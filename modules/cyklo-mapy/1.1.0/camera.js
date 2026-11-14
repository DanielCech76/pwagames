(function(root){'use strict';
const radians=v=>v*Math.PI/180;
function forwardMeters(origin,p,heading){const dy=(p.lat-origin.lat)*111195,dx=(p.lng-origin.lon)*111195*Math.cos(radians(origin.lat));return dy*Math.cos(radians(heading))+dx*Math.sin(radians(heading));}
function lookahead(speed,min,max){return Math.max(min,Math.min(max,(speed||0)*60));}
function fromSlider(t,max){return 50*Math.pow(max/50,t)}
function toSlider(value,max){return Math.log(value/50)/Math.log(max/50)}
function nextHeading(old,target){return old+(((target-old+540)%360)-180)*.35;}
function fitCamera(map,p,heading,pitch,distance,max){const h=map.getContainer().clientHeight,w=map.getContainer().clientWidth;if(h<10||w<10)return null;const opts={center:[p.lon,p.lat],bearing:heading,pitch,padding:{top:Math.round(h*.42),bottom:0,left:0,right:Math.min(72,Math.round(w*.18))}};let lo=8,hi=23;
 const extent=()=>Math.max(...[[0,0],[w/2,0],[w,0],[0,h/2],[w,h/2],[0,h],[w,h]].map(pt=>forwardMeters(p,map.unproject(pt),heading)));
 const target=Math.min(distance,max);
 for(let i=0;i<17;i++){const mid=(lo+hi)/2;map.jumpTo({...opts,zoom:mid});if(extent()>target)lo=mid;else hi=mid;}
 map.jumpTo({...opts,zoom:hi});return {zoom:hi,forward:extent(),target,pitch};
}
root.CykloCamera={lookahead,fromSlider,toSlider,nextHeading,fitCamera,forwardMeters};if(typeof module!=='undefined')module.exports=root.CykloCamera;
})(globalThis);
