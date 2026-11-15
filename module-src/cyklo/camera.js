(function(root){'use strict';
const radians=v=>v*Math.PI/180;
function forwardMeters(origin,p,heading){const dy=(p.lat-origin.lat)*111195,dx=(p.lng-origin.lon)*111195*Math.cos(radians(origin.lat));return dy*Math.cos(radians(heading))+dx*Math.sin(radians(heading));}
function lookahead(speed,min,max){return Math.max(min,Math.min(max,(speed||0)*60));}
function fromSlider(t,max,min=50){return min*Math.pow(max/min,t)}
function toSlider(value,max,min=50){return Math.log(value/min)/Math.log(max/min)}
function nextHeading(old,target){return old+(((target-old+540)%360)-180)*.35;}
function layout(w,h,insets={}){const top=Math.max(0,Math.min(h-1,Number(insets.top)||0)),bottom=Math.max(0,Math.min(h-top-1,Number(insets.bottom)||0)),visible=h-top-bottom;return {x:w/2,y:top+visible*2/3,height:visible,padding:{top:top+visible/3,bottom,left:0,right:0}}}
function fitCamera(map,p,heading,pitch,distance,max,insets={}){const h=map.getContainer().clientHeight,w=map.getContainer().clientWidth;if(h<10||w<10)return null;const opts={center:[p.lon,p.lat],bearing:heading,pitch,padding:layout(w,h,insets).padding};let lo=2,hi=Math.min(24,map.getMaxZoom?.()??24);
 const extent=()=>{const values=[[0,0],[w/2,0],[w,0],[0,h/2],[w,h/2],[0,h],[w,h]].map(pt=>{try{const v=map.unproject(pt);return Number.isFinite(v?.lat)&&Number.isFinite(v?.lng)?forwardMeters(p,v,heading):NaN}catch{return NaN}}).filter(Number.isFinite);return values.length?Math.max(...values):null};
 const target=Math.min(distance,max);
 for(let i=0;i<17;i++){const mid=(lo+hi)/2;map.jumpTo({...opts,zoom:mid});const value=extent();if(value===null)return null;if(value>target)lo=mid;else hi=mid;}
 map.jumpTo({...opts,zoom:hi});return {zoom:hi,forward:extent(),target,pitch};
}
root.CykloCamera={lookahead,fromSlider,toSlider,nextHeading,fitCamera,forwardMeters,layout};if(typeof module!=='undefined')module.exports=root.CykloCamera;
})(globalThis);
