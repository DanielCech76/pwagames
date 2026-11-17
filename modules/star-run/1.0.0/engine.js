/* Pure simulation: world coordinates and scoring do not depend on screen aspect. */
(function(root){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
class Flight{
 constructor(training=false,random=Math.random){this.training=training;this.random=random;this.x=0;this.y=0;this.time=0;this.score=0;this.health=3;this.energy=100;this.rings=0;this.perfect=0;this.hits=0;this.objects=[{kind:'ring',x:0,y:0,z:7,r:.4},{kind:'rock',x:-.85,y:-.4,z:5,r:.22,spin:1},{kind:'rock',x:.9,y:.3,z:9,r:.27,spin:2},{kind:'rock',x:-.6,y:.6,z:12,r:.18,spin:3}];this.spawnAt=.8;this.ringAt=1.6;this.invincible=0;this.flash=0;this.shield=false;this.ended=false;this.distance=0;}
 step(dt,input){if(this.ended)return;dt=clamp(dt,0,.05);this.time+=dt;this.invincible=Math.max(0,this.invincible-dt);this.flash=Math.max(0,this.flash-dt);const smooth=1-Math.exp(-9*dt);this.x+=(clamp(input.x,-1,1)*.82-this.x)*smooth;this.y+=(clamp(input.y,-1,1)*.78-this.y)*smooth;
 this.shield=!!input.shield&&this.energy>0;this.energy=clamp(this.energy+(this.shield?-32:3)*dt,0,100);if(this.energy===0)this.shield=false;
 const speed=this.training?2.5:3.2+Math.min(3,this.time/45);this.distance+=speed*dt;this.score+=dt*10;this.spawnAt-=dt;this.ringAt-=dt;
 if(this.spawnAt<=0){this.spawnAt=this.training?1.25:Math.max(.42,.95-this.time/220);this.objects.push({kind:'rock',x:(this.random()-.5)*2.8,y:(this.random()-.5)*2.5,z:15,r:.14+this.random()*.14,spin:this.random()*6.28});}
 if(this.ringAt<=0){this.ringAt=3.6;this.objects.push({kind:'ring',x:(this.random()-.5)*1.25,y:(this.random()-.5)*1.1,z:15,r:.4});}
 for(const o of this.objects){const old=o.z;o.z-=speed*dt;if(old>.7&&o.z<=.7){const d=Math.hypot(this.x-o.x,this.y-o.y);if(o.kind==='ring'&&d<o.r-.04){this.rings++;const perfect=d<.16;this.perfect+=perfect?1:0;this.score+=perfect?500:250;this.energy=clamp(this.energy+25,0,100);o.collected=true;}else if(o.kind==='rock'&&d<o.r+.09&&this.invincible<=0){o.hit=true;if(!this.shield){this.hits++;this.flash=.45;if(!this.training)this.health--;this.invincible=1.25;}}}}
 this.objects=this.objects.filter(o=>o.z>-.3);if(this.health<=0)this.ended=true;
 }
}
function tiltVector(beta,gamma,angle){const r=angle*Math.PI/180;return{x:gamma*Math.cos(r)+beta*Math.sin(r),y:beta*Math.cos(r)-gamma*Math.sin(r)};}
const api={Flight,tiltVector,clamp};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.StarRun=api;
})(globalThis);
