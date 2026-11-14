/* Tables are declarative: geometry, scoring and tuning can vary independently. */
(function(root){
 const neon={id:'neon-arcade',name:'Neon Arcade',width:600,height:1000,gravity:720,balls:3,flipperSpeed:32,flipperReturnSpeed:19,launchLane:{left:520,right:580,reloadY:860},colors:{rail:'#b797ff',mint:'#86f6c5',coral:'#ff9daf'},
 walls:[[[65,40],[490,40]],[[65,40],[30,100]],[[30,100],[30,910]],[[30,910],[100,970]],[[100,970],[240,970]],[[360,970],[500,970]],[[500,970],[580,920]],[[580,920],[580,100]],[[580,100],[510,40]],[[520,180],[520,980]],[[72,620],[100,735]],[[100,735],[157,812]],[[487,620],[467,735]],[[467,735],[443,812]],[[70,780],[130,875]],[[130,875],[225,948]],[[500,780],[465,875]],[[465,875],[375,948]]],
 bumpers:[{x:210,y:220,r:39},{x:390,y:220,r:39},{x:300,y:355,r:43}],
 targets:[{x:100,y:360,r:17},{x:110,y:425,r:17},{x:120,y:490,r:17},{x:470,y:360,r:17},{x:460,y:425,r:17},{x:450,y:490,r:17}],
 slings:[{x:127,y:745,r:31},{x:473,y:745,r:31}],
 flippers:[{x:175,y:858,length:111,rest:.34,active:-.57},{x:425,y:858,length:111,rest:Math.PI-.34,active:Math.PI+.57}],
 points:{bumper:100,target:250,sling:25,complete:2000},launch:{x:550,y:925},description:'Rozsviť všech šest terčů a zvyš bonus.'};
 root.PinballTables=[neon];if(typeof module!=='undefined')module.exports=root.PinballTables;
})(typeof window!=='undefined'?window:globalThis);
