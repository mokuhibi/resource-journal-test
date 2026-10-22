'use strict';
const SleepUI=(()=>{
 let date='',draft=null,number=1,loaded=false,mode='candy',query='',showOtherTypes=false,historyKind='all',historyDay='',researchSource=null,inputMode='candy',recordView=false,napView=false,historyView=false,navigationReady=false,pickupOnly=false,calendarMonth='',calendarOpen=true,searchViewportCleanup=null;
 const fields=['ワカクサ本島','シアンの砂浜','トープ洞窟','ウノハナ雪原','ラピスラズリ湖畔','ゴールド旧発電所','アンバー渓谷','ワカクサ本島EX','シアンの砂浜EX'];
 const sessions=()=>state.sleepSessions||[],draftKey=()=>date+':'+number;
 const rowFor=()=>SleepResearch.researchRows(state,date).find(r=>r.number===number);
 function loadDraft(){const d=SleepResearch.getDraft(state,date,number,uid());return {...d,...(!rowFor()&&(d.researchExp==='0'||d.researchExp===0)?{researchExp:''}:{}),candyMultiplier:number===1?SleepResearch.candyMultiplier(state,date):1};}
 const effectiveMultiplier=()=>number===1?SleepResearch.candyMultiplier(state,date):1;
 function keep(){if(!draft)return true;try{const drafts={...(state.sleepDrafts||{}),[draftKey()]:clone(draft)},next={...state,sleepDrafts:drafts};if(blocked)throw Error('保存を停止しています');SleepResearch.validateDrafts(drafts,candyMap);localStorage.setItem(KEY,JSON.stringify(next));state=next;return true;}catch(e){notice('入力途中の保存ができません：'+e.message,true);return false;}}
 function choose(n){if(!keep())return;number=n;researchSource=null;draft=loadDraft();loaded=true;render();}
 function switchMode(next){if(mode!=='history'&&next!=='history'&&!keep())return;mode=inputMode=next;render();}
 function input(value,change,attrs={}){const l=el('label'),i=el('input');Object.assign(i,{type:'number',inputMode:'numeric',min:'0',max:'1000000000',step:'1',value,...attrs});i.oninput=()=>{change(i.value);keep();updateTotal();};l.append(i);return l;}
 function options(label,values,value,change){const s=el('select');s.setAttribute('aria-label',label);const placeholder=new Option(label,'');placeholder.disabled=true;placeholder.hidden=true;s.add(placeholder);for(const name of values)s.add(new Option(name,name));if(value&&!values.includes(value)){const legacy=new Option(value==='とくちょうなし'?'旧設定：すべて':value,value);legacy.hidden=true;legacy.disabled=true;s.add(legacy);}s.value=value;s.dataset.empty=String(!value);s.onchange=()=>{s.dataset.empty=String(!s.value);change(s.value);keep();updateTotal();};return s;}
 function pokemonName(species){
  const root=el('strong',undefined,'sleep-pokemon-name'),name=C.speciesName(species),match=name.match(/^(.*?)([（(])(.*?)([）)])$/);root.dataset.species=name;
  const dex=typeof nationalDex!=='undefined'?nationalDex[species]:null;if(Number.isInteger(dex)&&dex>0)root.append(el('small',String(dex).padStart(4,'0'),'sleep-dex'));
  root.append(el('span',match?match[1]:name));if(match)root.append(el('small',match[2]+match[3]+match[4],'sleep-form-name'));return root;
 }
 function updateTotal(){const total=$('sleep-candy-total');if($('sleep-entry-count'))quantityText($('sleep-entry-count'),draft.entries.length+'匹');if(total)quantityText(total,(mode==='candy'?draft.entries.reduce((n,e)=>n+(Number(e.amount)||0),0):(Number(draft.baseAmount)||0)+(draft.researchRank===70?(Number(draft.researchExp)||0):0)).toLocaleString('ja-JP')+'個');updateSaveStatus();}
 function saveStatus(){
  const row=rowFor(),r=row?.record,saved=row?.kind==='session'?r:row?.sleepSession;
  const num=v=>v===''||v===null||v===undefined?'':Number(v);
  let exists=false,equal=false;
  if(mode==='candy'){
   exists=Boolean(saved&&saved.candyRecorded!==false);
   const view=(s,bonus)=>[s.field||'',s.sleepType||'',bonus,(s.entries||[]).map(e=>[e.id,e.species,e.stars,num(e.amount)])];
   equal=exists&&JSON.stringify(view(draft,effectiveMultiplier()))===JSON.stringify(view(saved,saved.candyMultiplier??1));
  }else if(mode==='shards'){
   exists=Boolean(row&&(row.kind==='legacy'||r.shardsRecorded!==false));
   equal=exists&&num(draft.baseAmount)===num(r.baseAmount)&&num(draft.researchExp)===num(r.researchExp)&&draft.researchRank===(row.kind==='legacy'?r.researchLevel:r.researchRank);
  }
  return {saved:exists,label:!exists?'記録':equal?'記録済':'保存'};
 }
 function updateSaveStatus(){
  if(!draft||!['candy','shards'].includes(mode))return;const value=saveStatus(),save=$('sleep-save');if(save){save.textContent=value.label;save.setAttribute('aria-label',number+'回目の'+(mode==='candy'?'アメ':'ゆめのかけら')+'を'+value.label);}
  const total=$('sleep-candy-total');if(total){total.dataset.saved=String(value.saved);if($('sleep-entry-count'))$('sleep-entry-count').dataset.saved=String(value.saved);}
 }
 function pickupsChanged(){if(mode==='pickup'||pickupOnly)render();}
 function remove(id){if(!confirm('この睡眠リサーチのアメとゆめのかけらを削除しますか？'))return;const item=sessions().find(s=>s.id===id),drafts={...(state.sleepDrafts||{})};if(item)delete drafts[item.date+':'+item.number];const next={...state,sleepSessions:sessions().filter(s=>s.id!==id),sleepDrafts:drafts,...(item?.legacyResearchId?{shardRecords:state.shardRecords.filter(r=>r.id!==item.legacyResearchId)}:{})};if(commit(next,'睡眠リサーチを削除しました。')){draft=null;loaded=false;render();}}
 // Move the existing screen as a sibling: its IDs, sticky header and form handlers stay intact.
 function initNavigation(){
  for(const [hostId,title] of [['record','記録'],['history','履歴']]){
   const host=$(hostId),content=el('div');content.id=hostId+'-main-view';
   for(const child of [...host.children])if(!child.classList.contains('editorial-page-title'))content.append(child);
   const choices=tabs([['main',title],['sleep','睡眠リサーチ'],...(hostId==='record'?[['nap','おひるね島']]:[])],'main',key=>{if(hostId==='record'&&key==='nap'){napView=true;recordView=false;showTab('record');}else selectView(hostId,key==='sleep');},title+'の表示');choices.id=hostId+'-view-switch';host.append(choices,content);if(hostId==='record'){const pane=el('div');pane.id='record-nap-view';pane.hidden=true;const section=$('nap-island-section');if(section)pane.append(section);host.append(pane);}
  }
  $('sleep').querySelector('.editorial-page-title').hidden=true;navigationReady=true;syncNavigation();
 }
 function syncNavigation(){
  if(!navigationReady)return;
  if(napView&&state.settings.showNapIsland!==true)napView=false;const enabled=SleepResearch.visible(state);if(!enabled&&activeTab!=='record')recordView=false;
  for(const [hostId,on] of [['record',recordView],['history',historyView]]){
   $(hostId+'-main-view').hidden=on||(hostId==='record'&&napView);const buttons=$(hostId+'-view-switch').children;
   for(const b of buttons){const selected=b===buttons[hostId==='record'&&napView?2:on?1:0];b.setAttribute('aria-selected',String(selected));b.setAttribute('aria-pressed',String(selected));}
   // The existing preference hides the input entry only; saved history stays reachable.
   if(hostId==='record'){buttons[1].hidden=!enabled&&!recordView;buttons[2].hidden=state.settings.showNapIsland!==true;const pane=$('record-nap-view');pane.hidden=!napView;const dateCard=$(hostId).querySelector('.record-date-card');if(dateCard){const target=napView?pane:$(hostId+'-main-view');if(dateCard.parentElement!==target)target.prepend(dateCard);}}
  }
  const host=activeTab==='history'&&historyView?'history':activeTab==='record'&&recordView?'record':null;
  $('sleep').hidden=!host;if(host&&$(host).nextElementSibling!==$('sleep'))$(host).after($('sleep'));
 }
 function navigate(tab){
  if(mode!=='history')inputMode=mode;
  mode=tab==='history'&&historyView?'history':inputMode;syncNavigation();render();
 }
 function selectView(host,sleep){if(host==='record'){recordView=sleep;napView=false;}else historyView=sleep;showTab(host);}
 function openResearch(day,round,nextMode){
  if(mode!=='history'&&!keep())return;date=day;number=round;mode=inputMode=nextMode;draft=loadDraft();loaded=true;researchSource=null;recordView=true;napView=false;showTab('record');
 }
 function edit(id){const item=sessions().find(s=>s.id===id);if(item)openResearch(item.date,item.number,'candy');}
 function syncResearch(){
  const row=rowFor(),saved=row?.record,cached=state.sleepDrafts?.[draftKey()],rank=row?.kind==='legacy'?saved.researchLevel:saved?.researchRank;
  const key=JSON.stringify([saved?[saved.id,saved.baseAmount,saved.researchExp,rank]:null,cached?[cached.id,cached.baseAmount,cached.researchExp,cached.researchRank]:null]);
  if(researchSource!==null&&key!==researchSource){const source=cached||saved;if(source)draft={...draft,id:cached?.id||(row?.kind==='session'?saved.id:row?.sleepSession?.id)||draft.id,baseAmount:source.baseAmount,researchExp:source.researchExp,researchRank:cached?cached.researchRank:rank};}
  researchSource=key;
 }
 function tabs(items,current,change,label){const root=el('div',undefined,'period-quick-buttons sleep-switch');root.setAttribute('role','tablist');root.setAttribute('aria-label',label);for(const [key,title] of items){const b=button(title,()=>change(key));b.setAttribute('role','tab');b.setAttribute('aria-selected',String(current===key));b.setAttribute('aria-pressed',String(current===key));root.append(b);}return root;}
 function home(host){if(recordView&&mode!=='history'&&!keep())return false;if(host==='record')mode=inputMode='candy';selectView(host,false);return true;}
 function reset(){date='';draft=null;loaded=false;number=1;researchSource=null;mode=inputMode='candy';recordView=napView=historyView=false;query='';showOtherTypes=false;historyKind='all';historyDay='';pickupOnly=false;calendarMonth='';calendarOpen=true;}
 function renderHistory(root){
  if(!historyDay)historyDay=date||C.gameDay(new Date());
  const input=el('input');Object.assign(input,{type:'date',value:historyDay,id:'sleep-history-date'});input.setAttribute('aria-label','睡眠履歴の基準日');input.onchange=()=>{if(C.dateOnly(input.value)){historyDay=input.value;calendarMonth=historyDay.slice(0,7);render();}};
  const header=PeriodPicker.dayHeader(input,historyKind),choices=tabs([['day','日'],['week','週'],['month','月'],['all','全期間']],historyKind,key=>{historyKind=key;render();},'睡眠履歴の期間'),today=button('今日',()=>{historyDay=C.gameDay(new Date());calendarMonth=historyDay.slice(0,7);render();});today.className='sleep-history-today';choices.classList.add('sleep-history-periods');choices.append(today);header.append(choices);root.append(header);renderCalendar(root);renderSavedHistory(root);
 }
 function renderCalendar(root){
  if(!calendarMonth)calendarMonth=historyDay.slice(0,7);
  const details=el('details',undefined,'sleep-history-calendar'),summary=el('summary','カレンダー'),bar=el('div',undefined,'sleep-calendar-head'),grid=el('div',undefined,'sleep-calendar-grid');details.open=calendarOpen;details.ontoggle=()=>{calendarOpen=details.open;};
  const move=n=>{calendarMonth=PeriodPicker.shift(calendarMonth+'-01','month',n).slice(0,7);render();};
  const prev=button('＜',()=>move(-1)),next=button('＞',()=>move(1));prev.setAttribute('aria-label','カレンダーの前月');next.setAttribute('aria-label','カレンダーの翌月');bar.append(prev,el('strong',calendarMonth.replace('-','年')+'月'),next);
  const days=new Set([...sessions().map(s=>s.date),...(state.shardRecords||[]).filter(r=>r.method==='research').map(r=>r.targetDate||C.gameDay(r.datetime))]);
  for(const text of ['月','火','水','木','金','土','日'])grid.append(el('small',text));const first=calendarMonth+'-01',offset=(new Date(first).getUTCDay()+6)%7,last=new Date(Date.UTC(Number(first.slice(0,4)),Number(first.slice(5,7)),0)).getUTCDate();
  for(let i=0;i<offset;i++)grid.append(el('span'));
  for(let d=1;d<=last;d++){const day=calendarMonth+'-'+String(d).padStart(2,'0'),b=button(String(d),()=>{historyDay=day;historyKind='day';render();});b.setAttribute('aria-label',C.displayDate(day)+(days.has(day)?'・記録あり':''));b.setAttribute('aria-pressed',String(historyKind==='day'&&historyDay===day));if(days.has(day))b.append(el('span','●','sleep-calendar-dot'));grid.append(b);}
  details.append(summary,bar,grid);root.append(details);
 }
 function renderSavedHistory(root){
  const dates=[...new Set([...sessions().map(s=>s.date),...(state.shardRecords||[]).filter(r=>r.method==='research').map(r=>r.targetDate||C.gameDay(r.datetime))])].sort().reverse(),list=el('div',undefined,'sleep-history');
  const range=C.range(historyKind,historyDay);
  for(const day of dates.filter(day=>!range||day>=range[0]&&day<range[1]))for(const row of SleepResearch.researchRows(state,day)){
   const s=row.kind==='session'?row.record:row.sleepSession,shard=row.record,box=el('section',undefined,'sleep-history-entry'),head=el('div',undefined,'sleep-session-head');
   head.append(el('h3',C.displayDate(day)+' '+row.number+'回目'),button('開く',()=>openResearch(day,row.number,s?.candyRecorded!==false&&s?'candy':'shards')));box.append(head);
   const bonus=s?(s.candyMultiplier??1):null;box.append(el('p',[(s?.field||'フィールド未記録'),s?.sleepType==='とくちょうなし'?'すべて':(s?.sleepType||'睡眠タイプ未記録'),bonus===null?'倍率未記録':bonus===1?'－（1倍）':bonus+'倍'].join(' / '),'sleep-note'));
   const candySaved=s&&s.candyRecorded!==false;box.append(qel('strong','アメ '+(candySaved?C.sum(s.entries).toLocaleString('ja-JP')+'個':'未入力')));
   if(candySaved&&s.entries.length){const entries=el('ul',undefined,'sleep-history-pokemon');for(const e of s.entries){const line=el('li');line.append(el('span',C.speciesName(e.species)),el('span','★'+e.stars),qel('span',e.amount.toLocaleString('ja-JP')+'個'));entries.append(line);}box.append(entries);}
   box.append(qel('p','ゆめのかけら '+(shard.shardsRecorded===false?'未入力':shard.amount.toLocaleString('ja-JP')+'個')+(shard.shardsRecorded!==false&&shard.researchExp!==undefined?' ／ EXP '+shard.researchExp.toLocaleString('ja-JP'):''),'sleep-note'));list.append(box);
  }
  if(!list.children.length)list.append(el('p','保存済みの睡眠リサーチはありません。','sleep-note'));root.append(list);
 }
 // 表示領域の変化だけを監視し、スクロール位置や保存データは操作しない。
 function bindSearchViewport(root,header,q){
  if(typeof window==='undefined'||typeof document==='undefined')return;
  const viewport=window.visualViewport,host=$('sleep');if(!viewport||!host)return;
  let baseHeight=Math.max(window.innerHeight,document.documentElement.clientHeight,viewport.height),baseWidth=window.innerWidth,wasKeyboard=false;
  const refresh=()=>{
   if(Math.abs(window.innerWidth-baseWidth)>80){baseWidth=window.innerWidth;baseHeight=Math.max(window.innerHeight,document.documentElement.clientHeight,viewport.height);}
   const touch=window.matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0;
   const focused=document.activeElement===q&&!host.hidden;
   if(!focused)baseHeight=Math.max(window.innerHeight,document.documentElement.clientHeight,viewport.height);
   const keyboard=focused&&touch&&Math.abs(viewport.scale-1)<.05&&Math.max(baseHeight,window.innerHeight,document.documentElement.clientHeight)-viewport.height>100;
   if(keyboard&&!wasKeyboard)host.style.setProperty('--sleep-workspace-height',root.getBoundingClientRect().height+'px');
   host.classList.toggle('sleep-keyboard-open',keyboard);wasKeyboard=keyboard;
   if(!keyboard){host.style.removeProperty('--sleep-entry-height');host.style.removeProperty('--sleep-visible-top');host.style.removeProperty('--sleep-visible-height');host.style.removeProperty('--sleep-workspace-height');return;}
   host.style.setProperty('--sleep-visible-top',Math.max(0,viewport.offsetTop)+'px');host.style.setProperty('--sleep-visible-height',viewport.height+'px');
   const available=Math.max(0,viewport.height-header.getBoundingClientRect().height-root.querySelector('.sleep-search-row').getBoundingClientRect().height-8);
   const entryHeight=available>=188?44:0;
   host.style.setProperty('--sleep-entry-height',entryHeight+'px');
  };
  q.addEventListener('focus',refresh);q.addEventListener('blur',refresh);
  viewport.addEventListener('resize',refresh);viewport.addEventListener('scroll',refresh);window.addEventListener('resize',refresh);
  searchViewportCleanup=()=>{q.removeEventListener('focus',refresh);q.removeEventListener('blur',refresh);viewport.removeEventListener('resize',refresh);viewport.removeEventListener('scroll',refresh);window.removeEventListener('resize',refresh);host.classList.remove('sleep-keyboard-open');for(const key of ['--sleep-entry-height','--sleep-visible-top','--sleep-visible-height','--sleep-workspace-height'])host.style.removeProperty(key);};
  refresh();
 }
 function render(){
  searchViewportCleanup?.();searchViewportCleanup=null;
  const root=$('sleep-root');if(!root||$('sleep')?.hidden===true)return;
  if(mode==='history'){root.replaceChildren();renderHistory(root);return;}
  if(!date)date=SleepResearch.initialDate(state,C.gameDay(new Date()));
  if($('sleep')?.hidden===false&&!Object.hasOwn(state.settings.sleepCandyMultipliers||{},date)){try{const next={...state,settings:{...state.settings,sleepCandyMultipliers:{...(state.settings.sleepCandyMultipliers||{}),[date]:SleepResearch.candyMultiplier(state,date)}}};if(!blocked){localStorage.setItem(KEY,JSON.stringify(next));state=next;}}catch(err){notice('倍率設定を保存できません：'+err.message,true);}}
  if(!loaded){number=1;draft=loadDraft();loaded=true;}
  syncResearch();if(!rowFor()||rowFor().kind==='session'&&rowFor().record.shardsRecorded===false)draft.researchRank=DreamClusters.validRank(state.settings.researchRank)?state.settings.researchRank:null;
  root.replaceChildren();const dateInput=el('input');Object.assign(dateInput,{type:'date',value:date});dateInput.setAttribute('aria-label','リサーチ日');dateInput.onchange=()=>{if(!SleepResearch.validDate(dateInput.value))return;if(!keep())return;date=dateInput.value;loaded=false;draft=null;researchSource=null;render();};
  const header=PeriodPicker.dayHeader(dateInput),actions=el('div',undefined,'sleep-sticky-actions'),total=el('div',undefined,'sleep-sticky-total'),value=el('strong');value.id='sleep-candy-total';if(mode!=='candy')total.append(el('span','ゆめのかけら'));total.append(value);if(mode==='candy'){const count=el('span',draft.entries.length+'匹','sleep-entry-count');count.id='sleep-entry-count';total.append(count);total.setAttribute('aria-label','選択中のリサーチのアメ個数と匹数');}
  const save=el('button','保存','sleep-save');save.id='sleep-save';save.type='submit';save.setAttribute('form',mode==='candy'?'sleep-form':'sleep-shard-form');save.setAttribute('aria-label',number+'回目の'+(mode==='candy'?'アメ':'ゆめのかけら')+'を保存');const rounds=tabs([[1,'1回目'],[2,'2回目']],number,choose,'睡眠の回数');rounds.classList.add('sleep-rounds');actions.append(total,rounds,save);root.append(header);
  actions.hidden=mode==='pickup';header.append(tabs([['candy','アメ'],['shards','ゆめのかけら'],['pickup','ピックアップ']],mode,switchMode,'睡眠の記録項目'));header.append(actions);
  if(mode==='pickup'){SleepPickups.render(root,render);return;}
  const form=el('form');form.id='sleep-form';form.hidden=mode!=='candy';
  const selectedHead=el('div',undefined,'sleep-research-heading'),entries=el('div');entries.id='sleep-entries';entries.setAttribute('aria-label','リサーチしたポケモン');selectedHead.hidden=mode!=='candy';header.append(selectedHead);form.append(entries);
  function renderEntries(){
   const scroll=entries.scrollTop;entries.replaceChildren();if(!draft.entries.length)entries.append(el('p','まだ選択されていません。','sleep-note'));
   for(const e of draft.entries){const row=el('div',undefined,'sleep-entry'),name=pokemonName(e.species),status=SleepResearch.rewardStatus(e.species,e.stars);name.title=C.speciesName(e.species)+'・'+e.candy+(status==='unknown'?'（報酬未確認）':'');
    const legacy=Object.hasOwn(SleepResearch.starOverrides,e.species)&&!SleepResearch.displayStars(e.species).includes(e.stars);if(legacy){name.style.whiteSpace='normal';name.append(el('small',' ・保存値★'+e.stars,'sleep-form-name'));name.title+='・保存値★'+e.stars+'（現在の選択対象外）';}
    const star=button(legacy?'変更':'★'+e.stars,()=>{Object.assign(e,SleepResearch.changeStars(e,SleepResearch.nextStars(e.species,e.stars),effectiveMultiplier()));keep();renderEntries();updateTotal();});star.classList.add('sleep-star-button');star.setAttribute('aria-pressed',String(!legacy));star.setAttribute('aria-label',e.species+(legacy?'の保存値★'+e.stars+'（現在の選択対象外）を変更':'の寝顔★'+e.stars+'を切り替える'));
    const amount=input(e.amount,v=>{e.amount=v;e.manualAmount=true;},{required:true,placeholder:status==='unknown'?'手入力':''});amount.className='sleep-entry-amount';amount.onclick=event=>{if(event.target===amount){event.preventDefault();amount.querySelector('input:not([hidden])')?.focus({preventScroll:true});}};const i=amount.querySelector('input');i.setAttribute('aria-label',e.species+'のアメ個数');i.title=e.candy+'の実獲得数（修正可）'+(status==='unknown'?'・報酬未確認':'');
    const remove=button('×',()=>{draft.entries=draft.entries.filter(x=>x.id!==e.id);keep();renderEntries();updateTotal();},'sleep-entry-remove');remove.setAttribute('aria-label',e.species+'を削除');row.append(name,star,amount,remove);entries.append(row);
   }
   entries.scrollTop=scroll;
  }
  renderEntries();
  const settings=el('div',undefined,'sleep-fields'),search=el('div',undefined,'sleep-search'),q=el('input'),results=el('div',undefined,'sleep-candidates'),filterInfo=el('div',undefined,'sleep-filter-info');
  settings.append(options('フィールド',fields,draft.field,v=>{draft.field=v;renderCandidates();renderEntries();}),options('睡眠タイプ',['うとうと','すやすや','ぐっすり','特徴なし'],draft.sleepType,v=>{draft.sleepType=v;renderCandidates();renderEntries();}));const multiplier=el('select');multiplier.setAttribute('aria-label','アメ獲得量');for(const [value,title] of [[1,'×1'],[1.5,'×1.5'],[2,'×2'],[3,'×3']])multiplier.add(new Option(title,String(value)));multiplier.value=String(SleepResearch.candyMultiplier(state,date));multiplier.title='アメ獲得量（1回目のみ）';multiplier.onchange=()=>{if(!keep())return;try{const next=SleepResearch.setCandyMultiplier(state,date,Number(multiplier.value),candyMap);if(blocked)throw Error('保存を停止しています');localStorage.setItem(KEY,JSON.stringify(next));state=next;draft=loadDraft();render();}catch(err){notice(err.message,true);}};const multiplierLabel=el('label',undefined,'sleep-bonus');multiplierLabel.append(multiplier);settings.append(multiplierLabel);for(const select of settings.querySelectorAll('select')){if(select===multiplier)continue;const compact=el('label',undefined,'sleep-compact-select'),caption=el('span');caption.setAttribute('aria-hidden','true');const sync=()=>{caption.textContent=(select.value==='とくちょうなし'?'特徴なし':select.value||select.getAttribute('aria-label')).replace('ワカクサ本島','ワカクサ').replace('シアンの砂浜','シアン').replace('ラピスラズリ湖畔','ラピス').replace('ゴールド旧発電所','ゴールド').replace('ウノハナ雪原','ウノハナ').replace('トープ洞窟','トープ').replace('アンバー渓谷','アンバー');};const change=select.onchange;select.onchange=()=>{change();sync();};select.after(compact);compact.append(caption,select);sync();}q.type='search';q.autocomplete='off';q.value=query;q.placeholder='ポケモン名を検索';q.setAttribute('aria-label','睡眠リサーチのポケモン名');const clear=button('×',()=>{q.value=query='';pickupOnly=false;renderCandidates();q.focus({preventScroll:true});},'sleep-search-clear');clear.setAttribute('aria-label','ポケモン検索の文字を消去');clear.onpointerdown=preserveSearchFocus;search.append(q,clear);results.setAttribute('aria-label','ポケモン一覧');
  function preserveSearchFocus(event){if(typeof document!=='undefined'&&document.activeElement===q&&event.isPrimary!==false&&(event.button===undefined||event.button===0))event.preventDefault();}
  function keepSearchFocusOn(b){let focused=false;const add=b.onclick;b.onpointerdown=e=>{focused=typeof document!=='undefined'&&document.activeElement===q;preserveSearchFocus(e);};b.onpointercancel=()=>{focused=false;};b.onclick=()=>{const refocus=focused||typeof document!=='undefined'&&document.activeElement===q;focused=false;add();if(refocus)q.focus({preventScroll:true});};}
  function addEntry(species,stars){if(SleepResearch.rewardStatus(species,stars)==='absent')return;if(draft.entries.length>=100){notice('1回に追加できるのは100匹までです。',true);return;}const basic=SleepResearch.estimate(species,stars),amount=basic===null?null:Math.ceil(basic*effectiveMultiplier());draft.entries.push({id:uid(),species,candy:candyMap[species],stars,amount:amount??'',calculatedAmount:amount});keep();renderEntries();updateTotal();}
  function renderCandidates(){
   clear.hidden=!q.value;results.replaceChildren();filterInfo.replaceChildren();const text=normalize(q.value),target=pickupOnly&&!text?new Set(SleepPickups.current(date,draft.field)):null;const pool=names.filter(n=>normalize(n).includes(text)&&(!target||target.has(n))).map(species=>({species,status:text||target?'all':SleepEncounters.status(species,draft.field,showOtherTypes||draft.sleepType==='特徴なし'?'':draft.sleepType)}));
   if(draft.sleepType&&draft.sleepType!=='とくちょうなし'){const toggle=button('他タイプ',()=>{showOtherTypes=!showOtherTypes;renderCandidates();});toggle.setAttribute('aria-label','他の睡眠タイプを表示');toggle.setAttribute('title','他の睡眠タイプを表示');toggle.setAttribute('aria-pressed',String(showOtherTypes));filterInfo.append(toggle);}
   const pickup=button('ピックアップ',()=>{pickupOnly=!pickupOnly;if(pickupOnly)q.value=query='';renderCandidates();});pickup.setAttribute('aria-pressed',String(pickupOnly));filterInfo.append(pickup);
   for(const {species,status:appearance} of pool){if(appearance==='different_type'||appearance==='unknown')continue;
    const row=el('div',undefined,'sleep-candidate'),label=pokemonName(species),choices=el('div',undefined,'sleep-candidate-stars');row.dataset.appearance=appearance;row.append(label);
    for(const stars of SleepResearch.displayStars(species)){const status=SleepResearch.rewardStatus(species,stars),b=button('★'+stars,()=>addEntry(species,stars));b.classList.add('sleep-star-button');b.disabled=status==='absent';keepSearchFocusOn(b);b.dataset.rewardStatus=status;b.setAttribute('aria-label',species+'の★'+stars+'を追加');b.title=status==='absent'?'資料に不存在の記載がある寝顔':status==='unknown'?'未確認の寝顔・個数は手入力':species+' ★'+stars+'・アメ'+Math.ceil(SleepResearch.estimate(species,stars)*effectiveMultiplier())+'個';choices.append(b);}row.append(choices);results.append(row);
   }
   if(!results.children.length)results.append(el('p',target?'この日付・フィールドに該当するピックアップはありません。':'確認済みの候補はありません。条件を変更してください。','sleep-note'));
  }
  q.oninput=()=>{if(query===q.value)return;query=q.value;renderCandidates();};q.onkeydown=e=>{if(e.key==='Enter'&&!e.isComposing&&e.keyCode!==229)e.preventDefault();};selectedHead.append(settings);const searchRow=el('div',undefined,'sleep-search-row');searchRow.append(search,filterInfo);form.append(searchRow,results);renderCandidates();
  form.onsubmit=e=>{e.preventDefault();try{if(!keep())return;const saved=saveStatus().saved,next=SleepResearch.saveCandy(state,draft,candyMap,new Date().toISOString());if(commit(next,saved?'睡眠リサーチを保存しました':'睡眠リサーチを記録しました')){draft=loadDraft();researchSource=null;render();}}catch(err){notice(err.message,true);}};
  const shardForm=el('form');shardForm.id='sleep-shard-form';shardForm.hidden=mode!=='shards';
  const shardFields=SleepShards.fields('sleep-shard',draft,(key,v)=>{draft[key]=v;keep();updateTotal();});shardForm.append(shardFields);if(!draft.researchRank)shardForm.append(el('p','設定でリサーチランクを設定してください。','rank-hint'));
  shardForm.onsubmit=e=>{e.preventDefault();try{if(!keep())return;const values={baseAmount:whole(draft.baseAmount),researchExp:whole(draft.researchExp===''?0:draft.researchExp)},row=rowFor(),saved=saveStatus().saved,next=SleepResearch.updateResearch(state,date,row?.key||'new:'+number,values,candyMap,draft.id,new Date().toISOString());if(commit(next,saved?'睡眠リサーチを保存しました':'睡眠リサーチを記録しました')){draft=loadDraft();researchSource=null;render();}}catch(err){notice(err.message,true);}};
  root.append(form,shardForm);
  bindSearchViewport(root,header,q);updateTotal();
 }
 function whole(raw){if(raw===''||!Number.isSafeInteger(Number(raw))||Number(raw)<0||Number(raw)>1000000000)throw Error('個数は0以上の整数で入力してください。');return Number(raw);}
 function appendHistory(root,period){for(const saved of sessions()){
  const legacy=saved.legacyResearchId&&(state.shardRecords||[]).find(r=>r.id===saved.legacyResearchId),s=legacy?{...saved,baseAmount:legacy.baseAmount,researchExp:legacy.researchExp,researchRank:legacy.researchLevel,amount:legacy.amount,shardsRecorded:true}:saved,shardsOnly=s.candyRecorded===false;
  const r={id:'sleep:'+s.id,recordedAt:s.recordedAt,datetime:SleepResearch.datetime(s),amount:shardsOnly?s.amount:C.sum(s.entries),method:'research',sleepSession:s},card=el('div',undefined,'card research'+(shardsOnly?' shards':'')),actions=el('div',undefined,'history-actions');if(!C.inRange(r,period))continue;card.dataset.datetime=r.datetime;if(shardsOnly)card.dataset.shardSource='research';actions.append(button('訂正',()=>edit(s.id)),button('削除',()=>remove(s.id),'danger'));
  historyCard(card,r,'睡眠リサーチ',shardsOnly?'ゆめのかけら':'アメ',s.number+'回目'+(!shardsOnly&&s.shardsRecorded!==false?' · ゆめのかけら '+s.amount.toLocaleString('ja-JP')+'個':''),actions);finishHistoryCard(card);root.append(card);
 }}
 return {render,edit,appendHistory,reset,initNavigation,syncNavigation,navigate,selectView,home,pickupsChanged,saveStatus};
})();
