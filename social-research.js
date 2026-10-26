'use strict';
// One receipt group is stored once; summary rows are derived, never persisted twice.
const SocialResearch=(()=>{
 const validTime=s=>typeof s==='string'&&Number.isFinite(Date.parse(s));
 // Display grouping only: persisted species and candy keys remain unchanged.
 const displaySpecies=name=>name.replace(/^(バケッチャ|パンプジン)\((?:ちゅうだま|こだま|おおだま|ギガだま)(?:しゅ)?\)$/,'$1');
 function pickupCandidates(names,events,day,pickups){const priority=new Map();for(const event of events){const tiers=pickups.tiersFor(event,day);for(const n of pickups.targets([event],day,event.fields[0]==='*'?'':event.fields[0])){const tier=['special','large','medium','small'].findIndex(k=>tiers[k]?.includes(n)),key=displaySpecies(n),rank=tier<0?4:tier;priority.set(key,Math.min(priority.get(key)??4,rank));}}const seen=new Set();return names.filter(n=>{const key=displaySpecies(n);if(!priority.has(key)||seen.has(key))return false;seen.add(key);return true;}).sort((a,b)=>priority.get(displaySpecies(a))-priority.get(displaySpecies(b)));}
 function validate(groups,map){
  if(!Array.isArray(groups))throw Error('ソーシャルリサーチの形式');const ids=new Set();
  for(const g of groups){if(!g||typeof g.id!=='string'||!g.id||ids.has(g.id)||!validTime(g.datetime)||!validTime(g.recordedAt)||g.updatedAt!==undefined&&!validTime(g.updatedAt)||!Array.isArray(g.entries)||!g.entries.length)throw Error('ソーシャルリサーチの記録');ids.add(g.id);const rows=new Set();for(const e of g.entries){if(!e||typeof e.id!=='string'||!e.id||rows.has(e.id)||!Object.hasOwn(map,e.species)||e.candy!==map[e.species]||![1,2].includes(e.amount))throw Error('ソーシャルリサーチのアメ');rows.add(e.id);}}
 }
 function save(state,draft,map,now){const groups=state.socialResearch||[],old=groups.find(g=>g.id===draft.id);if(draft.editing&&!old)throw Error('編集元が見つかりません。履歴を確認してください。');if(draft.editing&&draft.updatedAt!==old.updatedAt)throw Error('この履歴は別の画面で更新されています。履歴を開き直してください。');const group={...(old||{}),id:draft.id,datetime:draft.datetime,entries:draft.entries.map(e=>({...e})),recordedAt:old?.recordedAt||now,updatedAt:now};const next=old?groups.map(g=>g.id===group.id?group:g):[...groups,group];validate(next,map);return {...state,socialResearch:next};}
 const remove=(state,id)=>({...state,socialResearch:(state.socialResearch||[]).filter(g=>g.id!==id)});
 const records=state=>(state.socialResearch||[]).flatMap(g=>g.entries.map(e=>({...e,id:g.id+':'+e.id,groupId:g.id,datetime:g.datetime,recordedAt:g.recordedAt,method:'social',pokemonId:null,slot:null})));
 return {displaySpecies,pickupCandidates,validate,save,remove,records};
})();
if(typeof module!=='undefined')module.exports=SocialResearch;
