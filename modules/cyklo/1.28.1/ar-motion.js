/* Shared sensor smoothing. Map and labels consume exactly the same pose. */
(function(root){'use strict';const G=root.GeoLook;
class Motion{
 reset(){this.pose=null;this.jump=null;}
 update(target,dt,now,options={},camera=false){const lock=!camera&&options.horizonLock!==false,a=G.angles(target.forward);if(lock)target=G.manual(a.heading,a.pitch);
  if(!this.pose){this.pose=target;return target;}
  const distance=p=>Math.acos(G.clamp(G.dot(this.pose.forward,p.forward),-1,1))/G.D,angle=distance(target);
  // A single compass discontinuity must not rotate the whole scene.
  if(angle>60){if(!this.jump||Math.acos(G.clamp(G.dot(this.jump.pose.forward,target.forward),-1,1))/G.D>8)this.jump={pose:target,at:now};if(now-this.jump.at<150)return this.pose;}else this.jump=null;
  const preset={weak:[.06,.06],normal:[.2,.18],strong:[.38,.35]}[options.stabilization]||[.2,.18],roll=Math.acos(G.clamp(G.dot(this.pose.up,target.up),-1,1))/G.D;
  if(Math.max(angle,roll)<preset[1])return this.pose;
  const tau=preset[0]*(angle>4?.4:1)*(camera?.55:1);this.pose=G.smooth(this.pose,target,1-Math.exp(-G.clamp(dt||.016,.008,.1)/tau));return this.pose;
 }
}
root.GeoLookMotion=Motion;if(typeof module!=='undefined')module.exports=Motion;
})(globalThis);
