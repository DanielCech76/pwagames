// Distances to the nearest pixel of the requested kind, in grid steps.
function distance(mask, width, target) {
  const result = Uint16Array.from(mask, value => value === target ? 0 : 30000);
  const size = result.length;
  for (let i = 0; i < size; i++) {
    if (i % width) result[i] = Math.min(result[i], result[i - 1] + 1);
    if (i >= width) result[i] = Math.min(result[i], result[i - width] + 1);
  }
  for (let i = size - 1; i >= 0; i--) {
    if (i % width < width - 1) result[i] = Math.min(result[i], result[i + 1] + 1);
    if (i + width < size) result[i] = Math.min(result[i], result[i + width] + 1);
  }
  return result;
}

export function refineOutline({ data, width, height }, outline, marks) {
  const inside = distance(outline, width, 0);
  const outside = distance(outline, width, 1);
  const radius = Math.max(4, Math.round(Math.min(width, height) * .055));
  const mask = outline.slice();
  const locked = new Uint8Array(mask.length);
  const foreground = new Uint32Array(4096);
  const background = new Uint32Array(4096);
  const colors = Uint16Array.from(mask, (_, i) => {
    const p = i * 4;
    return ((data[p] >> 4) << 8) | ((data[p + 1] >> 4) << 4) | (data[p + 2] >> 4);
  });
  let fgCount = 0;
  let bgCount = 0;
  for (let i = 0; i < mask.length; i++) {
    if (marks[i]) mask[i] = Number(marks[i] === 1);
    locked[i] = Number(Boolean(marks[i]) || outside[i] > radius);
    if (marks[i] === 1 || (!marks[i] && inside[i] > radius)) {
      foreground[colors[i]]++;
      fgCount++;
    }
    if (marks[i] === 2 || (outside[i] > radius && outside[i] <= radius * 3 && !marks[i])) {
      background[colors[i]]++;
      bgCount++;
    }
  }
  const candidates = [];
  const scores = new Float32Array(mask.length);
  for (let i = 0; i < mask.length; i++) {
    if (locked[i]) continue;
    candidates.push(i);
    const color = colors[i];
    const fg = (foreground[color] + 1) / (fgCount + 4096);
    const bg = (background[color] + 1) / (bgCount + 4096);
    scores[i] = Math.log(fg / bg) + (inside[i] - outside[i]) / radius * .85;
  }
  function edgeWeight(i, j) {
    const a = i * 4;
    const b = j * 4;
    const difference = Math.abs(data[a] - data[b]) + Math.abs(data[a + 1] - data[b + 1])
      + Math.abs(data[a + 2] - data[b + 2]);
    return 1.2 / (1 + difference / 28);
  }
  for (let pass = 0; pass < 8; pass++) {
    if (pass % 2) candidates.reverse();
    let changed = false;
    for (const i of candidates) {
      let score = scores[i];
      if (i % width) score += edgeWeight(i, i - 1) * (2 * mask[i - 1] - 1);
      if (i % width < width - 1) score += edgeWeight(i, i + 1) * (2 * mask[i + 1] - 1);
      if (i >= width) score += edgeWeight(i, i - width) * (2 * mask[i - width] - 1);
      if (i + width < mask.length) score += edgeWeight(i, i + width) * (2 * mask[i + width] - 1);
      const next = Number(score > 0);
      if (next !== mask[i]) {
        mask[i] = next;
        changed = true;
      }
    }
    if (!changed) break;
  }
  return { mask, box: maskBounds(mask, width, height) };
}

export function maskBounds(mask, width, height) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i]) continue;
    const x = i % width;
    const y = Math.floor(i / width);
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  if (maxX < 0) return null;
  return { x: minX / width, y: minY / height, w: (maxX - minX + 1) / width, h: (maxY - minY + 1) / height };
}
