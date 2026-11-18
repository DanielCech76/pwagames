export function outlinePrompts(frame, { outline, marks }) {
  const { width, height } = frame;
  const positive = [];
  const negative = [];
  // Sample the interior rather than using the bounding-box center, which can lie outside a concave outline.
  const step = Math.max(3, Math.round(Math.min(width, height) / 19));
  for (let y = 1; y < height; y += step) {
    for (let x = 1; x < width; x += step) {
      const i = y * width + x;
      if (outline[i] && marks[i] !== 2) positive.push({ x, y, label: 1 });
      else if (!outline[i] && marks[i] !== 1 && [i - step, i + step, i - step * width, i + step * width].some(j => outline[j])) {
        negative.push({ x, y, label: 0 });
      }
    }
  }
  const added = [];
  const removed = [];
  let fallback;
  for (let i = 0; i < outline.length; i++) {
    const x = i % width;
    const y = Math.floor(i / width);
    if (!fallback && outline[i] && marks[i] !== 2) fallback = { x, y, label: 1 };
    if (marks[i] && (x % 3 === 0 && y % 3 === 0 || !added.length && marks[i] === 1 || !removed.length && marks[i] === 2)) {
      (marks[i] === 1 ? added : removed).push({ x, y, label: Number(marks[i] === 1) });
    }
  }
  const space = (points, count) => Array.from({ length: Math.min(points.length, count) }, (_, i) =>
    points[Math.floor((i + .5) * points.length / Math.min(points.length, count))]);
  const core = positive.length ? space(positive, 5) : fallback ? [fallback] : [];
  return [...core, ...space(negative, 4), ...space(added, 8), ...space(removed, 8)];
}

export function gridPrompts({ width, height }) {
  return Array.from({ length: 25 }, (_, i) => [{
    x: ((i % 5) + .5) * width / 5,
    y: (Math.floor(i / 5) + .5) * height / 5,
    label: 1
  }]);
}

export function shiftMask(mask, width, height, dx, dy) {
  const moved = new Uint8Array(mask.length);
  for (let y = Math.max(0, dy); y < Math.min(height, height + dy); y++) {
    for (let x = Math.max(0, dx); x < Math.min(width, width + dx); x++) {
      moved[y * width + x] = mask[(y - dy) * width + x - dx];
    }
  }
  return moved;
}
