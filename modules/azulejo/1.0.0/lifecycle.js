/* Connect the standalone editor to the existing trusted-module lifecycle. */
(()=>{'use strict';let generation=0,closed=true,studio=null,pendingStart=Promise.resolve();
document.getElementById('moduleBack').onclick=()=>ArcadeHost.back();
function failure(error){const el=document.getElementById('moduleError');el.hidden=false;el.textContent='QR Studio: '+String(error.message||error)}
function start(){const token=++generation;closed=false;pendingStart=Promise.resolve().then(()=>AzulejoStudio.create(()=>!closed&&token===generation)).then(async api=>{if(closed||token!==generation)await api?.stop();else studio=api}).catch(error=>{if(!closed&&token===generation)failure(error)});return pendingStart}
async function stop(){closed=true;generation++;const old=studio;studio=null;await Promise.all([old?.stop(),pendingStart])}
ArcadeHost.register({start,pause:()=>studio?.pause(),stop,dialogs:{large:()=>studio?.dialogs?.large(),cropDialog:()=>studio?.dialogs?.cropDialog()}});
})();
