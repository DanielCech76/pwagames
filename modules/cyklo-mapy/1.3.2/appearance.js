/* Independent persistent appearance choices; geometry follows the map container. */
(function(root){
'use strict';
const palettes={
 forest:{ink:'#153f29',muted:'#52664a',grid:'#cad4bf',past:['#87aa64','#205a37'],future:['#d7e3c8','#c3d3b2'],accent:['#ffa128','#eb7b0c'],onAccent:'#172820'},
 mist:{ink:'#17354e',muted:'#4b6477',grid:'#bdcddc',past:['#77a6a6','#275c70'],future:['#d9e9ee','#bdd5df'],accent:['#ffb43c','#e98c12'],onAccent:'#142f48'},
 night:{ink:'#ebf2f5',muted:'#b0c3cc',grid:'#465b64',past:['#87cfb5','#477f73'],future:['#617d76','#4e6862'],accent:['#ffbd56','#f59a23'],onAccent:'#172129'}
};let current='forest';
function normalize(settings){if(!['bottom','top','bar'].includes(settings.speedLayout))settings.speedLayout='bar';if(!Object.hasOwn(palettes,settings.colorTheme))settings.colorTheme='forest';settings.zoomDiameter=[40,48,56].includes(Number(settings.zoomDiameter))?Number(settings.zoomDiameter):48;return settings}
function geometry(width,height,diameter=48){const button=[40,48,56].includes(Number(diameter))?Number(diameter):48;return {axis:'vertical',rail:Math.min(288,Math.max(216,height-104)),width:Math.max(48,button)+10,button,thumb:button}}
class Appearance{
 constructor(settings,onChange){this.settings=normalize(settings);this.onChange=onChange;this.$=id=>document.getElementById(id);for(const id of ['speedLayout','colorTheme','zoomDiameter'])this.$(id).onchange=()=>{this.settings[id]=this.$(id).value;this.apply();this.onChange?.()};this.apply();if(root.ResizeObserver){this.observer=new root.ResizeObserver(()=>this.resize());this.observer.observe(this.$('mapArea'))}}
 apply(){normalize(this.settings);current=this.settings.colorTheme;document.documentElement.setAttribute('data-theme',current);this.$('app').setAttribute('data-layout',this.settings.speedLayout);this.$('app').setAttribute('data-provider',this.settings.edition||'open');this.$('speedLayout').value=this.settings.speedLayout;this.$('colorTheme').value=current;this.$('zoomDiameter').value=this.settings.zoomDiameter;this.$('linearSpeed').hidden=this.settings.speedLayout!=='bar';this.$('appearanceSummary').textContent=({bottom:'Ručičkový dole',top:'Ručičkový nahoře',bar:'Vodorovný pruh nahoře'}[this.settings.speedLayout])+' · '+({forest:'Lesní krém',mist:'Modrá mlha',night:'Noční grafit'}[current]);this.resize()}
 resize(){const area=this.$('mapArea'),g=geometry(area.clientWidth,area.clientHeight,this.settings.zoomDiameter);if(!area.clientWidth||!area.clientHeight)return;this.$('zoomControl').setAttribute('data-axis',g.axis);this.$('zoomControl').style.setProperty('--rail-height',g.rail+'px');this.$('zoomControl').style.setProperty('--rail-width',g.width+'px');this.$('zoomControl').style.setProperty('--zoom-diameter',g.button+'px');this.$('zoomControl').style.setProperty('--thumb-diameter',g.thumb+'px');this.$('zoomSlider').setAttribute('aria-orientation',g.axis);}
 destroy(){this.observer?.disconnect()}
}
root.CykloAppearance={Appearance,normalize,geometry,palette:(theme=current)=>palettes[theme]||palettes.forest};
})(globalThis);
