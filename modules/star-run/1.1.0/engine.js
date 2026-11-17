/* World-space simulation. Effects are visual only and never move collision bodies. */
(function(root){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rockHealth=r=>r<=.18?2:r<=.24?3:5;
class Flight{
 constructor(training=false,random=Math.random,options={}){
  this.training=training;this.random=random;this.maxRings=clamp(Math.round(Number(options.maxRings)||6),3,12);
  this.x=0;this.y=0;this.time=0;this.score=0;this.health=3;this.energy=100;this.rings=0;this.perfect=0;this.hits=0;this.destroyed=0;this.shotsFired=0;this.ended=false;this.distance=0;this.effects=[];this.level=0;this.nextLevel();
 }
 nextLevel(){
  if(this.ended||this.level&&!this.levelComplete)return false;
  this.level++;this.levelTime=0;this.levelPassed=0;this.levelCollected=0;this.levelComplete=false;
  this.speed=(this.training?2.5:3.2)*Math.pow(1.12,this.level-1);
  this.objects=[];this.bullets=[];this.effects=[];this.spawnAt=.8;this.shotAt=0;this.invincible=0;this.flash=0;this.bump=0;this.shield=false;
  // Every level has exactly the requested number of gates, passing at 3..27 seconds.
  for(let i=0;i<this.maxRings;i++)this.objects.push({kind:'ring',x:i?(this.random()-.5)*1.25:0,y:i?(this.random()-.5)*1.1:0,z:.7+this.speed*(3+24*i/(this.maxRings-1)),r:.4});
  for(const [x,y,t,r] of [[-.85,-.4,1.5,.22],[.9,.3,3,.27],[-.6,.6,4.5,.18]])this.objects.push(this.rock(x,y,.7+this.speed*t,r));
  return true;
 }
 rock(x,y,z,r){const hp=rockHealth(r);return{kind:'rock',x,y,z,r,hp,maxHp:hp,spin:this.random()*6.28};}
 nearestRing(){return this.objects.filter(o=>o.kind==='ring'&&!o.passed&&o.z>=.7).reduce((a,o)=>!a||o.z<a.z?o:a,null);}
 aimedAt(o){return !!o&&Math.hypot(this.x-o.x,this.y-o.y)<o.r-.04;}
 effect(kind,x,y,z,r){this.effects.push({kind,x,y,z,r,age:0,duration:kind==='gate'?.55:.45});if(this.effects.length>40)this.effects.shift();}
 damageRock(o){if(o.destroyed||o.hit)return;const hp=o.hp??rockHealth(o.r);o.maxHp??=hp;o.hp=hp-1;this.effect(o.hp<=0?'explosion':'spark',o.x,o.y,o.z,o.r);if(o.hp<=0){o.destroyed=true;this.destroyed++;this.score+=o.maxHp*40;}}
 step(dt,input={}){
  if(this.ended||this.levelComplete)return;
  // Substeps keep bullets/collisions stable while the active-time deadline uses elapsed time.
  let remaining=Math.min(clamp(Number(dt)||0,0,1),30-this.levelTime);
  while(remaining>1e-9&&!this.ended&&!this.levelComplete){const sub=Math.min(.025,remaining);this.tick(sub,input);remaining-=sub;}
 }
 animateEffects(dt){
  this.flash=Math.max(0,this.flash-dt);this.bump=Math.max(0,this.bump-dt);for(const e of this.effects)e.age+=dt;this.effects=this.effects.filter(e=>e.age<e.duration);
 }
 tick(dt,input){
  this.time+=dt;this.levelTime=Math.min(30,this.levelTime+dt);this.invincible=Math.max(0,this.invincible-dt);this.animateEffects(dt);
  const smooth=1-Math.exp(-9*dt);this.x+=(clamp(input.x||0,-1,1)*.82-this.x)*smooth;this.y+=(clamp(input.y||0,-1,1)*.78-this.y)*smooth;
  this.shield=!!input.shield&&this.energy>0;this.energy=clamp(this.energy+(this.shield?-32:3)*dt,0,100);if(this.energy===0)this.shield=false;
  this.distance+=this.speed*dt;this.score+=dt*10;this.spawnAt-=dt;this.shotAt-=dt;
  if(this.spawnAt<=0){this.spawnAt=this.training?1.25:.95;this.objects.push(this.rock((this.random()-.5)*2.8,(this.random()-.5)*2.5,.7+this.speed*4,.14+this.random()*.14));}
  if(input.fire&&this.shotAt<=0){this.shotAt=.16;this.shotsFired++;this.bullets.push({x:this.x,y:this.y,z:.75});}
  const travel=this.speed*dt;
  // Swept collision: compare bullet's segment against moving rock depth, nearest first.
  for(const b of this.bullets){const old=b.z;b.z+=24*dt;const rock=this.objects.filter(o=>o.kind==='rock'&&!o.hit&&!o.destroyed&&Math.hypot(b.x-o.x,b.y-o.y)<o.r+.035&&old<=o.z+o.r&&b.z>=o.z-travel-o.r).sort((a,c)=>a.z-c.z)[0];if(rock){b.dead=true;this.damageRock(rock);}}
  this.bullets=this.bullets.filter(b=>!b.dead&&b.z<80);
  for(const o of this.objects){const old=o.z;o.z-=travel;if(o.destroyed||o.hit)continue;
   if(old>.7&&o.z<=.7){const d=Math.hypot(this.x-o.x,this.y-o.y);
    if(o.kind==='ring'&&!o.passed){o.passed=true;this.levelPassed++;if(this.aimedAt(o)){this.rings++;this.levelCollected++;const perfect=d<.16;this.perfect+=perfect?1:0;this.score+=perfect?500:250;this.energy=clamp(this.energy+25,0,100);o.collected=true;this.effect('gate',o.x,o.y,.7,o.r);}}
    else if(o.kind==='rock'&&d<o.r+.09&&this.invincible<=0){o.hit=true;this.bump=.4;this.effect('impact',this.x,this.y,.7,.2);this.invincible=1.25;if(!this.shield){this.hits++;this.flash=.35;if(!this.training)this.health--;}}
   }
  }
  this.objects=this.objects.filter(o=>o.z>-.3&&!o.destroyed&&!o.hit);
  if(this.health<=0)this.ended=true;
  else if(this.levelTime>=30-1e-8||this.levelPassed>=this.maxRings){this.levelComplete=true;this.shield=false;this.bullets=[];}
 }
}
function tiltVector(beta,gamma,angle){const r=angle*Math.PI/180;return{x:gamma*Math.cos(r)+beta*Math.sin(r),y:beta*Math.cos(r)-gamma*Math.sin(r)};}
const api={Flight,tiltVector,clamp,rockHealth};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.StarRun=api;
})(globalThis);
