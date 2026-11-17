import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {settings,plan,candidates,tileCenter,km} from '../module-src/letadlo/detail-geo.js';
import {parseJSON,at} from '../module-src/letadlo/tracks.js';
import {paintVector,contours} from '../module-src/letadlo/tile-paint.js';
const s=settings();assert.equal(s.nearKm,30);assert.equal(s.midKm,200);assert.equal(settings({nearKm:999,nearZoom:42}).nearKm,80);assert.equal(settings({nearZoom:42}).nearZoom,12);
const a={lon:11.344,lat:47.2602},b={lon:13.0043,lat:47.7933};const p=plan([a,b],s),reverse=plan([b,a],s);assert.equal(new Set(p.tiles.map(t=>JSON.stringify(t))).size,p.tiles.length);assert.ok(p.tiles.some(t=>t.z===8));assert.ok(p.tiles.some(t=>t.z===12));assert.ok(p.dem.every(t=>t.z<=10));assert.ok(reverse.tiles.length>0);
assert.ok(candidates({...a,alt:10.6},settings({nearKm:5})).every(t=>t.z===8),'slant distance cannot be less than altitude');
const small=plan([a,b],{nearKm:5,midKm:80,nearZoom:11});assert.ok(small.tiles.length<p.tiles.length);for(const t of candidates({...a,alt:50},settings({nearKm:30})))assert.ok(t.z===8,'camera altitude must exclude nearby detail');
const json={icao:'abc123',timestamp:1700000000,trace:[[0,47,11,30000,400,90,0,0,null,null,31000],[60,47.1,11.2,31000,410,90,0,0,null,null,32000],[240,47.2,11.4,null,null,90,1]]};const track=parseJSON(json);assert.equal(track.timed,true);const multi=parseJSON({...json,trace:[...json.trace,[4000,48,12,30000,400,90,2],[4100,48.5,12.5,30000,400,90,0]]});assert.equal(multi.legs.length,2);assert.ok(multi.legs.every(l=>l.timed));assert.ok(Math.abs(at(track,0).alt-9.4488)<1e-6);assert.equal(at(track,.75).gap,true);assert.equal(at(track,.75).alt,null);assert.equal(at(track,1).lon,11.4);
assert.throws(()=>parseJSON({type:'LineString',coordinates:[[0,0],[999,4]]}),/souřadnice/);const geo=parseJSON({type:'LineString',coordinates:[[11,47,1000],[12,48,2000]]});assert.equal(geo.timed,false);assert.equal(at(geo,.5).alt,1.5);assert.ok(geo.distance>100);
let fills=[],strokes=0;const ctx={fillStyle:'',fillRect(){},beginPath(){},moveTo(){},lineTo(){},fill(){fills.push(this.fillStyle)},stroke(){strokes++}};const polygon={type:3,properties:{kind:'forest'},loadGeometry:()=>[[{x:0,y:0},{x:4096,y:0},{x:4096,y:4096},{x:0,y:4096}]]};const layer=f=>({extent:4096,length:1,feature:()=>f});const vector={layers:{landuse:layer(polygon),water:layer({...polygon,properties:{kind:'water'}}),buildings:layer({...polygon,properties:{kind:'building'}})}};paintVector(ctx,vector,512,{buildings:true},'near');assert.deepEqual(fills,['#426d45','#5b9faf','#8a7b69']);fills=[];paintVector(ctx,vector,256,{buildings:true},'mid');assert.equal(fills.length,2,'mid layer omits building footprints');contours(ctx,new Float32Array([0,200,0,200]),2,512,100);assert.ok(strokes>0);
// Network responses must be range-bounded; never accept a complete planet archive.
const worker=fs.readFileSync('module-src/letadlo/data-worker.js','utf8').replace(/^import .*;\n/gm,'');const box={URL,self:{location:{href:'https://example.test/modules/letadlo/1.3.0/data-worker.js'}},PMTiles:class{constructor(source){return source}},AbortController,DOMException,Response,Uint8Array,setTimeout,clearTimeout,fetch:async()=>new Response(new Uint8Array(127),{status:200})};vm.createContext(box);vm.runInContext(worker+';self.getArchive=getArchive;self.boundedFetch=boundedFetch;',box);await assert.rejects(box.self.getArchive(new AbortController().signal).getBytes(0,127),/částečné/);box.fetch=async()=>new Response(new Uint8Array(200),{headers:{'Content-Length':'200'}});await assert.rejects(box.self.boundedFetch('https://example.test',{},100),/limit/);
console.log('PASS flight details: corridor planning, camera altitude LOD, profiles, real-track timing/altitude/gaps, vector land/water/buildings, DEM contours and bounded archive reads');

const meta=JSON.parse(fs.readFileSync('module-src/letadlo/module.json'));const manifest=JSON.parse(fs.readFileSync('modules/letadlo/'+meta.version+'/manifest.json'));assert.ok(manifest.files.every(f=>!/^data\//.test(f.path)&&!f.path.endsWith('.png')&&!f.path.endsWith('.jpg')&&!f.path.endsWith('.bin')));assert.ok(manifest.files.some(f=>f.path==='data-worker.js'));

await import('../module-src/letadlo/engine.js');
const THREE=await import('../module-src/letadlo/vendor/three.module.js');
const {DetailRenderer}=await import('../module-src/letadlo/detail-renderer.js');
const renderer=new DetailRenderer(new THREE.Scene(),{},settings(),()=>{});
renderer.updateMask([{tile:{z:8,x:140,y:90}},{tile:{z:12,x:2240,y:1440}}]);
assert.equal(renderer.mask.value.image.data[0],255,'combined mid/near mask retains fallback coverage');
assert.equal(renderer.mask.value.format,THREE.RGBAFormat,'coverage mask also supports WebGL1');
const shader={uniforms:{},vertexShader:THREE.ShaderLib.lambert.vertexShader,fragmentShader:THREE.ShaderLib.lambert.fragmentShader};
renderer.material(null,'near').onBeforeCompile(shader);
assert.ok(shader.fragmentShader.includes('distance(flightLocal,flightCamera)'));
assert.ok(shader.fragmentShader.includes('if(fd>fn)discard'));
assert.ok(shader.vertexShader.includes('flightLocal=transformed'));
renderer.dispose();
console.log('PASS terrain coverage masks and injection into actual Three.js Lambert shaders');
