import './module-data.js';
export const DB_NAME='arcade-modular-v1';
import {CORE_VERSION} from './version.js';
export {CORE_VERSION,API_VERSION} from './version.js';
let opening;
export function db(){return opening??=new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,1);r.onupgradeneeded=()=>{for(const name of ['modules','settings','snapshots','locks'])r.result.createObjectStore(name)};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
export async function get(store,key){const d=await db();return new Promise((resolve,reject)=>{const r=d.transaction(store).objectStore(store).get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
export async function all(store){const d=await db();return new Promise((resolve,reject)=>{const r=d.transaction(store).objectStore(store).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
export async function put(store,key,value){const d=await db();return new Promise((resolve,reject)=>{const tx=d.transaction(store,'readwrite');tx.objectStore(store).put(value,key);tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);tx.onerror=()=>reject(tx.error)})}
export async function del(store,key){const d=await db();return new Promise((resolve,reject)=>{const tx=d.transaction(store,'readwrite');tx.objectStore(store).delete(key);tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error)})}
export const dataPrefix=id=>'arcade.data.'+id+'.';
export function readData(id){const out={},prefix=dataPrefix(id);for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key.startsWith(prefix))out[key.slice(prefix.length)]=localStorage.getItem(key)}return out}
export async function eraseData(id){await globalThis.ArcadeModuleData.erase(id);const keys=Object.keys(readData(id));for(const key of keys)localStorage.removeItem(dataPrefix(id)+key);if(id==='pinball')localStorage.removeItem('pinball.best.neon-arcade')}
export async function snapshot(id,label){const key=id+':'+crypto.randomUUID();const count=await globalThis.ArcadeModuleData.snapshot(id,key);await put('snapshots',key,{key,id,label,created:Date.now(),data:readData(id),large:count>0});return key}
export async function eraseSnapshots(id,keep=[]){for(const row of await all('snapshots'))if(row.id===id&&!keep.includes(row.key)){await globalThis.ArcadeModuleData.eraseBackup(row.key);await del('snapshots',row.key)}}
export async function migrateLegacy(){if(await get('settings','migrationDone'))return;const old=localStorage.getItem('pinball.best.neon-arcade');const key=dataPrefix('pinball')+'pinball.best.neon-arcade';if(old!==null&&localStorage.getItem(key)===null){localStorage.setItem(key,old);if(localStorage.getItem(key)!==old)throw Error('Původní rekord se nepodařilo zachovat. Přechod nebyl dokončen.')}await put('settings','migrationDone',{version:CORE_VERSION,time:Date.now()})}
// Web Locks protect installers and running modules across app windows.
export async function holdLock(name){if(navigator.locks){let release;let settled=false;return new Promise((resolve,reject)=>{navigator.locks.request('arcade:'+name,{ifAvailable:true},async lock=>{if(!lock){settled=true;reject(Error('Tato operace nebo modul už běží v jiném okně.'));return}await new Promise(done=>{release=done;settled=true;resolve(()=>release())})}).catch(err=>{if(!settled)reject(err)})})}
 const token=crypto.randomUUID(),d=await db();await new Promise((resolve,reject)=>{const tx=d.transaction('locks','readwrite'),s=tx.objectStore('locks'),r=s.get(name);let busy=false;r.onsuccess=()=>{if(r.result?.expires>Date.now()){busy=true;tx.abort();return}s.put({token,expires:Date.now()+45000},name)};tx.oncomplete=resolve;tx.onabort=()=>reject(Error(busy?'Operace už běží v jiném okně.':'Zámek operace není dostupný.'))});
 const beat=setInterval(async()=>{const row=await get('locks',name);if(row?.token===token)await put('locks',name,{token,expires:Date.now()+45000});else window.dispatchEvent(new Event('arcade-lock-lost'))},10000);return async()=>{clearInterval(beat);if((await get('locks',name))?.token===token)await del('locks',name)}
}
export async function locked(name,fn){const release=await holdLock(name);try{return await fn()}finally{await release()}}
