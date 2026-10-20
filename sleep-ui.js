'use strict';
const SleepUI=(()=>{
 let date='',draft=null,number=1,loaded=false,mode='candy',query='',showOtherTypes=false,historyKind='all',historyDay='',researchSource=null,editor=null,returnY=0,oldOverflow='',editTrigger=null;
 const fields=['ワカクサ本島','シアンの砂浜','トープ洞窟','ウノハナ雪原','ラピスラズリ湖畔','ゴールド旧発電所','アンバー渓谷','ワカクサ本島EX','シアンの砂浜EX'];
 const sessions=()=>state.sleepSessions||[],draftKey=()=>date+':'+number;
 const rowFor=()=>SleepResearch.researchRows(state,date).find(r=>r.number===number);
 function loadDraft(){const d=SleepResearch.getDraft(state,date,number,uid());return {...d,candyMultiplier:number===1?SleepResearch.candyMultiplier(state,date):1};}
 const effectiveMultiplier=()=>number===1?SleepResearch.candyMultiplier(state,date):1;
 function keep(){if(!draft)return true;try{const drafts={...(state.sleepDrafts||{}),[draftKey()]:clone(draft)},next={...state,sleepDrafts:drafts};if(blocked)throw Error('保存を停止しています');SleepResearch.validateDrafts(drafts,candyMap);localStorage.setItem(KEY,JSON.stringify(next));state=next;return true;}catch(e){notice('入力途中の保存ができません：'+e.message,true);return false;}}
 function choose(n){if(!keep())return;number=n;researchSource=null;draft=loadDraft();loaded=true;render();}
 function switchMode(next){if(mode!=='history'&&next!=='history'&&!keep())return;mode=next;render();}
 function input(value,change,attrs={}){const l=el('label'),i=el('input');Object.assign(i,{type:'number',inputMode:'numeric',min:'0',max:'1000000000',step:'1',value,...attrs});i.oninput=()=>{change(i.value);keep();updateTotal();};l.append(i);return l;}
 function options(label,values,value,change){const s=el('select');s.setAttribute('aria-label',label);const placeholder=new Option(label,'');placeholder.disabled=true;placeholder.hidden=true;s.add(placeholder);for(const name of values)s.add(new Option(name,name));if(value&&!values.includes(value)){const legacy=new Option(value==='とくちょうなし'?'旧設定：すべて':value,value);legacy.hidden=true;legacy.disabled=true;s.add(legacy);}s.value=value;s.dataset.empty=String(!value);s.onchange=()=>{s.dataset.empty=String(!s.value);change(s.value);keep();};return s;}
 function updateTotal(){const total=$('sleep-candy-total');if(total)total.textContent=(mode==='candy'?draft.entries.reduce((n,e)=>n+(Number(e.amount)||0),0):(Number(draft.baseAmount)||0)+(draft.researchRank===70?(Number(draft.researchExp)||0):0)).toLocaleString('ja-JP')+'個';}
 function remove(id){if(!confirm('この睡眠リサーチのアメとゆめのかけらを削除しますか？'))return;const item=sessions().find(s=>s.id===id),drafts={...(state.sleepDrafts||{})};if(item)delete drafts[item.date+':'+item.number];const next={...state,sleepSessions:sessions().filter(s=>s.id!==id),sleepDrafts:drafts,...(item?.legacyResearchId?{shardRecords:state.shardRecords.filter(r=>r.id!==item.legacyResearchId)}:{})};if(commit(next,'睡眠リサーチを削除しました。')){draft=null;loaded=false;render();}}
 function edit(id){mode='candy';const item=sessions().find(s=>s.id===id);if(!item)return;if(!keep())return;date=item.date;number=item.number;draft=loadDraft();loaded=true;researchSource=null;if(SleepResearch.visible(state))showTab('sleep');else openEditor();render();}
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
 function reset(){date='';draft=null;loaded=false;number=1;researchSource=null;mode='candy';query='';showOtherTypes=false;historyKind='all';historyDay='';}
 function renderHistory(root){
  if(!historyDay)historyDay=date||C.gameDay(new Date());
  const input=el('input');Object.assign(input,{type:'date',value:historyDay,id:'sleep-history-date'});input.setAttribute('aria-label','睡眠履歴の基準日');input.onchange=()=>{if(C.dateOnly(input.value)){historyDay=input.value;render();}};
  const header=PeriodPicker.dayHeader(input,historyKind),choices=tabs([['day','日'],['week','週'],['month','月'],['all','全期間']],historyKind,key=>{historyKind=key;render();},'睡眠履歴の期間'),today=button('今日',()=>{historyDay=C.gameDay(new Date());render();});today.className='sleep-history-today';choices.append(today);header.append(choices);root.append(header,tabs([['candy','アメ'],['shards','ゆめのかけら'],['history','履歴']],mode,switchMode,'睡眠の記録項目'));renderSavedHistory(root);
 }
 function renderSavedHistory(root){
  const dates=[...new Set([...sessions().map(s=>s.date),...(state.shardRecords||[]).filter(r=>r.method==='research').map(r=>r.targetDate||C.gameDay(r.datetime))])].sort().reverse(),list=el('div',undefined,'sleep-history');
  const range=C.range(historyKind,historyDay);
  for(const day of dates.filter(day=>!range||day>=range[0]&&day<range[1]))for(const row of SleepResearch.researchRows(state,day)){
   const s=row.kind==='session'?row.record:row.sleepSession,shard=row.record,box=el('section',undefined,'sleep-history-entry'),head=el('div',undefined,'sleep-session-head');
   head.append(el('h3',C.displayDate(day)+' '+row.number+'回目'),button('開く',()=>{date=day;number=row.number;mode=s?.candyRecorded!==false&&s?'candy':'shards';draft=loadDraft();loaded=true;researchSource=null;render();}));box.append(head);
   const bonus=s?(s.candyMultiplier??1):null;box.append(el('p',[(s?.field||'フィールド未記録'),s?.sleepType==='とくちょうなし'?'すべて':(s?.sleepType||'睡眠タイプ未記録'),bonus===null?'倍率未記録':bonus===1?'－（1倍）':bonus+'倍'].join(' / '),'sleep-note'));
   const candySaved=s&&s.candyRecorded!==false;box.append(el('strong','アメ '+(candySaved?C.sum(s.entries).toLocaleString('ja-JP')+'個':'未入力')));
   if(candySaved&&s.entries.length){const entries=el('ul',undefined,'sleep-history-pokemon');for(const e of s.entries){const line=el('li');line.append(el('span',C.speciesName(e.species)),el('span','★'+e.stars),el('span',e.amount.toLocaleString('ja-JP')+'個'));entries.append(line);}box.append(entries);}
   box.append(el('p','ゆめのかけら '+(shard.shardsRecorded===false?'未入力':shard.amount.toLocaleString('ja-JP')+'個')+(shard.shardsRecorded!==false&&shard.researchExp!==undefined?' ／ EXP '+shard.researchExp.toLocaleString('ja-JP'):''),'sleep-note'));list.append(box);
  }
  if(!list.children.length)list.append(el('p','保存済みの睡眠リサーチはありません。','sleep-note'));root.append(list);
 }
 function render(){
  const root=$('sleep-root');if(!root||$('sleep')?.hidden===true&&!editor?.open)return;
  if(mode==='history'){root.replaceChildren();renderHistory(root);return;}
  if(!date)date=SleepResearch.initialDate(state,C.gameDay(new Date()));
  if($('sleep')?.hidden===false&&!Object.hasOwn(state.settings.sleepCandyMultipliers||{},date)){try{const next={...state,settings:{...state.settings,sleepCandyMultipliers:{...(state.settings.sleepCandyMultipliers||{}),[date]:SleepResearch.candyMultiplier(state,date)}}};if(!blocked){localStorage.setItem(KEY,JSON.stringify(next));state=next;}}catch(err){notice('倍率設定を保存できません：'+err.message,true);}}
  if(!loaded){number=1;draft=loadDraft();loaded=true;}
  syncResearch();if(!rowFor()||rowFor().kind==='session'&&rowFor().record.shardsRecorded===false)draft.researchRank=DreamClusters.validRank(state.settings.researchRank)?state.settings.researchRank:null;
  root.replaceChildren();const dateInput=el('input');Object.assign(dateInput,{type:'date',value:date});dateInput.setAttribute('aria-label','リサーチ日');dateInput.onchange=()=>{if(!SleepResearch.validDate(dateInput.value))return;if(!keep())return;date=dateInput.value;loaded=false;draft=null;researchSource=null;render();};
  const header=PeriodPicker.dayHeader(dateInput),actions=el('div',undefined,'sleep-sticky-actions'),total=el('div',undefined,'sleep-sticky-total'),value=el('strong');value.id='sleep-candy-total';total.append(el('span',mode==='candy'?'アメ合計':'ゆめのかけら'),value);
  const save=el('button','保存','sleep-save');save.type='submit';save.setAttribute('form',mode==='candy'?'sleep-form':'sleep-shard-form');save.setAttribute('aria-label',number+'回目の'+(mode==='candy'?'アメ':'ゆめのかけら')+'を保存');const rounds=tabs([[1,'1回目'],[2,'2回目']],number,choose,'睡眠の回数');rounds.classList.add('sleep-rounds');actions.append(total,rounds,save);header.append(actions);root.append(header);
  root.append(tabs([['candy','アメ'],['shards','ゆめのかけら'],['history','履歴']],mode,switchMode,'睡眠の記録項目'));
  const form=el('form');form.id='sleep-form';form.hidden=mode!=='candy';
  const selectedTitle=el('h3',undefined,'sleep-selected-title'),entries=el('div');selectedTitle.id='sleep-selected-title';entries.id='sleep-entries';entries.setAttribute('aria-labelledby','sleep-selected-title');form.append(selectedTitle,entries);
  function renderEntries(){
   selectedTitle.replaceChildren(el('span','リサーチ（'+draft.entries.length+'匹）'),el('small',[draft.field||'フィールド未選択',draft.sleepType==='とくちょうなし'?'すべて':draft.sleepType||'睡眠タイプ未選択',effectiveMultiplier()===1?'－':effectiveMultiplier()+'倍'].join(' / ')));entries.replaceChildren();if(!draft.entries.length)entries.append(el('p','まだ選択されていません。','sleep-note'));
   for(const e of draft.entries){const row=el('div',undefined,'sleep-entry'),name=el('strong',C.speciesName(e.species)),status=SleepResearch.rewardStatus(e.species,e.stars);name.title=C.speciesName(e.species)+'・'+e.candy+(status==='unknown'?'（報酬未確認）':'');
    const star=button('★'+e.stars,()=>{Object.assign(e,SleepResearch.changeStars(e,SleepResearch.nextStars(e.species,e.stars),effectiveMultiplier()));keep();renderEntries();updateTotal();});star.setAttribute('aria-label',e.species+'の寝顔★'+e.stars+'を切り替える');
    const amount=input(e.amount,v=>{e.amount=v;e.manualAmount=true;},{required:true,placeholder:status==='unknown'?'手入力':''});amount.className='sleep-entry-amount';const i=amount.querySelector('input');i.setAttribute('aria-label',e.species+'のアメ個数');i.title=e.candy+'の実獲得数（修正可）'+(status==='unknown'?'・報酬未確認':'');
    const remove=button('×',()=>{draft.entries=draft.entries.filter(x=>x.id!==e.id);keep();renderEntries();updateTotal();},'sleep-entry-remove');remove.setAttribute('aria-label',e.species+'を削除');row.append(name,star,amount,remove);entries.append(row);
   }
  }
  renderEntries();
  const settings=el('div',undefined,'sleep-fields'),search=el('label',undefined,'sleep-search'),q=el('input'),results=el('div',undefined,'sleep-candidates'),filterInfo=el('div',undefined,'sleep-filter-info');
  settings.append(options('フィールド',fields,draft.field,v=>{draft.field=v;renderCandidates();renderEntries();}),options('睡眠タイプ',['うとうと','すやすや','ぐっすり','特徴なし'],draft.sleepType,v=>{draft.sleepType=v;renderCandidates();renderEntries();}));const multiplier=el('select');multiplier.setAttribute('aria-label','アメ獲得量');for(const [value,title] of [[1,'－'],[1.5,'1.5倍'],[2,'2倍'],[3,'3倍']])multiplier.add(new Option(title,String(value)));multiplier.value=String(SleepResearch.candyMultiplier(state,date));multiplier.title='アメ獲得量（1回目のみ）';multiplier.onchange=()=>{if(!keep())return;try{const next=SleepResearch.setCandyMultiplier(state,date,Number(multiplier.value),candyMap);if(blocked)throw Error('保存を停止しています');localStorage.setItem(KEY,JSON.stringify(next));state=next;draft=loadDraft();render();}catch(err){notice(err.message,true);}};const multiplierLabel=el('label',undefined,'sleep-bonus');multiplierLabel.append(multiplier);settings.append(multiplierLabel);q.type='search';q.autocomplete='off';q.value=query;q.placeholder='ポケモン名を検索';q.setAttribute('aria-label','睡眠リサーチのポケモン名');search.append(q);results.setAttribute('aria-label','ポケモン一覧');
  function addEntry(species,stars){if(SleepResearch.rewardStatus(species,stars)==='absent')return;if(draft.entries.length>=100){notice('1回に追加できるのは100匹までです。',true);return;}const basic=SleepResearch.estimate(species,stars),amount=basic===null?null:Math.ceil(basic*effectiveMultiplier());draft.entries.push({id:uid(),species,candy:candyMap[species],stars,amount:amount??'',calculatedAmount:amount});keep();renderEntries();updateTotal();}
  function renderCandidates(){
   results.replaceChildren();filterInfo.replaceChildren();if(draft.sleepType==='特徴なし'&&!SleepEncounters.hasType('特徴なし',draft.field))filterInfo.append(el('small','「特徴なし」の出現分類データは未確認です。'));const text=normalize(q.value),pool=names.filter(n=>normalize(n).includes(text)).map(species=>({species,status:SleepEncounters.status(species,draft.field,showOtherTypes?'':draft.sleepType)}));
   if(draft.sleepType&&draft.sleepType!=='とくちょうなし'){const toggle=button('他の睡眠タイプを表示',()=>{showOtherTypes=!showOtherTypes;renderCandidates();});toggle.setAttribute('aria-pressed',String(showOtherTypes));filterInfo.append(toggle);}
   for(const {species,status:appearance} of pool){if(appearance==='different_type'||appearance==='unknown')continue;
    const row=el('div',undefined,'sleep-candidate'),label=el('strong',C.speciesName(species)),choices=el('div',undefined,'sleep-candidate-stars');row.dataset.appearance=appearance;row.append(label);
    for(const stars of [1,2,3,4]){const status=SleepResearch.rewardStatus(species,stars),b=button('★'+stars,()=>addEntry(species,stars));b.disabled=status==='absent';b.dataset.rewardStatus=status;b.setAttribute('aria-label',species+'の★'+stars+'を追加');b.title=status==='absent'?'資料に不存在の記載がある寝顔':status==='unknown'?'未確認の寝顔・個数は手入力':species+' ★'+stars+'・アメ'+Math.ceil(SleepResearch.estimate(species,stars)*effectiveMultiplier())+'個';choices.append(b);}row.append(choices);results.append(row);
   }
   if(!results.children.length)results.append(el('p','確認済みの候補はありません。条件を変更してください。','sleep-note'));
  }
  q.oninput=()=>{query=q.value;renderCandidates();};form.append(settings,search,filterInfo,results);renderCandidates();
  form.onsubmit=e=>{e.preventDefault();try{if(!keep())return;const next=SleepResearch.saveCandy(state,draft,candyMap,new Date().toISOString());if(commit(next,number+'回目のアメ'+draft.entries.reduce((n,e)=>n+Number(e.amount),0).toLocaleString('ja-JP')+'個を保存しました。')){draft=loadDraft();researchSource=null;render();}}catch(err){notice(err.message,true);}};
  const shardForm=el('form');shardForm.id='sleep-shard-form';shardForm.hidden=mode!=='shards';
  const shardFields=SleepShards.fields('sleep-shard',draft,(key,v)=>{draft[key]=v;keep();updateTotal();},true);shardForm.append(shardFields);if(!draft.researchRank)shardForm.append(el('p','設定でリサーチランクを設定してください。','rank-hint'));
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
