'use strict';
const IndividualImportUI=(()=>{
 let rows=[],snapshot='',scrollY=0,bodyStyle=null;
 const env=()=>({species:names,speciesName:C.speciesName,pokemon:state.pokemon,natures,subskills,skillCap:C.skillCap,skillFind:(value,species)=>SK.entries.find(s=>(species!=='ミュウ'||s.mew)&&[s.id,s.name,s.legacyName,...s.aliases||[]].some(x=>x.normalize('NFKC').replace(/\s/g,'')===value.normalize('NFKC').replace(/\s/g,''))),skillFields:SK.fields,profileValid:C.profileValid,uid});
 function textRow(root,title,value){const row=el('div',undefined,'import-detail');row.append(el('dt',title),el('dd',String(value)));root.append(row);}
 function details(p){
  const root=el('dl',undefined,'individual-import-details'),v=p.importedIndividual||{},f=v.fields||{};
  if('nickname'in p)textRow(root,'ニックネーム',p.nickname||'未設定');
  const profile=p.profile||v;
  for(const [k,title]of [['level','レベル'],['nature','せいかく'],['skillLevel','スキルレベル']])if(profile[k]!==undefined)textRow(root,title,profile[k]);
  if(p.mainSkill)textRow(root,'メインスキル',SK.name(p.mainSkillId||p.mainSkill));
  for(let i=0;i<3;i++)if(v.ingredients?.[i]||f['ingredients'+(i+1)])textRow(root,'食材'+(i+1),v.ingredients?.[i]||f['ingredients'+(i+1)]+'（未対応）');
  (profile.subskills||[]).forEach((s,i)=>{if(s)textRow(root,'Lv'+[10,25,50,70,80][i],s);});
  if(v.sleepHours!==undefined)textRow(root,'一緒に眠った時間',v.sleepHours.toLocaleString('ja-JP')+'時間');
  if(v.shiny!==undefined)textRow(root,'色違い',v.shiny?'はい':'いいえ');
  return root;
 }
 function editor(p){
  let root=$('individual-import-supplement');if(!root){root=el('details');root.id='individual-import-supplement';$('profile-species').after(root);}
  root.replaceChildren();root.hidden=!p.importedIndividual;if(root.hidden)return;
  root.append(el('summary','取り込んだ個体情報'),details(p));
  // All original recognized column values remain available, including unsupported values.
  const original=el('details');original.append(el('summary','ファイルにあった値'));
  const list=el('dl',undefined,'individual-import-details');
  const labels={species:'ポケモン',nickname:'ニックネーム',level:'レベル',nature:'せいかく',skillLevel:'スキルレベル',mainSkill:'メインスキル',sleepHours:'一緒に眠った時間',shiny:'色違い'};
  for(const [k,v]of Object.entries(p.importedIndividual.fields||{}))if(v)textRow(list,labels[k]||k.replace('ingredients','食材').replace(/^sub([0-4])$/,(_,i)=>'Lv'+[10,25,50,70,80][i]),v);
  original.append(list);root.append(original);
 }
 function current(){return JSON.stringify(state.pokemon);}
 function render(){
  const root=$('individual-import-list');root.replaceChildren();
  rows.forEach(row=>{
   const box=el('section',undefined,'individual-import-row');
   box.append(el('h3',row.line+'行目　'+(row.patch.nickname||row.species||row.info.fields.species)));
   if(row.species)box.append(el('p',C.speciesName(row.species),'muted'));
   box.append(details({species:row.species,...row.patch,importedIndividual:row.info}));
   for(const warning of row.warnings)box.append(el('p',warning,'import-warning'));
   for(const error of row.errors)box.append(el('p',error,'import-error'));
   if(row.candidates.length){box.append(el('p','同じ種類の登録があります。更新先の個体情報を確認してください。','import-warning'));
    row.candidates.forEach((id,i)=>{const p=state.pokemon.find(x=>x.id===id),d=el('details');d.append(el('summary','登録済み'+(i+1)+'：'+label(p)),details(p));box.append(d);});
   }
   const l=el('label','この個体の取り込み方'),s=el('select');s.setAttribute('aria-label',row.line+'行目の取り込み方');
   s.add(new Option('取り込まない','skip'));
   if(!row.errors.length){s.add(new Option('別個体として新しく追加','add'));row.candidates.forEach((id,i)=>{const p=state.pokemon.find(x=>x.id===id);s.add(new Option('更新：登録済み'+(i+1)+' '+label(p),id));});}
   s.value=row.action;s.onchange=()=>{row.action=s.value;updateCount();};l.append(s);box.append(l);root.append(box);
  });updateCount();
 }
 function updateCount(){const add=rows.filter(r=>r.action==='add').length,update=rows.filter(r=>!['skip','add'].includes(r.action)).length;$('individual-import-count').textContent=add+'匹を追加・'+update+'匹を更新';$('individual-import-save').disabled=add+update===0;}
 function close(){$('individual-import-dialog').close();}
 async function read(file){
  if(!file)return;
  try{
   if(file.size>5000000)throw Error('5MB以下のファイルを選んでください。');
   const text=new TextDecoder('utf-8',{fatal:true}).decode(await file.arrayBuffer());
   rows=IndividualImport.preview(text,env());snapshot=current();render();$('individual-import-error').textContent='';
   scrollY=window.scrollY;bodyStyle={position:document.body.style.position,top:document.body.style.top,width:document.body.style.width,overflow:document.body.style.overflow};Object.assign(document.body.style,{position:'fixed',top:-scrollY+'px',width:'100%',overflow:'hidden'});
   $('individual-import-dialog').showModal();$('individual-import-close').focus({preventScroll:true});
  }catch(e){notice('取り込めませんでした：'+e.message,true);}finally{$('individual-import-file').value='';}
 }
 function save(){
  if(current()!==snapshot){$('individual-import-error').textContent='登録情報が変更されました。ファイルを選び直して確認してください。';return;}
  try{
   const next=IndividualImport.apply(state,rows,env());
   if(!confirm($('individual-import-count').textContent+'します。既存の履歴と編成は変更しません。よろしいですか？'))return;
   if(commit(next,'個体データを取り込みました。')){close();TeamUI.show('roster');$('roster-search').value='';showOtherPokemon=true;renderTeam();}
   else $('individual-import-error').textContent='保存できませんでした。既存データは変更されていません。';
  }catch(e){$('individual-import-error').textContent=e.message;}
 }
 function init(){
  $('individual-import-open').onclick=()=>$('individual-import-file').click();
  $('individual-import-file').onchange=()=>read($('individual-import-file').files[0]);
  $('individual-import-close').onclick=close;$('individual-import-cancel').onclick=close;$('individual-import-save').onclick=save;
  $('individual-import-dialog').addEventListener('close',()=>{if(bodyStyle){Object.assign(document.body.style,bodyStyle);bodyStyle=null;window.scrollTo({top:scrollY});}$('individual-import-open').focus({preventScroll:true});});
 }
 return {init,editor};
})();
