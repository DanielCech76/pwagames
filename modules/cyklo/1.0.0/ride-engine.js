(function(root){
'use strict';const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rad=x=>x*Math.PI/180;
function distance(a,b){const dlat=rad(b.lat-a.lat),dlon=rad(b.lon-a.lon),h=Math.sin(dlat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dlon/2)**2;return 6371008.8*2*Math.asin(Math.sqrt(Math.min(1,h)))}
function bearing(a,b){const l=rad(b.lon-a.lon),x=Math.sin(l)*Math.cos(rad(b.lat)),y=Math.cos(rad(a.lat))*Math.sin(rad(b.lat))-Math.sin(rad(a.lat))*Math.cos(rad(b.lat))*Math.cos(l);return (Math.atan2(x,y)*180/Math.PI+360)%360}
class RideEngine{
 constructor(saved){Object.assign(this,{id:typeof crypto!=='undefined'?crypto.randomUUID():String(Math.random()),schemaVersion:1,name:'Jízda',state:'ready',gps:'idle',movement:'unknown',startAt:null,endAt:null,clock:null,movingMs:0,stoppedMs:0,manualMs:0,distanceM:0,maxSpeed:0,segment:0,seq:0,last:null,speed:null,heading:null,altitude:null,autoPause:true,startCandidate:null,stopCandidate:null,pendingDistance:0,events:[],quality:{rejected:0,gaps:0}},saved||{});}
 advance(now){if(this.startAt===null||this.endAt!==null)return;const dt=Math.max(0,now-this.clock);if(this.state==='manual-paused')this.manualMs+=dt;else if(this.state==='recording'&&this.last){const valid=Math.max(0,Math.min(now,this.last.t+10000)-this.clock);if(this.movement==='moving')this.movingMs+=valid;else if(this.movement==='stopped')this.stoppedMs+=valid;}this.clock=Math.max(this.clock,now);if(this.last&&now-this.last.t>10000&&this.state==='recording'){if(this.gps!=='lost'){this.event('gps-lost',now);this.quality.gaps++;this.segment++;}this.gps='lost';this.movement='unknown';this.speed=null;this.startCandidate=null;this.stopCandidate=null;this.pendingDistance=0;}}
 lose(now){this.advance(now);if(this.last){this.segment++;this.quality.gaps++;}this.last=null;this.gps='lost';this.speed=null;this.movement='unknown';this.pendingDistance=0;this.startCandidate=null;this.stopCandidate=null;this.event('gps-lost',now);}
 event(type,t){this.events.push({type,t});}
 begin(){if(this.startAt===null){this.state='waiting-fix';this.gps='acquiring';}else{this.state='recording';this.last=null;this.movement='unknown';this.segment++;this.event('resume',Date.now())}}
 pause(now,interrupted=false){this.advance(now);if(this.startAt===null){this.state='ready';return}this.state=interrupted?'interrupted':'manual-paused';this.event(interrupted?'interrupted':'pause',now);this.segment++;this.last=null;this.speed=null;this.movement='unknown';this.startCandidate=null;this.stopCandidate=null;this.pendingDistance=0;}
 finish(now){this.advance(now);this.endAt=now;this.state='completed';this.event('completed',now);}
 ingest(raw,received=Date.now()){
  const p={lat:raw.latitude,lon:raw.longitude,t:raw.timestamp,accuracy:raw.accuracy,alt:Number.isFinite(raw.altitude)?raw.altitude:null,altAccuracy:Number.isFinite(raw.altitudeAccuracy)?raw.altitudeAccuracy:null};
  if(![p.lat,p.lon,p.t,p.accuracy].every(Number.isFinite)||Math.abs(p.lat)>90||Math.abs(p.lon)>180||p.accuracy<0||p.t>received+5000||received-p.t>15000||this.last&&p.t<=this.last.t){this.quality.rejected++;return null}
  if(p.accuracy>30){this.advance(received);this.gps='weak';this.speed=null;this.quality.rejected++;return null}
  if(!['waiting-fix','recording'].includes(this.state))return null;
  if(this.startAt===null){this.startAt=p.t;this.clock=p.t;this.state='recording';this.event('start',p.t)}
  this.advance(p.t);let prev=this.gps==='lost'?null:this.last;let d=prev?distance(prev,p):0,dt=prev?(p.t-prev.t)/1000:0;
  if(dt>10){prev=null;d=0;}
  if(prev&&d/Math.max(dt,.001)>100/3.6&&d>p.accuracy+prev.accuracy){this.quality.rejected++;this.gps='weak';return null}
  let speed=Number.isFinite(raw.speed)&&raw.speed>=0?raw.speed:null,source='gps';
  if(speed===null){source='estimated';if(prev&&dt>0&&d>Math.max(3,(p.accuracy+prev.accuracy)*.35))speed=d/dt;else if(prev&&dt>=1&&d<Math.max(3,p.accuracy*.35))speed=0;}
  if(speed!==null&&speed>100/3.6){this.quality.rejected++;return null}
  this.gps='valid';this.altitude=p.alt;
  if(speed!==null){this.speed=speed;this.maxSpeed=Math.max(this.maxSpeed,speed);if(speed>4/3.6){if(Number.isFinite(raw.heading)&&raw.heading>=0)this.heading=raw.heading%360;else if(prev&&d>Math.max(5,p.accuracy))this.heading=bearing(prev,p);}}
  else this.speed=null;
  const old=this.movement;
  if(speed===null){this.movement='unknown';this.startCandidate=null;this.stopCandidate=null;this.pendingDistance=0;}
  else if(!this.autoPause){this.movement='moving';}
  else if(this.movement==='moving'){
   if(speed<1.5/3.6){if(this.stopCandidate===null)this.stopCandidate=p.t;if(p.t-this.stopCandidate>=8000){this.movingMs=Math.max(0,this.movingMs-(p.t-this.stopCandidate));this.stoppedMs+=p.t-this.stopCandidate;this.movement='stopped';this.stopCandidate=null;this.pendingDistance=0;this.segment++;this.event('auto-pause',p.t)}}else{this.stopCandidate=null;this.distanceM+=this.pendingDistance;this.pendingDistance=0;}
  }else if(speed>3/3.6){if(this.startCandidate===null)this.startCandidate=p.t;if(p.t-this.startCandidate>=3000){const t=p.t-this.startCandidate;if(old==='stopped')this.stoppedMs=Math.max(0,this.stoppedMs-t);this.movingMs+=t;this.movement='moving';this.distanceM+=this.pendingDistance;this.pendingDistance=0;this.startCandidate=null;this.segment++;this.event('auto-resume',p.t)}}else{this.startCandidate=null;this.pendingDistance=0;this.movement='stopped';}
  if(prev){if(this.movement==='moving'&&this.stopCandidate===null)this.distanceM+=d;else if(this.startCandidate!==null||this.stopCandidate!==null)this.pendingDistance+=d;}
  this.last=p;p.speed=speed;p.speedSource=source;p.heading=this.heading;p.segment=this.segment;p.seq=++this.seq;p.moving=this.movement==='moving';return p;
 }
 summary(now=Date.now()){this.advance(now);const elapsed=this.startAt===null?0:Math.max(0,(this.endAt??now)-this.startAt);return {elapsed,moving:this.movingMs,unknown:Math.max(0,elapsed-this.movingMs-this.manualMs-this.stoppedMs),distance:this.distanceM,average:this.movingMs>0?this.distanceM/(this.movingMs/1000):null,maxSpeed:this.maxSpeed};}
 export(){return JSON.parse(JSON.stringify(this));}
}
root.Cyklo={RideEngine,distance,bearing,clamp};if(typeof module!=='undefined')module.exports=root.Cyklo;
})(globalThis);
