function removeCutIslands(mask, {problem, keeper, components}, maxArea) {
 const area = new Uint32Array(components + 1);
 for (const id of problem) if (id) area[id]++;
 for (let i = 0; i < mask.length; i++) {
  const id = problem[i];
  if (id && id !== keeper && area[id] <= maxArea) mask[i] = 0;
 }
}

function joinCutPieces(mask, w, h, {problem, components}, radius) {
 if (components < 2) return;
 // Grow all components together and connect their fronts when they meet.
 const queue = new Uint32Array(mask.length);
 const owner = Int32Array.from(problem);
 const parent = Int32Array.from({length: components + 1}, (_, i) => i);
 let tail = 0, remaining = components - 1;
 for (let i = 0; i < mask.length; i++) {
  if (owner[i]) queue[tail++] = i;
 }
 function root(id) {
  while (parent[id] !== id) {
   parent[id] = parent[parent[id]];
   id = parent[id];
  }
  return id;
 }
 const brush = [];
 for (let y = -radius; y <= radius; y++) {
  brush.push([y, Math.floor(Math.sqrt(radius*radius-y*y))]);
 }
 function seal(i) {
  const x = i % w, y = Math.floor(i / w);
  for (const [dy, halfWidth] of brush) {
   const row = y+dy;
   if (row >= 0 && row < h) {
    mask.fill(1, row*w+Math.max(0,x-halfWidth), row*w+Math.min(w,x+halfWidth+1));
   }
  }
 }
 function trace(i) {
  const id = owner[i];
  seal(i);
  while (problem[i] !== id) {
   // The queue's discovery parent is stored for background pixels.
   i = predecessor[i];
   seal(i);
  }
 }
 const predecessor = new Uint32Array(mask.length);
 function visit(i, j) {
  if (!remaining) return;
  if (!owner[j]) {
   owner[j] = owner[i];
   predecessor[j] = i;
   queue[tail++] = j;
   return;
  }
  if (owner[i] === owner[j]) return;
  const a = root(owner[i]), b = root(owner[j]);
  if (a === b) return;
  parent[b] = a;
  remaining--;
  trace(i);
  trace(j);
 }
 for (let head = 0; head < tail && remaining; head++) {
  const i = queue[head], x = i % w;
  if (x) visit(i, i-1);
  if (x+1 < w) visit(i, i+1);
  if (i >= w) visit(i, i-w);
  if (i+w < mask.length) visit(i, i+w);
 }
}
