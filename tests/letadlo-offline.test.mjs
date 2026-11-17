import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
const source=fs.readFileSync('module-src/letadlo/offline.js','utf8').replace('export class','class')+';globalThis.FlightOffline=FlightOffline;';
const rows=new Map();const c={match:async u=>rows.get(String(u))?.clone(),put:async(u,r)=>rows.set(String(u),r.clone()),keys:async()=>[...rows.keys()].map(url=>({url})),delete:async r=>rows.delete(r.url||String(r))};let calls=0,fail=false;
const ctx={URL,Response,AbortController,setTimeout,clearTimeout,crypto:webcrypto,navigator:{},caches:{open:async()=>c},fetch:async u=>{calls++;if(fail)throw Error('offline');return new Response(fs.readFileSync('flight-data/v1/PRG-VCE/'+new URL(u).pathname.split('/').pop()))}};vm.createContext(ctx);vm.runInContext(source,ctx);const o=new ctx.FlightOffline(new URL('https://example.test/flight-data/v1/'));
assert.equal(await o.cached('PRG-VCE'),null);assert.equal(calls,0);await o.prepare('PRG-VCE');assert.equal(calls,4);fail=true;await o.prepare('PRG-VCE');assert.equal(calls,4,'cached flight works without network');assert.equal(await o.cached('INN-PRG'),null,'different route requires its own data');await o.remove('PRG-VCE');assert.equal(await o.cached('PRG-VCE'),null);fail=false;
// A damaged download must never acquire the ready marker.
ctx.fetch=async u=>new Response(new URL(u).pathname.endsWith('manifest.json')?fs.readFileSync('flight-data/v1/PRG-VCE/manifest.json'):'bad');await assert.rejects(o.prepare('PRG-VCE'),/poškozená/);assert.equal(await o.cached('PRG-VCE'),null);
const manifest=JSON.parse(fs.readFileSync('modules/letadlo/1.2.0/manifest.json'));assert.ok(manifest.files.every(f=>!/^data\//.test(f.path)));console.log('PASS flight downloads: no automatic fetch, isolated routes, cached offline access, deletion, integrity failure, image-free package');
