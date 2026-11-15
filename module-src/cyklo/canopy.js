/* Reference-derived painted/faceted crowns; upright camera-azimuth cards with DEM foot anchors. */
(function(root){'use strict';
const R=6378137,rad=Math.PI/180;
const rects=[[0.0430622009569378, 0.03110047846889952, 0.2783094098883573, 0.2807017543859649], [0.3803827751196172, 0.03189792663476874, 0.23444976076555024, 0.2799043062200957], [0.6738437001594896, 0.11164274322169059, 0.28309409888357256, 0.19218500797448165], [0.04704944178628389, 0.3580542264752791, 0.2751196172248804, 0.2807017543859649], [0.3803827751196172, 0.35645933014354064, 0.23763955342902712, 0.2822966507177033], [0.6690590111642744, 0.43620414673046254, 0.284688995215311, 0.19537480063795853], [0.04784688995215311, 0.6794258373205742, 0.2743221690590112, 0.2902711323763955], [0.3787878787878788, 0.6850079744816587, 0.23923444976076555, 0.284688995215311], [0.6674641148325359, 0.773524720893142, 0.2886762360446571, 0.19218500797448165]];
const roots=[[0.49590308148594986, 0.9943181818181818], [0.5066407515387108, 0.9943019943019943], [0.4808212458832597, 0.991701244813278], [0.485751774318602, 0.9943181818181818], [0.5024527640764399, 0.9943502824858758], [0.48777203188967894, 0.9918367346938776], [0.488107822410148, 0.9945054945054945], [0.5039344262295082, 0.9943977591036415], [0.5026528106638604, 0.991701244813278]];
const topRects=[[0.03668261562998405, 0.02631578947368421, 0.2862838915470494, 0.2751196172248804], [0.361244019138756, 0.03269537480063796, 0.27352472089314195, 0.2743221690590112], [0.671451355661882, 0.06220095693779904, 0.291866028708134, 0.21451355661881977], [0.029505582137161084, 0.3532695374800638, 0.2966507177033493, 0.2807017543859649], [0.361244019138756, 0.3620414673046252, 0.2743221690590112, 0.2703349282296651], [0.6682615629984051, 0.3939393939393939, 0.3022328548644338, 0.21451355661881977], [0.03588516746411483, 0.6905901116427432, 0.27751196172248804, 0.2759170653907496], [0.35964912280701755, 0.69377990430622, 0.27751196172248804, 0.2679425837320574], [0.6666666666666666, 0.7320574162679426, 0.2982456140350877, 0.21770334928229665]];
function geometry(trees,origin,heights,shades=[],groups=false){const cos=Math.cos(origin[1]*rad),ox=R*origin[0]*rad,oy=R*Math.log(Math.tan(Math.PI/4+origin[1]*rad/2)),values=[];
 for(let i=0;i<trees.length;i++){if(groups&&i%5!==0)continue;const t=trees[i],z=heights[i];if(!Number.isFinite(z))continue;const x=(R*t.position[0]*rad-ox)*cos,y=(R*Math.log(Math.tan(Math.PI/4+t.position[1]*rad/2))-oy)*cos,h=t.height,w=h*(t.kind==='needleleaved'?.75:t.kind==='shrub'?1.5:.95),k=t.kind==='needleleaved'?1:t.kind==='shrub'?2:0;
  // Upright card plus a separate horizontal crown cap. The trunk never tilts.
  for(const cap of [0,2])for(const [u,v]of [[0,0],[1,0],[1,1],[0,0],[1,1],[0,1]])values.push(x,y,z,u,v,w*(groups?2:1),h,k,t.seed,shades[i]??1,(groups?1:0)+cap);
 }return new Float32Array(values)}
const vertex=`#version 300 es
precision highp float;
layout(location=0) in vec3 a_anchor;
layout(location=1) in vec2 a_uv;
layout(location=2) in vec2 a_size;
layout(location=3) in vec4 a_info;
uniform mat4 u_matrix; uniform vec3 u_eye; uniform float u_detail; uniform float u_limit; uniform float u_pseudo; uniform vec2 u_roots[9];
out float v_cap; out vec3 v_world; out vec2 v_uv; out float v_lod; out float v_kind; out float v_shade; out float v_fade;
void main(){
 vec3 center=a_anchor+vec3(0.,0.,a_size.y*.6);
 vec3 direction=u_eye-center; float distance=length(direction); direction=distance>.001?direction/distance:vec3(0.,-1.,0.);
 float ratio=distance/max(1.,u_detail); float lod=ratio<.35?0.:ratio<.7?1.:2.;
 bool cap=a_info.w>1.5; float group=mod(a_info.w,2.);
 int species=int(floor(a_info.x+.5)); vec2 root=u_roots[int(lod)*3+species];
 vec2 horizontal=direction.xy; float lengthXY=length(horizontal);
 // Cylindrical billboard: camera azimuth only, fixed world vertical, DEM foot anchor.
 vec3 right=lengthXY>.001?vec3(-horizontal.y,horizontal.x,0.)/lengthXY:vec3(1.,0.,0.);
 vec3 position=a_anchor+right*(a_uv.x-root.x)*a_size.x+vec3(0.,0.,(root.y-a_uv.y)*a_size.y);
 float overhead=smoothstep(.88,.98,abs(direction.z));
 v_uv=a_uv;
 if(cap){vec3 forward=vec3(-right.y,right.x,0.);position=a_anchor+vec3(0.,0.,a_size.y*.72)+right*(a_uv.x-.5)*a_size.x+forward*(a_uv.y-.5)*a_size.x*.85;v_uv=a_uv;}
 v_cap=cap?1.:0.; v_world=position; gl_Position=u_matrix*vec4(position,1.);
 v_lod=lod;
 v_kind=a_info.x; v_shade=a_info.z*(.92+a_info.y*.16);
 float clipRatio=distance/max(1.,u_limit); v_fade=(1.-smoothstep(.85,1.,clipRatio))*(cap?overhead:1.-overhead);
 if(group>.5&&u_pseudo>.5)v_fade*=smoothstep(.68,.85,ratio);
 if(group<.5)v_fade*=1.-smoothstep(.75,1.,clipRatio);
}`;
const fragment=`#version 300 es
precision highp float;
uniform sampler2D u_atlas; uniform sampler2D u_topAtlas; uniform vec4 u_rects[9]; uniform vec4 u_topRects[9]; in float v_cap; in vec2 v_uv; in float v_lod; in float v_kind; in float v_shade; in float v_fade; out vec4 color;
void main(){int index=int(floor(v_lod+.5))*3+int(floor(v_kind+.5));vec4 rect=v_cap>.5?u_topRects[index]:u_rects[index];vec2 uv=rect.xy+clamp(v_uv,vec2(.002),vec2(.998))*rect.zw;
 vec4 tex=v_cap>.5?texture(u_topAtlas,uv):texture(u_atlas,uv); float d=fract(dot(mod(floor(gl_FragCoord.xy),vec2(4.)),vec2(.25,.5625)));
 if(v_cap>.5)d=1.-d-.0001;
 if(tex.a<.45||v_fade<=d)discard; color=vec4(tex.rgb*v_shade,1.);}`;
root.CykloCanopy={rects,roots,topRects,topAsset:'./assets/tree-crowns-top-v2.png',asset:'./assets/tree-crowns-v2.png',geometry,vertex,fragment};if(typeof module!=='undefined')module.exports=root.CykloCanopy;
})(globalThis);
