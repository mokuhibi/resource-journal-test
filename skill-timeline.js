'use strict';
// 発動履歴を読むだけの集計。資源の獲得記録には書き戻さない。
const SkillTimeline=(()=>{
 const C=typeof CandyCore!=='undefined'?CandyCore:require('./core.js');
 const skill=r=>r&&(['mew','delibird'].includes(r.method)||r.method==='skill'&&r.source!=='nap_island'&&r.otherKind!=='nap_island'||r.method==='lucky');
 function records(data){
  const main=(data.records||[]).filter(skill),ids=new Set(main.map(r=>r.id));
  const shards=(data.shardRecords||[]).filter(r=>skill(r)&&r.source!=='mew'&&!ids.has(r.activationId||r.id));
  return [...main,...shards].filter(r=>Number.isFinite(Date.parse(r.datetime)));
 }
 const hour=r=>Number(C.localInput(r.datetime).slice(11,13));
 const band=count=>count>=45?'high':count>=30?'mid':'normal';
 const shade=(count,max)=>count===0?0:Math.max(1,Math.ceil(4*count/max));
 function day(data,date){const hours=Array(24).fill(0);for(const r of records(data))if(C.gameDay(r.datetime)===date)hours[(hour(r)+20)%24]++;return {date,total:hours.reduce((a,b)=>a+b,0),hours};}
 function week(data,date){const start=C.range('week',date)[0],days=Array.from({length:7},(_,i)=>day(data,C.addDays(start,i)));return {start,days,max:Math.max(0,...days.flatMap(d=>d.hours))};}
 function month(data,date){const start=C.range('month',date)[0],end=C.range('month',date)[1],days=[];for(let d=start;d<end;d=C.addDays(d,1))days.push(day(data,d));return {start,days};}
 let mode='week',anchor='';
 function show(host,data){
  if(!host)return;anchor||=C.gameDay(new Date());host.replaceChildren();
  const controls=el('div',undefined,'skill-timeline-controls'),period=el('span'),previous=button('‹',()=>move(-1)),next=button('›',()=>move(1));
  for(const [key,name] of [['week','週間'],['month','月間']]){const choice=button(name,()=>{mode=key;show(host,state);});choice.setAttribute('aria-pressed',String(mode===key));controls.append(choice);}
  controls.append(previous,period,next);host.append(controls);
  function move(n){anchor=mode==='week'?C.addDays(anchor,7*n):(()=>{const d=new Date(anchor+'T12:00:00Z');d.setUTCMonth(d.getUTCMonth()+n);return d.toISOString().slice(0,10);})();show(host,state);}
  if(mode==='week'){
   const result=week(data,anchor),grid=el('div',undefined,'skill-timeline-week');period.textContent=C.displayDate(result.start)+' 〜 '+C.displayDate(C.addDays(result.start,6));
   grid.append(el('span','時間','skill-timeline-corner'));
   for(const d of result.days){const head=el('div',undefined,'skill-timeline-day');head.append(el('small',d.date.slice(5).replace('-','/')+C.weekday(d.date)),el('strong',String(d.total),'skill-total-'+band(d.total)));grid.append(head);}
   for(let h=0;h<24;h++){grid.append(el('span',String((h+4)%24).padStart(2,'0'),'skill-timeline-hour'));for(const d of result.days){const n=d.hours[h],cell=el('span',String(n),'skill-timeline-cell skill-shade-'+shade(n,result.max));cell.setAttribute('aria-label',d.date+' '+(h+4)%24+'時 '+n+'回');grid.append(cell);}}
   host.append(grid);
  }else{
   const result=month(data,anchor),grid=el('div',undefined,'skill-timeline-month');period.textContent=result.start.slice(0,7).replace('-','/');
   for(const name of ['月','火','水','木','金','土','日'])grid.append(el('span',name,'skill-timeline-weekday'));
   const offset=(new Date(result.start).getUTCDay()+6)%7;for(let i=0;i<offset;i++)grid.append(el('span',undefined,'skill-timeline-blank'));
   for(const d of result.days){const cell=el('div',undefined,'skill-timeline-monthday');cell.append(el('small',String(Number(d.date.slice(-2)))),el('strong',String(d.total),'skill-total-'+band(d.total)));grid.append(cell);}host.append(grid);
  }
 }
 return {records,skill,hour,band,shade,day,week,month,show};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=SkillTimeline;
