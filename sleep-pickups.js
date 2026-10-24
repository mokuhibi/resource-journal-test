'use strict';
// Standard events are read-only distribution data. Personal events live in existing settings/CSV.
const SleepPickups=(()=>{
 const fields=['ワカクサ本島','シアンの砂浜','トープ洞窟','ウノハナ雪原','ラピスラズリ湖畔','ゴールド旧発電所','アンバー渓谷','ワカクサ本島EX','シアンの砂浜EX'];
 let standard=[],status='',editor=null;
 const validDay=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
 function validate(events,map){
  if(!Array.isArray(events)||events.length>1000)throw Error('イベント一覧の形式が不正です。');const ids=new Set();
  for(const e of events){if(!e||typeof e.id!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(e.id)||ids.has(e.id)||typeof e.name!=='string'||!e.name.trim()||e.name.length>100||!validDay(e.start)||!validDay(e.end)||e.start>e.end||!Array.isArray(e.fields)||!e.fields.length||new Set(e.fields).size!==e.fields.length||e.fields.some(f=>f!=='*'&&!fields.includes(f))||e.fields.includes('*')&&e.fields.length!==1||!Array.isArray(e.pokemon)||!e.pokemon.length||new Set(e.pokemon).size!==e.pokemon.length||e.pokemon.some(n=>!Object.hasOwn(map,n)))throw Error('ピックアップイベントの内容を確認してください。');if(e.tiers!==undefined){if(!e.tiers||typeof e.tiers!=='object'||Object.entries(e.tiers).some(([key,xs])=>!['large','medium','small'].includes(key)||!Array.isArray(xs)||xs.some(n=>!e.pokemon.includes(n)))||new Set(Object.values(e.tiers).flat()).size!==Object.values(e.tiers).flat().length)throw Error('ピックアップ区分');}
   if(e.candyBonuses!==undefined&&(!Array.isArray(e.candyBonuses)||e.candyBonuses.some(b=>!validDay(b.start)||!validDay(b.end)||b.start>b.end||b.start<e.start||b.end>e.end||![1.5,2,3].includes(b.multiplier))))throw Error('イベントのアメ倍率');ids.add(e.id);}
  return events;
 }
 function documentData(json,map){if(!json||json.schemaVersion!==1)throw Error('未対応のイベントJSON形式です。');return validate(json.events,map);}
 function targets(events,day,field){return [...new Set(events.filter(e=>e.start<=day&&day<=e.end&&(e.fields.includes('*')||Boolean(field)&&e.fields.includes(field))).flatMap(e=>e.pokemon))];}
 function list(){return [...standard.map(e=>({...e,standard:true})),...(state.settings.sleepPickupEvents||[]).map(e=>({...e,standard:false}))].sort((a,b)=>b.start.localeCompare(a.start)||a.name.localeCompare(b.name));}
 function matching(events,day,field){return events.filter(e=>e.start<=day&&day<=e.end&&(e.fields.includes('*')||Boolean(field)&&e.fields.includes(field)));}
 function multiplier(events,day,field,number=1){return number===1?Math.max(1,...matching(events,day,field).flatMap(e=>(e.candyBonuses||[]).filter(b=>b.start<=day&&day<=b.end).map(b=>b.multiplier))):1;}
 function bonus(day,field,number=1){return multiplier(list(),day,field,number);}
 function current(day,field){return targets(list(),day,field);}
 async function load(){
  const key=KEY+'-pickup-standard';try{const cached=localStorage.getItem(key);if(cached)standard=documentData(JSON.parse(cached),candyMap);}catch(_){}
  try{const response=await fetch('sleep-pickups.json?t='+Date.now(),{cache:'no-store'});if(!response.ok)throw Error('取得失敗');const next=documentData(await response.json(),candyMap);standard=next;status='';try{localStorage.setItem(key,JSON.stringify({schemaVersion:1,events:standard}));}catch(_){} }
  catch(_){status='標準イベントを取得できませんでした。'+(standard.length?'前回の情報を表示しています。':'');}
  if(typeof SleepUI!=='undefined')SleepUI.pickupsChanged();
 }
 function saveEvent(item){const events=[...(state.settings.sleepPickupEvents||[]).filter(e=>e.id!==item.id),item];validate(events,candyMap);return commit({...state,settings:{...state.settings,sleepPickupEvents:events}},'イベントを保存しました。');}
 function removeEvent(id){return commit({...state,settings:{...state.settings,sleepPickupEvents:(state.settings.sleepPickupEvents||[]).filter(e=>e.id!==id)}},'イベントを削除しました。');}
 function tierLines(tiers){return ['large','medium','small'].filter(key=>tiers[key]).map(key=>{
  const xs=[...tiers[key]].sort((a,b)=>(nationalDex[a]??Infinity)-(nationalDex[b]??Infinity)||a.localeCompare(b,'ja'));
  return ({large:'大',medium:'中',small:'小'})[key]+'ピックアップ：'+[...new Set(xs.map(n=>C.speciesName(n).replace(/[（(](ちゅうだま|こだま|おおだま|ギガだま)(しゅ)?[）)]/,'')))].join('・');
 });}
 function render(root,refresh,day,field){
  const head=el('div',undefined,'pickup-heading');head.append(el('h3','ピックアップ'),button('イベントを追加',()=>{editor={id:uid(),name:'',start:'',end:'',fields:['*'],pokemon:[]};refresh();}));root.append(head);
  if(status)root.append(el('p',status,'sleep-note'));
  if(editor){
   const form=el('form'),row=el('div',undefined,'pickup-dates'),error=el('p');form.className='pickup-form';error.setAttribute('role','alert');
   for(const [key,title,type] of [['name','イベント名','text'],['start','開始日','date'],['end','終了日','date']]){const label=el('label',title),input=el('input');Object.assign(input,{type,value:editor[key],required:true});if(key==='name')input.maxLength=100;input.setAttribute('aria-label',title);input.oninput=()=>editor[key]=input.value;label.append(input);if(key==='name')form.append(label);else row.append(label);}form.append(row);
   const fieldset=el('fieldset'),legend=el('legend','対象フィールド');fieldset.append(legend);for(const f of ['*',...fields]){const l=el('label'),i=el('input');Object.assign(i,{type:'checkbox',checked:editor.fields.includes(f)});i.onchange=()=>{editor.fields=f==='*'?(i.checked?['*']:[]):[...editor.fields.filter(x=>x!=='*'&&x!==f),...(i.checked?[f]:[])];for(const label of fieldset.querySelectorAll('label'))label.querySelector('input').checked=editor.fields.includes(label.dataset.field);};l.dataset.field=f;l.append(i,el('span',f==='*'?'すべて':f));fieldset.append(l);}form.append(fieldset);
   const selected=el('div',undefined,'pickup-selected'),search=el('input'),results=el('div',undefined,'pickup-results');search.type='search';search.placeholder='対象ポケモンを検索';search.setAttribute('aria-label','対象ポケモンを検索');
   const update=()=>{selected.replaceChildren();for(const n of editor.pokemon)selected.append(button(C.speciesName(n)+' ×',()=>{editor.pokemon=editor.pokemon.filter(x=>x!==n);update();}));results.replaceChildren();const text=normalize(search.value);if(text)for(const n of names.filter(n=>normalize(C.speciesName(n)).includes(text)&&!editor.pokemon.includes(n)))results.append(button(C.speciesName(n),()=>{editor.pokemon.push(n);update();}));};search.oninput=update;update();
   const label=el('label','対象ポケモン');label.append(search);form.append(label,selected,results,error);const save=el('button','イベントを保存');save.type='submit';form.append(save,button('キャンセル',()=>{editor=null;refresh();}));form.onsubmit=e=>{e.preventDefault();try{const value={...editor,name:editor.name.trim(),fields:[...editor.fields],pokemon:[...editor.pokemon]};if(saveEvent(value)){editor=null;refresh();}}catch(err){error.textContent=err.message;}};root.append(form);
  }
  const events=list().filter(e=>!e.standard||!day||matching([e],day,field).length);for(const event of events){const row=el('section',undefined,'pickup-event'),head=el('div',undefined,'pickup-heading');head.append(el('strong',event.name),el('small',event.standard?'標準':'端末登録'));if(!event.standard)head.append(button('編集',()=>{editor=JSON.parse(JSON.stringify(({id:event.id,name:event.name,start:event.start,end:event.end,fields:event.fields,pokemon:event.pokemon})));refresh();}),button('削除',()=>{if(confirm('このイベントを削除しますか？')){if(removeEvent(event.id)){if(editor?.id===event.id)editor=null;refresh();}}},'danger'));row.append(head,el('p',C.displayDate(event.start)+' 〜 '+C.displayDate(event.end),'sleep-note'),el('p',event.fields.includes('*')?'すべてのフィールド':event.fields.join('・'),'sleep-note'),...((event.tiers?tierLines(event.tiers):[event.pokemon.map(C.speciesName).join('・')]).map(text=>el('p',text,'sleep-note'))));root.append(row);}
  if(!events.length)root.append(el('p','登録済みのイベントはありません。','sleep-note'));
 }
 return {tierLines,fields,validate,documentData,targets,matching,multiplier,bonus,current,list,load,render,saveEvent,removeEvent};
})();
if(typeof module!=='undefined')module.exports=SleepPickups;
