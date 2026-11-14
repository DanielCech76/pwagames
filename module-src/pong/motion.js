/* Motion controller: pure mapping is also exercised by Node tests. */
(function(root){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const profiles={direct:{tau:.045,dead:2,accel:4200},balanced:{tau:.11,dead:3,accel:2600},walking:{tau:.19,dead:5,accel:1700}};
const wrap=x=>((x+180)%360+360)%360-180;
class PongMotion {
 constructor(){this.reset();this.mode='touch';this.profile='balanced';this.sensitivity=1;this.tuning={};this.inverted={};}
 reset(){this.filtered=0;this.speed=0;this.active=false;this.input=0;this.zero=null;this.lastOrientation=0;this.lastRate=0;this.lastAcceleration=0;this.raw=null;this.rate=null;this.acceleration=null;this.suspend();this.displacement=0;}
 orientation(beta,gamma,angle=0,time=performance.now()){
  if(!Number.isFinite(beta)||!Number.isFinite(gamma))return;
  const b=beta*Math.PI/180,g=gamma*Math.PI/180,a=angle*Math.PI/180;
  // Gravity projected into displayed screen axes; independent of compass heading.
  const x=-Math.cos(b)*Math.sin(g),y=Math.sin(b),z=Math.cos(b)*Math.cos(g);
  const sx=x*Math.cos(a)-y*Math.sin(a),sy=x*Math.sin(a)+y*Math.cos(a);
  this.raw={tilt:Math.atan2(-sx,Math.hypot(sy,z))*180/Math.PI,wheel:Math.atan2(-sx,sy)*180/Math.PI,wheelValid:Math.hypot(sx,sy)>.25};this.lastOrientation=time;
 }
 motion(rate,acc,angle=0,time=performance.now()){
  const a=angle*Math.PI/180;
  if(rate&&Number.isFinite(rate.gamma)&&Number.isFinite(rate.beta)){this.rate=-(rate.gamma*Math.cos(a)-rate.beta*Math.sin(a));this.lastRate=time;}
  if(acc&&Number.isFinite(acc.x)&&Number.isFinite(acc.y)){const previous=this.lastAcceleration;this.acceleration=acc.x*Math.cos(a)-acc.y*Math.sin(a);this.lastAcceleration=time;if(this.mode==='translation'&&this.zero&&this.tracking){const dt=(time-previous)/1000;if(dt>0&&dt<=.1){let value=this.acceleration-this.zero.acc;const threshold=this.profile==='walking'?.3:this.profile==='direct'?.06:.12;if(Math.abs(value)<threshold){value=0;this.quietTime+=dt;}else this.quietTime=0;const before=this.velocity;if(this.quietTime>.16)this.velocity=0;else this.velocity=clamp(this.velocity+value*dt,-2,2);const delta=(before+this.velocity)*.5*dt;this.pendingDelta+=delta;this.displacement+=delta;}else{this.velocity=0;this.pendingDelta=0;}}}
 }
 ready(now=performance.now()){
  if(this.mode==='touch')return true;
  if(this.mode==='gyro')return this.rate!==null&&now-this.lastRate<700;
  if(this.mode==='impulse'||this.mode==='translation')return this.acceleration!==null&&now-this.lastAcceleration<700;
  return !!this.raw&&now-this.lastOrientation<700&&(this.mode!=='wheel'||this.raw.wheelValid);
 }
 calibrate(now=performance.now()){
  if(!this.ready(now))return false;
  this.zero={tilt:this.raw?.tilt||0,wheel:this.raw?.wheel||0,rate:this.rate||0,acc:this.acceleration||0};this.filtered=0;this.speed=0;this.input=0;this.active=false;this.suspend();this.displacement=0;this.tracking=true;return true;
 }
 suspend(){this.velocity=0;this.quietTime=0;this.pendingDelta=0;this.tracking=false;}
 direction(){return this.inverted[this.mode]?-1:1;}
 reading(){
  if(!this.zero)return 0;
  return this.direction()*(this.mode==='translation'?this.displacement*100:this.mode==='gyro'?this.rate-this.zero.rate:this.mode==='impulse'?this.acceleration-this.zero.acc:wrap(this.raw[this.mode==='wheel'?'wheel':'tilt']-this.zero[this.mode==='wheel'?'wheel':'tilt']));
 }
 limits(){const def=this.mode==='translation'?20:this.mode==='gyro'?65:this.mode==='impulse'?2:22;return this.tuning[this.mode]||{left:def,right:def,speed:1.25};}
 setLimits(left,right,speed){
  const min=this.mode==='translation'?2:this.mode==='impulse'?.2:this.mode==='gyro'?12:6,max=this.mode==='translation'?100:this.mode==='impulse'?30:this.mode==='gyro'?360:85;
  if(![left,right,speed].every(Number.isFinite)||left<min||right<min||left>max||right>max||speed<.2||speed>3)return false;
  this.tuning[this.mode]={left,right,speed};this.speed=0;return true;
 }
 step(dt,position,range,now=performance.now()){
  if(this.mode==='touch'||!this.zero||!this.ready(now))return position;
  if(this.mode==='translation'){const delta=this.pendingDelta*this.direction()*this.sensitivity;this.pendingDelta=0;const limits=this.limits(),limit=(delta<0?limits.left:limits.right)/100;this.input=this.reading();const change=clamp(delta/limit*range/2,-range*limits.speed*dt,range*limits.speed*dt);return clamp(position+change,0,range);}
  const p=profiles[this.profile]||profiles.balanced;
  let value=this.reading();
  this.filtered+=(value-this.filtered)*(1-Math.exp(-dt/p.tau));value=this.filtered*this.sensitivity;
  const dead=this.mode==='gyro'?p.dead*1.5:this.mode==='impulse'?p.dead*.13:p.dead;
  if(Math.abs(value)>dead)this.active=true;else if(Math.abs(value)<dead*.7)this.active=false;
  this.input=this.active?Math.sign(value)*Math.max(0,Math.abs(value)-dead*.7):0;
  const limits=this.limits(),max=range*limits.speed;
  const normalized=clamp(this.input/(Math.max(.01,(this.input<0?limits.left:limits.right)-dead*.7)),-1,1);
  let target=0;
  if(this.mode==='position'||this.mode==='wheel'){
   const desired=range/2+clamp(normalized,-1,1)*range/2;
   target=clamp((desired-position)*9,-max,max);
  }else if(this.mode==='gyro')target=clamp(normalized,-1,1)*max;
  else if(this.mode==='impulse')target=clamp(this.speed*Math.exp(-dt*3.5)+normalized*dt*max*4,-max,max);
  else target=Math.sign(this.input)*Math.pow(clamp(Math.abs(normalized),0,1),1.5)*max;
  this.speed+=clamp(target-this.speed,-p.accel*dt,p.accel*dt);
  const next=clamp(position+this.speed*dt,0,range);if(next===0||next===range)this.speed=0;return next;
 }
}
root.PongMotion=PongMotion;if(typeof module!=='undefined')module.exports={PongMotion,wrap};
})(typeof window==='undefined'?globalThis:window);
