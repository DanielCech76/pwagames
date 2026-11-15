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
 float d=fract(dot(mod(floor(gl_FragCoord.xy),vec2(4.)),vec2(.25,.5625)));
 if(v_cap>.5)d=1.-d-.0001;
 if(v_fade<=d)discard; vec4 tex=v_cap>.5?texture(u_topAtlas,uv):texture(u_atlas,uv); if(tex.a<.45)discard; color=vec4(tex.rgb*v_shade,1.);}`;

// Shared conservative outline fan; only the nine-float instance changes per tree.
const outlines=[[[0.30816131,0.0],[0.69164333,0.0],[1.0,0.30835667],[1.0,0.62975384],[0.62975384,1.0],[0.33285035,1.0],[0.0,0.66714965],[0.0,0.30816131]],[[0.48552241,0.0],[0.53697889,0.0],[1.0,0.46302111],[1.0,0.76353276],[0.76353276,1.0],[0.23591488,1.0],[0.0,0.76408512],[0.0,0.48552241]],[[0.32151248,0.0],[0.62645082,0.0],[1.0,0.37354918],[1.0,0.65259774],[0.65259774,1.0],[0.27983169,1.0],[0.0,0.72016831],[0.0,0.32151248]],[[0.2923666,0.0],[0.7094944,0.0],[1.0,0.2905056],[1.0,0.62367424],[0.62367424,1.0],[0.33371212,1.0],[0.0,0.66628788],[0.0,0.2923666]],[[0.48993289,0.0],[0.5212528,0.0],[1.0,0.4787472],[1.0,0.78195503],[0.78195503,1.0],[0.21468927,1.0],[0.0,0.78531073],[0.0,0.48993289]],[[0.33789516,0.0],[0.58495398,0.0],[1.0,0.41504602],[1.0,0.68931573],[0.68931573,1.0],[0.31916767,1.0],[0.0,0.68083233],[0.0,0.33789516]],[[0.33912599,0.0],[0.70077306,0.0],[1.0,0.29922694],[1.0,0.64320854],[0.64320854,1.0],[0.33688985,1.0],[0.0,0.66311015],[0.0,0.33912599]],[[0.49386555,0.0],[0.51613445,0.0],[1.0,0.48386555],[1.0,0.81792717],[0.81792717,1.0],[0.18207283,1.0],[0.0,0.81792717],[0.0,0.49386555]],[[0.33851814,0.0],[0.57999587,0.0],[1.0,0.42000413],[1.0,0.7262557],[0.7262557,1.0],[0.26404713,1.0],[0.0,0.73595287],[0.0,0.33851814]],[[0.24904122,0.0],[0.74677647,0.0],[1.0,0.25322353],[1.0,0.79518792],[0.79518792,1.0],[0.17537443,1.0],[0.0,0.82462557],[0.0,0.24904122]],[[0.32631873,0.0],[0.72031155,0.0],[1.0,0.27968845],[1.0,0.71198895],[0.71198895,1.0],[0.2823666,1.0],[0.0,0.7176334],[0.0,0.32631873]],[[0.24683609,0.0],[0.74084344,0.0],[1.0,0.25915656],[1.0,0.76597193],[0.76597193,1.0],[0.23250452,1.0],[0.0,0.76749548],[0.0,0.24683609]],[[0.14070137,0.0],[0.85783236,0.0],[1.0,0.14216764],[1.0,0.84692693],[0.84692693,1.0],[0.21022727,1.0],[0.0,0.78977273],[0.0,0.14070137]],[[0.17703403,0.0],[0.75234959,0.0],[1.0,0.24765041],[1.0,0.74901386],[0.74901386,1.0],[0.24290835,1.0],[0.0,0.75709165],[0.0,0.17703403]],[[0.17208267,0.0],[0.68554502,0.0],[1.0,0.31445498],[1.0,0.71169483],[0.71169483,1.0],[0.26647115,1.0],[0.0,0.73352885],[0.0,0.17208267]],[[0.16377649,0.0],[0.86432795,0.0],[1.0,0.13567205],[1.0,0.76028171],[0.76028171,1.0],[0.26777291,1.0],[0.0,0.73222709],[0.0,0.16377649]],[[0.21849343,0.0],[0.7206486,0.0],[1.0,0.2793514],[1.0,0.7044335],[0.7044335,1.0],[0.24784483,1.0],[0.0,0.75215517],[0.0,0.21849343]],[[0.28708546,0.0],[0.65251415,0.0],[1.0,0.34748585],[1.0,0.76920139],[0.76920139,1.0],[0.22376643,1.0],[0.0,0.77623357],[0.0,0.28708546]]];
const template=new Float32Array([0,2].flatMap(cap=>Array.from({length:6},(_,i)=>[0,cap,i+1,cap,i+2,cap]).flat()));
function instances(trees,origin,heights,shades=[],groups=false){
 const cos=Math.cos(origin[1]*rad),ox=R*origin[0]*rad,oy=R*Math.log(Math.tan(Math.PI/4+origin[1]*rad/2)),data=new Float32Array(trees.length*9);let n=0;
 for(let i=0;i<trees.length;i++){if(groups&&i%5!==0)continue;const t=trees[i],z=heights[i];if(!Number.isFinite(z))continue;const h=t.height;
 data.set([(R*t.position[0]*rad-ox)*cos,(R*Math.log(Math.tan(Math.PI/4+t.position[1]*rad/2))-oy)*cos,z,h*(t.kind==='needleleaved'?.75:t.kind==='shrub'?1.5:.95)*(groups?2:1),h,t.kind==='needleleaved'?1:t.kind==='shrub'?2:0,t.seed,shades[i]??1,groups?1:0],n);n+=9;
 }return data.subarray(0,n)
}
// Conservative world-space sphere encloses trunk, all LOD roots and both crown planes.
function visible(data,matrix,target=new Float32Array(data.length)){
 const planes=[];for(let row=0;row<3;row++)for(const sign of [-1,1]){const p=[matrix[3]+sign*matrix[row],matrix[7]+sign*matrix[4+row],matrix[11]+sign*matrix[8+row],matrix[15]+sign*matrix[12+row]];const n=Math.hypot(p[0],p[1],p[2]);planes.push(p.map(v=>v/(n||1)))}let cursor=0;
 for(let i=0;i<data.length;i+=9){const x=data[i],y=data[i+1],z=data[i+2]+data[i+4]*.5,r=Math.max(data[i+3],data[i+4])*1.8+.05;if(planes.some(p=>p[0]*x+p[1]*y+p[2]*z+p[3]<-r))continue;target.set(data.subarray(i,i+9),cursor);cursor+=9}return target.subarray(0,cursor)
}
const outlineGLSL='const vec2 outline[144]=vec2[144]('+outlines.flat().map(p=>'vec2('+p.map(v=>Number(v).toFixed(8)).join(',')+')').join(',')+');\n';
const instanceVertex=vertex
 .replace('layout(location=1) in vec2 a_uv;','layout(location=1) in vec2 a_corner;')
 .replace('void main(){',outlineGLSL+'void main(){')
 .replace('bool cap=a_info.w>1.5;','bool cap=a_corner.y>1.5;')
 .replace('vec2 horizontal=direction.xy;', 'vec2 a_uv=outline[((cap?9:0)+int(lod)*3+species)*8+int(a_corner.x+.5)];\n vec2 horizontal=direction.xy;')
 .replace('if(group<.5)v_fade*=1.-smoothstep(.75,1.,clipRatio);','if(group<.5)v_fade*=1.-smoothstep(.75,1.,clipRatio);\n if(v_fade<=0.)gl_Position=vec4(2.,2.,2.,1.);');

root.CykloCanopy={visible,outlines,template,instances,instanceVertex,rects,roots,topRects,topAsset:'./assets/tree-crowns-top-v2.png',asset:'./assets/tree-crowns-v2.png',geometry,vertex,fragment};if(typeof module!=='undefined')module.exports=root.CykloCanopy;
})(globalThis);
