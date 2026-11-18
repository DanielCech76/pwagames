import { maskBounds } from './outline.js';
import { compareViews } from "./views.js";

const runtime = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/';
const models = {
  sam: ['Xenova/slimsam-77-uniform', '5850ab45f587c112167512ffef949107115e26a0', 'SamModel'],
  sam2: ['onnx-community/sam2.1-hiera-tiny-ONNX', '814a066640debee5a91e70aa401fb8e17e030503', 'Sam2Model'],
  depth: ['onnx-community/depth-anything-v2-small-ONNX', 'c3b67641fd837b2368757101311e5d21e511441e']
};
let loaded;
let library;

async function load(kind) {
  if (loaded?.kind !== kind) {
    const previous = loaded;
    loaded = null;
    if (previous) {
      const { predict, model } = await previous.promise;
      await (predict ?? model).dispose();
    }
    const promise = (async () => {
      library ??= import(runtime + 'transformers.min.js').then(tf => {
        tf.env.allowLocalModels = false;
        tf.env.backends.onnx.wasm.numThreads = 1;
        tf.env.backends.onnx.wasm.wasmPaths = runtime;
        return tf;
      }).catch(error => {
        library = null;
        throw error;
      });
      const tf = await library;
      const [id, revision, klass] = models[kind];
      const options = { revision, device: 'wasm', dtype: kind === 'depth' ? 'q4' : 'q8', use_external_data_format: kind !== 'sam', progress_callback: event => {
        if (event.status === 'progress') self.postMessage({ phase: 'download', file: event.file, progress: event.progress });
      } };
      if (kind === 'depth') return { tf, predict: await tf.pipeline('depth-estimation', id, options) };
      const [processor, model] = await Promise.all([
        tf.AutoProcessor.from_pretrained(id, options),
        tf[klass].from_pretrained(id, options)
      ]);
      return { tf, processor, model };
    })();
    loaded = { kind, promise };
    promise.catch(() => {
      if (loaded?.promise === promise) loaded = null;
    });
  }
  return loaded.promise;
}

function unpack(tensor, scores, width, height, resized, padded) {
  const [maskHeight, maskWidth] = tensor.dims.slice(-2);
  const stride = maskWidth * maskHeight;
  function positions(length, limit, scale) {
    return Array.from({ length }, (_, i) => {
      const coordinate = Math.max(0, Math.min(limit - 1, (i + .5) * scale - .5));
      const start = Math.floor(coordinate);
      return [start, Math.min(limit - 1, start + 1), coordinate - start];
    });
  }
  // Map directly from unpadded image pixels to the decoder grid.
  const xs = positions(width, maskWidth, resized[1] * maskWidth / (width * padded[1]));
  const ys = positions(height, maskHeight, resized[0] * maskHeight / (height * padded[0]));
  const logits = tensor.data;
  return Array.from(scores, (score, i) => {
    const mask = new Uint8Array(width * height);
    const offset = i * stride;
    for (let y = 0; y < height; y++) {
      const [top, bottom, fy] = ys[y];
      const a = offset + top * maskWidth;
      const b = offset + bottom * maskWidth;
      for (let x = 0; x < width; x++) {
        const [left, right, fx] = xs[x];
        const first = logits[a + left] * (1 - fx) + logits[a + right] * fx;
        const second = logits[b + left] * (1 - fx) + logits[b + right] * fx;
        mask[y * width + x] = Number(first * (1 - fy) + second * fy > 0);
      }
    }
    return { mask, score, box: maskBounds(mask, width, height) };
  }).filter(item => item.box);
}

function maskOverlap(a, b) {
  let common = 0;
  let either = 0;
  for (let i = 0; i < a.length; i++) {
    common += a[i] & b[i];
    either += a[i] | b[i];
  }
  return either ? common / either : 0;
}

async function segment(kind, frame, prompts, reference, tracking) {
  const { tf, processor, model } = await load(kind);
  const { width, height, data } = frame;
  const inputs = await processor(new tf.RawImage(data, width, height, 4));
  self.postMessage({ phase: 'analysis' });
  const embeddings = await model.get_image_embeddings(inputs);
  try {
    const result = [];
    // Small prompt batches bound the decoder's peak memory on mobile.
    for (let offset = 0; offset < prompts.length; offset += 4) {
      const batch = prompts.slice(offset, offset + 4);
      const points = processor.reshape_input_points(
        batch.map(group => group.map(({ x, y }) => [x, y])),
        inputs.original_sizes, inputs.reshaped_input_sizes
      );
      const flags = batch.flatMap(group => group.map(({ label }) => BigInt(label)));
      const labels = new tf.Tensor('int64', flags, points.dims.slice(0, -1));
      const output = await model({ input_points: points, input_labels: labels, ...embeddings });
      result.push(...unpack(output.pred_masks, output.iou_scores.data, width, height,
        inputs.reshaped_input_sizes[0], inputs.pixel_values.dims.slice(-2)));
      self.postMessage({ phase: 'analysis', progress: Math.min(1, (offset + 4) / prompts.length) });
      output.pred_masks.dispose();
      output.iou_scores.dispose();
      output.object_score_logits?.dispose();
      points.dispose();
      labels.dispose();
    }
    if (reference) {
      result.sort((a, b) => rank(b) - rank(a));
      function rank(item) {
        return item.score * .4 + maskOverlap(item.mask, reference) * .6;
      }
      return result.filter(item => !tracking || item.score >= .55 && maskOverlap(item.mask, reference) >= .25).slice(0, 1);
    }
    const selected = [];
    for (const candidate of result.sort((a, b) => b.score - a.score)) {
      const area = candidate.mask.reduce((sum, bit) => sum + bit, 0) / (width * height);
      if (candidate.score < .72 || area > .78 || area < .006) continue;
      if (selected.some(item => maskOverlap(item.mask, candidate.mask) > .7)) continue;
      selected.push(candidate);
      if (selected.length === 12) break;
    }
    return selected;
  } finally {
    inputs.pixel_values.dispose();
    for (const tensor of Object.values(embeddings)) tensor.dispose();
  }
}

self.onmessage = async ({ data: request }) => {
  try {
    if (request.kind === 'views') {
      self.postMessage({ result: compareViews(request.frame, request.second, request.reference) });
    } else if (request.kind === 'depth') {
      const { tf, predict } = await load('depth');
      self.postMessage({ phase: 'analysis' });
      const { width, height, data } = request.frame;
      const { depth, predicted_depth } = await predict(new tf.RawImage(data, width, height, 4));
      predicted_depth?.dispose();
      self.postMessage({ result: depth.data }, [depth.data.buffer]);
    } else {
      const result = await segment(request.kind, request.frame, request.prompts, request.reference, request.tracking);
      self.postMessage({ result }, result.map(item => item.mask.buffer));
    }
  } catch (error) {
    self.postMessage({ error: String(error?.message ?? error) });
  }
};
