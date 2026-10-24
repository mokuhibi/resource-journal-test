'use strict';
const FieldHistoryUI=(()=>{
 let override=null,selected='',start='',editing=null,body=null,ready=false;
 const stamp=date=>Number.isFinite(date.getTime())?C.localInput(date):'';
 function context(date=recordDate()){const key=stamp(date);if(!key)return {field:'',status:'missing',confirmed:false};return FieldHistory.resolve(state,date,override?.key===key?override.field:'');}
 function field(date=recordDate()){const value=context(date);return value.confirmed?value.field:'';}
 function select(value,aria){const input=el('select');input.setAttribute('aria-label',aria);input.add(new Option('フィールドを選択',''));for(const f of FieldHistory.definitions)input.add(new Option(f.name,f.id));if(value&&!FieldHistory.fields.includes(value))input.add(new Option(value,value));input.value=value||'';return input;}
 function saveAt(date,value){const at=C.localInput(date),d=C.gameDay(date);return commit(FieldHistory.save(state,{id:uid(),date:d,time:at.slice(11),field:value}),'フィールドを保存');}
 function sync(){
  if(!ready)return;const root=$('record-field-row'),date=recordDate(),value=context(date);root.replaceChildren();
  const choice=select(value.field,'記録フィールド');choice.id='record-field';choice.className='record-event-field';const history=button('履歴',open);history.id='field-history-open';root.append(choice,history);
  const hint=$('record-field-hint');hint.replaceChildren();hint.hidden=value.confirmed===true&&value.status!=='record';
  const ambiguous=value.status==='ambiguous';let only=null;
  if(value.status==='record'){hint.append(el('small','今回のみ：'+FieldHistory.info(value.field).name),button('解除',()=>{override=null;renderRecord();}));}
  else if(ambiguous){const label=el('label',undefined,'check'),check=el('input');check.type='checkbox';check.checked=true;check.id='field-record-only';label.append(check,el('span','今回のみ'));hint.append(label,el('small','移動時刻未確定'));only=check;}
  else if(value.status==='sleep'){hint.append(el('small','睡眠リサーチから参照・未確定'));if(value.field)hint.append(button('確定',()=>saveAt(date,value.field)));}
  else if(!value.confirmed)hint.append(el('small','今週のフィールドを選択'));
  choice.onchange=()=>{if(!choice.value)return;if(only?.checked){override={key:stamp(date),field:choice.value};renderRecord();return;}saveAt(date,choice.value);};
 }
 function afterCommit(old,next){if(!override)return;const added=next.records.some(r=>!old.records.some(x=>x.id===r.id)&&['mew','delibird','skill'].includes(r.method))||next.shardRecords.some(r=>!old.shardRecords.some(x=>x.id===r.id)&&['skill','lucky'].includes(r.method));if(added)override=null;}
 function open(){selected=C.gameDay(recordDate());start=FieldHistory.week(selected);editing=null;AppPanels.open('フィールド履歴',root=>{body=root;render();});}
 function render(){
  if(!body)return;body.replaceChildren();const nav=el('div',undefined,'field-history-nav');nav.append(button('＜',()=>{start=FieldHistory.add(start,-28);render();}),button('今日',()=>{selected=C.gameDay(new Date());start=FieldHistory.week(selected);editing=null;render();}),button('＞',()=>{start=FieldHistory.add(start,28);render();}));body.append(nav);
  const calendar=el('div',undefined,'field-history-weeks');calendar.setAttribute('aria-label','週ごとのフィールド履歴');
  for(let w=0;w<5;w++){const monday=FieldHistory.add(start,w*7),sunday=FieldHistory.add(monday,6),week=el('section'),heading=el('h3',Number(monday.slice(5,7))+'月'+Number(monday.slice(8))+'日〜'+Number(sunday.slice(5,7))+'月'+Number(sunday.slice(8))+'日'),row=el('div',undefined,'field-history-days');for(let i=0;i<7;i++){
   const d=FieldHistory.add(monday,i),v=FieldHistory.dayView(state,d),b=button('',()=>{selected=d;editing=null;render();body.querySelector('.field-history-detail').scrollIntoView({block:'nearest'});});b.dataset.day=d;b.setAttribute('aria-pressed',String(selected===d));b.setAttribute('aria-label',C.displayDate(d)+' '+(v.colors.filter(Boolean).map(f=>FieldHistory.info(f).name).join('→')||'未登録'));
   const alpha=v.confirmed?44:15,colors=v.colors.length?v.colors:[''];b.style.background='linear-gradient(90deg,'+colors.flatMap((f,i)=>{const c=f?'color-mix(in srgb,'+FieldHistory.info(f).color+' '+alpha+'%,var(--mh-surface))':'var(--mh-surface)';return [c+' '+i/colors.length*100+'%',c+' '+(i+1)/colors.length*100+'%'];}).join(',')+')';
   b.append(el('small',d.slice(8)==='01'?Number(d.slice(5,7))+'月':['月','火','水','木','金','土','日'][i]),el('strong',String(Number(d.slice(8)))));if(v.colors.some(f=>FieldHistory.info(f).ex))b.append(el('small','EX'));row.append(b);
  }week.append(heading,row);calendar.append(week);}body.append(calendar);details();DateUI.update();
 }
 function details(){
  const view=FieldHistory.dayView(state,selected),box=el('section',undefined,'field-history-detail');box.append(el('h3',C.displayDate(selected)),el('p',(view.confirmed?'確定':view.status==='sleep'?'睡眠リサーチから参照':'未登録')+(view.field?'：'+FieldHistory.info(view.field).name:'')));
  const rows=(state.fieldHistory||[]).filter(r=>r.date===selected);for(const r of rows){const line=el('div',undefined,'field-history-change');line.append(el('span',(r.time?(Number(r.time.slice(0,2))<4?'翌日 ':'')+r.time:'時刻未指定')+'　'+FieldHistory.info(r.field).name),button('編集',()=>{editing=r.id;render();}));box.append(line);}
  if(!rows.length&&view.entry)box.append(el('small',C.displayDate(view.entry.date)+'から継続'));
  if(view.status==='legacy')box.append(el('small','旧フィールド設定（当日のみ）'));
  for(const ref of view.references)box.append(el('p','睡眠リサーチ '+ref.number+'回目：'+FieldHistory.info(ref.field).name+(ref.recordedAt?'／記録日時 '+DateUI.datetime(ref.recordedAt):''),'field-reference'));
  const original=rows.find(r=>r.id===editing),form=el('form'),date=el('input'),fieldInput=select(original?.field||view.field,'履歴のフィールド'),toggle=el('input'),time=el('input'),check=el('label',undefined,'check');Object.assign(date,{type:'date',value:original?.time&&Number(original.time.slice(0,2))<4?FieldHistory.add(original.date,1):original?.date||selected,required:true});date.setAttribute('aria-label','フィールド変更日');Object.assign(toggle,{type:'checkbox',checked:!!original?.time});check.append(toggle,el('span','時刻を指定する'));Object.assign(time,{type:'time',value:original?.time||'',required:toggle.checked,hidden:!toggle.checked});time.setAttribute('aria-label','フィールド変更時刻');toggle.onchange=()=>{time.hidden=!toggle.checked;time.required=toggle.checked;};
  const row=el('div',undefined,'field-history-inputs');row.append(date,fieldInput);const save=el('button',original?'変更を保存':'確定');save.type='submit';fieldInput.required=true;form.append(row,check,time,save);if(editing)form.append(button('キャンセル',()=>{editing=null;render();}));const error=el('p');error.setAttribute('role','alert');form.append(error);
  form.onsubmit=e=>{e.preventDefault();try{const item={...(original||{}),id:original?.id||uid(),date:toggle.checked&&time.value?C.gameDay(C.fromInput(date.value+'T'+time.value)):date.value,time:toggle.checked?time.value:null,field:fieldInput.value};if(toggle.checked&&!time.value)throw Error('変更時刻を入力してください。');const next=FieldHistory.save(state,item);if(commit(next,'フィールドを保存')){selected=item.date;editing=null;sync();render();}}catch(e){error.textContent=e.message;}};box.append(form);body.append(box);
 }
 function init(){const card=$('record').querySelector('.record-date-card'),row=el('div',undefined,'record-date-row'),fieldRow=el('div',undefined,'record-field-row'),hint=el('div',undefined,'record-field-hint');row.append(...card.children);fieldRow.id='record-field-row';hint.id='record-field-hint';card.append(row,fieldRow,hint);ready=true;sync();}
 return {init,sync,context,field,afterCommit,open};
})();
