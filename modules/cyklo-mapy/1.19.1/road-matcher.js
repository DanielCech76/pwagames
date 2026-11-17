/* Display-only matching. Raw fixes remain the source of recording and rerouting. */
(function(root){'use strict';
const R=6371000,rad=Math.PI/180;
const dist=(a,b)=>Math.hypot((b[0]-a[0])*Math.cos((a[1]+b[1])*rad/2),(b[1]-a[1]))*rad*R;
const angle=(a,b)=>Math.abs((a-b+540)%360-180);
const bearing=(a,b)=>(Math.atan2((b[0]-a[0])*Math.cos((a[1]+b[1])*rad/2),b[1]-a[1])/rad+360)%360;
function segments(lines){const out=[];for(const line of lines){let along=0;for(let i=1;i<line.coordinates.length;i++){const a=line.coordinates[i-1],b=line.coordinates[i],length=dist(a,b);if(length>.1)out.push({...line,a,b,length,along,index:i});along+=length}}return out}
function project(s,p){const cos=Math.cos(p.lat*rad),ax=(s.a[0]-p.lon)*cos,ay=s.a[1]-p.lat,dx=(s.b[0]-s.a[0])*cos,dy=s.b[1]-s.a[1],f=Math.max(0,Math.min(1,-(ax*dx+ay*dy)/(dx*dx+dy*dy||1)));return {...s,lon:s.a[0]+f*(s.b[0]-s.a[0]),lat:s.a[1]+f*(s.b[1]-s.a[1]),distance:Math.hypot(ax+f*dx,ay+f*dy)*rad*R,progress:s.along+f*s.length,bearing:bearing(s.a,s.b)}}
function roads(features){const out=[];for(const f of features){const p=f.properties||{},g=f.geometry;if(!g||!['LineString','MultiLineString'].includes(g.type)||!['motorway','trunk','primary','secondary','tertiary','minor','service','track','path','raceway'].includes(p.class)||p.access==='no'||p.bicycle==='no')continue;for(const c of g.type==='LineString'?[g.coordinates]:g.coordinates){if(c.length<2||c.some(v=>!Number.isFinite(v[0])||!Number.isFinite(v[1])))continue;const grade=String(p.layer??0)+':'+String(p.brunnel||'');out.push({key:grade+':'+JSON.stringify(c),grade,coordinates:c})}}return out}
function connected(a,b){if(a.key===b.key)return true;const ends=c=>[c[0],c.at(-1)],same=a.grade===b.grade;
// A geometric crossing has no shared vertex. Grade transitions are allowed only at both line ends.
return a.coordinates.some((p,i)=>b.coordinates.some((q,j)=>dist(p,q)<1.5&&(same||((i===0||i===a.coordinates.length-1)&&(j===0||j===b.coordinates.length-1)))))}
class Matcher{
 constructor(){this.reset()}
 reset(){this.lock=null;this.last=null;this.route=null;this.missAt=null;this.cached=null}
 match(p,lines,options={}){if(!p)return p;const t=p.t,now=options.now??Date.now(),tolerance=Math.max(5,Math.min(60,Number(options.tolerance)||25));
 if(options.enabled===false||!Number.isFinite(t)||now-t>10000||now<t-1000||!Number.isFinite(p.accuracy)||p.accuracy>Math.max(50,tolerance*2)){this.reset();return p}
 const config=[options.enabled,options.tolerance];if(this.config&&config.some((v,i)=>v!==this.config[i])||options.route!==this.route){this.reset()}this.config=config;
 if(this.last&&t===this.last.t)return this.cached||p;
 if(this.last&&(t<this.last.t||t-this.last.t>15000)){this.reset()}
 const prev=this.last,travel=prev?dist([prev.lon,prev.lat],[p.lon,p.lat]):0,dt=prev?(t-prev.t)/1000:0;
 let heading=Number.isFinite(p.heading)&&p.speed>=1?p.heading:null;
 if(heading===null&&prev&&travel>Math.max(5,Math.min(15,p.accuracy))&&dt>0)heading=bearing([prev.lon,prev.lat],[p.lon,p.lat]);
 this.last={...p};if(options.route!==this.route){this.lock=null;this.missAt=null;this.route=options.route}
 let list=lines;if(this.lock&&!list.some(l=>l.key===this.lock.key))list=[...list,this.lock];
 let candidates=segments(list).map(s=>{const q=project(s,p);q.reverse=heading!==null&&angle(heading,q.bearing)>90;q.direction=heading===null?0:Math.min(angle(heading,q.bearing),angle(heading,(q.bearing+180)%360));q.score=q.distance+q.direction*.3;return q}).filter(q=>q.distance<=tolerance&&q.direction<=55);
 if(this.lock){const old=this.lock,maxStep=Math.max(25,Math.min(200,travel*2+10,dt*20+10));candidates=candidates.filter(q=>q.key!==old.key||Math.abs(q.progress-old.progress)<=maxStep);const same=candidates.filter(q=>q.key===old.key),continuations=candidates.filter(q=>q.key!==old.key&&connected(old,q)&&dist([old.lon,old.lat],[q.lon,q.lat])<=maxStep);if(same.length)candidates=same;else candidates=continuations}
 candidates.sort((a,b)=>a.score-b.score);const best=candidates[0];
 if(!best){if(this.lock){this.missAt??=t;if(t-this.missAt>=8000)this.lock=null}this.cached=p;return p}
 this.missAt=null;this.lock=best;this.cached={...p,lat:best.lat,lon:best.lon,heading:heading===null?(p.heading??0):(best.bearing+(best.reverse?180:0))%360,snapped:true,snapDistance:best.distance};return this.cached}
}
root.CykloRoadMatch={Matcher,roads,connected};
})(globalThis);
