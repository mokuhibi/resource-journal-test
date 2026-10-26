// 編成内の表示状態だけを管理。保存する個体・編成・履歴の形式は変えません。
const TeamUI=(()=>{
 let drag=null,suppressClick=false;
 let view='team',editing=false,editOrigin='roster';let columns=4,rosterView='skills';
 // 表示専用。個体IDや保存された名前・スキルは変更しない。
 function name(p){
  const root=el('span',undefined,'team-individual-name');
  const nickname=p?.nickname?.trim();
  const primary=el('strong');primary.textContent=p?(nickname||C.speciesName(p.species)||'未確認'):'未設定';root.append(primary);
  if(p&&nickname)root.append(el('small',C.speciesName(p.species)||'未確認'));
  if(p)root.title=label(p);
  return root;
 }
 // Saved lineups use IDs only; current and saved slots are copied independently.
 const savedTeam=i=>state.savedTeams?.[i]||{name:'チーム'+(i+1),team:null};
 function saveTeam(i,changes,refresh=true){const savedTeams=Array.from({length:8},(_,n)=>state.savedTeams?.[n]||null);savedTeams[i]={...savedTeam(i),...changes};return commit({...state,savedTeams},'チームを保存',refresh);}
 function useTeam(i){const saved=savedTeam(i);if(!saved.team)return false;return commit({...state,team:[...saved.team]},'編成を保存');}
 function saveCurrent(i){if(savedTeam(i).team&&!confirm(savedTeam(i).name+'を現在のチームで上書きしますか？'))return false;return saveTeam(i,{team:[...state.team]});}
 function renderSavedTeams(){
  $('save-current-team').onclick=()=>AppPanels.open('チームの保存先',body=>{const choices=el('div',undefined,'team-save-choices');for(let i=0;i<8;i++)choices.append(button(savedTeam(i).name||'チーム'+(i+1),()=>{if(saveCurrent(i))AppPanels.close();}));body.append(choices);});
  const root=$('saved-teams');root.replaceChildren();
  for(let i=0;i<8;i++){
   const saved=savedTeam(i),section=el('section',undefined,'saved-team'),head=el('div',undefined,'saved-team-head'),title=el('input'),apply=button('編成',()=>useTeam(i));
   title.type='text';title.value=saved.name;title.placeholder='チーム'+(i+1);title.setAttribute('aria-label','チーム'+(i+1)+'の名前');title.onchange=()=>{if(saveTeam(i,{name:title.value},false))apply.setAttribute('aria-label',(title.value||title.placeholder)+'を編成');};apply.disabled=!saved.team;apply.setAttribute('aria-label',(saved.name||title.placeholder)+'を編成');head.append(title,apply);
   const slots=el('div',undefined,'saved-team-slots');
   for(let j=0;j<5;j++){
    const id=saved.team?.[j],p=state.pokemon.find(p=>p.id===id),b=button('',()=>TeamPicker.open(j,{name:savedTeam(i).name||'チーム'+(i+1),team:()=>savedTeam(i).team||Array(5).fill(null),save:team=>saveTeam(i,{team}),focusId:'saved-team-'+i+'-slot-'+j}),'team-slot-button');
    b.id='saved-team-'+i+'-slot-'+j;b.setAttribute('aria-label','チーム'+(i+1)+'の位置'+(j+1)+'：'+(p?label(p):'未設定'));b.setAttribute('aria-haspopup','dialog');b.append(el('span',j===0?'1R':String(j+1),'saved-slot-number'),name(p));slots.append(b);
   }
   section.append(head,slots);root.append(section);
  }
 }
 function sync(){
  for(const name of ['team','roster','register'])$(name+'-panel').hidden=view!==name||editing;
  $('individual-editor').hidden=!editing;
  for(const b of document.querySelectorAll('[data-team-view]')){b.setAttribute('aria-selected',String(b.dataset.teamView===view));b.tabIndex=b.dataset.teamView===view?0:-1;}
 }
 function show(name){view=name;editing=false;sync();window.scrollTo({top:0});}
 function edit(origin='roster'){editOrigin=['team','roster'].includes(origin)?origin:'roster';view=editOrigin;editing=true;sync();window.scrollTo({top:0});$('profile-back').focus({preventScroll:true});}
 function finishEdit(){show(editOrigin);}
 function registration(){$('registration-fields').hidden=!selected;}
 function renderRoster(){
  const root=$('registered-pokemon-list'),q=normalize($('roster-search').value);root.replaceChildren();root.style.setProperty('--roster-columns',columns);root.dataset.columns=String(columns);
  const normal=state.pokemon.filter(p=>!special(p));
  const category=p=>['メタモン','マネネ','バリヤード'].includes(p.species)?'スキルコピー':p.species!=='ミュウ'&&SK.id(SK.forPokemon(p))==='metronome'?'ゆびをふる':special(p)?'アメ':relatedPokemon(p)?'ゆめのかけら':'その他のポケモン';
  const target=p=>category(p)!=='その他のポケモン';
  const visible=state.pokemon.filter(p=>(rosterView==='skills'?!p.provisional&&target(p):rosterView==='registered'?!p.provisional:rosterView==='provisional'?p.provisional:true)&&(!q||[p.species,C.speciesName(p.species),p.nickname].some(v=>normalize(v||'').includes(q))));
  for(const b of document.querySelectorAll('[data-roster-view]')){b.setAttribute('aria-pressed',String(b.dataset.rosterView===rosterView));if(b.dataset.rosterView==='provisional'){const n=state.pokemon.filter(p=>p.provisional).length;b.textContent='仮登録'+(n?'（'+n+'）':'');}}
  const groups=['アメ','ゆめのかけら','スキルコピー','ゆびをふる','その他のポケモン'].map(title=>[title,visible.filter(p=>category(p)===title)]);
  for(const [title,members] of groups){if(!members.length)continue;root.append(el('h3',title,'roster-purpose-heading'));const group=el('div',undefined,'individual-roster-grid');root.append(group);
  for(const p of members){
   const line=el('div',undefined,'registered-row'),info=el('div',undefined,'registered-info'),actions=el('div',undefined,'row-actions');
   info.append(el('small',nationalDex[p.species]?'No.'+String(nationalDex[p.species]).padStart(3,'0'):'種類未確認','individual-number'),name(p));if(p.provisional)info.append(el('small','仮登録','provisional-badge'));
   if(sorting&&!special(p)){
    const i=normal.findIndex(x=>x.id===p.id),up=button('↑',()=>movePokemon(p.id,-1)),down=button('↓',()=>movePokemon(p.id,1));
    up.setAttribute('aria-label',label(p)+'を上へ');down.setAttribute('aria-label',label(p)+'を下へ');up.disabled=i===0;down.disabled=i===normal.length-1;actions.append(up,down);
   }
   line.setAttribute('role','button');line.tabIndex=0;line.setAttribute('aria-label',label(p)+'を編集');line.onclick=e=>{if(sorting||suppressClick){suppressClick=false;return;}if(!e.target.closest('button'))openIndividualEditor(p);};line.onkeydown=e=>{if(e.target===line&&['Enter',' '].includes(e.key)){e.preventDefault();openIndividualEditor(p);}};line.dataset.pokemonId=p.id;line.append(info,actions);group.append(line);bindReorder(line,p);
  }
  }
  if(!visible.length)root.append(el('p',q?'一致する登録ポケモンがありません。':'表示できる登録ポケモンがありません。'));
 }
 function reorder(id,beforeId){
  const xs=[...state.pokemon],from=xs.findIndex(p=>p.id===id),to=xs.findIndex(p=>p.id===beforeId);if(from<0||to<0||from===to)return false;
  const [item]=xs.splice(from,1);xs.splice(to,0,item);
  // 固定の用途別グループは維持し、その中の表示順だけ保存する。
  return commit({...state,pokemon:xs},null);
 }
 function bindReorder(line,p){
  if(!sorting){suppressClick=false;return;}line.classList.add('reorder-enabled');
  let timer=null,start=null,active=false;
  const clear=()=>{clearTimeout(timer);timer=null;line.classList.remove('reorder-dragging');drag=null;};
  line.onpointerdown=e=>{if(e.button!==0||e.target.closest('button'))return;start={x:e.clientX,y:e.clientY};timer=setTimeout(()=>{active=true;suppressClick=true;drag={id:p.id,target:p.id};line.classList.add('reorder-dragging');line.setPointerCapture(e.pointerId);},400);};
  line.onpointermove=e=>{if(!start)return;if(!active){if(Math.hypot(e.clientX-start.x,e.clientY-start.y)>8)clear();return;}e.preventDefault();const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('.registered-row');if(target&&target.parentElement===line.parentElement)drag.target=target.dataset.pokemonId;};
  line.onpointerup=()=>{const move=active&&drag?{...drag}:null;active=false;start=null;clear();if(move&&move.id!==move.target)reorder(move.id,move.target);};
  line.onpointercancel=()=>{active=false;start=null;clear();};line.oncontextmenu=e=>e.preventDefault();
 }
 function init(){
  const tabs=[...document.querySelectorAll('[data-team-view]')];
  tabs.forEach((b,i)=>{if(typeof TabIcons!=='undefined')TabIcons.add(b,({team:'users',roster:'list',register:'user-round-plus'})[b.dataset.teamView]);b.onclick=()=>show(b.dataset.teamView);b.onkeydown=e=>{let next;if(e.key==='ArrowRight')next=(i+1)%tabs.length;else if(e.key==='ArrowLeft')next=(i+tabs.length-1)%tabs.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=tabs.length-1;else return;e.preventDefault();show(tabs[next].dataset.teamView);tabs[next].focus({preventScroll:true});};});
  $('roster-search').oninput=renderRoster;
  $('roster-other-toggle').remove();const views=el('div',undefined,'roster-views');for(const [key,title] of [['skills','記録スキル'],['registered','登録済み'],['provisional','仮登録'],['all','すべて']]){const b=button(title,()=>{rosterView=key;renderRoster();});b.dataset.rosterView=key;views.append(b);}$('registered-pokemon-list').before(views);$('roster-search').addEventListener('change',renderRoster);
  const toolbar=el('div',undefined,'profile-editor-actions'),cancel=$('profile-back'),save=$('profile-form').querySelector('button[type=submit]');cancel.textContent='キャンセル';save.textContent='保存';save.classList.add('primary');toolbar.append(cancel,$('profile-remove'),save);$('profile-form').prepend(toolbar);cancel.onclick=finishEdit;
  $('profile-remove').onclick=()=>{
   const p=state.pokemon.find(p=>p.id===$('profile-select').value);if(!p)return;
   if(confirm(label(p)+'を登録解除しますか？')&&commit({...state,pokemon:state.pokemon.filter(x=>x.id!==p.id),team:state.team.map(id=>id===p.id?null:id),...(state.savedTeams?{savedTeams:state.savedTeams.map(t=>t?{...t,team:t.team?.map(id=>id===p.id?null:id)||null}:null)}:{})},'登録解除しました。'))finishEdit();
  };
  sync();registration();
 }
 return {init,show,edit,finishEdit,sync,registration,renderRoster,name,reorder,renderSavedTeams,saveCurrent,useTeam,saveTeam};
})();
