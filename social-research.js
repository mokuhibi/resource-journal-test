'use strict';
// One receipt group is stored once; summary rows are derived, never persisted twice.
const SocialResearch=(()=>{
 const validTime=s=>typeof s==='string'&&Number.isFinite(Date.parse(s));
 function validate(groups,map){
  if(!Array.isArray(groups))throw Error('ソーシャルリサーチの形式');const ids=new Set();
  for(const g of groups){if(!g||typeof g.id!=='string'||!g.id||ids.has(g.id)||!validTime(g.datetime)||!validTime(g.recordedAt)||g.updatedAt!==undefined&&!validTime(g.updatedAt)||!Array.isArray(g.entries)||!g.entries.length)throw Error('ソーシャルリサーチの記録');ids.add(g.id);const rows=new Set();for(const e of g.entries){if(!e||typeof e.id!=='string'||!e.id||rows.has(e.id)||!Object.hasOwn(map,e.species)||e.candy!==map[e.species]||![1,2].includes(e.amount))throw Error('ソーシャルリサーチのアメ');rows.add(e.id);}}
 }
 function save(state,draft,map,now){const groups=state.socialResearch||[],old=groups.find(g=>g.id===draft.id);if(draft.editing&&!old)throw Error('編集元が見つかりません。履歴を確認してください。');if(draft.editing&&draft.updatedAt!==old.updatedAt)throw Error('この履歴は別の画面で更新されています。履歴を開き直してください。');const group={...(old||{}),id:draft.id,datetime:draft.datetime,entries:draft.entries.map(e=>({...e})),recordedAt:old?.recordedAt||now,updatedAt:now};const next=old?groups.map(g=>g.id===group.id?group:g):[...groups,group];validate(next,map);return {...state,socialResearch:next};}
 const remove=(state,id)=>({...state,socialResearch:(state.socialResearch||[]).filter(g=>g.id!==id)});
 const records=state=>(state.socialResearch||[]).flatMap(g=>g.entries.map(e=>({...e,id:g.id+':'+e.id,groupId:g.id,datetime:g.datetime,recordedAt:g.recordedAt,method:'social',pokemonId:null,slot:null})));
 return {validate,save,remove,records};
})();
if(typeof module!=='undefined')module.exports=SocialResearch;
