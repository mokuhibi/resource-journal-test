'use strict';
// History dates are game dates (JST 04:00 boundary). A null time is not midnight.
const FieldHistory=(()=>{
 const definitions=[['ワカクサ本島','若草','#88a954'],['シアンの砂浜','シアン','#46a6b0'],['トープ洞窟','トープ','#9b8b78'],['ウノハナ雪原','ウノハナ','#d8d8c1'],['ラピスラズリ湖畔','ラピスラズリ','#5276b4'],['ゴールド旧発電所','ゴールド','#c5a147'],['アンバー渓谷','アンバー','#c18a43'],['ワカクサ本島EX','若草','#88a954',true],['シアンの砂浜EX','シアン','#46a6b0',true]].map(([id,colorName,color,ex=false])=>({id,name:id.replace('EX',' EX'),colorName,color,ex}));
 const fields=definitions.map(d=>d.id),iso=d=>d.toISOString().slice(0,10),validDay=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d))&&iso(new Date(d))===d;
 const add=(d,n)=>iso(new Date(Date.parse(d)+n*86400000)),day=t=>iso(new Date(new Date(t).getTime()+5*3600000)),local=t=>new Date(new Date(t).getTime()+9*3600000).toISOString().slice(0,16),week=d=>add(d,-(new Date(d).getUTCDay()+6)%7);
 const info=id=>definitions.find(f=>f.id===id)||{id,name:id||'未登録',color:'#d9d9d9',ex:false};
 function validate(rows){if(rows===undefined)return;if(!Array.isArray(rows)||rows.length>100000)throw Error('フィールド履歴');const ids=new Set();for(const r of rows){if(!r||typeof r.id!=='string'||!r.id||ids.has(r.id)||!validDay(r.date)||typeof r.field!=='string'||!r.field.trim()||r.field.length>100||r.time!==null&&r.time!==undefined&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(r.time))throw Error('フィールド履歴の内容を確認してください。');ids.add(r.id);}}
 // A precise time before 04:00 belongs to the following civil date of this game day.
 function instant(r){if(!r.time)return null;const civil=Number(r.time.slice(0,2))<4?add(r.date,1):r.date;return new Date(civil+'T'+r.time+':00+09:00').getTime();}
 function entries(s,d){const start=week(d);return (s.fieldHistory||[]).filter(r=>week(r.date)===start).slice().sort((a,b)=>a.date.localeCompare(b.date)||(!a.time&&b.time?-1:a.time&&!b.time?1:a.time&&b.time?instant(a)-instant(b):0)||a.id.localeCompare(b.id));}
 function references(s,d){return (s.sleepSessions||[]).filter(r=>r.date===d&&r.field).map(r=>({id:r.id,date:r.date,number:r.number,field:r.field,recordedAt:r.recordedAt,updatedAt:r.updatedAt,source:'sleep'}));}
 function resolve(s,when,override=''){
  const timed=typeof when!=='string'||when.includes('T');if(timed&&!Number.isFinite(new Date(when).getTime()))return {field:'',status:'missing',confirmed:false,candidates:[]};const d=timed?day(when):when;if(!validDay(d))return {field:'',status:'missing',date:d,candidates:[]};
  if(override)return {field:override,status:'record',date:d,confirmed:true,candidates:[]};
  const all=entries(s,d),before=all.filter(r=>r.date<d),today=all.filter(r=>r.date===d),prior=before.at(-1),unknown=today.filter(r=>!r.time),eligible=today.filter(r=>r.time&&(!timed||instant(r)<=new Date(when).getTime()));
  let latest=eligible.at(-1)||unknown.at(-1)||prior,ambiguous=!!prior&&new Set(before.filter(r=>r.date===prior.date&&!r.time).map(r=>r.field)).size>1&&!prior.time;
  const sameInstant=eligible.length&&eligible.filter(r=>instant(r)===instant(eligible.at(-1)));
  if(sameInstant&&new Set(sameInstant.map(r=>r.field)).size>1)ambiguous=true;
  if(unknown.length){const possibilities=new Set([...unknown.map(r=>r.field),...(prior?[prior.field]:[]),...today.filter(r=>r.time).map(r=>r.field)]);if(possibilities.size>1)ambiguous=true;}
  // Date-only queries describe the displayed day; timestamp queries must not guess an unknown move time.
  if(latest){const status=timed&&ambiguous?'ambiguous':'confirmed';return {field:status==='ambiguous'?'':latest.field,status,confirmed:status==='confirmed',date:d,entry:latest,candidates:[...new Set([...(prior?[prior.field]:[]),...today.map(r=>r.field)])],changes:today};}
  const old=s.settings?.recordFields?.[d];if(old)return {field:old,status:'legacy',confirmed:true,date:d,candidates:[old],changes:[]};
  const refs=references(s,d),candidates=[...new Set(refs.map(r=>r.field))];return {field:candidates.length===1?candidates[0]:'',status:candidates.length?'sleep':'missing',confirmed:false,date:d,candidates,references:refs,changes:[]};
 }
 function save(s,item){validate([item]);const rows=[...(s.fieldHistory||[]).filter(r=>r.id!==item.id),{...item,time:item.time||null}];validate(rows);return {...s,fieldHistory:rows};}
 function dayView(s,d){const resolved=resolve(s,d),changes=entries(s,d).filter(r=>r.date===d),previous=resolve(s,add(d,-1));let colors=changes.some(r=>r.time)?[previous.confirmed&&week(add(d,-1))===week(d)?previous.field:'',...changes.map(r=>r.field)]:[resolved.field];if(!resolved.confirmed&&resolved.candidates.length)colors=resolved.candidates;colors=colors.filter((f,i)=>i===0||colors[i-1]!==f);return {...resolved,colors,changes,references:references(s,d)};}
 return {definitions,fields,info,validDay,add,day,local,week,instant,validate,entries,references,resolve,save,dayView};
})();
if(typeof module!=='undefined')module.exports=FieldHistory;
