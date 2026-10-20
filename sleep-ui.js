'use strict';
const SleepUI=(()=>{
 let date='',draft=null,number=1,loaded=false,mode='candy',query='',showUnknown=false,researchSource=null,editor=null,returnY=0,oldOverflow='',editTrigger=null;
 const fields=['ワカクサ本島','シアンの砂浜','トープ洞窟','ウノハナ雪原','ラピスラズリ湖畔','ゴールド旧発電所','アンバー渓谷','ワカクサ本島EX','シアンの砂浜EX'];
 const sessions=()=>state.sleepSessions||[],draftKey=()=>date+':'+number;
 const rowFor=()=>SleepResearch.researchRows(state,date).find(r=>r.number===number);
 function loadDraft(){const d=SleepResearch.getDraft(state,date,number,uid());return {...d,candyMultiplier:number===1?SleepResearch.candyMultiplier(state,date):1};}
 const effectiveMultiplier=()=>number===1?SleepResearch.candyMultiplier(state,date):1;
 function keep(){if(!draft)return true;try{const drafts={...(state.sleepDrafts||{}),[draftKey()]:clone(draft)},next={...state,sleepDrafts:drafts};if(blocked)throw Error('保存を停止しています');SleepResearch.validateDrafts(drafts,candyMap);localStorage.setItem(KEY,JSON.stringify(next));state=next;return true;}catch(e){notice('入力途中の保存ができません：'+e.message,true);return false;}}
 function choose(n){if(!keep())return;number=n;researchSource=null;draft=loadDraft();loaded=true;render();}
 function switchMode(next){if(!keep())return;mode=next;render();}
 function input(value,change,attrs={}){const l=el('label'),i=el('input');Object.assign(i,{type:'number',inputMode:'numeric',min:'0',max:'1000000000',step:'1',value,...attrs});i.oninput=()=>{change(i.value);keep();updateTotal();};l.append(i);return l;}
 function options(label,values,value,change){const s=el('select');s.setAttribute('aria-label',label);s.add(new Option(label,''));for(const name of values)s.add(new Option(name,label==='睡眠タイプ'&&name==='すべて'?'とくちょうなし':name));s.value=value;s.onchange=()=>{change(s.value);keep();};return s;}
 function updateTotal(){const total=$('sleep-candy-total');if(total)total.textContent=(mode==='candy'?draft.entries.reduce((n,e)=>n+(Number(e.amount)||0),0):(Number(draft.baseAmount)||0)+(draft.researchRank===70?(Number(draft.researchExp)||0):0)).toLocaleString('ja-JP')+'個';}
 function remove(id){if(!confirm('この睡眠リサーチのアメとゆめのかけらを削除しますか？'))return;const item=sessions().find(s=>s.id===id),drafts={...(state.sleepDrafts||{})};if(item)delete drafts[item.date+':'+item.number];const next={...state,sleepSessions:sessions().filter(s=>s.id!==id),sleepDrafts:drafts,...(item?.legacyResearchId?{shardRecords:state.shardRecords.filter(r=>r.id!==item.legacyResearchId)}:{})};if(commit(next,'睡眠リサーチを削除しました。')){draft=null;loaded=false;render();}}
 function edit(id){const item=sessions().find(s=>s.id===id);if(!item)return;if(!keep())return;date=item.date;number=item.number;draft=loadDraft();loaded=true;researchSource=null;if(SleepResearch.visible(state))showTab('sleep');else openEditor();render();}
 function openEditor(){
  if(!editor){editor=el('dialog');editor.id='sleep-editor';editor.setAttribute('aria-labelledby','sleep-editor-title');const head=el('div',undefined,'sleep-editor-head'),title=el('h2','睡眠リサーチの訂正');title.id='sleep-editor-title';head.append(title,button('閉じる',closeEditor));editor.append(head);document.body.append(editor);editor.addEventListener('cancel',e=>{e.preventDefault();closeEditor();});}
  editTrigger=document.activeElement;returnY=window.scrollY;oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';editor.append($('sleep-root'));editor.showModal();
 }
 function closeEditor(){if(!keep())return;$('sleep').append($('sleep-root'));editor.close();document.body.style.overflow=oldOverflow;window.scrollTo({top:returnY});if(editTrigger?.isConnected)editTrigger.focus({preventScroll:true});}
 function syncResearch(){
  const row=rowFor(),saved=row?.record,cached=state.sleepDrafts?.[draftKey()],rank=row?.kind==='legacy'?saved.researchLevel:saved?.researchRank;
  const key=JSON.stringify([saved?[saved.id,saved.baseAmount,saved.researchExp,rank]:null,cached?[cached.id,cached.baseAmount,cached.researchExp,cached.researchRank]:null]);
  if(researchSource!==null&&key!==researchSource){const source=cached||saved;if(source)draft={...draft,id:cached?.id||(row?.kind==='session'?saved.id:row?.sleepSession?.id)||draft.id,baseAmount:source.baseAmount,researchExp:source.researchExp,researchRank:cached?cached.researchRank:rank};}
  researchSource=key;
 }
 function tabs(items,current,change,label){const root=el('div',undefined,'period-quick-buttons sleep-switch');root.setAttribute('role','tablist');root.setAttribute('aria-label',label);for(const [key,title] of items){const b=button(title,()=>change(key));b.setAttribute('role','tab');b.setAttribute('aria-selected',String(current===key));b.setAttribute('aria-pressed',String(current===key));root.append(b);}return root;}
 function reset(){date='';draft=null;loaded=false;number=1;researchSource=null;mode='candy';query='';showUnknown=false;}
 function render(){
  const root=$('sleep-root');if(!root)return;if(!date)date=C.addDays(C.gameDay(new Date()),-1);
  if($('sleep')?.hidden===false&&!Object.hasOwn(state.settings.sleepCandyMultipliers||{},date)){try{const next={...state,settings:{...state.settings,sleepCandyMultipliers:{...(state.settings.sleepCandyMultipliers||{}),[date]:SleepResearch.candyMultiplier(state,date)}}};if(!blocked){localStorage.setItem(KEY,JSON.stringify(next));state=next;}}catch(err){notice('倍率設定を保存できません：'+err.message,true);}}
  if(!loaded){number=1;draft=loadDraft();loaded=true;}
  syncResearch();if(!rowFor()||rowFor().kind==='session'&&rowFor().record.shardsRecorded===false)draft.researchRank=DreamClusters.validRank(state.settings.researchRank)?state.settings.researchRank:null;
  root.replaceChildren();const dateInput=el('input');Object.assign(dateInput,{type:'date',value:date});dateInput.setAttribute('aria-label','リサーチ日');dateInput.onchange=()=>{if(!SleepResearch.validDate(dateInput.value))return;if(!keep())return;date=dateInput.value;loaded=false;draft=null;researchSource=null;render();};
  const header=PeriodPicker.dayHeader(dateInput),actions=el('div',undefined,'sleep-sticky-actions'),total=el('div',undefined,'sleep-sticky-total'),value=el('strong');value.id='sleep-candy-total';total.append(el('span',mode==='candy'?'アメ合計':'ゆめのかけら'),value);
  const save=el('button','保存','sleep-save');save.type='submit';save.setAttribute('form',mode==='candy'?'sleep-form':'sleep-shard-form');save.setAttribute('aria-label',number+'回目の'+(mode==='candy'?'アメ':'ゆめのかけら')+'を保存');actions.append(total,save);header.append(actions);root.append(header);
  root.append(tabs([['candy','アメ'],['shards','ゆめのかけら']],mode,switchMode,'睡眠の記録項目'),tabs([[1,'1回目'],[2,'2回目']],number,choose,'睡眠の回数'));
  const form=el('form');form.id='sleep-form';form.hidden=mode!=='candy';
  const selectedTitle=el('h3',undefined,'sleep-selected-title'),entries=el('div');selectedTitle.id='sleep-selected-title';entries.id='sleep-entries';entries.setAttribute('aria-labelledby','sleep-selected-title');form.append(selectedTitle,entries);
  function renderEntries(){
   selectedTitle.textContent='選択済み（'+draft.entries.length+'匹）';entries.replaceChildren();if(!draft.entries.length)entries.append(el('p','まだ選択されていません。','sleep-note'));
   for(const e of draft.entries){const row=el('div',undefined,'sleep-entry'),name=el('strong',C.speciesName(e.species)),status=SleepResearch.rewardStatus(e.species,e.stars);name.title=C.speciesName(e.species)+'・'+e.candy+(status==='unknown'?'（報酬未確認）':'');
    const star=button('★'+e.stars,()=>{Object.assign(e,SleepResearch.changeStars(e,SleepResearch.nextStars(e.species,e.stars),effectiveMultiplier()));keep();renderEntries();updateTotal();});star.setAttribute('aria-label',e.species+'の寝顔★'+e.stars+'を切り替える');
    const amount=input(e.amount,v=>{e.amount=v;e.manualAmount=true;},{required:true,placeholder:status==='unknown'?'手入力':''});amount.className='sleep-entry-amount';const i=amount.querySelector('input');i.setAttribute('aria-label',e.species+'のアメ個数');i.title=e.candy+'の実獲得数（修正可）'+(status==='unknown'?'・報酬未確認':'');
    const remove=button('×',()=>{draft.entries=draft.entries.filter(x=>x.id!==e.id);keep();renderEntries();updateTotal();},'sleep-entry-remove');remove.setAttribute('aria-label',e.species+'を削除');row.append(name,star,amount,remove);entries.append(row);
   }
  }
  renderEntries();
  const settings=el('div',undefined,'sleep-fields'),search=el('label','ポケモン名を検索','sleep-search'),q=el('input'),results=el('div',undefined,'sleep-candidates'),filterInfo=el('div',undefined,'sleep-filter-info');
  settings.append(options('フィールド',fields,draft.field,v=>{draft.field=v;renderCandidates();}),options('睡眠タイプ',['うとうと','すやすや','ぐっすり','すべて'],draft.sleepType,v=>{draft.sleepType=v;renderCandidates();}));const multiplier=el('select');multiplier.setAttribute('aria-label','アメ獲得量');for(const [value,title] of [[1,'－'],[1.5,'1.5倍'],[2,'2倍'],[3,'3倍']])multiplier.add(new Option(title,String(value)));multiplier.value=String(SleepResearch.candyMultiplier(state,date));multiplier.title='アメ獲得量（1回目のみ）';multiplier.onchange=()=>{if(!keep())return;try{const next=SleepResearch.setCandyMultiplier(state,date,Number(multiplier.value),candyMap);if(blocked)throw Error('保存を停止しています');localStorage.setItem(KEY,JSON.stringify(next));state=next;draft=loadDraft();render();}catch(err){notice(err.message,true);}};const multiplierLabel=el('label','アメ獲得量','sleep-bonus');multiplierLabel.append(multiplier);settings.append(multiplierLabel);q.type='search';q.autocomplete='off';q.value=query;q.placeholder='例：ぴか・いーぶい';q.setAttribute('aria-label','睡眠リサーチのポケモン名');search.append(q);results.setAttribute('aria-label','ポケモン一覧');
  function addEntry(species,stars){if(SleepResearch.rewardStatus(species,stars)==='absent')return;if(draft.entries.length>=100){notice('1回に追加できるのは100匹までです。',true);return;}const basic=SleepResearch.estimate(species,stars),amount=basic===null?null:Math.ceil(basic*effectiveMultiplier());draft.entries.push({id:uid(),species,candy:candyMap[species],stars,amount:amount??'',calculatedAmount:amount});keep();renderEntries();updateTotal();}
  function renderCandidates(){
   results.replaceChildren();filterInfo.replaceChildren();const text=normalize(q.value),pool=names.filter(n=>normalize(n).includes(text)).map(species=>({species,status:SleepEncounters.status(species,draft.field,draft.sleepType)})),unknown=pool.filter(r=>r.status==='unknown');
   if(draft.field||(draft.sleepType&&draft.sleepType!=='とくちょうなし')){const confirmed=pool.filter(r=>r.status==='confirmed');filterInfo.append(el('small','出現確認済み '+confirmed.length+'種類'));if(unknown.length){const toggle=button((showUnknown?'未確認候補を閉じる':'未確認候補も表示')+'（'+unknown.length+'）',()=>{showUnknown=!showUnknown;renderCandidates();});toggle.setAttribute('aria-expanded',String(showUnknown));filterInfo.append(toggle);}}
   for(const {species,status:appearance} of pool){if(appearance==='different_type'||appearance==='unknown'&&!showUnknown)continue;
    const row=el('div',undefined,'sleep-candidate'),label=el('strong',C.speciesName(species)),choices=el('div',undefined,'sleep-candidate-stars');row.dataset.appearance=appearance;if(appearance==='unknown')label.append(el('small','出現未確認'));row.append(label);
    for(const stars of [1,2,3,4]){const status=SleepResearch.rewardStatus(species,stars),b=button('★'+stars,()=>addEntry(species,stars));b.disabled=status==='absent';b.dataset.rewardStatus=status;b.setAttribute('aria-label',species+'の★'+stars+'を追加');b.title=status==='absent'?'資料に不存在の記載がある寝顔':status==='unknown'?'未確認の寝顔・個数は手入力':species+' ★'+stars+'・アメ'+Math.ceil(SleepResearch.estimate(species,stars)*effectiveMultiplier())+'個';choices.append(b);}row.append(choices);results.append(row);
   }
   if(!results.children.length)results.append(el('p',unknown.length?'確認済みの候補はありません。未確認候補の表示か、条件を解除してください。':'該当するポケモンはありません。','sleep-note'));
  }
  q.oninput=()=>{query=q.value;renderCandidates();};form.append(settings,search,filterInfo,results);renderCandidates();
  form.onsubmit=e=>{e.preventDefault();try{if(!keep())return;const next=SleepResearch.saveCandy(state,draft,candyMap,new Date().toISOString());if(commit(next,number+'回目のアメ'+draft.entries.reduce((n,e)=>n+Number(e.amount),0).toLocaleString('ja-JP')+'個を保存しました。')){draft=loadDraft();researchSource=null;render();}}catch(err){notice(err.message,true);}};
  const shardForm=el('form');shardForm.id='sleep-shard-form';shardForm.hidden=mode!=='shards';
  const shardFields=SleepShards.fields('sleep-shard',draft,(key,v)=>{draft[key]=v;keep();updateTotal();}),rankHint=el('p',draft.researchRank?'記録時のランク '+draft.researchRank+(draft.researchRank===70?'・EXPをゆめのかけらに加算します。':''):'設定でリサーチランクを設定してください。','rank-hint');shardForm.append(shardFields,rankHint);
  shardForm.onsubmit=e=>{e.preventDefault();try{if(!keep())return;const values={baseAmount:whole(draft.baseAmount),researchExp:whole(draft.researchExp)},row=rowFor(),next=SleepResearch.updateResearch(state,date,row?.key||'new:'+number,values,candyMap,draft.id,new Date().toISOString());if(commit(next,number+'回目のゆめのかけらを保存しました。')){draft=loadDraft();researchSource=null;render();}}catch(err){notice(err.message,true);}};
  root.append(form,shardForm);const savedRows=SleepResearch.researchRows(state,date);
  if(savedRows.length){const list=el('details',undefined,'sleep-sessions');list.append(el('summary','保存済みの記録'));for(const row of savedRows){const session=row.kind==='session'?row.record:row.sleepSession,box=el('div',undefined,'sleep-session'),head=el('div',undefined,'sleep-session-head');head.append(el('strong',row.number+'回目'),button('編集',()=>choose(row.number)),button('削除',()=>{if(session)remove(session.id);else if(confirm('この睡眠リサーチを削除しますか？'))commit({...state,shardRecords:state.shardRecords.filter(x=>x.id!==row.record.id)},'削除しました。');},'danger'));box.append(head,el('p','アメ '+(session?.candyRecorded!==false&&session?C.sum(session.entries).toLocaleString('ja-JP')+'個':'未入力')+' ／ ゆめのかけら '+(row.record.shardsRecorded===false?'未入力':row.record.amount.toLocaleString('ja-JP')+'個')));list.append(box);}root.append(list);}
  updateTotal();
 }
 function whole(raw){if(raw===''||!Number.isSafeInteger(Number(raw))||Number(raw)<0||Number(raw)>1000000000)throw Error('個数は0以上の整数で入力してください。');return Number(raw);}
 function appendHistory(root,period){for(const saved of sessions()){
  const legacy=saved.legacyResearchId&&(state.shardRecords||[]).find(r=>r.id===saved.legacyResearchId),s=legacy?{...saved,baseAmount:legacy.baseAmount,researchExp:legacy.researchExp,researchRank:legacy.researchLevel,amount:legacy.amount,shardsRecorded:true}:saved,shardsOnly=s.candyRecorded===false;
  const r={id:'sleep:'+s.id,recordedAt:s.recordedAt,datetime:SleepResearch.datetime(s),amount:shardsOnly?s.amount:C.sum(s.entries),method:'research',sleepSession:s},card=el('div',undefined,'card research'+(shardsOnly?' shards':'')),actions=el('div',undefined,'history-actions');if(!C.inRange(r,period))continue;card.dataset.datetime=r.datetime;actions.append(button('訂正',()=>edit(s.id)),button('削除',()=>remove(s.id),'danger'));
  historyCard(card,r,'睡眠リサーチ',shardsOnly?'ゆめのかけら':'アメ',s.number+'回目'+(!shardsOnly&&s.shardsRecorded!==false?' · ゆめのかけら '+s.amount.toLocaleString('ja-JP')+'個':''),actions);card.querySelector('.history-time').textContent=($('history-period').value==='day'?'':s.date.slice(5).replace('-','/')+' · ')+s.number+'回目';finishHistoryCard(card);root.append(card);
 }}
 return {render,edit,appendHistory,reset};
})();
