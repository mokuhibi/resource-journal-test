'use strict';
// Both tabs use these fields and updateResearch to address the same saved sleep/legacy row.
const SleepShards=(()=>{
 let sourceKey=null,selectedKey='',selector;
 function number(id,emptyZero=false){const raw=$(id).value.trim(),value=Number(raw);if(raw===''&&emptyZero)return 0;if(raw===''||!Number.isSafeInteger(value)||value<0||value>1000000000)throw Error('個数は0以上の整数で入力してください。');return value;}
 function fields(prefix,values,change){
  const root=el('div',undefined,'filters research-fields');
  for(const [key,title,suffix] of [['researchRank','リサーチランク','level'],['researchExp','リサーチEXP','exp'],['baseAmount','ゆめのかけら','base']]){
   const label=el('label',key==='researchRank'?title:undefined),input=el('input');label.dataset.researchField=key;Object.assign(input,{id:prefix+'-'+suffix,type:'number',inputMode:'numeric',min:key==='researchRank'?'1':'0',max:key==='researchRank'?'70':'1000000000',step:'1',required:key!=='researchExp',placeholder:key==='researchRank'?'':title,readOnly:key==='researchRank',value:values[key]??''});input.setAttribute('aria-label',title);
   if(key!=='researchRank')input.oninput=()=>change(key,input.value);label.append(input);root.append(label);
  }
  return root;
 }
 function keepDraft(){
  try{const date=$('shard-research-date').value,rows=SleepResearch.researchRows(state,date),row=rows.find(r=>r.key===selectedKey),n=row?.number||Number(selectedKey.split(':')[1]);
   if(!C.dateOnly(date)||![1,2].includes(n))return;
   if(blocked)throw Error('保存を停止しています');const next=SleepResearch.researchDraft(state,date,n,{baseAmount:$('shard-research-base').value,researchExp:$('shard-research-exp').value},candyMap,uid());localStorage.setItem(KEY,JSON.stringify(next));state=next;
  }catch(err){notice('入力途中の保存ができません：'+err.message,true);}
 }
 function render(force=false){
  if($('record-shard-date-input')){const current=recordDate();if(Number.isFinite(current.getTime())){$('record-shard-date-input').value=C.gameDay(current);$('record-shard-date-text').textContent=PeriodPicker.datesText(C.gameDay(current));}}
  const stamp=recordDate();if(!Number.isFinite(stamp.getTime()))return;const date=C.gameDay(stamp);$('shard-research-date').value=date;
  const rows=SleepResearch.researchRows(state,date),options=rows.map(row=>({key:row.key,text:row.number+'回目'}));
  if(rows.length<2)for(let n=1;n<=2;n++)if(!rows.some(r=>r.number===n))options.push({key:'new:'+n,text:n+'回目'});
  if(!selector){const label=el('label');label.className='research-session-field';selector=el('select');selector.id='shard-research-session';selector.setAttribute('aria-label','睡眠回数');label.append(selector);$('shard-research-form').querySelector('.research-fields').prepend(label);selector.onchange=()=>{selectedKey=selector.value;render(true);};const total=el('p',undefined,'research-daily-total');total.id='research-daily-total';$('shard-research-form').prepend(total);}
  const key=JSON.stringify([date,rows,state.settings.researchRank,state.sleepDrafts]);if(!force&&key===sourceKey)return;sourceKey=key;
  if(!options.some(o=>o.key===selectedKey))selectedKey=rows[0]?.key||options[0]?.key||'';
  selector.replaceChildren();for(const o of options)selector.add(new Option(o.text,o.key));selector.value=selectedKey;
  const row=rows.find(r=>r.key===selectedKey),r=row?.record,n=row?.number||Number(selectedKey.split(':')[1]),draft=state.sleepDrafts?.[date+':'+n],rank=row?(row.kind==='legacy'?r.researchLevel:(r.shardsRecorded===false?state.settings.researchRank:r.researchRank)):state.settings.researchRank;
  $('research-daily-total').textContent='その日の合計 '+SleepResearch.researchTotal(state,date).toLocaleString('ja-JP')+'個'+(rows.length?'（'+rows.length+'回分）':'');
  $('shard-research-level').required=!row||rank!==null;$('shard-research-level').value=rank??'';$('shard-research-base').value=draft?.baseAmount??(r?.shardsRecorded===false?'':r?.baseAmount??'');$('shard-research-exp').value=draft?.researchExp??(r?.shardsRecorded===false?'':r?.researchExp??'');
  $('research-save').textContent=row?'訂正を保存':'リサーチを記録';$('research-rank-hint').hidden=Boolean(row);$('research-rank-hint').textContent=row?'':rank?'設定のリサーチランクを使用します。':'設定でリサーチランクを設定してください。';
 }
 function init(){
  const day=el('input');day.id='record-shard-date-input';day.type='date';day.value=C.gameDay(recordDate());day.setAttribute('aria-label','ゆめのかけらの記録日');
  day.onchange=()=>{if(!C.dateOnly(day.value))return;const stamp=recordDate(),time=C.localInput(stamp).slice(11),calendarDay=stamp.getHours()<4?C.addDays(day.value,1):day.value;$('datetime').value=calendarDay+'T'+time;$('auto-now').checked=false;$('datetime').dispatchEvent(new Event('change',{bubbles:true}));render(true);DateUI.update();};
  const dateHeader=PeriodPicker.dayHeader(day);dateHeader.id='record-shard-date';dateHeader.querySelector('.period-picker-date').querySelector('span').id='record-shard-date-text';$('record-shard-heading').before(dateHeader);

  const old=$('shard-research-form').querySelector('.research-fields'),shared=fields('shard-research',{},keepDraft);const dateInput=$('shard-research-date');dateInput.type='hidden';dateInput.hidden=true;shared.prepend(dateInput);old.replaceWith(shared);
  $('shard-research-form').onsubmit=e=>{e.preventDefault();try{const stamp=recordDate();if(!Number.isFinite(stamp.getTime()))throw Error('記録日時を入力してください。');const date=C.gameDay(stamp);if(date!==$('shard-research-date').value){render(true);throw Error('記録日時が変わりました。対象の入力を確認してください。');}const next=SleepResearch.updateResearch(state,date,selectedKey,{baseAmount:number('shard-research-base'),researchExp:number('shard-research-exp',true)},candyMap,uid(),new Date().toISOString());if(commit(next,'睡眠リサーチを保存しました。'))render(true);}catch(err){notice(err.message,true);}};
 }
 return {init,render,fields};
})();
