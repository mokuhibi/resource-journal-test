'use strict';
// Eligibility uses verified event members, never inferred Pokémon types or current team history.
// Automatic fixed rewards use shards(); manually entered amounts are actual acquired quantities and are not multiplied again.
const EventEffects=(()=>{
 function skill(actor,date,source=null,events=SleepPickups.list(),field=recordField(date)){
  const base=C.recordProfile(actor).skillLevel,cap=SK.copyCap(source||actor)||C.skillCap((source||actor).species),applied=[];
  for(const event of events)if(event.start<=date&&date<=event.end&&(event.fields.includes('*')||!!field&&event.fields.includes(field)))for(const bonus of event.skillBonuses||[])if(bonus.pokemon.includes(actor.species))applied.push({id:event.id,name:event.name,start:event.start,end:event.end,fields:[...event.fields],...JSON.parse(JSON.stringify(bonus))});
  // 同じLv効果は最大値を使い、重複登録や重複期間で掛け重ねない。
  const boost=Math.max(0,...applied.map(b=>b.boost));return {baseLevel:base,effectiveLevel:Math.min(cap,base+boost),cap,boost,date,field,bonuses:applied};
 }
 function shards(amount,actor,date,scope='skill',field=recordField(date),number=1,events=SleepPickups.list()){
  const bonuses=[];
  for(const event of events)if(event.start<=date&&date<=event.end&&(event.fields.includes('*')||!!field&&event.fields.includes(field)))for(const bonus of event.shardBonuses||[])if(bonus.scope===scope&&(!bonus.firstOnly||number===1)&&(!bonus.pokemon||bonus.pokemon.includes(actor?.species)))bonuses.push({id:event.id,name:event.name,start:event.start,end:event.end,fields:[...event.fields],...JSON.parse(JSON.stringify(bonus))});
  const multiplier=Math.max(1,...bonuses.map(b=>b.multiplier)),matching=bonuses.filter(b=>b.multiplier===multiplier),rounding=matching[0]?.rounding;
  // 端数処理はイベントデータで確認済みの規則を明記。同率で規則が競合する場合は適用しない。
  if(matching.some(b=>b.rounding!==rounding))return {amount,baseAmount:amount,date,field,bonuses:[],conflict:true};
  return {amount:multiplier===1?amount:Math[rounding](amount*multiplier),baseAmount:amount,date,field,number,multiplier,bonuses};
 }
 function recordDay(date=recordDate()){return Number.isFinite(date.getTime())?C.gameDay(date):'';}
 function recordField(date){return typeof state==='undefined'?'':state.settings.recordFields?.[date]||'';}
 function renderField(root,date){
  if(!SleepPickups.list().some(e=>e.start<=date&&date<=e.end&&e.skillBonuses?.length&&!e.fields.includes('*')))return;
  const select=el('select');select.className='record-event-field';select.setAttribute('aria-label','スキル記録のフィールド');select.add(new Option('フィールドを選択',''));for(const field of SleepPickups.fields)select.add(new Option(field,field));select.value=recordField(date);select.onchange=()=>{const old=recordField(date);if(!commit({...state,settings:{...state.settings,recordFields:{...state.settings.recordFields,[date]:select.value}}},null))select.value=old;};root.append(select);
 }
 return {skill,shards,recordDay,recordField,renderField};
})();
if(typeof module!=='undefined')module.exports=EventEffects;
