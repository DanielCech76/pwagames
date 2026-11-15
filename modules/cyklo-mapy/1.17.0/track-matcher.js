/* Fixed-lag display reconstruction. Original GPS coordinates and ride statistics are never changed. */
(function(root){'use strict';
const R=6371000,rad=Math.PI/180;
const distance=(a,b)=>Math.hypot((b[0]-a[0])*Math.cos((a[1]+b[1])*rad/2),b[1]-a[1])*rad*R;
const bearing=(a,b)=>(Math.atan2((b[0]-a[0])*Math.cos((a[1]+b[1])*rad/2),b[1]-a[1])/rad+360)%360;
const angle=(a,b)=>Math.abs((a-b+540)%360-180);
function prepare(lines,p,tolerance){const out=[],seen=new Set();for(const line of lines){let along=0;const cumulative=[0];for(let i=1;i<line.coordinates.length;i++)cumulative.push(cumulative[i-1]+distance(line.coordinates[i-1],line.coordinates[i]));for(let i=1;i<line.coordinates.length;i++){const a=line.coordinates[i-1],b=line.coordinates[i],length=cumulative[i]-cumulative[i-1];if(length<.1)continue;const cos=Math.cos(p.lat*rad),ax=(a[0]-p.lon)*cos,ay=a[1]-p.lat,dx=(b[0]-a[0])*cos,dy=b[1]-a[1],f=Math.max(0,Math.min(1,-(ax*dx+ay*dy)/(dx*dx+dy*dy||1))),xy=[a[0]+f*(b[0]-a[0]),a[1]+f*(b[1]-a[1])],d=distance(xy,[p.lon,p.lat]);along=cumulative[i-1]+f*length;if(d>tolerance)continue;const key=line.key+':'+Math.round(along);if(seen.has(key))continue;seen.add(key);out.push({line,index:i,along,cumulative,xy,d,bearing:bearing(a,b)})}}return out}
function slice(a,b){const forward=b.along>=a.along,lo=forward?a:b,hi=forward?b:a;const path=[lo.xy];for(let i=lo.index;i<hi.index;i++)path.push(a.line.coordinates[i]);path.push(hi.xy);return forward?path:path.reverse()}
function vertex(c,i){let along=0;for(let j=1;j<=i;j++)along+=distance(c.line.coordinates[j-1],c.line.coordinates[j]);return {...c,xy:c.line.coordinates[i],index:Math.max(1,i),along}}
function link(a,b){if(a.line.key===b.line.key)return slice(a,b);if(!root.CykloRoadMatch.connected(a.line,b.line))return null;let best=null,bestLength=Infinity;const ac=a.line.coordinates,bc=b.line.coordinates;for(let i=0;i<ac.length;i++)for(let j=0;j<bc.length;j++){if(distance(ac[i],bc[j])>=1.5||a.line.grade!==b.line.grade&&!((i===0||i===ac.length-1)&&(j===0||j===bc.length-1)))continue;const av=vertex(a,i),bv=vertex(b,j),length=Math.abs(a.along-av.along)+Math.abs(b.along-bv.along);if(length<bestLength){bestLength=length;best=[...slice(a,av),...slice(bv,b)]}}return best}
const pathLength=path=>path.slice(1).reduce((s,p,i)=>s+distance(path[i],p),0);
function display(p){return p?.match?.version===1?{...p,lon:p.match.lon,lat:p.match.lat,heading:p.match.heading,snapped:true,snapDistance:p.match.offset}:p}
function geometry(points,corrected=true){const features=[];let coordinates=[],segment,previous=null;const flush=()=>{if(coordinates.length>1)features.push({type:'Feature',properties:{},geometry:{type:'LineString',coordinates}});coordinates=[]};for(const p of points){if(segment!==p.segment){flush();previous=null;segment=p.segment}const q=corrected?display(p):p,path=corrected&&p.match?.path;const valid=path?.length>1&&previous&&distance(path[0],[previous.lon,previous.lat])<2&&distance(path.at(-1),[q.lon,q.lat])<2;coordinates.push(...(valid?path:[[q.lon,q.lat]]));previous=q}flush();return {type:'FeatureCollection',features}}
class TrackMatcher{
 constructor(){this.reset()}
 reset(){this.beam=[];this.last=null;this.missAt=null;this.window=[];this.config=null}
 add(p,lines,options={}){const config=String(options.enabled!==false)+':'+options.tolerance;if(this.config!==config||this.last&&(p.t<=this.last.t||p.t-this.last.t>15000||p.segment!==this.last.segment)){this.reset()}this.config=config;
 const prev=this.last;this.last=p;this.window.push(p);if(this.window.length>5)this.window.shift();
 const tolerance=Math.max(5,Math.min(60,Number(options.tolerance)||25)),travel=prev?distance([prev.lon,prev.lat],[p.lon,p.lat]):0,dt=prev?(p.t-prev.t)/1000:0;
 if(options.enabled===false||!Number.isFinite(p.accuracy)||p.accuracy>Math.min(50,tolerance*2)){this.beam=[];p.match=null;return [p]}
 let heading=Number.isFinite(p.heading)&&p.speed>=1?p.heading:null;if(heading===null&&prev&&travel>Math.max(5,p.accuracy))heading=bearing([prev.lon,prev.lat],[p.lon,p.lat]);
 // Retain only nearby predecessor geometries across a tile boundary.
 const available=new Map(lines.map(l=>[l.key,l]));for(const b of this.beam)available.set(b.c.line.key,b.c.line);
 let candidates=prepare([...available.values()],p,tolerance).map(c=>{c.reverse=heading!==null&&angle(heading,c.bearing)>90;c.direction=heading===null?0:Math.min(angle(heading,c.bearing),angle(heading,c.bearing+180));c.emission=c.d/Math.max(4,Math.min(20,p.accuracy))+c.direction/40;return c}).filter(c=>c.direction<=60).sort((a,b)=>a.emission-b.emission).slice(0,12);
 const next=[];for(const c of candidates){if(!this.beam.length){next.push({c,cost:c.emission,nodes:[{p,c,path:null,step:c.emission}]});continue}let best;for(const b of this.beam){const path=link(b.c,c);if(!path||path.length>256)continue;const length=pathLength(path);if(length>Math.min(250,Math.max(25,dt*20+10),travel*2+2*p.accuracy+10))continue;const step=c.emission+Math.abs(length-travel)/Math.max(10,p.accuracy+prev.accuracy),nodes=[...b.nodes,{p,c,path,step}].slice(-5),cost=nodes.reduce((s,n)=>s+n.step,0);if(!best||cost<best.cost)best={c,nodes,cost}}if(best)next.push(best)}
 next.sort((a,b)=>a.cost-b.cost);
 if(!next.length){p.match=null;this.missAt??=p.t;if(p.t-this.missAt>=8000)this.beam=[];return [p]}
 this.missAt=null;this.beam=next.slice(0,6);const winner=next[0],alternative=next.find(b=>distance(b.c.xy,winner.c.xy)>5),confident=winner.nodes.length>=2&&heading!==null&&(!alternative||alternative.cost-winner.cost>.7);
 const revised=new Set([p]);for(const point of this.window){if(point.match){point.match=null;revised.add(point)}}
 if(confident)for(const n of winner.nodes){n.p.match={version:1,lon:n.c.xy[0],lat:n.c.xy[1],heading:(n.c.bearing+(n.c.reverse?180:0))%360,offset:n.c.d,path:n.path||undefined,source:'openfreemap'};revised.add(n.p)}
 return [...revised]
 }
}
root.CykloTrack={TrackMatcher,display,geometry,link};
})(globalThis);
