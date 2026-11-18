const CDN = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/';
export const CACHE = 'camera-ai-assets-v1';
export const runtime = ['transformers.min.js', 'ort-wasm-simd-threaded.jsep.mjs',
  'ort-wasm-simd-threaded.jsep.wasm'].map(file => CDN + file);
const samFiles = ['vision_encoder_quantized.onnx', 'prompt_encoder_mask_decoder_quantized.onnx'];

export const models = {
  sam: {
    id: 'Xenova/slimsam-77-uniform', revision: '5850ab45f587c112167512ffef949107115e26a0',
    klass: 'SamModel', dtype: 'q8', files: samFiles
  },
  sam2: {
    id: 'onnx-community/sam2.1-hiera-tiny-ONNX', revision: '814a066640debee5a91e70aa401fb8e17e030503',
    klass: 'Sam2Model', dtype: 'q8', external: true, files: samFiles.flatMap(file => [file, file + '_data'])
  },
  depth: {
    id: 'onnx-community/depth-anything-v2-small-ONNX', revision: 'c3b67641fd837b2368757101311e5d21e511441e',
    dtype: 'q4', external: true, files: ['model_q4.onnx', 'model_q4.onnx_data']
  }
};

export function assets(kind) {
  const { id, revision, files } = models[kind];
  return [...runtime, ...['config.json', 'preprocessor_config.json', ...files.map(file => 'onnx/' + file)]
    .map(file => 'https://huggingface.co/' + id + '/resolve/' + revision + '/' + file)];
}

export async function availability() {
  const cache = await caches.open(CACHE);
  const keys = new Set((await cache.keys()).map(request => request.url));
  return Object.fromEntries(Object.keys(models).map(kind => [kind, assets(kind).every(url => keys.has(url))]));
}

export async function saveAssets(kinds, onProgress = () => {}, signal) {
  const cache = await caches.open(CACHE);
  const urls = [...new Set(kinds.flatMap(assets))];
  for (let i = 0; i < urls.length; i++) {
    signal?.throwIfAborted();
    const url = urls[i];
    if (!await cache.match(url)) {
      onProgress(i, urls.length);
      const response = await fetch(url, { signal });
      if (!response.ok || response.type === 'opaque') throw new Error('Stažení souboru selhalo: ' + response.status);
      await cache.put(url, response);
    }
  }
  onProgress(urls.length, urls.length);
  return cache;
}
