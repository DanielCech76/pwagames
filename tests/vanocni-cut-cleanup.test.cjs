'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = path.join(__dirname, '../module-src/vanocni-dilna');
const run = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(source, 'cut-cleanup.js'), 'utf8'), run);

test('cleans pinholes and raster seams while preserving windows and larger pieces', () => {
 const width = 24, height = 18;
 const mask = new Uint8Array(width * height);
 const set = (x, y, value) => { mask[y * width + x] = value; };
 for (let y = 3; y < 15; y++) {
  for (let x = 3; x < 17; x++) set(x, y, 1);
 }
 for (let y = 6; y < 11; y++) {
  for (let x = 11; x < 15; x++) set(x, y, 0);
 }
 for (let y = 5; y < 12; y++) set(7, y, 0);
 set(9, 12, 0);
 set(1, 1, 1);
 for (let y = 4; y < 8; y++) {
  for (let x = 19; x < 21; x++) set(x, y, 1);
 }
 run.cleanCutMask(mask, width, height, 10);
 assert.equal(mask[width + 1], 0);
 assert.equal(mask[12 * width + 9], 1);
 for (let y = 5; y < 12; y++) assert.equal(mask[y * width + 7], 1);
 for (let y = 6; y < 11; y++) {
  for (let x = 11; x < 15; x++) assert.equal(mask[y * width + x], 0);
 }
 assert.equal(mask[5 * width + 19], 1);
});

test('simplifies a staircase without losing the closed loop', () => {
 const points = [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [3, 2], [3, 3], [0, 3]];
 const simplified = run.simplifyCutLoop(points, .8);
 assert(simplified.length < points.length);
 assert(simplified.length >= 3);
 assert.deepEqual([...simplified[0]], points[0]);
 const originalArea = points.reduce((sum, [x, y], i) => {
  const [u, v] = points[(i + 1) % points.length];
  return sum + x * v - y * u;
 }, 0);
 const simplifiedArea = simplified.reduce((sum, [x, y], i) => {
  const [u, v] = simplified[(i + 1) % simplified.length];
  return sum + x * v - y * u;
 }, 0);
 assert.equal(Math.sign(simplifiedArea), Math.sign(originalArea));
});
