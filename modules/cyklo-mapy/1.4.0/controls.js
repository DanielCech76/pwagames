/* Auto-hide only secondary chrome; never interrupt a gesture or an open dialog. */
(function(root){'use strict';
class Controls{
 constructor(settings,onResize){this.settings=settings;this.onResize=onResize;this.$=id=>document.getElementById(id);this.screen='ride';this.pointers=new Set();this.listeners=[];this.hidden=false;this.suppressPick=false;this.closed=false;const listen=(type,fn)=>{document.addEventListener(type,fn,true);this.listeners.push([type,fn])};listen('pointerdown',e=>{this.suppressPick=this.hidden;this.pointers.add(e.pointerId);this.reveal()});const release=e=>{this.pointers.delete(e.pointerId);this.schedule()};listen('pointerup',release);listen('pointercancel',release);listen('keydown',()=>this.reveal());listen('focusin',()=>this.reveal());listen('wheel',()=>this.reveal());listen('visibilitychange',()=>{this.pointers.clear();this.reveal()});this.$('revealControls').onclick=()=>this.reveal();this.configure()}
 eligible(){return ['ride','map'].includes(this.screen)&&this.settings.autoHideControls}
 configure(){this.$('app').classList.toggle('focus-enabled',this.eligible());this.$('revealControls').hidden=!this.eligible();this.reveal()}
 setScreen(name){this.screen=name;this.configure()}
 show(hidden){if(this.hidden===hidden)return;this.hidden=hidden;this.$('app').classList.toggle('controls-hidden',hidden);this.$('revealControls').setAttribute('aria-expanded',String(!hidden));this.onResize?.()}
 reveal(){if(this.closed)return;this.show(false);this.schedule()}
 schedule(){clearTimeout(this.timer);if(this.closed||!this.eligible()||document.hidden||this.pointers.size)return;this.timer=setTimeout(()=>{if(document.querySelector('dialog[open]')||this.pointers.size||document.activeElement?.matches?.('button:focus-visible,input:focus-visible,select:focus-visible')){this.schedule();return}this.show(true)},this.settings.controlsDelay*1000)}
 destroy(){this.closed=true;clearTimeout(this.timer);for(const [type,fn]of this.listeners)document.removeEventListener(type,fn,true);this.pointers.clear();this.show(false)}
}
root.CykloControls=Controls;
})(globalThis);
