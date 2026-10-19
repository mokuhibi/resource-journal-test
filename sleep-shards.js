'use strict';
// Record tab editor for the exact same sleep/legacy rows used by the sleep tab.
const SleepShards=(()=>{
 let sourceKey=null,selectedKey='',selector;
 function number(id){const raw=$(id).value.trim(),value=Number(raw);if(raw===''||!Number.isSafeInteger(value)||value<0||value>1000000000)throw Error('個数は0以上の整数で入力してください。');return value;}
 function render(force=false){
  const date=$('shard-research-date').value;if(!C.dateOnly(date))return;
  const rows=SleepResearch.researchRows(state,date),options=rows.map(row=>({key:row.key,text:row.number+'回目'+(row.kind==='legacy'?'（既存の記録）':'')}));
  if(rows.length<2)for(let n=1;n<=2;n++)if(!rows.some(r=>r.number===n))options.push({key:'new:'+n,text:n+'回目を記録'});
  if(!selector){const label=el('label','編集する睡眠');selector=el('select');selector.id='shard-research-session';label.append(selector);$('shard-research-form').prepend(label);selector.onchange=()=>{selectedKey=selector.value;render(true);};const total=el('p',undefined,'research-daily-total');total.id='research-daily-total';$('shard-research-form').prepend(total);}
  const key=JSON.stringify([date,rows,state.settings.researchRank]);if(!force&&key===sourceKey)return;sourceKey=key;
  if(!options.some(o=>o.key===selectedKey))selectedKey=rows[0]?.key||options[0]?.key||'';
  selector.replaceChildren();for(const o of options)selector.add(new Option(o.text,o.key));selector.value=selectedKey;
  const row=rows.find(r=>r.key===selectedKey),r=row?.record,rank=row?(row.kind==='legacy'?r.researchLevel:r.researchRank):state.settings.researchRank;
  $('research-daily-total').textContent='その日の合計 '+SleepResearch.researchTotal(state,date).toLocaleString('ja-JP')+'個'+(rows.length?'（'+rows.length+'回分）':'');
  $('shard-research-level').required=!row||rank!==null;$('shard-research-level').value=rank??'';$('shard-research-base').value=r?.baseAmount??'';$('shard-research-exp').value=r?.researchExp??'0';
  $('research-save').textContent=row?'訂正を保存':'リサーチを記録';$('research-rank-hint').textContent=row?'記録時のランクを使用します。':rank?'設定のリサーチランクを使用します。':'設定でリサーチランクを設定してください。';
 }
 function init(){
  $('shard-research-form').onsubmit=e=>{e.preventDefault();try{const date=$('shard-research-date').value;const next=SleepResearch.updateResearch(state,date,selectedKey,{baseAmount:number('shard-research-base'),researchExp:number('shard-research-exp')},candyMap,uid(),new Date().toISOString());if(commit(next,'睡眠リサーチを保存しました。'))render(true);}catch(err){notice(err.message,true);}};
 }
 return {init,render};
})();
