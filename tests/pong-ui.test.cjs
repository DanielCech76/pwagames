const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
function setup({pending=false,deny=false}={}){
const els={},events={},docEvents={},frames=new Map(),storage=new Map();let lifecycle,permissionCalls=0,resolvePermission,time=100,raf=0;
const list=()=>({add(){},remove(){},toggle(){}});
const context2d=new Proxy({}, {get:(_,key)=>key==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}});
const el=id=>els[id]??={hidden:false,open:false,value:id==='controlMode'?'touch':'',classList:list(),style:{setProperty(){}},setAttribute(){},listeners:{},addEventListener(t,f){(this.listeners[t]??=[]).push(f)},querySelector(){return el(id+'strong')},getContext:()=>context2d,showModal(){this.open=true},close(){this.open=false;for(const f of this.listeners.close||[])f()},click(){this.onclick?.();for(const f of this.listeners.click||[])f()}};
const add=(name,fn)=>{(events[name]??=new Set()).add(fn)};
const window={addEventListener:add,removeEventListener:(n,f)=>events[n]?.delete(f)};
const document={getElementById:el,body:{classList:list()},hidden:false,addEventListener:(n,f)=>{(docEvents[n]??=[]).push(f)}};
const permission=()=>{permissionCalls++;return pending?new Promise(r=>resolvePermission=r):Promise.resolve(deny?'denied':'granted')};
const ctx={window,document,DeviceOrientationEvent:{requestPermission:permission},DeviceMotionEvent:{requestPermission:permission},ArcadeHost:{storage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},register:x=>lifecycle=x,back:()=>lifecycle.stop()},screen:{orientation:{angle:0}},performance:{now:()=>time},matchMedia:()=>({matches:false}),requestAnimationFrame:f=>{frames.set(++raf,f);return raf},cancelAnimationFrame:id=>frames.delete(id),setTimeout:()=>0,Math,Number,Promise};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('module-src/pong/motion.js','utf8'),ctx);ctx.PongMotion=window.PongMotion;vm.runInContext(fs.readFileSync('module-src/pong/game.js','utf8'),ctx);
return {el,document,storage,open:()=>lifecycle.start(),stop:()=>lifecycle.stop(),calls:()=>permissionCalls,resolve:()=>resolvePermission('granted'),emit:(n,e)=>{for(const f of events[n]||[])f(e)},count:n=>events[n]?.size||0,hidden(){document.hidden=true;for(const f of docEvents.visibilitychange||[])f()},frame(t){time=t;const f=[...frames.values()].at(-1);f(t)}};
}
(async()=>{
const flush=async()=>{for(let i=0;i<5;i++)await Promise.resolve()};
const s=setup();s.open();assert.equal(s.calls(),0);s.el('controlMode').value='position';s.el('controlMode').onchange();await flush();assert.equal(s.calls(),1);assert.equal(s.el('pause').textContent,'▶');s.emit('deviceorientation',{beta:45,gamma:0});s.el('calibrate').click();assert.match(s.el('motionStatus').textContent,/Kalibrováno/);s.el('resume').click();assert.equal(s.el('pause').textContent,'Ⅱ');s.frame(1000);assert.equal(s.el('pause').textContent,'▶');assert.match(s.el('motionStatus').textContent,/nedodává/);s.hidden();assert.equal(s.count('deviceorientation'),0);assert.equal(s.count('devicemotion'),0);s.stop();
const race=setup({pending:true});race.open();race.el('controlMode').value='velocity';race.el('controlMode').onchange();race.el('controlMode').value='touch';race.el('controlMode').onchange();race.resolve();await flush();assert.equal(race.count('deviceorientation'),0,'cancel pending permission');
const denied=setup({deny:true});denied.open();denied.el('controlMode').value='gyro';denied.el('controlMode').onchange();await flush();assert.equal(denied.calls(),2);assert.equal(denied.count('devicemotion'),0);assert.match(denied.el('motionStatus').textContent,/nebyl povolen/);
const html=fs.readFileSync('module-src/pong/index.html','utf8');for(const m of fs.readFileSync('module-src/pong/game.js','utf8').matchAll(/\$\('([^']+)'\)/g))assert(html.includes('id="'+m[1]+'"'),'missing UI '+m[1]);
console.log('PASS: Pong UI lifecycle, explicit permission, calibration/resume, stale pause, background cleanup, permission cancellation/denial and UI references');
})().catch(e=>{console.error(e);process.exitCode=1});
