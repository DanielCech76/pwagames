const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const events={},dialogEvents={},sent=[],stored=new Map();let starts=0,pauses=0,stops=0,observer;
const parent={postMessage:m=>sent.push(m)},dialog={id:'settings',open:false,addEventListener:(type,fn)=>dialogEvents[type]=fn,close(){this.open=false;dialogEvents.close?.()}};
const context={window:{addEventListener:(type,fn)=>events[type]=fn},parent,location:{origin:'https://test.local'},document:{currentScript:{dataset:{moduleId:'pong'}},querySelectorAll:()=>[dialog],getElementById:()=>dialog},localStorage:{getItem:k=>stored.get(k)||null,setItem:(k,v)=>stored.set(k,v),removeItem:k=>stored.delete(k)},MutationObserver:class{constructor(fn){observer=fn}observe(){}}};
vm.createContext(context);vm.runInContext(fs.readFileSync('scripts/module-bridge.js','utf8'),context);
context.window.ArcadeHost.register({start:()=>starts++,pause:()=>pauses++,stop:()=>stops++,dialogs:{settings:()=>{dialog.open=true;observer()}}});assert.equal(sent.at(-1).type,'READY');
function command(type,data={},origin='https://test.local',source=parent){events.message({source,origin,data:{arcadeHost:1,id:'pong',type,...data}})}
command('INIT',{},'https://evil.local');assert.equal(starts,0);command('INIT',{apiVersion:1});command('INIT',{apiVersion:1});assert.equal(starts,1);command('PAUSE');assert.equal(pauses,1);
context.window.ArcadeHost.storage.setItem('record',123);assert.equal(stored.get('arcade.data.pong.record'),'123');command('OPEN_DIALOG',{dialog:'settings'});assert.equal(sent.at(-1).type,'DIALOG_OPEN');let prevented=false;dialogEvents.cancel({preventDefault(){prevented=true}});assert(prevented);assert.equal(sent.at(-1).type,'BACK');command('CLOSE_DIALOG',{dialog:'settings'});assert(!dialog.open);command('STOP');assert.equal(stops,1);assert.equal(sent.at(-1).type,'STOPPED');
console.log('PASS: host source/origin validation, lifecycle, dialog/back protocol, namespaced data');
