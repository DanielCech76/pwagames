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
