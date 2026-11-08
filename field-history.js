'use strict';
// History dates are game dates (JST 04:00 boundary). A null time is not midnight.
const FieldHistory=(()=>{
 const definitions=[['ワカクサ本島','若草','#88a954'],['シアンの砂浜','シアン','#46a6b0'],['トープ洞窟','トープ','#9b8b78'],['ウノハナ雪原','ウノハナ','#d8d8c1'],['ラピスラズリ湖畔','ラピスラズリ','#5276b4'],['ゴールド旧発電所','ゴールド','#c5a147'],['アンバー渓谷','アンバー','#c18a43'],['ワカクサ本島EX','若草','#88a954',true],['シアンの砂浜EX','シアン','#46a6b0',true]].map(([id,colorName,color,ex=false])=>({id,name:id.replace('EX',' EX'),colorName,color,ex}));
 const fields=definitions.map(d=>d.id),iso=d=>d.toISOString().slice(0,10),validDay=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d))&&iso(new Date(d))===d;
 const add=(d,n)=>iso(new Date(Date.parse(d)+n*86400000)),day=t=>iso(new Date(new Date(t).getTime()+5*3600000)),local=t=>new Date(new Date(t).getTime()+9*3600000).toISOString().slice(0,16),week=d=>add(d,-(new Date(d).getUTCDay()+6)%7);
 const info=id=>definitions.find(f=>f.id===id)||{id,name:id||'未登録',color:'#d9d9d9',ex:false};
 function labelColors(id){const background=info(id).color,rgb=background.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=0.04045?x/12.92:((x+0.055)/1.055)**2.4),l=rgb[0]*0.2126+rgb[1]*0.7152+rgb[2]*0.0722;return {background,color:(l+0.05)/0.0556>=1.05/(l+0.05)?'#111111':'#ffffff'};}
 function validate(rows){if(rows===undefined)return;if(!Array.isArray(rows)||rows.length>100000)throw Error('フィールド履歴');const ids=new Set();for(const r of rows){if(!r||typeof r.id!=='string'||!r.id||ids.has(r.id)||!validDay(r.date)||typeof r.field!=='string'||!r.field.trim()||r.field.length>100||!['day','week','record',undefined].includes(r.scope)||r.scope==='record'&&(!r.sourceId||typeof r.sourceId!=='string')||r.time!==null&&r.time!==undefined&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(r.time))throw Error('フィールド履歴の内容を確認してください。');ids.add(r.id);}}
 // A precise time before 04:00 belongs to the following civil date of this game day.
 function instant(r){if(!r.time)return null;const civil=Number(r.time.slice(0,2))<4?add(r.date,1):r.date;return new Date(civil+'T'+r.time+':00+09:00').getTime();}
 function entries(s,d){const start=week(d);return (s.fieldHistory||[]).filter(r=>week(r.date)===start).slice().sort((a,b)=>a.date.localeCompare(b.date)||(!a.time&&b.time?-1:a.time&&!b.time?1:a.time&&b.time?instant(a)-instant(b):0)||a.id.localeCompare(b.id));}
 function references(s,d){return (s.sleepSessions||[]).filter(r=>r.date===d&&r.field).map(r=>({id:r.id,date:r.date,number:r.number,field:r.field,recordedAt:r.recordedAt,updatedAt:r.updatedAt,source:'sleep'}));}
 function weekState(s,d){const rows=(s.fieldHistory||[]).filter(r=>r.date===week(d)&&['week','record'].includes(r.scope)),entry=rows.filter(r=>r.scope==='week'&&r.confirmed===true).at(-1)||rows.filter(r=>r.scope==='record').at(-1)||rows.filter(r=>r.scope==='week').at(-1);return entry?{field:entry.field,status:entry.scope==='week'&&entry.confirmed!==true?'provisional':'confirmed',confirmed:entry.scope==='record'||entry.confirmed===true,date:d,entry,candidates:[entry.field]}:null;}
 function resolve(s,when,override=''){
  const timed=typeof when!=='string'||when.includes('T');if(timed&&!Number.isFinite(new Date(when).getTime()))return {field:'',status:'missing',confirmed:false,candidates:[]};const d=timed?day(when):when;if(!validDay(d))return {field:'',status:'missing',date:d,candidates:[]};
  if(override)return {field:override,status:'record',date:d,confirmed:true,candidates:[]};
  const weekly=weekState(s,d);if(weekly)return weekly;
  const rows=entries(s,d),daily=rows.filter(r=>r.date===d&&r.scope==='day'),dayEntry=daily.filter(r=>!r.time).at(-1)||daily.filter(r=>!timed||instant(r)<=new Date(when).getTime()).at(-1);
  if(dayEntry)return {field:dayEntry.field,status:'confirmed',confirmed:true,date:d,entry:dayEntry,candidates:[dayEntry.field],changes:daily};
  const all=rows.filter(r=>r.scope!=='day'),before=all.filter(r=>r.date<d),today=all.filter(r=>r.date===d),prior=before.at(-1),unknown=today.filter(r=>!r.time),eligible=today.filter(r=>r.time&&(!timed||instant(r)<=new Date(when).getTime()));
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
 // Day selections override the displayed day without changing legacy weekly/timed rows.
 function saveDay(s,d,field,id){const old=(s.fieldHistory||[]).find(r=>r.date===d&&r.scope==='day'&&!r.time);return save(s,{id:old?.id||id,date:d,time:null,field,scope:'day'});}
 function saveWeek(s,d,field,id,confirmed=false){const start=week(d),old=(s.fieldHistory||[]).find(r=>r.date===start&&r.scope==='week'&&r.confirmed===confirmed),rows=(s.fieldHistory||[]).filter(r=>r.id!==old?.id);return save({...s,fieldHistory:rows},{id:old?.id||id,date:start,time:null,field,scope:'week',confirmed});}
 function savedSources(s){const found=new Map(),addSource=(id,date,field,row)=>{if(validDay(date)&&fields.includes(field))found.set(id,{date,field,row:JSON.stringify(row)});};for(const r of s.records||[])if(r.datetime)addSource('record:'+r.id,day(r.datetime),r.field||r.context?.fieldContext?.field,r);for(const r of s.shardRecords||[])if(r.datetime)addSource('shard:'+r.id,r.targetDate||day(r.datetime),r.field||r.fieldContext?.field,r);for(const r of s.sleepSessions||[])if(r.candyRecorded!==false||r.shardsRecorded!==false)addSource('sleep:'+r.id,r.date,r.field,r);return found;}
 function syncSaved(before,next){const prior=savedSources(before),current=savedSources(next),rows=(next.fieldHistory||[]).filter(r=>r.scope!=='record'||current.has(r.sourceId));for(const [sourceId,value] of current){if(prior.get(sourceId)?.row===value.row)continue;const start=week(value.date),id='saved-field:'+sourceId;for(let i=rows.length-1;i>=0;i--)if(rows[i].sourceId===sourceId)rows.splice(i,1);rows.push({id,date:start,time:null,field:value.field,scope:'record',sourceId});}return {...next,fieldHistory:rows};}
 // New weekly selections can seed an input; older history rows keep their original display behavior.
 function inherited(s,when){
  const timed=typeof when!=='string'||when.includes('T'),target=timed?new Date(when).getTime():Infinity,d=timed&&Number.isFinite(target)?day(when):when;
  if(!validDay(d))return {field:'',status:'missing',confirmed:false};
  const weekly=weekState(s,d);if(weekly)return {...weekly,status:weekly.confirmed?'inherited':'provisional'};
  const first=week(d),candidates=[];
  const addRecord=(r,field)=>{const at=Date.parse(r.datetime);if(!fields.includes(field)||!Number.isFinite(at)||at>target)return;const date=day(at);if(date>=first&&date<=d)candidates.push({field,at});};
  for(const r of s.records||[])addRecord(r,r.field||r.context?.fieldContext?.field);
  for(const r of s.shardRecords||[])if(['skill','lucky'].includes(r.method))addRecord(r,r.field||r.fieldContext?.field);
  for(const r of s.sleepSessions||[]){
   if(!fields.includes(r.field)||!validDay(r.date)||r.date<first||r.date>d||r.candyRecorded===false&&r.shardsRecorded===false)continue;
   const saved=Date.parse(r.recordedAt),sameDay=Number.isFinite(saved)&&day(saved)===r.date;
   // A session has a game date, but no research time. For same-day timestamp queries,
   // use its save time only when that time belongs to the same game day.
   if(timed&&r.date===d&&(!sameDay||saved>target))continue;
   candidates.push({field:r.field,at:sameDay?saved:Date.parse(r.date+'T04:00:00+09:00')});
  }
  candidates.sort((a,b)=>a.at-b.at);const latest=candidates.at(-1);
  return latest?{field:latest.field,status:'inherited',confirmed:false}:{field:'',status:'missing',confirmed:false};
 }
 function dayView(s,d){const resolved=resolve(s,d),changes=entries(s,d).filter(r=>r.date===d),previous=resolve({...s,fieldHistory:(s.fieldHistory||[]).filter(r=>r.scope!=='day')},add(d,-1));let colors=resolved.entry?.scope==='day'&&!resolved.entry.time?[resolved.field]:changes.some(r=>r.time)?[previous.confirmed&&week(add(d,-1))===week(d)?previous.field:'',...changes.map(r=>r.field)]:[resolved.field];if(!resolved.confirmed&&resolved.candidates.length)colors=resolved.candidates;colors=colors.filter((f,i)=>i===0||colors[i-1]!==f);return {...resolved,colors,changes,references:references(s,d)};}
 return {definitions,fields,info,labelColors,validDay,add,day,local,week,instant,validate,entries,references,resolve,save,saveDay,saveWeek,syncSaved,inherited,dayView};
})();
if(typeof module!=='undefined')module.exports=FieldHistory;
