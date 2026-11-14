const assert=require('node:assert/strict');
const Engine=require('../module-src/pinball/pinball-engine');
const table=require('../module-src/pinball/pinball-tables')[0];
for(const power of [0,.5,1]){
 const e=new Engine(table);e.launch(power);let reachedField=false;
 for(let i=0;i<240*12;i++){
  e.step(1/240,[i%150<80,i%130<70]);
  if(!e.ready&&e.ball.x<500)reachedField=true;
  assert(Number.isFinite(e.ball.x+e.ball.y+e.ball.vx+e.ball.vy));
 }
 assert(reachedField,'Every launch power must reach the playing field');
}
const e=new Engine(table);e.launch();
e.ball={x:210,y:175,vx:0,vy:200,r:10};e.step(1/240);
assert(e.score>0);assert(e.ball.vy<0);
const f=new Engine(table);f.launch();
f.ball={x:245,y:855,vx:0,vy:120,r:10};
for(let i=0;i<12;i++)f.step(1/240,[true,false]);
assert(f.ball.vy<0,'A moving flipper must lift the ball');
const targets=new Engine(table);targets.launch();
for(const target of table.targets){targets.ball={x:target.x,y:target.y+20,vx:0,vy:-100,r:10};targets.step(1/240)}
assert.equal(targets.multiplier,2);assert.equal(targets.score,3500);assert(targets.targets.every(hit=>!hit));
for(let i=0;i<3;i++){e.ready=false;e.ball.y=1100;e.step(1/240)}
assert(e.over);assert.equal(e.number,3);
e.reset();assert(!e.over);assert(e.ready);assert.equal(e.score,0);
console.log('PASS: launch powers, stable physics, bumper, moving flipper, target bonus, three balls, reset');
// Regression: returning to the plunger must re-arm without consuming a ball.
const reloadEvents=[];const returned=new Engine(table,type=>reloadEvents.push(type));
returned.launch();returned.score=1234;returned.leftLauncher=true;
returned.ball={x:550,y:910,vx:0,vy:200,r:10};returned.step(1/240);
assert(returned.ready);assert.equal(returned.number,1);assert.equal(returned.score,1234);assert(reloadEvents.includes('reload'));
returned.launch(.4);assert(!returned.ready);assert(returned.ball.vy<0);
// A low-speed ball at the bottom of the lane also becomes playable again.
const settled=new Engine(table);settled.launch();settled.launchAge=2;
settled.ball={x:550,y:925,vx:0,vy:0,r:10};settled.step(1/240);assert(settled.ready);
// The original shot must not be mistaken for a returning ball.
const fresh=new Engine(table);fresh.launch();fresh.step(1/240);assert(!fresh.ready);
// Full active travel in at most 33 ms, with motion in the first fixed step.
const responsive=new Engine(table);responsive.step(1/240,[true,true]);
assert(responsive.flippers[0].angle<table.flippers[0].rest);
for(let i=1;i<8;i++)responsive.step(1/240,[true,true]);
assert(Math.abs(responsive.flippers[0].angle-table.flippers[0].active)<1e-9);
assert(Math.abs(responsive.flippers[1].angle-table.flippers[1].active)<1e-9);
console.log('PASS: returning/settled launch-lane ball, preserved score and ball count, re-launch, <=33 ms flipper travel');
