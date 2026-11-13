/* Native browser/PWA back stack: menu -> screen -> dialog. */
(function(){
'use strict';const $=id=>document.getElementById(id),routes={pong:{launch:'launch',back:'back'},pinball:{launch:'pinLaunchGame',back:'pinBack'},lab:{launch:'labLaunch',back:'labBack'}},dialogs={settings:'pong',pinHelp:'pinball'};
const homeURL=location.pathname+location.search,openers={};let current='home',modal=null,applying=false,backPending=false;
for(const route of Object.values(routes)){route.open=$(route.launch).onclick;route.close=$(route.back).onclick}
function valid(s){return s?.arcadeNavigation===1&&(s.screen==='home'||Object.hasOwn(routes,s.screen))}
function state(screen,dialog=null){return {arcadeNavigation:1,screen,dialog,depth:(screen==='home'?0:1)+(dialog?1:0)}}
function url(screen){return homeURL+(screen==='home'?'':'#'+screen)}
function apply(next){applying=true;const target=valid(next)?next:state('home');modal=target.dialog&&dialogs[target.dialog]===target.screen?target.dialog:null;
for(const id of Object.keys(dialogs))if($(id).open&&id!==modal)$(id).close();
if(current!==target.screen){if(routes[current])routes[current].close();current=target.screen;if(routes[current])routes[current].open()}
if(modal&&!$(modal).open)openers[modal]();
applying=false;backPending=false;
}
function open(screen,event){if(backPending)return;if(current===screen)return;if(routes[current])routes[current].close();modal=null;current=screen;routes[screen].open(event);history.pushState(state(screen),'',url(screen))}
function back(){if(backPending)return;const s=history.state;if(valid(s)&&s.depth>0){backPending=true;history.back()}else{apply(state('home'));history.replaceState(state('home'),'',homeURL)}}
function home(event){event?.preventDefault();if(backPending)return;const s=history.state;if(valid(s)&&s.depth>0){backPending=true;history.go(-s.depth)}else apply(state('home'))}
for(const [name,route]of Object.entries(routes)){$(route.launch).onclick=e=>open(name,e);$(route.back).onclick=back}
$('brand').onclick=home;
for(const [button,id]of [['settingsOpen','settings'],['pinSettings','pinHelp']]){const original=$(button).onclick;openers[id]=original;$(button).onclick=e=>{if(backPending)return;original(e);if($(id).open&&modal!==id){modal=id;history.pushState(state(current,id),'',url(current))}}}
for(const id of Object.keys(dialogs)){$(id).addEventListener('cancel',e=>{if(modal===id){e.preventDefault();back()}});$(id).addEventListener('close',()=>{if(!applying&&modal===id)back()})}
window.addEventListener('popstate',e=>apply(e.state));
const initial=history.state;const requested=location.hash.slice(1);
if(valid(initial))apply(initial);else{history.replaceState(state('home'),'',homeURL);if(Object.hasOwn(routes,requested))open(requested)}
})();
