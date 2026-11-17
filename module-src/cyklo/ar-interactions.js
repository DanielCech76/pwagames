/* Contextual long-press panels and activity-based control hiding. */
(function(root){'use strict';
class Controls{
 constructor(view){this.view=view;this.listeners=[];this.last=Date.now();this.suppressed=null;const panels={lookHeightToggle:['height'],lookSettings:['view'],lookCamera:['view','lookHeightMode'],lookSensors:['align'],lookGPS:['view','lookPosition'],lookFlat:['detail'],lookBuildings:['detail','lookBuildingMode'],lookHide:['view','lookHideMode'],lookHelp:['view','lookHints'],lookPick:['align','lookTarget']};for(const [id,section]of Object.entries(panels)){const el=document.getElementById(id);if(!el)continue;this.on(el,'pointerdown',e=>{if(e.button!==undefined&&e.button!==0)return;this.cancel();this.suppressed=null;this.start={x:e.clientX,y:e.clientY};this.timer=setTimeout(()=>{this.timer=null;this.suppressed=id;section[0]==='height'?view.openHeightPanel():view.openPanel(section[0],id,section[1]);},550)});this.on(el,'pointermove',e=>{if(this.start&&Math.hypot(e.clientX-this.start.x,e.clientY-this.start.y)>12)this.cancel()});for(const event of ['pointerup','pointercancel','pointerleave'])this.on(el,event,()=>this.cancel());this.on(el,'contextmenu',e=>{e.preventDefault();if(this.suppressed!==id){this.suppressed=id;view.openPanel(section[0],id,section[1])}})}
 this.on(view.dialog,'pointerdown',e=>{this.activity();const target=e.target;if(view.heightPanelOpen&&!target.closest?.('#lookHeightControl')&&!target.closest?.('#lookHeightToggle'))view.closeHeightPanel();if(document.getElementById('lookSetup').open&&!target.closest?.('#lookSetup')&&!target.closest?.('#'+(view.panelOwner||'lookSettings'))){view.closePanel()}if(view.hiddenUI&&view.options.hideMode==='auto'&&target.closest?.('#lookStage'))view.hideControls(false)},true);for(const event of ['keydown','input','wheel'])this.on(view.dialog,event,()=>{if(event==='keydown')this.suppressed=null;this.activity()},true)
 }
 on(el,event,fn,capture=false){el.addEventListener(event,fn,capture);this.listeners.push([el,event,fn,capture])}
 activity(){this.last=Date.now()}
 cancel(){clearTimeout(this.timer);this.timer=null;this.start=null}
 click(id){this.activity();if(this.suppressed===id){this.suppressed=null;return true}this.suppressed=null;if(document.getElementById('lookSetup').open&&this.view.panelOwner===id){this.view.closePanel();return true}return false}
 tick(now=Date.now()){const v=this.view;if(v.options.hideMode==='auto'&&!v.hiddenUI&&!v.heightPanelOpen&&!document.getElementById('lookSetup').open&&!v.cameraPending&&!v.photoBusy&&!v.abort&&!v.detailAbort&&now-this.last>=(v.options.hideAfter||5)*1000)v.hideControls(true)}
 destroy(){this.cancel();for(const [el,event,fn,capture]of this.listeners)el.removeEventListener(event,fn,capture);this.listeners=[]}
}
root.GeoLookControls=Controls;if(typeof module!=='undefined')module.exports=Controls;
})(globalThis);
