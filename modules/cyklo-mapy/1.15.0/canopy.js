/* Original deterministic crown atlas and camera-facing geometry. No remote assets. */
(function(root){'use strict';
const CELL=128,COLS=6,ROWS=3,R=6378137,rad=Math.PI/180;
function noise(x,y){let n=Math.imul(x+37,374761393)^Math.imul(y+83,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296}
function atlas(){const width=CELL*COLS,height=CELL*ROWS,data=new Uint8Array(width*height*4);
 for(let lod=0;lod<ROWS;lod++)for(let col=0;col<COLS;col++){
  const kind=col%3,group=col>=3,forms=[];
  const crown=(cx,cy,size,seed)=>{if(kind===1){for(let j=0;j<3;j++)forms.push({x:cx,y:cy-j*size*.35,rx:size*(.8-j*.18),ry:size*.8,seed,cone:true})}else{const n=lod===0?13:lod===1?7:4;for(let j=0;j<n;j++){const a=j*2.39996,s=noise(j,col+lod*11);forms.push({x:cx+Math.cos(a)*size*.46,y:cy+Math.sin(a)*size*.38,rx:size*(.5+s*.2),ry:size*(.5+s*.2),seed:seed+s,cone:false})}}};
  if(group){for(let j=0;j<9;j++){const a=j*2.39996; crown(64+Math.cos(a)*25,70+Math.sin(a)*21,24,noise(j,col))}}
  else crown(64,kind===2?88:67,kind===2?32:40,.3);
  for(let y=0;y<CELL;y++)for(let x=0;x<CELL;x++){let alpha=0,color=[0,0,0];
   if(!group&&kind!==2&&Math.abs(x-64)<2.5&&y>76&&y<123){alpha=1;color=[86,65,40]}
   for(const f of forms){const dx=(x-f.x)/f.rx,dy=(y-f.y)/f.ry;const d=f.cone?Math.max(Math.abs(dx)/(Math.max(.05,(dy+1)*.55)),Math.abs(dy)):Math.hypot(dx,dy);const edge=lod===0?.045:0;if(d>1+edge)continue;const a=Math.min(1,Math.max(0,(1+edge-d)/Math.max(.02,edge)));if(a<=0)continue;
    const facet=lod===0?0:Math.floor((Math.atan2(dy,dx)+Math.PI)*(lod===1?6:4)/Math.PI)*.035;
    const light=.77+.23*Math.sqrt(Math.max(0,1-d*d))-.15*dx-.12*dy+facet+(lod===0?(noise(x,y)-.5)*.13:0);
    const base=kind===1?[42,100,55]:kind===2?[80,121,45]:[75,138,48];color=base.map(v=>v*light);alpha=Math.max(alpha,a);
   }
   const i=((lod*CELL+y)*width+col*CELL+x)*4;for(let c=0;c<3;c++)data[i+c]=Math.max(0,Math.min(255,color[c]));data[i+3]=Math.round(alpha*255);
  }
 }return {width,height,data}}
function geometry(trees,origin,heights,shades=[],groups=false){const cos=Math.cos(origin[1]*rad),ox=R*origin[0]*rad,oy=R*Math.log(Math.tan(Math.PI/4+origin[1]*rad/2)),values=[];
 for(let i=0;i<trees.length;i++){if(groups&&i%5!==0)continue;const t=trees[i],z=heights[i];if(!Number.isFinite(z))continue;const x=(R*t.position[0]*rad-ox)*cos,y=(R*Math.log(Math.tan(Math.PI/4+t.position[1]*rad/2))-oy)*cos,h=t.height,w=h*(t.kind==='needleleaved'?.75:t.kind==='shrub'?1.5:.95),k=t.kind==='needleleaved'?1:t.kind==='shrub'?2:0;
  for(const [u,v]of [[0,0],[1,0],[1,1],[0,0],[1,1],[0,1]])values.push(x,y,z,u,v,w*(groups?2.8:1),h*(groups?1.8:1),k,t.seed,shades[i]??1,groups?1:0);
 }return new Float32Array(values)}
const vertex=`#version 300 es
precision highp float;
layout(location=0) in vec3 a_anchor;
layout(location=1) in vec2 a_uv;
layout(location=2) in vec2 a_size;
layout(location=3) in vec4 a_info;
uniform mat4 u_matrix; uniform vec3 u_eye; uniform float u_detail; uniform float u_limit; uniform float u_pseudo;
out vec2 v_uv; out float v_lod; out float v_kind; out float v_shade; out float v_fade;
void main(){
 vec3 center=a_anchor+vec3(0.,0.,a_size.y*.5);
 vec3 direction=u_eye-center; float distance=length(direction); direction=distance>.001?direction/distance:vec3(0.,-1.,0.);
 // Spherical billboard, including a finite basis for the vertical top-down view.
 vec3 right=abs(direction.z)>.995?vec3(1.,0.,0.):normalize(cross(vec3(0.,0.,1.),direction));
 vec3 up=normalize(cross(direction,right));
 vec3 position=center+right*(a_uv.x-.5)*a_size.x+up*(.5-a_uv.y)*a_size.y;
 gl_Position=u_matrix*vec4(position,1.); v_uv=a_uv;
 float ratio=distance/max(1.,u_detail); v_lod=ratio<.35?0.:ratio<.7?1.:2.;
 v_kind=a_info.x+a_info.w*3.; v_shade=a_info.z*(.92+a_info.y*.16);
 float clipRatio=distance/max(1.,u_limit); v_fade=1.-smoothstep(.85,1.,clipRatio);
 if(a_info.w>.5&&u_pseudo>.5)v_fade*=smoothstep(.68,.85,ratio);
 if(a_info.w<.5)v_fade*=1.-smoothstep(.75,1.,clipRatio);
}`;
const fragment=`#version 300 es
precision highp float;
uniform sampler2D u_atlas; in vec2 v_uv; in float v_lod; in float v_kind; in float v_shade; in float v_fade; out vec4 color;
void main(){vec2 uv=(vec2(floor(v_kind+.5),floor(v_lod+.5))+clamp(v_uv,vec2(.004),vec2(.996)))/vec2(6.,3.);
 vec4 tex=texture(u_atlas,uv); float d=fract(dot(mod(floor(gl_FragCoord.xy),vec2(4.)),vec2(.25,.5625)));
 if(tex.a<.45||v_fade<=d)discard; color=vec4(tex.rgb*v_shade,1.);}`;
root.CykloCanopy={atlas,geometry,vertex,fragment};if(typeof module!=='undefined')module.exports=root.CykloCanopy;
})(globalThis);
