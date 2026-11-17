const {strict:assert}=require('node:assert');const {Flight,tiltVector}=require('../module-src/star-run/engine.js');
const neutral={x:0,y:0,shield:false};
function object(f,kind,r=.25){f.objects=[{kind,x:0,y:0,z:.71,r}];f.step(.02,neutral)}
let f=new Flight(false,()=>.5);object(f,'rock');assert.equal(f.health,2);object(f,'rock');assert.equal(f.health,2,'collision cooldown');
f=new Flight(false,()=>.5);f.objects=[{kind:'rock',x:0,y:0,z:.71,r:.25}];f.step(.02,{...neutral,shield:true});assert.equal(f.health,3);assert.ok(f.energy<100);
f=new Flight(false,()=>.5);f.energy=0;f.objects=[{kind:'rock',x:0,y:0,z:.71,r:.25}];f.step(.02,{...neutral,shield:true});assert.equal(f.health,2,'empty shield does not protect');
f=new Flight(false,()=>.5);f.energy=40;object(f,'ring',.4);assert.equal(f.rings,1);assert.equal(f.perfect,1);assert.ok(f.score>=500);assert.ok(f.energy>=65);f.step(.02,neutral);assert.equal(f.rings,1,'gate scored once');
f=new Flight(true,()=>.5);for(let i=0;i<8;i++){f.invincible=0;object(f,'rock')}assert.equal(f.health,3);assert.equal(f.ended,false);
f=new Flight(false,()=>.5);for(let i=0;i<3;i++){f.invincible=0;object(f,'rock')}assert.equal(f.ended,true);const t=f.time;f.step(.05,neutral);assert.equal(f.time,t);
for(const a of [0,90,180,270]){const v=tiltVector(0,10,a);assert.ok(Math.abs(Math.hypot(v.x,v.y)-10)<1e-9)}assert.ok(Math.abs(tiltVector(10,0,90).x-10)<1e-9);
f=new Flight();for(let i=0;i<200;i++)f.step(.02,{x:100,y:-100});assert.ok(f.x<=.82&&f.y>=-.78);
console.log('PASS Star Run: collisions, cooldown, depleted shield, gate scoring, training, game-over, orientation mapping, movement bounds');
// Gate targeting selects only the closest upcoming ring and uses scoring tolerance.
f=new Flight(false,()=>.5,{maxRings:4});assert.equal(f.objects.filter(o=>o.kind==='ring').length,4);assert.equal(f.aimedAt(f.nearestRing()),true);f.x=.7;assert.equal(f.aimedAt(f.nearestRing()),false);
f=new Flight(false,()=>.5);f.objects=[{kind:'ring',x:0,y:0,z:.71,r:.4}];f.step(.02,neutral);assert.ok(f.effects.some(e=>e.kind==='gate'));assert.equal(f.nearestRing(),null);
f=new Flight(false,()=>.5);object(f,'rock');assert.ok(f.bump>0);assert.ok(f.effects.some(e=>e.kind==='impact'));const before=f.x;f.animateEffects(.5);assert.equal(f.bump,0);assert.equal(f.effects.length,0);assert.equal(f.x,before,'jolt does not change steering physics');
// Fixed gate quota, hard active-time limit even when no gate can be reached.
f=new Flight(true,()=>.5,{maxRings:3});for(let i=0;i<130;i++)f.step(.25,neutral);assert.equal(f.levelComplete,true);assert.equal(f.levelPassed,3);assert.ok(f.levelTime<=30);const speed=f.speed,score=f.score;assert.equal(f.nextLevel(),true);assert.equal(f.level,2);assert.ok(Math.abs(f.speed/speed-1.12)<1e-9);assert.equal(f.score,score);assert.equal(f.levelTime,0);assert.equal(f.nextLevel(),false,'cannot skip active level');
f=new Flight(true);f.objects=[];f.spawnAt=1e6;for(let i=0;i<121;i++)f.step(.25,neutral);assert.equal(f.levelComplete,true);assert.equal(f.levelPassed,0);assert.ok(Math.abs(f.levelTime-30)<1e-7);const stopped=f.time;f.step(.5,neutral);assert.equal(f.time,stopped);
// Rocks require exactly their size-dependent hit count; dead rocks cannot collide.
for(const [radius,hits] of [[.14,2],[.22,3],[.28,5]]){f=new Flight();const rock=f.rock(0,0,1,radius);assert.equal(rock.hp,hits);for(let i=1;i<=hits;i++){f.damageRock(rock);assert.equal(rock.hp,hits-i);assert.equal(!!rock.destroyed,i===hits)}assert.equal(f.destroyed,1);f.damageRock(rock);assert.equal(f.destroyed,1);f.objects=[rock];f.step(.25,neutral);assert.equal(f.health,3);}
// Swept projectile collision hits nearest target once, even crossing it in one update.
f=new Flight();const near=f.rock(0,0,1,.14),far=f.rock(0,0,1.3,.14);f.objects=[far,near];f.bullets=[{x:0,y:0,z:.75}];f.step(.025,neutral);assert.equal(near.hp,1);assert.equal(far.hp,2);assert.equal(f.bullets.length,0);
f=new Flight(true);f.objects=[];f.spawnAt=1e6;for(let i=0;i<40;i++)f.step(.025,{...neutral,fire:true});assert.ok(f.shotsFired>=5&&f.shotsFired<=7);assert.ok(f.bullets.length<=7);
console.log('PASS Star Run 1.1: targeting, flashes/sparks, visual recoil, gate quota, deadline, level progression, asteroid HP and swept shooting');
