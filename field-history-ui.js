'use strict';
const FieldHistoryUI=(()=>{
 let selected='',start='',editing=null,body=null,ready=false;
 const stamp=date=>Number.isFinite(date.getTime())?C.localInput(date):'';
 function context(date=recordDate()){const key=stamp(date);if(!key)return {field:'',status:'missing',confirmed:false};return FieldHistory.resolve(state,date);}
 function field(date=recordDate()){const value=context(date);return value.confirmed||value.status==='sleep'?value.field:'';}
 function select(value,aria){const input=el('select');input.setAttribute('aria-label',aria);input.add(new Option('フィールドを選択',''));for(const f of FieldHistory.definitions)input.add(new Option(f.name,f.id));if(value&&!FieldHistory.fields.includes(value))input.add(new Option(value,value));input.value=value||'';return input;}
 function saveAt(date,value){const saved=commit(FieldHistory.saveDay(state,C.gameDay(date),value,uid()),'フィールドを保存');if(!saved)sync();return saved;}
 function sync(){
  if(!ready)return;const root=$('record-field-row'),date=recordDate(),value=context(date);root.replaceChildren();
  const choice=select(value.field,'記録フィールド');choice.id='record-field';choice.className='record-event-field';const colors=FieldHistory.labelColors(value.field);if(value.field){choice.style.backgroundColor=colors.background;choice.style.color=colors.color;}root.append(choice);
  const hint=$('record-field-hint');hint.replaceChildren();hint.hidden=value.confirmed===true;
  if(value.status==='sleep')hint.append(el('small',value.field?'睡眠リサーチから参照':'フィールドを選択'));
  else if(!value.confirmed)hint.append(el('small','フィールドを選択'));
  choice.onchange=()=>{if(choice.value)saveAt(date,choice.value);else sync();};
 }

 function showHistory(root){body=root;if(!selected){selected=C.gameDay(new Date());start=selected.slice(0,7)+'-01';}render();}
 function open(){SleepUI.selectFieldHistory();}
 function monthOffset(date,offset){const d=new Date(date+'T12:00:00Z');d.setUTCMonth(d.getUTCMonth()+offset);return d.toISOString().slice(0,10);}
 function render(){
  if(!body)return;body.replaceChildren();const nav=el('div',undefined,'field-history-nav');nav.append(button('＜',()=>{start=monthOffset(start,-1);render();}),button('今日',()=>{selected=C.gameDay(new Date());start=selected.slice(0,7)+'-01';editing=null;render();}),button('＞',()=>{start=monthOffset(start,1);render();}));body.append(nav);
  const calendar=el('div',undefined,'field-history-weeks');calendar.setAttribute('aria-label','月ごとのフィールド履歴');
  const month=el('section'),heading=el('h3',Number(start.slice(0,4))+'年'+Number(start.slice(5,7))+'月'),first=FieldHistory.week(start),end=monthOffset(start,1);month.append(heading);
  for(let monday=first;monday<end;monday=FieldHistory.add(monday,7)){const row=el('div',undefined,'field-history-days');for(let i=0;i<7;i++){
   const d=FieldHistory.add(monday,i),v=FieldHistory.dayView(state,d),b=button('',()=>{selected=d;editing=null;render();body.querySelector('.field-history-detail').scrollIntoView({block:'nearest'});});b.dataset.day=d;if(d.slice(0,7)!==start.slice(0,7))b.classList.add('field-history-outside-month');b.setAttribute('aria-pressed',String(selected===d));b.setAttribute('aria-label',C.displayDate(d)+' '+(v.colors.filter(Boolean).map(f=>FieldHistory.info(f).name).join('→')||'未登録'));
   const alpha=v.confirmed?44:15,colors=v.colors.length?v.colors:[''];b.style.background='linear-gradient(90deg,'+colors.flatMap((f,i)=>{const c=f?'color-mix(in srgb,'+FieldHistory.info(f).color+' '+alpha+'%,var(--mh-surface))':'var(--mh-surface)';return [c+' '+i/colors.length*100+'%',c+' '+(i+1)/colors.length*100+'%'];}).join(',')+')';
   b.append(el('small',d.slice(8)==='01'?Number(d.slice(5,7))+'月':['月','火','水','木','金','土','日'][i]),el('strong',String(Number(d.slice(8)))));if(v.colors.some(f=>FieldHistory.info(f).ex))b.append(el('small','EX'));row.append(b);
  }month.append(row);}calendar.append(month);body.append(calendar);details();DateUI.update();
 }
 function details(){
  const view=FieldHistory.dayView(state,selected),box=el('section',undefined,'field-history-detail');box.append(el('h3',C.displayDate(selected)),el('p',(view.confirmed?'確定':view.status==='sleep'?'睡眠リサーチから参照':'未登録')+(view.field?'：'+FieldHistory.info(view.field).name:'')));
  const rows=(state.fieldHistory||[]).filter(r=>r.date===selected);for(const r of rows){const line=el('div',undefined,'field-history-change');line.append(el('span',(r.time?(Number(r.time.slice(0,2))<4?'翌日 ':'')+r.time:r.scope==='day'?'当日':'時刻未指定')+'　'+FieldHistory.info(r.field).name),button('編集',()=>{editing=r.id;render();}),button('削除',()=>{if(!confirm('このフィールド履歴を削除しますか？'))return;if(commit({...state,fieldHistory:(state.fieldHistory||[]).filter(x=>x.id!==r.id)},'フィールド履歴を削除')){editing=null;sync();render();}},'danger'));box.append(line);}
  if(!rows.length&&view.entry)box.append(el('small',C.displayDate(view.entry.date)+'から継続'));
  if(view.status==='legacy')box.append(el('small','旧フィールド設定(当日のみ)'));
  for(const ref of view.references)box.append(el('p','睡眠リサーチ '+ref.number+'回目：'+FieldHistory.info(ref.field).name+(ref.recordedAt?'／記録日時 '+DateUI.datetime(ref.recordedAt):''),'field-reference'));
  const original=rows.find(r=>r.id===editing),form=el('form'),date=el('input'),fieldInput=select(original?.field||view.field,'履歴のフィールド'),toggle=el('input'),time=el('input'),check=el('label',undefined,'check');Object.assign(date,{type:'date',value:original?.time&&Number(original.time.slice(0,2))<4?FieldHistory.add(original.date,1):original?.date||selected,required:true});date.setAttribute('aria-label','フィールド変更日');Object.assign(toggle,{type:'checkbox',checked:!!original?.time});check.append(toggle,el('span','時刻を指定する'));Object.assign(time,{type:'time',value:original?.time||'',required:toggle.checked,hidden:!toggle.checked});time.setAttribute('aria-label','フィールド変更時刻');toggle.onchange=()=>{time.hidden=!toggle.checked;time.required=toggle.checked;};
  const row=el('div',undefined,'field-history-inputs');row.append(date,fieldInput);const save=el('button',original?'変更を保存':'確定');save.type='submit';fieldInput.required=true;form.append(row,check,time,save);if(editing)form.append(button('キャンセル',()=>{editing=null;render();}));const error=el('p');error.setAttribute('role','alert');form.append(error);
  form.onsubmit=e=>{e.preventDefault();try{const item={...(original||{}),id:original?.id||uid(),...(!original?{scope:'day'}:{}),date:toggle.checked&&time.value?C.gameDay(C.fromInput(date.value+'T'+time.value)):date.value,time:toggle.checked?time.value:null,field:fieldInput.value};if(toggle.checked&&!time.value)throw Error('変更時刻を入力してください。');const next=!original&&!item.time?FieldHistory.saveDay(state,item.date,item.field,item.id):FieldHistory.save(state,item);if(commit(next,'フィールドを保存')){selected=item.date;editing=null;sync();render();}}catch(e){error.textContent=e.message;}};box.append(form);body.append(box);
 }
 function init(){const card=$('record').querySelector('.record-date-card'),row=el('div',undefined,'record-date-row'),fieldRow=el('div',undefined,'record-field-row'),hint=el('div',undefined,'record-field-hint');row.append(...card.children);fieldRow.id='record-field-row';hint.id='record-field-hint';card.append(row,fieldRow,hint);ready=true;sync();}
 return {init,sync,context,field,open,showHistory};
})();
