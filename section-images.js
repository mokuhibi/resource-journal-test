'use strict';
// 描画済みの表示だけを読む。記録・設定・集計の状態は変更しない。
const SectionImages=(()=>{
 const definitions=[
  ['candy-breakdown','アメゲットの記録','#summary-total','candy'],
  ['candy-types','ポケモンのアメ一覧','#candy-list','candy','create-candy-image'],
  ['candy-week','週間のアメ','#candy-weekly-chart','candy'],
  ['candy-month','月間のアメ','#candy-calendar','candy'],
  ['candy-help','アメ拾いの記録','#slot-counts','candy'],
  ['candy-get','メインスキルの記録','#analysis','candy','create-mew-image'],
  ['shard-breakdown','ゆめのかけらの記録','#shard-total','shard'],
  ['shard-week','週間のゆめのかけら','#shard-weekly-chart','shard'],
  ['shard-month','月間のゆめのかけら','#shard-calendar','shard']
 ];
 const text=e=>(e?.innerText??e?.textContent??'').trim().replace(/([\d,])\s+(個|匹|回)(?=\s|$)/g,'$1$2');
 const visible=e=>!e.hidden&&getComputedStyle(e).display!=='none';
 function table(e){return {type:'table',caption:text(e.querySelector('caption')),rows:[...e.rows].filter(r=>!r.hidden).map(r=>({header:r.parentElement.tagName==='THEAD',strong:r.classList.contains('mew-all')||r.classList.contains('mew-totals'),sourceColor:r.className.startsWith('shard-method-')?getComputedStyle(r.cells[0]).color:undefined,cells:[...r.cells].map(c=>({text:text(c),color:getComputedStyle(c).color}))}))};}
 function legend(e){return {type:'legend',items:[...e.children].filter(visible).map(x=>{const dot=x.querySelector('i'),fallback=dot?.className?.startsWith('shard-source-')?document.querySelector('#shard-weekly-chart .'+dot.className):null;let color=getComputedStyle(dot||x).backgroundColor;if(color==='rgba(0, 0, 0, 0)'&&fallback)color=getComputedStyle(fallback).backgroundColor;return {text:text(x),color};})};}
 function week(e,shard){
  const cols=[...e.querySelectorAll(shard?'.weekly-column':'.capsule-day')];
  return {type:'week',topAtBar:!shard,days:cols.map(d=>{
   const bar=d.querySelector(shard?'.weekly-bar':'.capsule-stack'),h=shard?parseFloat(bar.style.height)/100:parseFloat(d.querySelector('.capsule-stack-group').style.height)/164;
   return {total:text(d.querySelector(shard?'.weekly-value':'.capsule-total')),weekday:text(d.querySelector(shard?'.weekly-weekday':'.capsule-weekday')),date:text(d.querySelector(shard?'.weekly-day-number':'.capsule-date')),height:h,selected:d.getAttribute('aria-pressed')==='true',segments:[...(bar?.children||[])].map(s=>({ratio:parseFloat(s.style.height)/100,color:getComputedStyle(s).backgroundColor,label:[...s.children].filter(x=>s.clientHeight>=16&&s.clientWidth>=x.scrollWidth+2).map(text).join(' ')}))};
  })};
 }
 function month(e){const children=[...e.children],first=children.findIndex(x=>x.matches('button.day'));return {type:'month',offset:Math.max(0,first-7),days:children.filter(x=>x.matches('button.day')).map(d=>({day:text(d.querySelector('.day-number')),total:text(d.querySelector('.day-total')),color:getComputedStyle(d).backgroundColor,selected:d.getAttribute('aria-pressed')==='true'})),key:[...e.parentElement.querySelectorAll('.heat-key i')].map(x=>getComputedStyle(x).backgroundColor)};}
 function blocks(root){
  const out=[];
  function visit(e){
   if(!visible(e)||e.matches('button,input,select,label,dialog,.candy-source-switches,.graph-detail,.heat-key,.summary-section-head,h3'))return;
   if(e.matches('.capsule-visual,.shard-stacked-chart'))return;
   if(e.matches('.calendar')){out.push(month(e));return;}
   if(e.matches('#candy-weekly-chart,#shard-weekly-chart')){
    for(const child of e.children)if(child.matches('p:not(.weekly-range),.shard-chart-legend,.candy-chart-legend'))visit(child);
    out.push(week(e,e.id==='shard-weekly-chart'));return;
   }
   if(e.tagName==='TABLE'){out.push(table(e));return;}
   if(e.matches('.candy-chart-legend,.shard-chart-legend,.month-legend')){out.push(legend(e));return;}
   if(e.matches('details')&&!e.open){const s=e.querySelector('summary');if(s)out.push({type:'text',text:text(s),muted:true});return;}
   if(e.matches('.source-total-row,.mew-position-head')){out.push({type:'text',text:text(e).replace(/\n/g,'　'),bold:true});return;}
   if(e.matches('p,h4,h5,caption,.total,.mew-amount-note,small,summary')){const value=text(e);if(value)out.push({type:'text',text:value,bold:e.matches('h4,h5,.total'),size:e.matches('.total')?34:undefined,muted:e.matches('p,small,summary')});return;}
   for(const child of e.children)visit(child);
  }visit(root);return out;
 }
 function captureVisible(key){
  const d=definitions.find(d=>d[0]===key);if(!d)throw Error('画像の項目が見つかりません。');
  const [id,title,selector,kind]=d,root=document.querySelector(selector);if(!root)throw Error('対象のタブを表示してください。');
  const graph=/-week$|-month$/.test(id),section=root.closest('.card'),period=RangePicker.get(kind==='shard'?'shard-period':'period');
  let label=period?C.displayDate(period[0])+(C.addDays(period[1],-1)===period[0]?'':' 〜 '+C.displayDate(C.addDays(period[1],-1))):'全期間';
  if(id.endsWith('-week'))label=text(root.querySelector('.weekly-range'));
  if(id.endsWith('-month'))label=text(section.querySelector('.calendar-month'));
  const result=[];
  if(graph){const controls=section.querySelector('.candy-source-switches');if(controls)result.push({type:'legend',items:[...controls.querySelectorAll('button[aria-pressed=true]')].map(b=>({text:text(b),color:getComputedStyle(b).backgroundColor}))});}
  if(id==='candy-get')for(const select of document.querySelectorAll('#analysis-card select'))if(!select.closest('label').hidden)result.push({type:'text',text:text(select.closest('label').firstChild)+'：'+text(select.selectedOptions[0]),muted:true});
  const heading=section?.querySelector('h3 .heading-total');if(heading)result.push({type:'text',text:text(heading),bold:true,size:26});
  if(id.endsWith('-breakdown')){result.push(...blocks(root));const rows=[...root.querySelectorAll('tbody tr')];if(rows.every(r=>/^0回$/.test(text(r.cells[1]))))result.push({type:'text',text:'この条件の記録はありません。',muted:true});}
  else if(graph){for(const child of section.children)if(!child.matches('h3,.summary-section-head,.graph-detail,.heat-key,.calendar-month'))result.push(...blocks(child));}
  else{if(id==='candy-types')result.push(...blocks(document.querySelector('#candy-source-totals')));result.push(...blocks(root));}
  if(!result.length)result.push({type:'text',text:'この条件の記録はありません。',muted:true});
  return {title:(kind==='candy'?'アメ':'ゆめのかけら')+'｜'+title,period:label,blocks:result};
 }
 // 非表示タブも同じ幅で一時測定する。表示タブ・スクロール・保存状態は変更しない。
 function capture(key){
  const d=definitions.find(d=>d[0]===key),root=d&&document.querySelector(d[2]),section=root?.closest('section');
  if(!section?.hidden)return captureVisible(key);
  const css=section.style.cssText,width=document.querySelector('section:not([hidden])')?.getBoundingClientRect().width||350;
  try{section.style.cssText=`position:fixed;left:-10000px;top:0;width:${width}px;pointer-events:none;`;section.hidden=false;return captureVisible(key);}
  finally{section.hidden=true;section.style.cssText=css;}
 }
 function combined(keys,title){
  return {title,period:'各項目の対象期間を表示',blocks:keys.flatMap(key=>{const m=capture(key);return [{type:'section',text:m.title,period:m.period},...m.blocks];})};
 }
 function pages(model){
  const W=600,M=28,inner=W-M*2,limit=1800,ink='#202124',muted='#777C80',line='#ECEDEE',font='-apple-system, BlinkMacSystemFont, "Hiragino Kaku Gothic ProN", sans-serif';
  const probe=document.createElement('canvas').getContext('2d');if(!probe)throw Error('この環境では画像を生成できません。');
  const setFont=(c,size,bold=false)=>c.font=`${bold?600:400} ${size}px ${font}`;
  function wrap(value,width,size){setFont(probe,size);const lines=[];for(const paragraph of String(value).split('\n')){let row='';for(const ch of paragraph.match(/[\d,]+(?:個|匹|回)|[\s\S]/g)||[]){if(row&&probe.measureText(row+ch).width>width){lines.push(row);row='';}row+=ch;}lines.push(row);}return lines;}
  const tasks=[];
  for(const b of model.blocks){
   if(b.type==='section'){const lines=wrap(b.text,inner,23),periodLines=wrap(b.period,inner,16);tasks.push({...b,lines,periodLines,height:lines.length*31+periodLines.length*24+26});}
   else if(b.type==='table'){
    if(!b.rows.length)continue;const n=b.rows[0].cells.length,first=n>=6?108:n===4?220:Math.min(250,inner*.46),widths=[first,...Array(n-1).fill((inner-first)/(n-1))];
    const prepare=r=>({...r,lines:r.cells.map((c,i)=>wrap(c.text,widths[i]-14,n>=6?14:16))});const header=b.rows.find(r=>r.header),head=header?prepare(header):null;
    if(b.caption)tasks.push({type:'text',text:b.caption,bold:true,lines:wrap(b.caption,inner,18),size:18,height:38});
    for(const row of b.rows){const r=prepare(row),max=Math.max(...r.lines.map(x=>x.length));for(let start=0;start<max;start+=35){const part={...r,lines:r.lines.map(x=>x.slice(start,start+35))};tasks.push({type:'row',row:part,head,widths,size:n>=6?14:16,height:Math.max(42,Math.min(35,max-start)*23+18)});}}
   }else if(b.type==='text'){const size=b.size||17,lines=wrap(b.text,inner,size);for(let i=0;i<lines.length;i+=35)tasks.push({...b,size,lines:lines.slice(i,i+35),height:Math.min(35,lines.length-i)*(size+8)+14});}
   else if(b.type==='legend'){let y=0,x=0;const items=[];for(const item of b.items){const lines=wrap(item.text,inner-22,14),w=Math.min(inner,Math.max(...lines.map(s=>{setFont(probe,14);return probe.measureText(s).width;}))+30);if(x+w>inner){x=0;y+=30;}items.push({...item,lines,x,y});x+=w;}tasks.push({...b,items,height:y+Math.max(30,...items.map(i=>i.lines.length*21+8))});}
   else tasks.push({...b,height:b.type==='week'?370:Math.ceil((b.offset+b.days.length)/7)*84+70});
  }
  const titleLines=wrap(model.title,inner,24),periodLines=wrap(model.period,inner,16),top=36+titleLines.length*32+periodLines.length*24+22;
  const batches=[];let batch=[],y=top,sectionHead=null;
  function nextPage(t){batches.push(batch);batch=[];y=top;
   if(sectionHead&&t.type!=='section'){batch.push(sectionHead);y+=sectionHead.height;}
   if(t.type==='row'&&!t.row.header&&t.head){const repeated={...t,row:t.head,height:Math.max(42,Math.max(...t.head.lines.map(x=>x.length))*23+18)};batch.push(repeated);y+=repeated.height;}
  }
  for(let i=0;i<tasks.length;i++){const t=tasks[i];
   if(t.type==='section'){
    let end=i+1;while(end<tasks.length&&tasks[end].type!=='section')end++;
    const groupHeight=tasks.slice(i,end).reduce((n,x)=>n+x.height,0),needed=groupHeight+top+60<=limit?groupHeight:t.height+(tasks[i+1]?.height||0)+(tasks[i+2]?.height||0);
    if(batch.length&&y+needed+60>limit)nextPage(t);sectionHead=t;
   }
   if(y+t.height+60>limit&&batch.length)nextPage(t);
   batch.push(t);y+=t.height;
  }if(batch.length||!batches.length)batches.push(batch);
  return batches.map((batch,page)=>{
   const h=Math.max(300,top+batch.reduce((n,t)=>n+t.height,0)+54),canvas=document.createElement('canvas');canvas.width=W*2;canvas.height=Math.ceil(h*2);const c=canvas.getContext('2d');if(!c)throw Error('画像を生成できません。');c.scale(2,2);c.fillStyle='#FFFFFF';c.fillRect(0,0,W,h);
   function txt(value,x,y,size=17,bold=false,color=ink,align='left'){setFont(c,size,bold);c.fillStyle=color;c.textAlign=align;c.fillText(String(value),x,y);}
   function rule(y){c.beginPath();c.strokeStyle=line;c.lineWidth=1;c.moveTo(M,y);c.lineTo(W-M,y);c.stroke();}
   function rounded(x,y,w,h,r,color){if(w<=0||h<=0)return;c.beginPath();c.roundRect(x,y,w,h,Math.min(r,w/2,h/2));c.fillStyle=color;c.fill();}
   let y=36;for(const s of titleLines){txt(s,M,y,24,true);y+=32;}for(const s of periodLines){txt(s,M,y,16,false,muted);y+=24;}y=top;
   for(const t of batch){
    if(t.type==='section'){let yy=y+23;for(const line of t.lines){txt(line,M,yy,23,true);yy+=31;}for(const line of t.periodLines){txt(line,M,yy,16,false,muted);yy+=24;}}
    if(t.type==='text')t.lines.forEach((s,i)=>txt(s,M,y+t.size+i*(t.size+8),t.size,t.bold,t.muted?muted:ink));
    if(t.type==='legend')for(const item of t.items){rounded(M+item.x,y+item.y+7,7,7,4,item.color==='rgba(0, 0, 0, 0)'?muted:item.color);item.lines.forEach((s,i)=>txt(s,M+item.x+14,y+item.y+15+i*21,14,false,muted));}
    if(t.type==='row'){let x=M;for(let j=0;j<t.row.cells.length;j++){const color=t.row.header?muted:(!j&&t.row.sourceColor)||ink;t.row.lines[j].forEach((s,i)=>txt(s,j?x+t.widths[j]-7:x,y+25+i*23,t.size,t.row.strong||(!t.row.header&&j===1),color,j?'right':'left'));x+=t.widths[j];}rule(y+t.height-5);}
    if(t.type==='week'){
     const cw=inner/7,base=y+300;for(let i=0;i<3;i++)rule(y+38+i*111);
     t.days.forEach((d,i)=>{const x=M+i*cw,cx=x+cw/2,bh=d.height*220;if(d.selected)rounded(x+3,y+4,cw-6,358,6,'#F5F6F6');const totals=wrap(d.total,cw-10,16),ty=t.topAtBar?Math.max(y+24,base-bh-10-(totals.length-1)*20):y+24;totals.forEach((value,j)=>txt(value,cx,ty+j*20,16,true,ink,'center'));if(bh){c.save();c.beginPath();c.roundRect(cx-16,base-bh,32,bh,16);c.clip();let bottom=base;for(const s of d.segments){const sh=bh*s.ratio;c.fillStyle=s.color;c.fillRect(cx-16,bottom-sh,32,sh);if(s.label&&sh>=20){setFont(c,13,true);const size=Math.min(13,13*28/Math.max(1,c.measureText(s.label).width));if(size>=9)txt(s.label,cx,bottom-sh/2+5,size,true,'#FFFFFF','center');}bottom-=sh;}c.restore();}else rounded(cx-10,base-3,20,3,2,'#DCDDDF');txt(d.weekday,cx,base+25,15,false,muted,'center');txt(d.date,cx,base+49,14,false,muted,'center');});
    }
    if(t.type==='month'){
     const cw=inner/7;['月','火','水','木','金','土','日'].forEach((s,i)=>txt(s,M+(i+.5)*cw,y+19,15,false,muted,'center'));
     t.days.forEach((d,i)=>{const j=t.offset+i,x=M+(j%7)*cw+3,yy=y+32+Math.floor(j/7)*84;rounded(x,yy,cw-6,78,6,d.color);if(d.selected){c.strokeStyle='#555D58';c.lineWidth=1.5;c.strokeRect(x+1,yy+1,cw-8,76);}txt(d.day,x+(cw-6)/2,yy+24,14,false,muted,'center');txt(d.total,x+(cw-6)/2,yy+57,16,true,ink,'center');});
     const ky=y+t.height-12;txt('少ない',M,ky,12,false,muted);t.key.forEach((color,i)=>rounded(M+48+i*20,ky-12,15,15,3,color));txt('多い',M+156,ky,12,false,muted);
    }
    y+=t.height;
   }
   rule(h-40);txt('育成リソースノート',M,h-18,12,false,muted);if(batches.length>1)txt(`${page+1} / ${batches.length}`,W-M,h-18,12,false,muted,'right');
   const url=canvas.toDataURL('image/png');if(!url.startsWith('data:image/png'))throw Error('画像が大きすぎるため生成できませんでした。');canvas.width=canvas.height=1;return url;
  });
 }
 function exportScope(key,scope){
  try{const d=definitions.find(d=>d[0]===key);if(!d)throw Error('画像の項目が見つかりません。');
   const keys=definitions.filter(x=>scope==='all'||x[3]===d[3]).map(x=>x[0]);
   const model=scope==='single'?capture(key):combined(keys,scope==='all'?'アメ＋ゆめのかけら':d[3]==='candy'?'アメのまとめ':'ゆめのかけらのまとめ');
   ImagePreview.open(model.title,pages(model));
  }catch(e){notice('画像を作成できませんでした：'+e.message);}
 }
 function open(key){exportScope(key,'single');}

 function init(){for(const [key,title,selector,kind,oldId] of definitions){const root=document.querySelector(selector);let head,b=oldId?document.getElementById(oldId):null;
   if(key.endsWith('-breakdown')){head=el('div',undefined,'summary-section-head export-overview-heading');head.append(el('h3',title));root.before(head);const controls=$(key==='candy-breakdown'?'candy-breakdown-filters':'shard-record-filters');if(controls)head.after(controls);}
   else{const h=root.closest('.card').querySelector('h3');head=h.parentElement.classList.contains('summary-section-head')?h.parentElement:null;if(!head){head=el('div',undefined,'summary-section-head');h.before(head);head.append(h);}}
   if(!b){b=el('button','画像');b.type='button';b.id='export-'+key;head.append(b);}b.classList.add('section-image-button');b.dataset.sectionImage=key;b.setAttribute('aria-label',(kind==='candy'?'アメ':'ゆめのかけら')+'：'+title+'の画像を作成');b.onclick=()=>open(key);
  }}
 return {init,capture,pages,open,exportScope,combined,definitions};
})();
SectionImages.init();
