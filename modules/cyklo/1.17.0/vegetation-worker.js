/* Geographic sampling stays off the UI thread; no DOM, network or DEM access. */
importScripts('./landscape.js');
let revision,route,features,prepared,cache=new Map();
onmessage=({data})=>{try{if(data.revision!==revision){cache.clear();prepared=null;revision=data.revision}if(data.route!==route){cache.clear();route=data.route}if(data.args[1])features=data.args.slice(1,4);else for(let i=0;i<3;i++)data.args[i+1]=features[i];const start=performance.now();data.args[5].cache=cache;data.args[5].prepared=prepared;const trees=CykloLandscape.sample(...data.args);prepared=data.args[5].prepared;postMessage({id:data.id,trees,ms:performance.now()-start})}catch(error){postMessage({id:data.id,error:String(error.message||error)})}};
