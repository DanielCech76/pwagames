'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const source=join(__dirname,'../module-src/vanocni-dilna');
const html=readFileSync(join(source,'index.html'),'utf8');
const js=readFileSync(join(source,'workshop.js'),'utf8');
const context=vm.createContext({Uint8Array,TextDecoder,TextEncoder});
function section(code,start,end){
 return code.slice(code.indexOf(start),code.indexOf(end,code.indexOf(start)));
}
vm.runInContext(
 section(html,'function labelMask','function check()')+
 section(js,'function cutRegions','const markerLayer')+
 section(js,'const zipText','function validateExternalModel')+
 section(js,'function readLibraryZip','async function parseLibraryZip'),context);
vm.runInContext(readFileSync(join(source,'fflate.js'),'utf8'),context);
const run=(code,bindings={})=>vm.runInContext(code,Object.assign(context,bindings));

test('identifies islands, an internal hole and a thin bridge on the composed mask',()=>{
 const w=24,h=15,mask=new Uint8Array(w*h);
 const rectangle=(x,y,width,height,value=1)=>{
  for(let row=y;row<y+height;row++)mask.fill(value,row*w+x,row*w+x+width);
 };
 rectangle(2,4,7,8);rectangle(14,4,7,8);rectangle(9,7,5,1);
 rectangle(5,7,2,2,0);rectangle(3,1,2,1);
 const regions=run('cutRegions(mask,w,h).regions',{mask,w,h});
 assert.equal(regions.length,2);
 assert.equal(regions.find(r=>r.value===1).area,2);
 assert.equal(regions.find(r=>r.value===0).area,4);
 const narrow=run('thinCutAreas(mask,w,h,3)');
 assert(narrow.some(p=>p.x>=9&&p.x<14&&p.y===7&&p.width===1));
 const edits=regions.map(({value,seed,area,hash})=>({value,seed,area,hash,w,h}));
 run('let cutEdits=validateCutEdits(edits);applyCutEdits(mask,w,h)',{edits});
 assert.equal(mask[1*w+3],0);
 assert.equal(mask[7*w+5],1);
 assert.equal(mask[7*w+11],1);
 assert.equal(run('cutRegions(mask,w,h).regions.length'),0);
});

test('a component modified after diagnosis is preserved',()=>{
 const w=16,h=10,mask=new Uint8Array(w*h);
 for(let y=3;y<8;y++)mask.fill(1,y*w+3,y*w+12);
 mask[w+2]=1;
 const region=run('cutRegions(mask,w,h).regions[0]',{mask,w,h});
 mask[w+3]=1;
 run('cutEdits=[{...region,w,h}];applyCutEdits(mask,w,h)',{region});
 assert.equal(mask[w+2],1);
 assert.equal(mask[w+3],1);
});

test('ZIP reader preserves assets and rejects unsafe entry paths and oversized records',()=>{
 const zip=run('fflate.zipSync({"manifest.json":zipEncoder.encode("{}"),"groups/les/smrk.svg":zipEncoder.encode("<svg/>")})');
 assert.equal(run('zipText.decode(readLibraryZip(zip)["groups/les/smrk.svg"])',{zip}),'<svg/>');
 for(const name of ['../a.svg','groups/../a.svg','/absolute.svg','constructor']){
  const bad=run('fflate.zipSync({[name]:new Uint8Array(1)})',{name});
  assert.throws(()=>run('readLibraryZip(bad)',{bad}),/neplatnou cestu/);
 }
 const bad=run('fflate.zipSync({"a.svg":new Uint8Array(2000001)})');
 assert.throws(()=>run('readLibraryZip(bad)',{bad}),/překračuje limity/);
});

vm.runInContext(readFileSync(join(source,'outline-fit.js'),'utf8'),context);

test('fits a stepped arc with a few cubic segments and keeps sharp vertices',()=>{
 const points=Array.from({length:61},(_,i)=>[i*2,Math.round(-32*Math.sin(Math.PI*i/60))]);
 points.push([120,55],[0,55]);
 const outline=run('fitTracedOutline(points,1.5)',{points});
 assert(outline.segments.length<points.length/4);
 assert(outline.segments.some(segment=>segment.c1));
 for(const [x,y] of [[0,0],[120,0],[120,55],[0,55]]){
  assert(outline.segments.some(({end})=>end[0]===x&&end[1]===y));
 }
 assert.equal(run('traceTopologyIsSafe([outline])',{outline}),true);
 assert.equal(run('fitTracedOutline(points,0).segments.length'),points.length);
});

test('rejects a contour with crossing segments',()=>{
 const outline={start:[0,0],segments:[[10,10],[0,10],[10,0],[0,0]].map(end=>({end}))};
 assert.equal(run('traceTopologyIsSafe([outline])',{outline}),false);
});
