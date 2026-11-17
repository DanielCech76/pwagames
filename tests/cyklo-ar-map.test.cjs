const assert=require('node:assert/strict');
global.GeoLook=require('../module-src/cyklo/ar-geo.js');
class MapMock{
 constructor(options){this.options=options;this.events={};this.calls=[];this.canvas={addEventListener(){}};}
 on(t,f){this.events[t]=f;}getCanvas(){return this.canvas;}getStyle(){return {layers:[{id:'building',type:'fill-extrusion',filter:['==','class','building']}]};}
 setCenterClampedToGround(v){this.clamped=v;}resize(){this.calls.push('resize');}setVerticalFieldOfView(v){this.fov=v;}setLayoutProperty(...a){this.visibility=a;}setFilter(...a){this.filter=a;}
 calculateCameraOptionsFromCameraLngLatAltRotation(...a){this.camera=a;return {zoom:this.zoom||16};}jumpTo(v){this.jump=v;}project(p){return {x:p[0],y:p[1]};}remove(){this.removed=true;}
}
global.maplibregl={Map:MapMock};global.CykloRelief=class{constructor(m,s){this.settings=s;}apply(){this.applied=true;}destroy(){this.destroyed=true;}};
const {OverviewMap,expression}=require('../module-src/cyklo/ar-map.js');
const errors=[],o=new OverviewMap({},e=>errors.push(e)),p={lon:16.6,lat:49.2,alt:1200},pose=GeoLook.manual(135,-30);
assert.equal(o.update(p,pose,400,800,60,false,true,2000),false,'loading keeps offline renderer');o.map.events.load();
assert(o.update(p,pose,400,800,60,false,true,2000));assert.deepEqual(o.map.camera.slice(0,2),[[p.lon,p.lat],1200]);assert(Math.abs(o.map.camera[2]-135)<1e-8);assert(Math.abs(o.map.camera[3]-60)<1e-8);assert.equal(o.map.clamped,false);assert.equal(o.map.fov,60,'preserve vertical FOV in portrait');assert.deepEqual(o.map.filter[1],['all',['==',['get','class'],'building'],['<=',['distance',{type:'Point',coordinates:[16.6,49.2]}],2000]]);
assert(o.update(p,pose,800,400,60,true,false,1000));assert.equal(o.map.fov,60,'preserve vertical FOV in landscape');assert.equal(o.relief.settings.terrainEnabled,false);assert.equal(o.map.visibility[2],'none');assert.deepEqual(o.project({lon:16,lat:49}),{x:16,y:49});
assert.equal(o.update(p,GeoLook.manual(0,10),400,800,60,false,true,1000),false,'upward view uses original renderer');o.map.zoom=25;assert.equal(o.update(p,pose,400,800,60,false,true,2000),false,'never silently clamp eye altitude');o.map.events.error();assert.equal(o.failed,true);assert.equal(errors.length,1);assert.equal(o.update(p,pose,400,800,60,false,true,2000),false);o.destroy();o.destroy();assert(o.map.removed);assert(o.relief.destroyed);assert.equal(o.layers.size,0);
assert.deepEqual(expression(['in','class','residential','service']),['in',['get','class'],['literal',['residential','service']]]);assert.deepEqual(expression(['==',['get','class'],'building']),['==',['get','class'],'building']);
console.log('PASS detailed AR map: absolute eye camera, portrait/landscape FOV, terrain/building toggles, radius filter, horizon/zoom fallback, failure and teardown');
