'use strict';
// The legacy localStorage value is read only. An IndexedDB marker is the sole
// authority for choosing the new copy after a verified migration.
const JournalStorage=(()=>{
 const dbName='resource-journal-state',stateKey='main',markerKey='active';
 let db,revision=0,legacyKey='',sourceHash=null;
 async function fingerprint(raw){if(raw===null)return null;const bytes=new TextEncoder().encode(raw),digest=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('');}
 function open(){return new Promise((resolve,reject)=>{
  if(!globalThis.indexedDB){reject(Error('IndexedDBを利用できません。'));return;}
  const request=indexedDB.open(dbName,1);
  request.onupgradeneeded=()=>{const database=request.result;database.createObjectStore('state');database.createObjectStore('meta');};
  request.onsuccess=()=>{db=request.result;db.onversionchange=()=>{db.close();db=null;};resolve(db);};
  request.onerror=()=>reject(request.error||Error('保存先を開けません。'));
  request.onblocked=()=>reject(Error('別の画面が保存先を使用しています。'));
 });}
 function read(){return new Promise((resolve,reject)=>{
  const transaction=db.transaction(['state','meta'],'readonly'),item=transaction.objectStore('state').get(stateKey),marker=transaction.objectStore('meta').get(markerKey);
  transaction.oncomplete=()=>resolve({item:item.result,marker:marker.result});
  transaction.onabort=()=>reject(transaction.error||Error('保存データを読めません。'));
 });}
 function writeCandidate(value){return new Promise((resolve,reject)=>{
  const transaction=db.transaction(['state','meta'],'readwrite'),marker=transaction.objectStore('meta').get(markerKey);
  marker.onsuccess=()=>{if(marker.result?.active)transaction.abort();else transaction.objectStore('state').put({value,revision:0},stateKey);};
  transaction.oncomplete=resolve;transaction.onabort=()=>reject(transaction.error||Error('移行先に保存できません。別の画面で移行済みの可能性があります。'));
 });}
 function activate(sourceHash,value){return new Promise((resolve,reject)=>{
  const transaction=db.transaction(['state','meta'],'readwrite'),meta=transaction.objectStore('meta'),marker=meta.get(markerKey);
  marker.onsuccess=()=>{if(marker.result?.active){transaction.abort();return;}const item=transaction.objectStore('state').get(stateKey);item.onsuccess=()=>{if(item.result?.revision!==0||JSON.stringify(item.result.value)!==JSON.stringify(value))transaction.abort();else meta.put({active:true,sourceHash},markerKey);};};
  transaction.oncomplete=resolve;transaction.onabort=()=>reject(transaction.error||Error('移行を確定できません。別の画面の変更を確認してください。'));
 });}
 async function load(key,makeFresh,validate){
  await open();const current=await read();
  if(current.marker?.active){
   if(!current.item)throw Error('IndexedDBの保存データが見つかりません。');
   const legacy=localStorage.getItem(key);
   if(legacy!==null&&current.marker.sourceHash!==await fingerprint(legacy))throw Error('旧保存先が別の画面で変更されています。上書きを停止しました。');
   revision=current.item.revision;legacyKey=key;sourceHash=current.marker.sourceHash;return validate(current.item.value);
  }
  const legacyRaw=localStorage.getItem(key);
  const value=legacyRaw?JSON.parse(legacyRaw):makeFresh();validate(value);
  await writeCandidate(value);
  const copy=await read();
  if(JSON.stringify(copy.item?.value)!==JSON.stringify(value)||copy.item.revision!==0)throw Error('移行後のデータが一致しません。');
  if(localStorage.getItem(key)!==legacyRaw)throw Error('移行中に別の画面が元データを更新しました。');
  const hash=await fingerprint(legacyRaw);await activate(hash,value);revision=0;legacyKey=key;sourceHash=hash;return validate(value);
 }
 async function save(value){
  if(!db||!legacyKey)throw Error('保存先の初期化が完了していません。');
  if(await fingerprint(localStorage.getItem(legacyKey))!==sourceHash)throw Error('旧保存先が別の画面で変更されています。再読み込み前にバックアップを確認してください。');
  return new Promise((resolve,reject)=>{
  const transaction=db.transaction(['state','meta'],'readwrite'),data=transaction.objectStore('state'),meta=transaction.objectStore('meta');
  const marker=meta.get(markerKey);marker.onsuccess=()=>{
   if(!marker.result?.active){transaction.abort();return;}
   const request=data.get(stateKey);request.onsuccess=()=>{
    if(request.result?.revision!==revision){transaction.abort();return;}
    data.put({value,revision:revision+1},stateKey);
   };
  };
  transaction.oncomplete=()=>{revision++;resolve();};
  transaction.onabort=()=>reject(transaction.error||Error('別の画面でデータが更新されました。再読み込みしてください。'));
 });}
 return {load,save,read,active:()=>Boolean(db),revision:()=>revision};
})();
if(typeof module!=='undefined')module.exports=JournalStorage;
