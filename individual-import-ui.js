'use strict';
const IndividualImportUI=(()=>{
 let rows=[],snapshot='',scrollY=0,bodyStyle=null,tab='new';
 const categories={new:'新規',change:'変更',duplicate:'重複',exclude:'除外'};
 const env=()=>({species:names,speciesName:C.speciesName,pokemon:state.pokemon,natures,subskills,skillCap:C.skillCap,skillFind:(value,species)=>SK.entries.find(s=>(species!=='ミュウ'||s.mew)&&[s.id,s.name,s.legacyName,...s.aliases||[]].some(x=>x.normalize('NFKC').replace(/\s/g,'')===value.normalize('NFKC').replace(/\s/g,''))),skillFields:SK.fields,profileValid:C.profileValid,uid});
 function textRow(root,title,value){const row=el('div',undefined,'import-detail');row.append(el('dt',title),el('dd',String(value)));root.append(row);}
 function details(p){
  const root=el('dl',undefined,'individual-import-details'),v=p.importedIndividual||{},f=v.fields||{};
  if('nickname'in p)textRow(root,'ニックネーム',p.nickname||'未設定');
  const profile=p.profile||v;
  for(const [k,title]of [['level','レベル'],['nature','せいかく'],['skillLevel','スキルレベル']])if(profile[k]!==undefined)textRow(root,title,profile[k]);
  if(p.mainSkill)textRow(root,'メインスキル',SK.name(p.mainSkillId||p.mainSkill));
  (profile.subskills||[]).forEach((s,i)=>{if(s)textRow(root,'Lv'+[10,25,50,70,80][i],s);});
  if(v.shiny!==undefined)textRow(root,'色違い',v.shiny?'はい':'いいえ');
  return root;
 }
 function editor(){const root=$('individual-import-supplement');if(root)root.hidden=true;}

 function current(){return JSON.stringify(state.pokemon);}
 function initialCategory(row){
  if(row.errors.length)return 'exclude';if(row.action==='add')return 'new';
  const linked=row.candidates.map(id=>state.pokemon.find(p=>p.id===id)).filter(Boolean);
  const same=linked.find(p=>row.info.custom?p.importedIndividual?.custom?.serialized===row.info.custom.serialized:JSON.stringify(p.importedIndividual?.fields)===JSON.stringify(row.info.fields));
  if(same)return same.nickname===(row.patch.nickname||'')?'duplicate':'change';
  return linked.length===1&&row.patch.nickname&&linked[0].nickname===row.patch.nickname?'change':'duplicate';
 }
 function plan(row){row.action=!row.errors.length&&row.category==='new'?'add':!row.errors.length&&row.category==='change'&&row.confirmed&&row.target?row.target:'skip';}
 function counts(){return {add:rows.filter(r=>r.action==='add').length,update:rows.filter(r=>r.action!=='skip'&&r.action!=='add').length,exclude:rows.filter(r=>r.category==='exclude').length,hold:rows.filter(r=>r.category!=='exclude'&&r.action==='skip').length};}
 function render(){
  const root=$('individual-import-list');root.replaceChildren();const tabs=$('individual-import-tabs');tabs.replaceChildren();
  for(const [key,name] of Object.entries(categories)){const b=button(name+' ('+rows.filter(r=>r.category===key).length+')',()=>{tab=key;render();});b.setAttribute('role','tab');b.setAttribute('aria-selected',String(tab===key));b.setAttribute('aria-controls','individual-import-list');tabs.append(b);}
  for(const row of rows.filter(r=>r.category===tab)){
   const box=el('details',undefined,'individual-import-row');box.open=row.open===true;box.ontoggle=()=>{row.open=box.open;};
   const title=el('summary',row.line+'行目　'+(row.patch.nickname||row.species||row.info.fields.species||'読み取り不可'));box.append(title);
   if(row.species)box.append(el('p',C.speciesName(row.species),'muted'));
   box.append(details({species:row.species,...row.patch,importedIndividual:row.info}));
   for(const warning of row.warnings)box.append(el('p',warning,'import-warning'));
   for(const error of row.errors)box.append(el('p',error,'import-error'));
   if(row.candidates.length){const comparison=el('details');comparison.append(el('summary','登録済みの個体と比較'));row.candidates.forEach((id,i)=>{const p=state.pokemon.find(x=>x.id===id),d=el('details');d.append(el('summary','登録済み'+(i+1)+'：'+label(p)),details(p));comparison.append(d);});box.append(comparison);}
   const l=el('label','取り込み分類'),s=el('select');s.setAttribute('aria-label',row.line+'行目の取り込み分類');
   for(const [key,name] of Object.entries(categories)){const option=new Option(name,key);option.disabled=!!row.errors.length&&key!=='exclude';s.add(option);}s.value=row.category;s.onchange=()=>{row.category=s.value;row.confirmed=false;row.open=true;plan(row);tab=row.category;render();};l.append(s);box.append(l);
   if(row.category==='change'){
    const target=el('select');target.setAttribute('aria-label',row.line+'行目の更新先');target.add(new Option('更新先の個体を選択',''));row.candidates.forEach((id,i)=>{const p=state.pokemon.find(x=>x.id===id),level=p.profile?.level??p.importedIndividual?.level;target.add(new Option('登録済み'+(i+1)+'：'+label(p)+(level?' Lv.'+level:''),id));});target.value=row.target||'';
    target.onchange=()=>{row.target=target.value;row.confirmed=false;plan(row);render();};box.append(target);
    const confirmLabel=el('label','更新内容を確認しました','check'),check=el('input');check.type='checkbox';check.checked=!!row.confirmed;check.disabled=!row.target;check.setAttribute('aria-label',row.line+'行目の更新内容を確認');check.onchange=()=>{row.confirmed=check.checked;plan(row);updateCount();};confirmLabel.prepend(check);box.append(confirmLabel);
   }
   root.append(box);
  }
  if(!root.children.length)root.append(el('p','該当する個体はありません。','muted'));updateCount();
 }
 function updateCount(){const c=counts();$('individual-import-count').textContent=rows.length+'件／新規'+c.add+'匹・更新'+c.update+'匹・除外'+c.exclude+'件・保留'+c.hold+'件';$('individual-import-save').disabled=c.add+c.update===0;}
 function close(){$('individual-import-dialog').close();}
 async function read(file){
  if(!file)return;
  try{
   if(file.size>5000000)throw Error('5MB以下のファイルを選んでください。');
   const text=new TextDecoder('utf-8',{fatal:true}).decode(await file.arrayBuffer());
   showText(text);
  }catch(e){notice('取り込めませんでした：'+e.message,true);}finally{$('individual-import-file').value='';}
 }
 function showText(text){
   rows=IndividualImport.preview(text,env());for(const row of rows){row.category=initialCategory(row);row.confirmed=false;plan(row);}tab='new';snapshot=current();render();$('individual-import-error').textContent='';
   scrollY=window.scrollY;bodyStyle={position:document.body.style.position,top:document.body.style.top,width:document.body.style.width,overflow:document.body.style.overflow};Object.assign(document.body.style,{position:'fixed',top:-scrollY+'px',width:'100%',overflow:'hidden'});
   $('individual-import-dialog').showModal();$('individual-import-close').focus({preventScroll:true});
 }
 function save(){
  if(current()!==snapshot){$('individual-import-error').textContent='登録情報が変更されました。ファイルを選び直して確認してください。';return;}
  try{
   const next=IndividualImport.apply(state,rows,env());
   if(!confirm($('individual-import-count').textContent+'します。既存の履歴と編成は変更しません。よろしいですか？'))return;
   const c=counts(),result='新規'+c.add+'匹・更新'+c.update+'匹・除外'+c.exclude+'件・保留'+c.hold+'件';
   if(commit(next,'個体データを取り込み：'+result)){let output=$('individual-import-result');if(!output){output=el('p');output.id='individual-import-result';output.setAttribute('role','status');$('individual-import-open').before(output);}output.textContent='取り込み結果：'+result;close();TeamUI.show('roster');$('roster-search').value='';showOtherPokemon=true;renderTeam();}
   else $('individual-import-error').textContent='保存できませんでした。既存データは変更されていません。';
  }catch(e){$('individual-import-error').textContent=e.message;}
 }
 function init(){
  const tabs=el('div');tabs.id='individual-import-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','取り込み分類');$('individual-import-dialog').querySelector('header').after(tabs);
  $('individual-import-paste').onclick=()=>{try{showText($('individual-import-text').value);}catch(e){notice('取り込めませんでした：'+e.message,true);}};
  $('individual-import-open').onclick=()=>$('individual-import-file').click();
  $('individual-import-file').onchange=()=>read($('individual-import-file').files[0]);
  $('individual-import-close').onclick=close;$('individual-import-cancel').onclick=close;$('individual-import-save').onclick=save;
  $('individual-import-dialog').addEventListener('close',()=>{if(bodyStyle){Object.assign(document.body.style,bodyStyle);bodyStyle=null;window.scrollTo({top:scrollY});}$('individual-import-open').focus({preventScroll:true});});
 }
 return {init,editor};
})();
