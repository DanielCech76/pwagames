/* Detailed overhead view, using the same MapLibre/OpenFreeMap stack as CYKLO. */
(function(root){'use strict';
const STYLE='https://tiles.openfreemap.org/styles/liberty';
class OverviewMap{
 constructor(container,status,origin){this.container=container;this.status=status;this.ready=false;this.failed=false;this.disposed=false;this.layers=new Map();this.key='';this.paintReady=false;
  container.replaceChildren?.();this.map=new root.maplibregl.Map({container,style:STYLE,center:origin?[origin.lon,origin.lat]:[0,0],zoom:12,interactive:false,attributionControl:false,maxPitch:179,maxZoom:30,centerClampedToGround:false,renderWorldCopies:false,canvasContextAttributes:{antialias:true}});
  this.map.on('load',()=>{if(this.disposed)return;for(const layer of this.map.getStyle().layers||[])if(layer.type==='fill-extrusion')this.layers.set(layer.id,{filter:layer.filter||null,visibility:layer.layout?.visibility||'visible'});
   this.relief=new root.CykloRelief(this.map,{mapMode:'3d',terrainEnabled:false,terrainExaggeration:1,hillshadeEnabled:false,contoursEnabled:false,contourLabels:true,buildings:false,economyMode:false},()=>{});this.map.off?.('moveend',this.relief.onBuildingMove);this.relief.apply();this.map.setCenterClampedToGround(false);this.map.setSky?.({'sky-color':'#79a8bf','horizon-color':'#d8e4df','fog-color':'#d8e4df','fog-ground-blend':.4,'atmosphere-blend':0});this.ready=true;this.key='';});
  this.map.on('render',()=>{if(this.disposed||!this.key)return;if(this.map.areTilesLoaded?.()!==false)this.paintReady=true;});
  this.map.on('error',e=>{if(this.disposed)return;const id=e?.sourceId||e?.error?.sourceId||'',text=e?.error?.message||'';if(/contour|cyklo-dem/.test(id+' '+text)){if(!this.contourFailed){this.contourFailed=true;this.key='';this.status('Vrstevnice se nepodařilo načíst. Mapa zůstává dostupná.');}return;}if(id.startsWith('cyklo-relief-')){if(!this.heightFailed){this.heightFailed=true;this.key='';this.relief?.fail();this.status('Chybí výškový podklad. Mapa zůstává plochá.');}return;}if(!this.failed){this.failed=true;this.status('Mapové podklady nejsou dostupné. Zkontroluj připojení.');}});
  this.map.getCanvas().addEventListener('webglcontextlost',()=>{if(!this.disposed){this.failed=true;this.status('3D vykreslování mapy bylo přerušeno. Zavři a znovu otevři výhled.');}});
 }
 elevation(point){if(!this.ready||this.heightFailed)return null;try{const value=this.map.queryTerrainElevation?.([point.lon,point.lat]);return Number.isFinite(value)?value:null;}catch{return null;}}
 update(origin,pose,w,h,fov,flat,buildings,radius,height=1000,ground=null){if(this.disposed||this.failed||!this.ready)return false;
  const angles=root.GeoLook.angles(pose.forward),pitch=root.GeoLook.clamp(90+angles.pitch,0,179),level=root.GeoLook.manual(angles.heading,angles.pitch),roll=-Math.atan2(root.GeoLook.dot(pose.right,level.up),root.GeoLook.dot(pose.right,level.right))*180/Math.PI;
  const signature=[origin.lon,origin.lat,origin.alt,angles.heading,angles.pitch,roll,w,h,fov,flat,buildings,radius,height,ground,this.contourFailed,this.heightFailed].join(':');if(signature===this.key)return this.paintReady&&!this.waitingHeight;
  if(w!==this.w||h!==this.h){this.map.resize();this.w=w;this.h=h;this.paintReady=false;}
  this.map.setVerticalFieldOfView(fov);
  // The automatic phone-height map is a zero-altitude plane; manual altitude
  // uses physical elevations. Never clamp or recenter the selected camera.
  const relief=!flat&&!this.heightFailed,contours=!this.contourFailed&&!this.heightFailed&&height<=3000;
  const reliefKey=[relief,contours,buildings].join(':');if(reliefKey!==this.reliefKey){Object.assign(this.relief.settings,{terrainEnabled:relief,hillshadeEnabled:relief,contoursEnabled:contours,buildings:!!buildings});this.relief.apply();this.reliefKey=reliefKey;}
  const plane=flat||this.heightFailed,base=plane?0:ground??0,cameraAltitude=plane?height:origin.alt;if(this.groundElevation!==base){this.map.setCenterElevation?.(base);this.groundElevation=base;}
  const camera=this.map.calculateCameraOptionsFromCameraLngLatAltRotation([origin.lon,origin.lat],cameraAltitude,angles.heading,pitch,roll);if(!Number.isFinite(camera.zoom)||camera.zoom>30){this.waitingHeight=true;return false;}this.map.jumpTo(camera);
  this.waitingHeight=!flat&&!Number.isFinite(ground)&&!this.heightFailed;
  const layerKey=[origin.lon,origin.lat,buildings,radius,contours].join(':');if(layerKey!==this.layerKey){const nearby=['<=',['distance',{type:'Point',coordinates:[origin.lon,origin.lat]}],radius];for(const [id,original]of this.layers){this.map.setLayoutProperty(id,'visibility',buildings?original.visibility:'none');if(buildings)this.map.setFilter(id,original.filter?['all',expression(original.filter),nearby]:nearby);}
   const contourDistance=['<=',['distance',{type:'Point',coordinates:[origin.lon,origin.lat]}],Math.min(radius,5000)];for(const id of ['cyklo-relief-lines','cyklo-relief-labels'])if(this.map.getLayer?.(id)){this.map.setFilter(id,id.endsWith('labels')?['all',['>',['get','level'],0],contourDistance]:contourDistance);this.map.setLayerZoomRange?.(id,12,24);this.map.setLayoutProperty(id,'visibility',contours?'visible':'none');}this.layerKey=layerKey;}
  this.origin={...origin,alt:cameraAltitude};this.pose=pose;this.flat=plane;this.contoursVisible=contours&&camera.zoom>=12&&camera.zoom<24;this.key=signature;return this.paintReady&&!this.waitingHeight;
 }
 places(observer,radius){if(!this.ready||this.failed||!root.GeoLookDetail)return [];const features=[];for(const [source,config]of Object.entries(this.map.getStyle().sources||{})){if(config.type!=='vector')continue;for(const layer of ['poi','building','water','water_name','waterway']){try{for(const feature of this.map.querySourceFeatures(source,{sourceLayer:layer})||[]){if(features.length>=12000)break;features.push({kind:layer,properties:feature.properties,geometry:feature.geometry,id:feature.id})}}catch{}}}return root.GeoLookDetail.places({format:1,center:observer,radius:Math.min(10000,radius),features},observer,radius)}
 project(point){if(!this.ready||this.failed)return null;if(this.origin&&this.pose){const v=root.GeoLook.local(this.origin,{...point,alt:this.flat?0:point.alt??this.elevation(point)??0});if(root.GeoLook.dot(v,this.pose.forward)<=0)return null;}const p=this.map.project([point.lon,point.lat]);return Number.isFinite(p.x)&&Number.isFinite(p.y)?p:null;}
 destroy(){if(this.disposed)return;this.disposed=true;this.relief?.destroy();this.map.remove();this.layers.clear();}
}
// Liberty currently uses expression filters. Convert legacy filters defensively.
function expression(f){if(!Array.isArray(f))return f;const [op,...args]=f;if(['all','any','none'].includes(op))return [op,...args.map(expression)];if(typeof args[0]!=='string'||args[0]==='$type')return f;const value=['get',args[0]];if(['==','!=','<','>','<=','>='].includes(op))return [op,value,args[1]];if(op==='in'||op==='!in'){const e=['in',value,['literal',args.slice(1)]];return op==='!in'?['!',e]:e;}if(op==='has'||op==='!has'){const e=['has',args[0]];return op==='!has'?['!',e]:e;}return f;}
root.GeoLookMap=OverviewMap;if(typeof module!=='undefined')module.exports={OverviewMap,expression};
})(globalThis);
