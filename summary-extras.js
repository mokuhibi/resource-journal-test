// 表示用の集計は履歴から都度作り、localStorageには保存しません。
const SummaryExtras=(()=>{
 const candySources=[['help','アメ拾い'],['mew','ミュウ'],['delibird','デリバード'],['skill','その他']];
 const shardSources=[['research','睡眠リサーチ'],['skill','スキル'],['cluster','ゆめのかたまり'],['other','その他']];
 const settingKeys={skill:'showShardSkill',research:'showShardResearch',cluster:'showShardCluster',other:'showShardOther'};
 const shardKey=method=>method==='lucky'?'skill':method;
 const shardVisible=(method,settings=state.settings)=>settings[settingKeys[shardKey(method)]]!==false;
 // アメの通常集計だけに共通適用。履歴・位置集計・アメゲット記録は呼び出さない。
 const candyRecords=records=>records.filter(r=>recordVisible(r.method));
 const visibleCandySources=()=>candySources.filter(([key])=>recordVisible(key));
 function sourceTotals(root,kind,records,sourceVisible=()=>true){
  root.replaceChildren();root.className='source-totals';
  for(const [key,name] of kind==='candy'?candySources:shardSources){
   const total=C.sum(records.filter(r=>(kind==='candy'?r.method:shardKey(r.method))===key));
   if(!total||!sourceVisible(key)||(kind==='candy'&&!enabled(key)))continue;
   const line=el('div',undefined,'source-total-row'),label=el('span',name);label.dataset.source=kind+'-'+key;
   if(kind==='shard')label.append(el('small',' '+records.filter(r=>shardKey(r.method)===key).length+'回','source-count'));
   line.append(label,qel('strong',total.toLocaleString('ja-JP')+'個'));root.append(line);
   if(kind==='shard'&&key==='other')for(const [otherKind,name] of Object.entries(DreamClusters.otherKinds)){const xs=records.filter(r=>r.method==='other'&&DreamClusters.otherKind(r)===otherKind);if(!xs.length)continue;const row=el('div',undefined,'source-total-row source-subtotal');row.append(el('span',name+' '+xs.length+'回'),qel('strong',C.sum(xs).toLocaleString('ja-JP')+'個'));root.append(row);}
  }
  root.hidden=!root.children.length;
 }
 // 選択日付は操作部に一度だけ表示し、ここでは範囲の意味を説明する。
 function periodCaption(period){return period?Math.round((Date.parse(period[1])-Date.parse(period[0]))/86400000)+'日分の獲得数（04:00切替）':'保存済みのすべての記録';}
 function recordSummary(){
  const date=recordDate();if(!Number.isFinite(date.getTime()))return;
  const day=C.gameDay(date),period=C.range('day',day),root=$('today-total'),wasOpen=root.querySelector('details')?.open||false;const heading=el('small',day===C.gameDay(new Date())?'今日の獲得数':'選択日の獲得数');if(C.localInput(date).slice(0,10)!==day)heading.append(el('span','集計日：'+C.displayDate(day)+'（04:00切替）','record-day-note'));root.replaceChildren(heading);
  const candy=el('div',undefined,'daily-resource'),shard=el('div',undefined,'daily-resource');
  totals(candy,state.records.filter(r=>C.inRange(r,period)),'アメ',true);
  const records=ShardUI.summaryRecords().filter(r=>C.inRange(r,period)),total=C.sum(records);
  // 未記録の日だけ省略。0個のスキル記録がある日は回数・内訳も表示します。
  if(records.length||total!==0){
   shard.append(el('small','ゆめのかけら'),qel('div',total+'個','total'));
   const body=totalBreakdown(shard,'ゆめのかけら');ShardUI.appendBreakdown(body,records,true);
  }
  // サマリーの全内訳を一つの開閉欄へ移し、記録操作までの距離を短くする。
  const metrics=el('div',undefined,'daily-metrics'),details=el('details',undefined,'daily-details');details.open=wasOpen;details.append(el('summary','その日の内訳'));
  for(const resource of [candy,...(records.length||total!==0?[shard]:[])]){
   const table=resource.querySelector('.total-breakdown');details.append(el('h3',resource.querySelector('small').textContent),table);metrics.append(resource);
  }
  root.append(metrics,details);
 }
 function candyGroups(records){
  const groups=new Map();for(const r of records){if(!r.candy||!r.amount)continue;if(!groups.has(r.candy))groups.set(r.candy,{name:r.candy,total:0,sources:{}});const g=groups.get(r.candy);g.total+=r.amount;g.sources[r.method]=(g.sources[r.method]||0)+r.amount;}
  return [...groups.values()].sort((a,b)=>b.total-a.total||a.name.localeCompare(b.name,'ja'));
 }
 // 表示列だけを分割。集計済みの値・並び順は変更しません。
 function candyColumns(groups){
  const active=candySources.filter(([key])=>recordVisible(key)&&groups.some(g=>g.sources[key]));
  const panels=[];for(let i=0;i<active.length;i+=2)panels.push(active.slice(i,i+2));
  return panels.length?panels:[[]];
 }
 const candyName=name=>name.replace(/のアメ$/,'');
 const candyValue=value=>value?value.toLocaleString('ja-JP'):'−';
 function candyList(records){
  records=candyRecords(records);
  sourceTotals($('candy-source-totals'),'candy',records,recordVisible);
  const root=$('candy-list');root.replaceChildren();
  const groups=candyGroups(records);
  if(!groups.length){root.append(el('p','この条件のアメの記録はありません。'));return;}
  root.append(el('small','単位：個','candy-table-unit'));
  for(const sources of candyColumns(groups)){
   const scroll=el('div',undefined,'candy-table-scroll'),table=el('table',undefined,'candy-totals-table');
   table.setAttribute('aria-label','アメ種類別合計：'+sources.map(([,name])=>name).join('・'));
   const head=el('thead'),header=el('tr');
   for(const label of ['アメ名','合計',...sources.map(([,name])=>name)])header.append(el('th',label));
   head.append(header);table.append(head);const body=el('tbody');
   for(const g of groups){const line=el('tr'),name=el('th',candyName(g.name));name.setAttribute('scope','row');line.append(name,el('td',g.total.toLocaleString('ja-JP'),'candy-table-total'));
    for(const [key] of sources)line.append(el('td',candyValue(g.sources[key])));body.append(line);
   }
   table.append(body);scroll.append(table);root.append(scroll);
  }
 }
 function monthly(kind,records,day){
  if(kind==='candy')return CandyGraphs.monthly(records,day);
  const candy=false;
  const month=day.slice(0,7),root=$(kind+'-calendar'),legend=$(kind+'-month-legend');
  $(kind+'-month').textContent=month.replace('-','年')+'月';root.classList.add('resource-calendar');legend.replaceChildren();
  const sources=candy?visibleCandySources():shardSources;
  for(const [key,name] of sources){const item=el('span',name,'month-legend-item');item.dataset.source=kind+'-'+key;legend.append(item);}
  const grouped=new Map();for(const r of records){const date=C.gameDay(r.datetime);if(!date.startsWith(month))continue;if(!grouped.has(date))grouped.set(date,{});const key=candy?r.method:shardKey(r.method),g=grouped.get(date);g[key]=(g[key]||0)+r.amount;}
  calendar(root,month,date=>{const amounts=grouped.get(date)||{},b=button('',()=>{RangePicker.set(candy?'period':'shard-period',date);DateUI.update();},'day');b.append(el('strong',Number(date.slice(-2)),'day-number'));const values=el('span',undefined,'candy-values');const description=[];
   for(const [key,name] of sources){const amount=amounts[key]||0,text=candy?amount.toLocaleString('ja-JP'):WeeklyChart.shortAmount(amount),value=el('span',text,'month-value');value.dataset.source=kind+'-'+key;value.title=name+'：'+amount.toLocaleString('ja-JP')+'個';value.style.fontSize=Math.max(8,Math.min(11,65/text.length))+'px';values.append(value);description.push(value.title);}
   b.append(values);b.setAttribute('aria-label',C.displayDate(date)+' '+description.join('、'));b.title=C.displayDate(date)+' '+description.join('、');if(date===day)b.classList.add('selected');return b;
  });
  const monthlyRecords=records.filter(r=>C.gameDay(r.datetime).startsWith(month));
  headingTotal(kind+'-calendar',C.sum(monthlyRecords));sourceTotals($(kind+'-month-totals'),kind,monthlyRecords);
 }
 // 画像専用レイアウト。実数・取得元の列は画面と同じ集計結果から描画する。
 function imagePages(groups,period){
  const panels=candyColumns(groups),pages=[],canvas=document.createElement('canvas');canvas.width=1200;
  const c=canvas.getContext('2d');if(!c)throw Error('画像描画に対応していません。');
  const ink='#202124',muted='#777C80',line='#ECEDEE',colors={help:'#567563',mew:'#a46f85',delibird:'#ae7568',skill:'#686b63'};
  const font=(size,bold=false)=>{c.font=`${bold?600:400} ${size}px -apple-system, BlinkMacSystemFont, "Hiragino Kaku Gothic ProN", sans-serif`;};
  const wrap=(value,width,size)=>{font(size);const rows=[''];for(const ch of String(value)){const i=rows.length-1,trial=rows[i]+ch;if(rows[i]&&(c.measureText?c.measureText(trial).width:trial.length*size)>width)rows.push(ch);else rows[i]=trial;}return rows;};
  const text=(value,x,y,size=34,bold=false,right=false,color=ink)=>{font(size,bold);c.fillStyle=color;c.textAlign=right?'right':'left';c.fillText(String(value),x,y);};
  const rule=y=>{c.strokeStyle=line;c.lineWidth=1;c.beginPath();c.moveTo(60,y);c.lineTo(1140,y);c.stroke();};
  const periodLines=wrap(period,1080,30),top=230+periodLines.length*40;
  const prepared=groups.map(g=>({g,lines:wrap(candyName(g.name),420,42)}));
  const batches=[];let batch=[],height=0;
  for(const row of prepared){const h=Math.max(86,row.lines.length*50+30);if(batch.length&&top+panels.length*(120+height+h)>11000){batches.push(batch);batch=[];height=0;}batch.push({...row,height:h});height+=h;}
  if(batch.length||!batches.length)batches.push(batch);
  const total=groups.reduce((n,g)=>n+g.total,0);
  for(const [pageIndex,rows] of batches.entries()){
   canvas.height=Math.max(420,top+panels.length*(120+rows.reduce((n,r)=>n+r.height,0))+60);
   c.fillStyle='#FFFFFF';c.fillRect(0,0,canvas.width,canvas.height);
   text('アメ種類別合計',60,78,44,true);
   periodLines.forEach((t,i)=>text(t,60,128+i*40,30,false,false,muted));
   text('獲得合計',60,top-60,30,false,false,muted);text(total.toLocaleString('ja-JP')+'個',1140,top-55,48,true,true);
   if(batches.length>1)text((pageIndex+1)+' / '+batches.length,1140,canvas.height-22,24,false,true,muted);
   if(!rows.length)text('この期間の記録はありません。',60,top+65,32,false,false,muted);
   let y=top;
   for(const sources of rows.length?panels:[]){
    const ends=sources.length===2?[720,930,1140]:sources.length===1?[850,1140]:[1140];
    text('アメ名',60,y+36,30,false,false,muted);text('合計',ends[0],y+36,30,true,true);
    sources.forEach(([key,name],i)=>wrap(name,190,30).forEach((t,j)=>text(t,ends[i+1],y+36+j*36,30,false,true,colors[key])));
    y+=88;rule(y);
    for(const {g,lines,height} of rows){
     lines.forEach((t,i)=>text(t,60,y+54+i*50,42));
     text(g.total.toLocaleString('ja-JP'),ends[0],y+54,46,true,true);
     sources.forEach(([key],i)=>text(candyValue(g.sources[key]),ends[i+1],y+54,40,false,true,colors[key]));
     y+=height;rule(y);
    }
    y+=32;
   }
   text('単位：個',60,canvas.height-22,24,false,false,muted);
   pages.push(canvas.toDataURL('image/png'));
  }return pages;
 }
 function init(){
  for(const [key,id] of Object.entries(settingKeys))$('setting-'+id).onchange=()=>commit({...state,settings:{...state.settings,[id]:$('setting-'+id).checked}},'表示設定を保存しました。');
  $('create-candy-image').onclick=()=>{try{const period=RangePicker.get('period');ImagePreview.open('アメ種類別合計',imagePages(candyGroups(candyRecords(filteredRecords())),summaryTitle(period)));}catch(e){notice('画像を作成できませんでした：'+e.message);}};
 }
 function settings(){for(const [key,id] of Object.entries(settingKeys))$('setting-'+id).checked=shardVisible(key);}
 return {periodCaption,candyRecords,visibleCandySources,recordSummary,sourceTotals,candySources,shardSources,shardKey,shardVisible,candyGroups,candyList,monthly,imagePages,init,settings};
})();
