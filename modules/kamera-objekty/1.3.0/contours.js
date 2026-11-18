// Trace each pixel edge shared by foreground and background, including holes.
export function strokeContours(ctx, selections, width, height) {
  ctx.beginPath();
  for (const { mask, width: columns, height: rows } of selections) {
    const sx = width / columns;
    const sy = height / rows;
    for (let i = 0; i < mask.length; i++) {
      if (!mask[i]) continue;
      const x = i % columns;
      const y = Math.floor(i / columns);
      const left = x * sx;
      const right = (x + 1) * sx;
      const top = y * sy;
      const bottom = (y + 1) * sy;
      if (y === 0 || !mask[i - columns]) {
        ctx.moveTo(left, top);
        ctx.lineTo(right, top);
      }
      if (x === columns - 1 || !mask[i + 1]) {
        ctx.moveTo(right, top);
        ctx.lineTo(right, bottom);
      }
      if (y === rows - 1 || !mask[i + columns]) {
        ctx.moveTo(right, bottom);
        ctx.lineTo(left, bottom);
      }
      if (x === 0 || !mask[i - 1]) {
        ctx.moveTo(left, bottom);
        ctx.lineTo(left, top);
      }
    }
  }
  ctx.stroke();
}
