/* Detailed overhead view, using the same MapLibre/OpenFreeMap stack as CYKLO. */
(function(root){'use strict';
const STYLE='https://tiles.openfreemap.org/styles/liberty';
class OverviewMap{
 constructor(container,status){this.container=container;this.status=status;this.ready=false;this.failed=false;this.disposed=false;this.layers=new Map();this.key='';
  container.replaceChildren?.();this.map=new root.maplibregl.Map({container,style:STYLE,interactive:false,attributionControl:{compact:true},maxPitch:85,maxZoom:24,centerClampedToGround:false,renderWorldCopies:false,canvasContextAttributes:{antialias:true}});
  this.map.on('load',()=>{if(this.disposed)return;this.ready=true;for(const layer of this.map.getStyle().layers||[])if(layer.type==='fill-extrusion')this.layers.set(layer.id,{filter:layer.filter||null,visibility:layer.layout?.visibility||'visible'});
   this.relief=new root.CykloRelief(this.map,{mapMode:'3d',terrainEnabled:true,terrainExaggeration:1,hillshadeEnabled:true,contoursEnabled:false,buildings:true,economyMode:false},()=>{});this.relief.apply();this.map.setCenterClampedToGround(false);this.key='';});
  this.map.on('error',()=>{if(this.disposed)return;this.failed=true;this.status('Podrobná 3D mapa se nepodařila načíst. Používám uložený zjednodušený terén. Pro podrobnou mapu je potřeba připojení.');});
  this.map.getCanvas().addEventListener('webglcontextlost',()=>{if(!this.disposed)this.failed=true;});
 }
 update(origin,pose,w,h,fov,flat,buildings,radius){if(this.disposed||this.failed||!this.ready)return false;
  const angles=root.GeoLook.angles(pose.forward),pitch=90+angles.pitch;if(pitch<0||pitch>85)return false;
  const signature=[origin.lon,origin.lat,origin.alt,angles.heading,angles.pitch,w,h,fov,flat,buildings,radius].join(':');if(signature===this.key)return true;
  if(w!==this.w||h!==this.h){this.map.resize();this.w=w;this.h=h;}
  // GeoLook and MapLibre both use a vertical field of view.
  this.map.setVerticalFieldOfView(fov);
  if(this.flat!==flat){this.relief.settings.terrainEnabled=!flat;this.relief.apply();this.flat=flat;}
  const layerKey=[origin.lon,origin.lat,buildings,radius].join(':');if(layerKey!==this.layerKey){for(const [id,original]of this.layers){this.map.setLayoutProperty(id,'visibility',buildings?original.visibility:'none');if(buildings){const distance=['<=',['distance',{type:'Point',coordinates:[origin.lon,origin.lat]}],radius];this.map.setFilter(id,original.filter?['all',expression(original.filter),distance]:distance);}}this.layerKey=layerKey;}
  // Camera altitude is absolute; disabling terrain clamping keeps the selected eye height.
  const camera=this.map.calculateCameraOptionsFromCameraLngLatAltRotation([origin.lon,origin.lat],origin.alt,angles.heading,pitch,0);if(!Number.isFinite(camera.zoom)||camera.zoom>24)return false;this.map.jumpTo(camera);this.key=signature;return true;
 }
 project(point){if(!this.ready||this.failed)return null;const p=this.map.project([point.lon,point.lat]);return Number.isFinite(p.x)&&Number.isFinite(p.y)?p:null;}
 destroy(){if(this.disposed)return;this.disposed=true;this.relief?.destroy();this.map.remove();this.layers.clear();}
}
// Liberty currently uses expression filters. Convert legacy filters defensively.
function expression(f){if(!Array.isArray(f))return f;const [op,...args]=f;if(['all','any','none'].includes(op))return [op,...args.map(expression)];if(typeof args[0]!=='string'||args[0]==='$type')return f;const value=['get',args[0]];if(['==','!=','<','>','<=','>='].includes(op))return [op,value,args[1]];if(op==='in'||op==='!in'){const e=['in',value,['literal',args.slice(1)]];return op==='!in'?['!',e]:e;}if(op==='has'||op==='!has'){const e=['has',args[0]];return op==='!has'?['!',e]:e;}return f;}
root.GeoLookMap=OverviewMap;if(typeof module!=='undefined')module.exports={OverviewMap,expression};
})(globalThis);
