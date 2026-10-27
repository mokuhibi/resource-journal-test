'use strict';
// A roster-only backup must not silently reconnect an existing history ID to a different individual.
const PokemonBackup=(()=>{
 const format='resource-journal-pokemon',version=1;
 function encode(pokemon){return JSON.stringify({format,version,pokemon},null,2);}
 function decode(text){let v;try{v=JSON.parse(text.replace(/^\uFEFF/,''));}catch(_){throw Error('ポケモン一覧専用のバックアップを選択してください。');}if(!v||v.format!==format||v.version!==version||!Array.isArray(v.pokemon))throw Error('対応していないポケモン一覧バックアップです。');return v.pokemon;}
 function restore(state,pokemon,map,core){
  const ids=new Set(pokemon.map(p=>p?.id)),refs=new Map();
  function visit(x){if(!x||typeof x!=='object')return;if(Array.isArray(x)){x.forEach(visit);return;}for(const key of ['pokemonId','actorId'])if(typeof x[key]==='string'&&ids.has(x[key])){const list=refs.get(x[key])||[];list.push(x);refs.set(x[key],list);}if(typeof x.id==='string'&&ids.has(x.id)&&typeof x.species==='string'){const list=refs.get(x.id)||[];list.push(x);refs.set(x.id,list);}Object.values(x).forEach(visit);}
  visit(state.records);visit(state.shardRecords);visit(state.sleepSessions);visit(state.socialResearch);
  for(const p of pokemon){if(!p||typeof p.id!=='string'||!p.id)throw Error('個体IDが不正です。');const current=state.pokemon.find(x=>x.id===p.id),observations=refs.get(p.id)||[];if(current&&(current.species!==p.species||current.nickname!==p.nickname))throw Error('同じ個体IDの登録情報が一致しません。全データのバックアップをご確認ください。');if(!current&&observations.length){const evidence=observations.filter(x=>typeof x.species==='string'&&x.species);if(!evidence.length||evidence.some(x=>x.species!==p.species||typeof x.nickname==='string'&&x.nickname&&x.nickname!==p.nickname))throw Error('履歴に残る個体IDとの対応を確認できません。全データのバックアップをご確認ください。');}}
  const clean=team=>team.map(id=>ids.has(id)?id:null),next={...state,pokemon,team:clean(state.team),...(state.savedTeams?{savedTeams:state.savedTeams.map(t=>t?{...t,team:t.team?clean(t.team):null}:null)}:{})};core.migrate(next,map);return next;
 }
 return {encode,decode,restore};
})();
if(typeof module!=='undefined')module.exports=PokemonBackup;
