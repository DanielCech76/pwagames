async function pngWithDensity(blob, dpi) {
 const data = new Uint8Array(await blob.arrayBuffer());
 // Replace the encoder's default physical resolution, if present.
 const chunk = new Uint8Array(21);
 const view = new DataView(chunk.buffer);
 view.setUint32(0, 9);
 chunk.set([112, 72, 89, 115], 4); // pHYs
 const perMeter = Math.round(dpi / .0254);
 view.setUint32(8, perMeter);
 view.setUint32(12, perMeter);
 chunk[16] = 1;
 let crc = 0xffffffff;
 for (const byte of chunk.subarray(4, 17)) {
  crc ^= byte;
  for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
 }
 view.setUint32(17, crc ^ 0xffffffff);
 const input = new DataView(data.buffer);
 const parts = [data.subarray(0, 33), chunk]; // PNG signature and IHDR
 for (let offset = 33; offset + 12 <= data.length;) {
  const end = offset + input.getUint32(offset) + 12;
  if (input.getUint32(offset + 4) !== 0x70485973) parts.push(data.subarray(offset, end));
  offset = end;
 }
 return new Blob(parts, {type:'image/png'});
}
