const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
function setup(hash=''){
 const events={},elements={},calls=[],queue=[];const el=id=>elements[id]??={onclick:()=>calls.push(id),open:false,listeners:{},addEventListener(type,fn){(this.listeners[type]??=[]).push(fn)},showModal(){this.open=true},close(){if(!this.open)return;this.open=false;queue.push(()=>{for(const fn of this.listeners.close??[])fn()})}};
 for(const id of ['launch','back','pinLaunchGame','pinBack','labLaunch','labBack'])el(id);
 el('settingsOpen').onclick=()=>{calls.push('pause-pong');el('settings').showModal()};el('pinSettings').onclick=()=>{calls.push('pause-pinball');el('pinHelp').showModal()};
 const location={pathname:'/pwagames/',search:'',hash};const stack=[{state:null,url:'/pwagames/'+hash}];let index=0;
 const history={get state(){return stack[index].state},replaceState(state,_,url){stack[index]={state,url}},pushState(state,_,url){stack.splice(index+1);stack.push({state,url});index++},back(){this.go(-1)},go(n){const next=index+n;if(next<0||next>=stack.length)return;index=next;events.popstate({state:this.state})},forward(){this.go(1)}};
 const context={document:{getElementById:el},window:{addEventListener:(name,fn)=>events[name]=fn},location,history,Object};vm.createContext(context);vm.runInContext(fs.readFileSync('navigation.js','utf8'),context);
 return {el,history,calls,stack,flush(){while(queue.length)queue.shift()()}};
}
const s=setup();assert.equal(s.history.state.screen,'home');s.el('launch').onclick();assert.equal(s.history.state.screen,'pong');s.el('settingsOpen').onclick();assert.equal(s.history.state.dialog,'settings');s.history.back();s.flush();assert(!s.el('settings').open);assert.equal(s.history.state.screen,'pong');assert(!s.calls.includes('back'));
s.history.back();s.flush();assert.equal(s.history.state.screen,'home');assert(s.calls.includes('back'));
s.history.forward();s.history.forward();assert(s.el('settings').open);assert.equal(s.calls.filter(c=>c==='pause-pong').length,2,'Forward must pause again before restoring dialog');
s.el('settings').close();s.flush();assert.equal(s.history.state.dialog,null);s.el('back').onclick();s.flush();assert.equal(s.history.state.screen,'home');
s.el('labLaunch').onclick();s.history.back();assert(s.calls.includes('labBack'));s.el('pinLaunchGame').onclick();s.el('pinSettings').onclick();let prevented=false;for(const fn of s.el('pinHelp').listeners.cancel)fn({preventDefault(){prevented=true}});s.flush();assert(prevented);assert.equal(s.history.state.screen,'pinball');assert.equal(s.history.state.dialog,null);s.el('pinBack').onclick();s.flush();assert.equal(s.history.state.screen,'home');
const deep=setup('#lab');assert.equal(deep.history.state.screen,'lab');deep.history.back();assert.equal(deep.history.state.screen,'home');assert(deep.calls.includes('labBack'));
console.log('PASS: native Back/Forward, dialog-first navigation, close/cancel, route cleanup, deep link to menu');
