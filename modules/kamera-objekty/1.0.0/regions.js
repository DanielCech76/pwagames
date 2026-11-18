// Group adjacent pixels across weak color boundaries on a downscaled frame.
export function detectRegions({ data, width, height }) {
  const size = width * height;
  const seen = new Uint8Array(size);
  const queue = new Int32Array(size);
  const regions = [];
  for (let seed = 0; seed < size; seed++) {
    if (seen[seed]) continue;
    let count = 1;
    let border = 0;
    let left = seed % width;
    let right = left;
    let top = Math.floor(seed / width);
    let bottom = top;
    queue[0] = seed;
    seen[seed] = 1;
    function visit(neighbor, offset) {
      if (seen[neighbor]) return;
      const next = neighbor * 4;
      const contrast = Math.abs(data[offset] - data[next])
        + Math.abs(data[offset + 1] - data[next + 1])
        + Math.abs(data[offset + 2] - data[next + 2]);
      if (contrast > 63) return;
      seen[neighbor] = 1;
      queue[count++] = neighbor;
    }
    for (let cursor = 0; cursor < count; cursor++) {
      const pixel = queue[cursor];
      const x = pixel % width;
      const y = Math.floor(pixel / width);
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
      if (x > 0) visit(pixel - 1, pixel * 4);
      if (x < width - 1) visit(pixel + 1, pixel * 4);
      if (y > 0) visit(pixel - width, pixel * 4);
      if (y < height - 1) visit(pixel + width, pixel * 4);
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) border++;
    }
    const w = right - left + 1;
    const h = bottom - top + 1;
    if (count < size * 0.004 || w * h > size * .72 || count < w * h * .24
      || border > Math.min(w, h) || w < 5 || h < 5) continue;
    regions.push({ x: left / width, y: top / height, w: w / width, h: h / height });
  }
  regions.sort((a, b) => b.w * b.h - a.w * a.h);
  const boxes = [];
  for (const region of regions) {
    if (boxes.length === 12) break;
    if (boxes.some(box => overlap(box, region) > .62)) continue;
    boxes.push(region);
  }
  return boxes;
}

function overlap(a, b) {
  const width = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const height = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  return width * height / Math.min(a.w * a.h, b.w * b.h);
}

export function smoothRegions(previous, current) {
  const available = new Set(previous);
  return current.map(box => {
    const match = [...available].find(candidate => overlap(candidate, box) > .65);
    if (!match) return box;
    available.delete(match);
    return {
      x: match.x * .25 + box.x * .75,
      y: match.y * .25 + box.y * .75,
      w: match.w * .25 + box.w * .75,
      h: match.h * .25 + box.h * .75
    };
  });
}
