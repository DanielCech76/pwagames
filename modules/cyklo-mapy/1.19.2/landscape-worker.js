/* Local geometry worker: no network or map state; ignore obsolete jobs at receiver. */
importScripts('./landscape.js');
onmessage=({data})=>{try{let i=0;const vertices=CykloLandscape.mesh(data.trees,data.origin,()=>data.heights[i++]);postMessage({id:data.id,vertices},[vertices.buffer])}catch{postMessage({id:data.id,error:true})}};
