const assert=require('node:assert/strict');require('../module-src/cyklo/ar-geo.js');require('../module-src/cyklo/ar-vision.js');const G=global.GeoLook,V=global.GeoLookVision;
for(const [w,h]of [[844,390],[390,844]]){const raw=G.manual(359,2),vector=G.manual(12,8).forward,pose=G.corrected(raw,4,-3),screen=G.project(vector,pose,w,h,60),r=V.point(vector,raw,screen.x,screen.y,w,h,60);assert(r.ok);assert(Math.abs(r.yaw-4)<.3);assert(Math.abs(r.pitch+3)<.3)}
assert(!V.fit([],[],G.manual(0),0,0,192,108,60).ok);
const profile=Array.from({length:180},(_,i)=>({heading:i*2,pitch:3+2*Math.sin(i*.49)+Math.cos(i*.13)*3,valid:1})),w=192,h=108,pose=G.corrected(G.manual(0),6,-2),pts=profile.map(p=>G.project(G.manual(p.heading,p.pitch).forward,pose,w,h,60)).filter(p=>p&&p.x>=-30&&p.x<=222).sort((a,b)=>a.x-b.x),edge=[];
for(let x=3;x<w-3;x+=3){const i=pts.findIndex(p=>p.x>=x);if(i>0){const a=pts[i-1],b=pts[i];edge.push({x,y:a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x)})}}
const r=V.fit(edge,profile,G.manual(0),0,0,w,h,60);assert(r.ok,JSON.stringify(r));assert(Math.abs(r.yaw-6)<.5);assert(Math.abs(r.pitch+2)<.5);
assert(!V.fit(edge.map(p=>({...p,y:50})),profile,G.manual(0),0,0,w,h,60).ok);
assert(!V.fit(edge,profile.map(p=>({...p,valid:0})),G.manual(0),0,0,w,h,60).ok);
const image={width:w,height:h,data:new Uint8ClampedArray(w*h*4)};for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;image.data.set(y<40+Math.round(Math.sin(x/20)*6)?[110,170,210,255]:[50,85,40,255],i)}assert(V.boundary(image).length>50);image.data.fill(0);assert.equal(V.boundary(image).length,0);
console.log('Vision: manual projections, DEM fit and ambiguity/image rejection passed');
