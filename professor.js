'use strict';
/* 博士の個体履歴。睡眠のGETは既存の明細IDから導出し、直接送信だけ独立して保存する。 */
(function(root){
 const map=typeof candyMap!=='undefined'?candyMap:require('./pokemon-data.js').candyMap;
 const rewards=typeof ProfessorCandy!=='undefined'?ProfessorCandy:require('./professor-candy.js');
 const dateOnly=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
 const timestamp=s=>typeof s==='string'&&Number.isFinite(Date.parse(s));
 const getId=(sessionId,entryId)=>'sleep:'+sessionId+':'+entryId;
 const getTime=(session,mode='bulk')=>new Date(Date.parse(session.date+(mode==='split'&&session.number===1?'T12:00:00+09:00':'T04:00:00+09:00'))+(mode==='split'&&session.number===1?0:86400000)).toISOString();
 function gets(state){
  const mode=state.settings?.sleepMode||'bulk',sleep=(state.sleepSessions||[]).flatMap(s=>s.entries.flatMap((e,i)=>e.got===true?[{id:getId(s.id,e.id),source:'sleep',species:e.species,sessionId:s.id,entryId:e.id,date:s.date,number:s.number,position:i+1,getAt:state.professorGetOverrides?.[getId(s.id,e.id)]||getTime(s,mode)}]:[]));
  const direct=(state.professorTransfers||[]).filter(t=>t.source==='direct').map(t=>({id:t.getId,source:'direct',species:t.species,date:new Date(Date.parse(t.getAt)+9*3600000).toISOString().slice(0,10),getAt:t.getAt}));
  return [...sleep,...direct];
 }
 function status(state,item){const transfer=(state.professorTransfers||[]).find(t=>t.getId===item.id);if(transfer)return 'sent';const adopted=(state.professorAdoptions||[]).find(a=>a.getId===item.id);return adopted?'adopted':'pending';}
 function candyRecords(state){return (state.professorTransfers||[]).map(t=>({id:'professor:'+t.id,datetime:new Date(t.sentDate+'T12:00:00+09:00').toISOString(),method:'professor',amount:t.amount,species:t.species,pokemon:t.species,candy:map[t.species],pokemonId:t.getId,slot:null,getId:t.getId}));}
 function friendPoints(state,species){const all=gets(state).filter(g=>g.species===species),base=state.professorFriendPoints?.[species],point=base?base.value+all.filter(g=>Date.parse(g.getAt)>Date.parse(base.at)).length:1+all.length,unknown=Math.max(0,point-1-all.length);return {point,unknown,recorded:all.length,mismatch:all.length>point-1,baseline:base||null};}
 function validate(state){
  const all=gets(state),byId=new Map(all.map(g=>[g.id,g]));if(byId.size!==all.length)throw Error('博士GETの重複');
  const transfers=state.professorTransfers||[],adoptions=state.professorAdoptions||[],points=state.professorFriendPoints||{},overrides=state.professorGetOverrides||{};
  if(!Array.isArray(transfers)||!Array.isArray(adoptions)||!points||typeof points!=='object'||Array.isArray(points)||!overrides||typeof overrides!=='object'||Array.isArray(overrides))throw Error('博士履歴');
  const ids=new Set(),used=new Set();
  for(const t of transfers){if(!t||typeof t.id!=='string'||!t.id||ids.has(t.id)||typeof t.getId!=='string'||used.has(t.getId)||!['sleep','direct'].includes(t.source)||!Object.hasOwn(map,t.species)||!Number.isSafeInteger(t.amount)||t.amount<0||t.amount>1000000000||!timestamp(t.getAt)||!timestamp(t.sentAt)||!dateOnly(t.sentDate)||!byId.has(t.getId)||byId.get(t.getId).species!==t.species||t.source==='sleep'&&byId.get(t.getId).source!=='sleep'||t.source==='direct'&&t.getId!=='direct:'+t.id)throw Error('博士送り履歴');ids.add(t.id);used.add(t.getId);}
  const adoptedIds=new Set();
  for(const a of adoptions){const g=byId.get(a?.getId),p=state.pokemon.find(p=>p.id===a?.pokemonId);if(!g||!a.detached&&p&&p.species!==g.species||typeof a.getId!=='string'||adoptedIds.has(a.getId)||used.has(a.getId)||typeof a.pokemonId!=='string'||typeof a.detached!=='boolean'||!a.detached&&(!p||!p.provisional))throw Error('博士の採用履歴');adoptedIds.add(a.getId);}
  for(const [species,p] of Object.entries(points))if(!Object.hasOwn(map,species)||!p||!Number.isSafeInteger(p.value)||p.value<1||p.value>1000000000||!timestamp(p.at))throw Error('フレンドポイント');
  for(const [id,at] of Object.entries(overrides))if(!byId.has(id)||byId.get(id).source!=='sleep'||!timestamp(at))throw Error('GET日時の編集');
 }
 function reconcile(previous,next){
  const current=new Map(gets(next).map(g=>[g.id,g])),adoptions=(next.professorAdoptions||[]).filter(a=>current.has(a.getId)).filter(a=>{const old=previous.pokemon.find(p=>p.id===a.pokemonId),now=next.pokemon.find(p=>p.id===a.pokemonId);return a.detached||(!old?.provisional||!!now)&&(!now?.provisional||now.species===current.get(a.getId).species);}).map(a=>({...a,detached:a.detached||!next.pokemon.some(p=>p.id===a.pokemonId&&p.provisional)}));
  const prior=(previous.professorAdoptions||[]).filter(a=>!a.detached&&(!current.has(a.getId)||current.get(a.getId).species!==previous.pokemon.find(p=>p.id===a.pokemonId)?.species)).map(a=>a.pokemonId);
  return {...next,professorTransfers:(next.professorTransfers||[]).filter(t=>current.has(t.getId)&&current.get(t.getId).species===t.species),professorAdoptions:adoptions,professorGetOverrides:Object.fromEntries(Object.entries(next.professorGetOverrides||{}).filter(([id])=>current.has(id))),pokemon:next.pokemon.filter(p=>!prior.includes(p.id)||!p.provisional),team:next.team.map(id=>prior.includes(id)&&next.pokemon.some(p=>p.id===id&&p.provisional)?null:id)};
 }
 function linkedLosses(previous,next){
  const after=new Map(gets(next).map(g=>[g.id,g.species]));
  const lost=gets(previous).filter(g=>g.source==='sleep'&&after.get(g.id)!==g.species);
  return lost.filter(g=>(previous.professorTransfers||[]).some(t=>t.getId===g.id)||(previous.professorAdoptions||[]).some(a=>a.getId===g.id&&!a.detached));
 }
 function adopt(state,getId,pokemonId){const g=gets(state).find(g=>g.id===getId);if(!g||status(state,g)!=='pending')throw Error('採用するGETがありません。');const p={id:pokemonId,species:g.species,nickname:'',profile:null,provisional:true};return {...state,pokemon:[...state.pokemon,p],professorAdoptions:[...(state.professorAdoptions||[]),{getId,pokemonId,detached:false}]};}
 function cancelAdoption(state,getId){const a=(state.professorAdoptions||[]).find(a=>a.getId===getId);if(!a||a.detached)throw Error('仮登録を取り消せません。');return {...state,professorAdoptions:state.professorAdoptions.filter(x=>x.getId!==getId),pokemon:state.pokemon.filter(p=>p.id!==a.pokemonId),team:state.team.map(id=>id===a.pokemonId?null:id)};}
 function send(state,items,now){let next={...state,professorTransfers:[...(state.professorTransfers||[])]};for(const item of items){const g=gets(next).find(g=>g.id===item.getId);if(!g||status(next,g)!=='pending')throw Error('送るGETを確認してください。');next.professorTransfers.push({id:item.id,getId:g.id,source:'sleep',species:g.species,amount:item.amount,getAt:g.getAt,sentAt:item.sentAt||now,sentDate:item.sentDate||new Date(Date.parse(now)+9*3600000).toISOString().slice(0,10)});}return next;}
 function direct(state,{id,species,amount,getAt,sentAt,sentDate}){if(!Object.hasOwn(map,species))throw Error('ポケモン名を確認してください。');return {...state,professorTransfers:[...(state.professorTransfers||[]),{id,getId:'direct:'+id,source:'direct',species,amount,getAt,sentAt,sentDate}]};}
 function cancelSend(state,id){const transfer=(state.professorTransfers||[]).find(t=>t.id===id);if(!transfer)throw Error('博士送りが見つかりません。');return {...state,professorTransfers:state.professorTransfers.filter(t=>t.id!==id)};}
 const api={getId,getTime,gets,status,candyRecords,friendPoints,validate,reconcile,linkedLosses,adopt,cancelAdoption,send,direct,cancelSend,rewards};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Professor=api;
})(typeof globalThis!=='undefined'?globalThis:this);
