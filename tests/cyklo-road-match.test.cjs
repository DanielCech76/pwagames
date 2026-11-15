const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync('module-src/cyklo/road-matcher.js','utf8'),ctx);const {Matcher,connected,roads}=ctx.CykloRoadMatch;
const line=(key,c,grade='0:')=>({key,coordinates:c,grade});const east=line('east',[[0,0],[.003,0]]),bridge=line('bridge',[[.001,-.002],[.001,.002]],'1:bridge');let t=100000;
const fix=(lon,lat=0,heading=90)=>({lon,lat,heading,speed:5,accuracy:10,t:t+=3000});const match=(m,p,lines,extra={})=>m.match(p,lines,{now:p.t,...extra});
let m=new Matcher(),p=fix(.0005,.00008);let q=match(m,p,[east,bridge]);assert(q.snapped);assert.equal(q.lat,0);assert.equal(p.lat,.00008,'raw fix is untouched');
q=match(m,fix(.001,.00002),[east,bridge]);assert.equal(q.lat,0,'crossing stays on original road');assert.equal(m.lock.key,'east');
q=match(m,fix(.001,.00003,0),[east,bridge]);assert(!q.snapped,'incompatible direction releases display to GPS rather than another level');
assert(!connected(east,bridge));assert(!connected(east,line('cross',[[.001,-.001],[.001,.001]])),'geometric crossing is not a junction');
const north=line('north',[[.003,0],[.003,.002]]);assert(connected(east,north));m=new Matcher();match(m,fix(.00295),[east,north]);q=match(m,fix(.003,.0001,0),[east,north]);assert.equal(m.lock.key,'north','real junction allows a turn');
m=new Matcher();q=match(m,fix(.001,.0004),[east]);assert(!q.snapped,'outside tolerance');q=match(m,fix(.001,.0004),[east],{tolerance:60});assert(q.snapped);
m=new Matcher();p=fix(.001,.00005);q=match(m,p,[east],{enabled:false});assert.equal(q,p);
p=fix(.001);q=m.match(p,[east],{now:p.t+11000});assert.equal(q,p,'stale GPS');p={...fix(.001),accuracy:90};assert.equal(match(m,p,[east]),p,'weak GPS');
// A folded route crosses itself at a distant progress point: stay on the local branch.
const route={};const folded=line('active-route',[[0,0],[.002,0],[.002,.01],[.001,.01],[.001,-.001]]);m=new Matcher();match(m,fix(.0008),[folded],{route});q=match(m,fix(.001,.00004,0),[folded],{route});assert(!q.snapped,'cannot jump a kilometre along route at crossing');
// Persistent departure eventually permits acquisition of another disconnected road.
m=new Matcher();match(m,fix(.0005),[east,bridge]);for(let i=0;i<10;i++)q=match(m,fix(.001,.0008,0),[east,bridge]);assert.equal(m.lock.key,'bridge');
assert.equal(roads([{properties:{class:'rail'},geometry:{type:'LineString',coordinates:[[0,0],[1,1]]}}]).length,0);
console.log('road matching: direction, tolerance, junctions, bridge crossing, route continuity, release, raw fixes OK');
