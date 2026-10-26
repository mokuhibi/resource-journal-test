'use strict';
// 選択画面の状態だけを保持し、編成は既存のcommitで保存する。
const TeamPicker=(()=>{
 let slot=null,target=null,scrollY=0,bodyStyle=null;
 const members=()=>target?target.team():state.team;
 const slotName=i=>i===0?'1R':String(i+1);
 function close(){ $('team-picker').close(); }
 function refresh(){
  if(slot===null)return;
  const current=state.pokemon.find(p=>p.id===members()[slot]);
  $('team-picker-context').textContent=(target?.name||'編成枠')+' '+slotName(slot)+' · 現在：'+(current?label(current):'未設定');
  const query=normalize($('team-picker-search').value),root=$('team-picker-list');root.replaceChildren();const grid=el('div',undefined,'team-picker-grid');
  const add=(p)=>{
   const id=p?.id||null,selected=members()[slot]===id,used=id!==null&&members().some((pid,i)=>i!==slot&&pid===id);
   const b=button('',()=>choose(id),'team-picker-row');b.disabled=used;b.setAttribute('aria-pressed',String(selected));
   b.append(p&&typeof TeamUI!=='undefined'?TeamUI.cardInfo(p):el('span',p?label(p):'未設定','team-picker-name'),el('span',selected?'✓':used?'編成中':'','team-picker-status'));if(p&&typeof TeamUI!=='undefined')TeamUI.typeBorder(b,p);if(p)b.dataset.pokemonId=p.id;
   if(selected)b.setAttribute('aria-label',(p?label(p):'未設定')+'(選択中)');
   (p?grid:root).append(b);
  };
  add(null);root.append(grid);
  const candidates=orderedPokemon().filter(p=>!query||[p.species,C.speciesName(p.species),p.nickname||''].some(s=>normalize(s).includes(query)));
  candidates.forEach(add);
  if(query&&!candidates.length)grid.append(el('p','一致する登録ポケモンがありません。','muted'));
 }
 function choose(id){
  if(slot===null||id!==null&&(!state.pokemon.some(p=>p.id===id)||members().some((pid,i)=>i!==slot&&pid===id)))return;
  if(members()[slot]===id){close();return;}
  const team=[...members()];team[slot]=id;
  if(target?target.save(team):commit({...state,team},'編成を保存しました。'))close();
  else $('team-picker-error').textContent='編成を保存できませんでした。選択は変更されていません。';
 }
 function open(index,options=null){
  slot=index;target=options;$('team-picker-search').value='';$('team-picker-error').textContent='';refresh();
  scrollY=window.scrollY;bodyStyle={position:document.body.style.position,top:document.body.style.top,width:document.body.style.width,overflow:document.body.style.overflow};
  Object.assign(document.body.style,{position:'fixed',top:-scrollY+'px',width:'100%',overflow:'hidden'});
  $(target?.focusId||'team-slot-'+index)?.setAttribute('aria-expanded','true');$('team-picker').showModal();$('team-picker-close').focus();
 }
 function init(){
  $('team-picker-search').oninput=refresh;$('team-picker-close').onclick=close;
  $('team-picker').addEventListener('close',()=>{const previous=slot,focus=target?.focusId||'team-slot-'+previous;slot=null;target=null;if(bodyStyle){Object.assign(document.body.style,bodyStyle);bodyStyle=null;window.scrollTo({top:scrollY});}$(focus)?.setAttribute('aria-expanded','false');$(focus)?.focus({preventScroll:true});});
 }
 return {open,refresh,init};
})();
