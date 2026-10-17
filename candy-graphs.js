'use strict';
// 表示専用。既存の通常集計フィルター・ゲーム内日付・保存済み獲得数を使用する。
const CandyGraphs=(()=>{
 const colors={help:'#567563',mew:'#a46f85',delibird:'#ae7568',skill:'#686b63'},selection={week:null,month:null};
 const fmt=n=>n.toLocaleString('ja-JP');
 function legend(sources,records){const root=el('div',undefined,'candy-chart-legend');for(const [key,name] of sources){const item=el('span'),dot=el('i');dot.style.background=colors[key];dot.setAttribute('aria-hidden','true');item.append(dot,el('span',name));if(records)item.append(qel('strong',fmt(C.sum(records.filter(r=>r.method===key)))+'個'));root.append(item);}return root;}
 function details(root,records,date,sources){
  root.replaceChildren();const rs=records.filter(r=>C.gameDay(r.datetime)===date),head=el('div',undefined,'graph-detail-head');
  const title=el('h4',C.displayDate(date));head.append(title,qel('strong',fmt(C.sum(rs))+'個','detail-total'));root.append(head);
  const table=el('table',undefined,'graph-detail-table'),thead=el('thead'),tr=el('tr'),body=el('tbody');for(const text of ['獲得方法','回数','アメ'])tr.append(el('th',text));thead.append(tr);table.append(thead,body);
  for(const [key,name] of sources){const xs=rs.filter(r=>r.method===key),row=el('tr'),label=el('th',name);label.scope='row';const dot=el('i',undefined,'source-dot');dot.style.background=colors[key];label.prepend(dot);row.append(label,qel('td',xs.length+'回'),qel('td',fmt(C.sum(xs))+'個'));body.append(row);}root.append(table);
  if(!sources.length||!rs.length)root.append(el('p',sources.length?'この日の記録はありません。':'表示する獲得方法がすべてOFFです。','graph-empty-note'));
  root.append(button('この日の集計を見る →',()=>{RangePicker.set('period',date);DateUI.update();window.scrollTo({top:0,behavior:'auto'});},'day-summary-link'));
 }
 // 内訳は固定表示の吹き出し。開閉・位置調整でページをスクロールしない。
 let opened=null,listening=false;
 function closePopover(restore=false){if(!opened)return;const current=opened;opened=null;current.detail.hidden=true;current.anchor.setAttribute('aria-expanded','false');if(restore)current.anchor.focus({preventScroll:true});}
 function placePopover(){
  if(!opened)return;const {detail,anchor}=opened,box=anchor.getBoundingClientRect(),viewport=window.visualViewport;
  const left=viewport?.offsetLeft||0,top=viewport?.offsetTop||0,width=viewport?.width||window.innerWidth,height=viewport?.height||window.innerHeight;
  const nav=document.querySelector('.tabs')?.getBoundingClientRect(),safe=parseFloat(getComputedStyle(detail).getPropertyValue('--popover-safe-top'))||0,limit=nav&&nav.top>top?Math.min(top+height-12,nav.top-8):top+height-12,minTop=top+safe+8;
  if(box.bottom<=minTop||box.top>=limit){closePopover();return;}
  const w=Math.min(252,width-32);detail.style.width=w+'px';detail.style.maxHeight=Math.max(100,limit-minTop)+'px';const h=detail.getBoundingClientRect().height;
  const above=box.top-h-8,below=box.bottom+8,y=above>=minTop?above:below+h<=limit?below:Math.max(minTop,limit-h);
  detail.style.left=Math.max(left+16,Math.min(box.left+box.width/2-w/2,left+width-16-w))+'px';detail.style.top=y+'px';
 }
 function popover(detail,anchor,records,date,sources){
  if(opened?.anchor===anchor){closePopover();return;}
  closePopover();details(detail,records,date,sources);detail.classList.add('candy-day-popover');detail.hidden=false;detail.setAttribute('role','region');detail.setAttribute('aria-label','選択した日の内訳');
  const close=button('×',()=>closePopover(true),'graph-popover-close');close.setAttribute('aria-label','内訳を閉じる');detail.prepend(close);opened={detail,anchor};anchor.setAttribute('aria-expanded','true');placePopover();
  if(!listening){listening=true;document.addEventListener('click',e=>{if(opened&&!opened.detail.contains(e.target)&&!opened.anchor.contains(e.target))closePopover();});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&opened){e.preventDefault();closePopover(true);}});window.addEventListener('scroll',placePopover,{passive:true});window.addEventListener('resize',placePopover);window.visualViewport?.addEventListener('resize',placePopover);window.visualViewport?.addEventListener('scroll',placePopover);}
 }
 function weekly(root,records,day){
  closePopover();records=SummaryExtras.candyRecords(records);const sources=SummaryExtras.visibleCandySources(),days=C.weeklyTotals(records,day),parts=sources.map(([key])=>C.weeklyTotals(records.filter(r=>r.method===key),day));
  const weekRecords=records.filter(r=>C.inRange(r,C.range('week',day)));root.replaceChildren();headingTotal(root.id,C.sum(weekRecords));$('candy-week-totals').replaceChildren();$('candy-week-totals').hidden=true;
  root.append(el('p',C.displayDate(days[0].date)+' 〜 '+C.displayDate(days[6].date),'weekly-range'),legend(sources,weekRecords));
  selection.week=days.some(d=>d.date===selection.week)?selection.week:days.some(d=>d.date===day)?day:days[0].date;
  const max=Math.max(1,...days.map(d=>d.amount)),power=10**Math.floor(Math.log10(max)),ceiling=[1,2,2.5,4,5,10].map(n=>n*power).find(n=>n>=max);
  const visual=el('div',undefined,'capsule-visual'),grid=el('div',undefined,'capsule-grid'),columns=el('div',undefined,'capsule-columns'),detail=el('div',undefined,'graph-detail');detail.id='candy-week-detail';detail.hidden=true;grid.setAttribute('aria-hidden','true');for(let i=0;i<3;i++)grid.append(el('i'));
  const buttons=days.map((d,i)=>{const b=button('',()=>{selection.week=d.date;update();popover(detail,b,records,d.date,sources);},'capsule-day'),track=el('span',undefined,'capsule-track'),group=el('span',undefined,'capsule-stack-group'),stack=el('span',undefined,'capsule-stack');
   b.setAttribute('aria-label',C.displayDate(d.date)+' 合計'+fmt(d.amount)+'個');b.setAttribute('aria-controls',detail.id);b.setAttribute('aria-expanded','false');b.dataset.date=d.date;
   group.style.height=(d.amount/ceiling*164)+'px';group.append(el('strong',fmt(d.amount),'capsule-total'+(!d.amount?' zero':'')));
   for(const [j,[key,name]] of sources.entries()){const amount=parts[j][i].amount;if(!amount)continue;const segment=el('span',undefined,'capsule-segment');segment.dataset.source=key;segment.dataset.amount=amount;segment.style.height=(amount/d.amount*100)+'%';segment.style.background=colors[key];segment.title=name+' '+fmt(amount)+'個';if(amount/ceiling*164>=18)segment.append(el('span',fmt(amount)));stack.append(segment);}
   group.append(d.amount?stack:el('span',undefined,'capsule-zero'));track.append(group);b.append(track,el('span',['月','火','水','木','金','土','日'][i],'capsule-weekday'),el('span',Number(d.date.slice(-2)),'capsule-date'));columns.append(b);return b;});
  function update(){buttons.forEach(b=>b.setAttribute('aria-pressed',b.dataset.date===selection.week?'true':'false'));}
  visual.append(grid,columns);root.append(visual,detail);if(!C.sum(weekRecords))root.append(el('p',sources.length?'この週の記録はありません。':'表示する獲得方法がすべてOFFです。','graph-empty-note'));update();
 }
 function heatLevel(value,min,max){return !value?0:min===max?4:Math.min(4,1+Math.floor((value-min)/(max-min)*4));}
 function monthly(records,day){
  closePopover();records=SummaryExtras.candyRecords(records);const month=day.slice(0,7),root=$('candy-calendar'),sources=SummaryExtras.visibleCandySources(),rs=records.filter(r=>C.gameDay(r.datetime).startsWith(month)),totals=new Map();
  for(const r of rs){const date=C.gameDay(r.datetime);totals.set(date,(totals.get(date)||0)+r.amount);}
  const positives=[...totals.values()].filter(n=>n>0),min=Math.min(...positives),max=Math.max(0,...positives);
  $('candy-month').textContent=month.replace('-','年')+'月';$('candy-month-legend').replaceChildren(...legend(sources,rs).children);headingTotal(root.id,C.sum(rs));$('candy-month-totals').replaceChildren();$('candy-month-totals').hidden=true;
  if(!selection.month?.startsWith(month))selection.month=day;
  let detail=$('candy-month-detail');if(!detail){detail=el('div',undefined,'graph-detail');detail.id='candy-month-detail';root.after(detail);}
  detail.hidden=true;
  let key=$('candy-heat-key');if(!key){key=el('div',undefined,'heat-key');key.id='candy-heat-key';root.after(key);}key.replaceChildren(el('span','少ない'));for(let level=0;level<5;level++){const swatch=el('i');swatch.dataset.level=level;swatch.setAttribute('aria-hidden','true');key.append(swatch);}key.append(el('span','多い'));
  const buttons=[];calendar(root,month,date=>{const amount=totals.get(date)||0,b=button('',()=>{selection.month=date;update();popover(detail,b,records,date,sources);},'day');b.dataset.level=heatLevel(amount,min,max);b.dataset.date=date;b.setAttribute('aria-controls',detail.id);b.setAttribute('aria-expanded','false');b.setAttribute('aria-label',C.displayDate(date)+' 合計'+fmt(amount)+'個');b.append(el('span',Number(date.slice(-2)),'day-number'),el('strong',fmt(amount),'day-total'));buttons.push(b);return b;});
  function update(){buttons.forEach(b=>b.setAttribute('aria-pressed',b.dataset.date===selection.month?'true':'false'));}update();
 }
 return {weekly,monthly,heatLevel};
})();
