// Match distinctive local patches between overlapping views of a stationary scene.
export function compareViews(first, second, mask) {
  const { width, height } = first;
  if (width !== second.width || height !== second.height) return null;
  const gray = frame => Uint8Array.from(mask, (_, i) =>
    .299 * frame.data[4 * i] + .587 * frame.data[4 * i + 1] + .114 * frame.data[4 * i + 2]);
  const a = gray(first);
  const b = gray(second);
  const radius = Math.min(36, Math.round(Math.min(width, height) * .19));
  const step = Math.max(8, Math.round(Math.min(width, height) / 20));
  const samples = [];
  for (let dy = -4; dy <= 4; dy += 2) {
    for (let dx = -4; dx <= 4; dx += 2) samples.push(dy * width + dx);
  }
  const mean = (image, index) => samples.reduce((sum, offset) => sum + image[index + offset], 0) / samples.length;
  function match(source, target, x, y) {
    const start = y * width + x;
    const center = mean(source, start);
    const patch = samples.map(offset => source[start + offset] - center);
    const energy = patch.reduce((sum, value) => sum + value ** 2, 0);
    if (energy < 1700) return null;
    let best = { score: -.1 };
    const alternatives = [];
    function measure(dx, dy) {
      const index = start + dy * width + dx;
      let sum = 0;
      let square = 0;
      let product = 0;
      for (let n = 0; n < samples.length; n++) {
        const v = target[index + samples[n]];
        sum += v;
        square += v * v;
        product += patch[n] * v;
      }
      const variance = square - sum * sum / samples.length;
      return variance > 1000 ? product / Math.sqrt(energy * variance) : -1;
    }
    function score(dx, dy) {
      if (x + dx < 4 || x + dx >= width - 4 || y + dy < 4 || y + dy >= height - 4) return;
      const value = measure(dx, dy);
      if (value > .78) alternatives.push({ dx, dy, score: value });
      if (value > best.score) best = { dx, dy, score: value };
    }
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) score(dx, dy);
    }
    const ambiguous = alternatives.some(other => Math.hypot(best.dx - other.dx, best.dy - other.dy) > 3
      && best.score - other.score < .045);
    return best.score >= .86 && !ambiguous ? best : null;
  }

  const foreground = [];
  const background = [];
  for (let y = 5; y < height - 5; y += step) {
    for (let x = 5; x < width - 5; x += step) {
      const index = y * width + x;
      if (samples.some(offset => mask[index + offset] !== mask[index])) continue;
      const hit = match(a, b, x, y);
      if (!hit) continue;
      const back = match(b, a, x + hit.dx, y + hit.dy);
      if (!back || Math.hypot(hit.dx + back.dx, hit.dy + back.dy) > 2) continue;
      (mask[index] ? foreground : background).push({ x, y, ...hit });
    }
  }
  if (foreground.length < 4 || background.length < 8) return null;

  // Robustly estimate a background similarity transform (translation, rotation and zoom).
  function fit(left, right) {
    const x = right.x - left.x;
    const y = right.y - left.y;
    const dx = right.dx - left.dx;
    const dy = right.dy - left.dy;
    const denom = x * x + y * y;
    if (denom < step * step * 4) return null;
    const scale = (x * dx + y * dy) / denom;
    const skew = (x * dy - y * dx) / denom;
    return { scale, skew, tx: left.dx - scale * left.x + skew * left.y,
      ty: left.dy - skew * left.x - scale * left.y };
  }
  function residual(model, point) {
    return { x: point.dx - (model.tx + model.scale * point.x - model.skew * point.y),
      y: point.dy - (model.ty + model.skew * point.x + model.scale * point.y) };
  }
  let best;
  let bestCount = 0;
  const stride = Math.max(1, Math.floor(background.length / 25));
  for (let i = 0; i < background.length; i += stride) {
    for (let j = i + stride; j < background.length; j += stride) {
      const model = fit(background[i], background[j]);
      if (!model) continue;
      const count = background.filter(p => { const r = residual(model, p); return Math.hypot(r.x, r.y) < 2.5; }).length;
      if (count > bestCount) {
        best = model;
        bestCount = count;
      }
    }
  }
  if (!best || bestCount < Math.max(8, background.length * .55)) return null;
  const median = values => values.sort((x, y) => x - y)[Math.floor(values.length / 2)];
  const dx = median(foreground.map(p => p.dx));
  const dy = median(foreground.map(p => p.dy));
  const diffs = foreground.map(p => residual(best, p));
  const rx = median(diffs.map(p => p.x));
  const ry = median(diffs.map(p => p.y));
  const scatter = median(diffs.map(p => Math.hypot(p.x - rx, p.y - ry)));
  return { dx, dy, displacement: Math.hypot(rx, ry), coherent: scatter <= 2.5, matches: foreground.length };
}
