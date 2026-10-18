'use strict';
const WeeklyChart={
 fitLabels(root){
  this.observers??=new WeakMap();this.observers.get(root)?.disconnect();
  const fit=()=>{for(const label of root.querySelectorAll('.stack-label')){const segment=label.parentElement;label.style.visibility=segment.clientHeight>=16&&segment.clientWidth>=label.scrollWidth+2?'visible':'hidden';}};
  if(typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(fit);observer.observe(root);this.observers.set(root,observer);}fit();
 },
 segmentLabel(segment,amount,shards){if(amount&&(!shards||amount>=10000)){const label=el('span',shards?this.manAmount(amount):amount.toLocaleString('ja-JP'),'stack-label');segment.append(label);}},
 // Display only: discard whole-item remainders before formatting the decimal.
 manAmount(n,suffix=''){return n===0?'0':(Math.floor(n/1000)/10).toFixed(1)+suffix;},
 renderShards(root,records,day){
  CandyGraphs.closePopover();
  const sources=SummaryExtras.shardSources;
  const days=C.weeklyTotals(records,day),max=Math.max(1,...days.map(d=>d.amount));
  const parts=sources.map(([key])=>C.weeklyTotals(records.filter(r=>key==='skill'?['skill','lucky'].includes(r.method):r.method===key),day));
  root.replaceChildren();headingTotal(root.id,days.reduce((n,d)=>n+d.amount,0));
  SummaryExtras.sourceTotals($('shard-week-totals'),'shard',records.filter(r=>C.inRange(r,C.range('week',day))));
  root.append(el('p',`${C.displayDate(days[0].date)} 〜 ${C.displayDate(days[6].date)}`,'weekly-range'));
  const legend=el('div',undefined,'shard-chart-legend');
  for(const [key,name] of sources){const item=el('span'),swatch=el('i',undefined,'shard-source-'+key);swatch.setAttribute('aria-hidden','true');item.append(swatch,el('span',name));legend.append(item);}root.append(legend,el('small','万個','shard-chart-unit'));
  const chart=el('div',undefined,'weekly-bars shard-stacked-chart');
  const popup=el('div',undefined,'graph-detail');popup.id='shard-week-detail';popup.hidden=true;
  const columns=[];
  days.forEach((d,i)=>{
   const col=button('',()=>{this.shardSelection=d.date;columns.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.date===d.date)));CandyGraphs.popover(popup,col,records,d.date,sources,'shard');},'weekly-column'),value=el('span',this.manAmount(d.amount),'weekly-value'),track=el('div',undefined,'weekly-track'),bar=el('div',undefined,'weekly-bar');
   const detail=C.displayDate(d.date)+'：合計 '+d.amount.toLocaleString('ja-JP')+'個。'+sources.map(([key,name],j)=>name+' '+parts[j][i].amount.toLocaleString('ja-JP')+'個').filter(Boolean).join('、');
   col.dataset.date=d.date;col.setAttribute('aria-controls',popup.id);col.setAttribute('aria-expanded','false');col.setAttribute('aria-pressed',String(this.shardSelection===d.date));columns.push(col);col.setAttribute('aria-label',detail);col.title=detail;bar.style.height=(d.amount/max*100)+'%';
   for(const [j,[key]] of sources.entries()){const segment=el('span',undefined,'shard-source-'+key);segment.style.height=(d.amount?parts[j][i].amount/d.amount*100:0)+'%';this.segmentLabel(segment,parts[j][i].amount,true);bar.append(segment);}
   track.append(bar);col.append(value,track,el('span',['月','火','水','木','金','土','日'][i],'weekly-weekday'),el('small',Number(d.date.slice(-2)),'weekly-day-number'));chart.append(col);
  });root.append(chart,popup);this.fitLabels(root);
 },
 renderCandy(root,records,day){
  return CandyGraphs.weekly(root,records,day);
 },
 render(root,records,day){
  if(root.id==='candy-weekly-chart')return this.renderCandy(root,records,day);
  if(root.id==='shard-weekly-chart')return this.renderShards(root,records,day);
  const days=C.weeklyTotals(records,day),max=Math.max(1,...days.map(d=>d.amount));root.replaceChildren();headingTotal(root.id,days.reduce((n,d)=>n+d.amount,0));
  root.append(el('p',`${C.displayDate(days[0].date)} 〜 ${C.displayDate(days[6].date)}`,'weekly-range'));
  const chart=el('div',undefined,'weekly-bars');chart.setAttribute('role','img');chart.setAttribute('aria-label',days.map((d,i)=>`${['月','火','水','木','金','土','日'][i]} ${d.date} ${d.amount}個`).join('、'));
  days.forEach((d,i)=>{const col=el('div',undefined,'weekly-column'),value=el('span',d.amount.toLocaleString('ja-JP'),'weekly-value'),track=el('div',undefined,'weekly-track'),bar=el('div',undefined,'weekly-bar');bar.style.height=(d.amount/max*100)+'%';track.append(bar);col.append(value,track,el('span',C.displayDate(d.date),'weekly-date'));col.title=C.displayDate(d.date)+'：'+d.amount.toLocaleString('ja-JP')+'個';chart.append(col);});root.append(chart);this.fitLabels(root);
 }
};
