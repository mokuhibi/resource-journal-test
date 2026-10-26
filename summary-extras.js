// 表示用の集計は履歴から都度作り、localStorageには保存しません。
const SummaryExtras=(()=>{
 const candySources=[['help','アメ拾い'],['mew','ミュウ'],['delibird','デリバード'],['skill','その他'],['research','睡眠リサーチ'],['social','ソーシャルリサーチ']];
 const shardSources=[['research','睡眠リサーチ'],['skill','スキル'],['cluster','ゆめのかたまり'],['other','その他']];
 const orderedSources=kind=>(kind==='shard'?['skill','research','cluster','other']:['help','mew','delibird','research','social','skill']).map(key=>(kind==='shard'?shardSources:candySources).find(([k])=>k===key));
 const settingKeys={skill:'showShardSkill',research:'showShardResearch',cluster:'showShardCluster',other:'showShardOther'};
 const shardKey=method=>method==='lucky'?'skill':method;
 const otherVisible=(key,settings=state.settings)=>C.actionAllowed(settings,'other','displayActions')&&settings.displayActions?.[key]!==false&&(settings.displayActions?.[key]===true||settings[key==='cluster'?'showShardCluster':'showShardOther']!==false);
 const shardVisible=(method,settings=state.settings)=>method==='cluster'?otherVisible('cluster',settings):method==='other'?['mission','achievement','gift'].some(key=>otherVisible(key,settings)):settings[settingKeys[shardKey(method)]]!==false;
 // 全体設定とセクション内フィルターは、入力表示・履歴とは独立する。
 const aggregateVisible=(kind,method)=>{
  const key=kind==='candy'?method:shardKey(method),legacy=(state.settings[kind==='candy'?'aggregateCandy':'aggregateShards']||C.aggregationSettings(state.settings)[kind==='candy'?'aggregateCandy':'aggregateShards'])[key]!==false;
  const categories=kind==='candy'?(key==='skill'?['copy','metronome','nap','other']:[key]):key==='skill'?['mew','delibird','copy','metronome','shards']:key==='other'?['nap','other']:key==='cluster'?['other']:[key];
  if(kind==='shard'&&key==='cluster'&&state.settings.aggregateActions?.cluster===false)return false;
  const childOn=kind==='shard'&&(key==='cluster'?state.settings.aggregateActions?.cluster===true:key==='other'?['mission','achievement','gift'].some(child=>state.settings.aggregateActions?.[child]===true):false);
  return categories.some(k=>C.actionAllowed(state.settings,k)&&(legacy||state.settings.aggregateActions?.[k]===true||k==='other'&&childOn));
 };
 const allowedRecord=(r,kind='candy')=>{const key=C.actionCategory(r),legacy=(state.settings[kind==='candy'?'aggregateCandy':'aggregateShards']||C.aggregationSettings(state.settings)[kind==='candy'?'aggregateCandy':'aggregateShards'])[kind==='candy'?r.method:shardKey(r.method)]!==false;const child=r.method==='cluster'?'cluster':r.method==='other'?r.otherKind:null,childOn=key==='other'&&C.otherKeys.includes(child)&&state.settings.aggregateActions?.[child]===true;return C.otherRecordAllowed(state.settings,r)&&C.actionAllowed(state.settings,key)&&(legacy||state.settings.aggregateActions?.[key]===true||childOn);};
 const localVisible=(scope,method)=>!scope||state.settings.candyFilters?.[scope]?.[method]!==false;
 const candySourceVisible=(method,scope)=>aggregateVisible('candy',method)&&localVisible(scope,method);
 const candyRecords=(records,scope)=>records.filter(r=>(r.activationVersion!==1||r.resourceFlags.candy)&&allowedRecord(r)&&localVisible(scope,r.method));
 const visibleCandySources=scope=>candySources.filter(([key])=>candySourceVisible(key,scope));
 const shardSourceVisible=(method,scope)=>aggregateVisible('shard',method)&&(!scope||state.settings.shardFilters?.[scope]?.[shardKey(method)]!==false);
 const shardRecords=(records,scope)=>records.filter(r=>allowedRecord(r,'shard')&&(!scope||state.settings.shardFilters?.[scope]?.[shardKey(r.method)]!==false));
 const visibleShardSources=scope=>shardSources.filter(([key])=>shardSourceVisible(key,scope));
 function filterControls(root,scope,records,kind='candy'){
  root.replaceChildren();root.className='candy-source-switches';root.setAttribute('aria-label',((kind==='shard'?{week:'週間のゆめのかけら',month:'月間のゆめのかけら'}:{types:'種類別アメ',week:'週間のアメ',month:'月間のアメ',breakdown:'獲得数の内訳'})[scope])+'の集計対象');
  const shard=kind==='shard',group=shard?'shardFilters':'candyFilters',filtered=shard?shardRecords(records,scope):candyRecords(records,scope),total=C.sum(filtered);
  for(const [key,title] of orderedSources(kind)){
   if(!aggregateVisible(kind,key))continue;
   const name=shard?({skill:'スキル',research:'睡眠',cluster:'かたまり',other:'その他'})[key]:key==='research'?'睡眠':key==='social'?'ソーシャル':title,toggle=el('button',name),item=el('div',undefined,'candy-source-choice'),on=state.settings[group]?.[scope]?.[key]!==false,amount=C.sum(filtered.filter(r=>(shard?shardKey(r.method):r.method)===key));
   toggle.type='button';toggle.dataset.source=key;item.dataset.source=key;toggle.style.setProperty?.('--source-color',shard?'var(--shard-'+(key==='cluster'?'other':key)+'-color)':({help:'#567563',mew:'#a46f85',delibird:'#ae7568',skill:'#686b63',research:'#a89461',social:'#608896'})[key]);toggle.setAttribute('aria-pressed',String(on));toggle.setAttribute('aria-label',name);
   toggle.onclick=()=>commit({...state,settings:{...state.settings,[group]:{...state.settings[group],[scope]:{...state.settings[group]?.[scope],[key]:!on}}}},null);
   item.append(toggle,el('small',on&&amount&&total?(amount/total*100).toFixed(1)+'%':'—','candy-source-percent'));if(['week','month'].includes(scope))item.append(qel('small',on?(shard?(amount?(Math.round(amount/1000)/10).toFixed(1)+'万':'0'):amount.toLocaleString('ja-JP')+'個'):'—','candy-source-amount'));root.append(item);
  }
 }
 function sourceTotals(root,kind,records,sourceVisible=()=>true){
  root.replaceChildren();root.className='source-totals';
  for(const [key,name] of kind==='candy'?candySources:shardSources){
   const total=C.sum(records.filter(r=>(kind==='candy'?r.method:shardKey(r.method))===key));
   if(!total||!sourceVisible(key)||(kind==='candy'&&!enabled(key)))continue;
   const line=el('div',undefined,'source-total-row'),label=el('span',name);label.dataset.source=kind+'-'+key;
   if(kind==='shard')label.append(el('small',' '+records.filter(r=>shardKey(r.method)===key).length+'回','source-count'));
   if(kind==='candy')label.append(el('small',' '+(100*total/C.sum(records)).toFixed(1)+'%','sleep-proportions'));line.append(label,qel('strong',total.toLocaleString('ja-JP')+'個'));root.append(line);
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
  totals(candy,candyRecords(allCandyRecords()).filter(r=>C.inRange(r,period)),'アメ',true,key=>candySourceVisible(key));
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
  const groups=new Map();for(const r of records){if(!r.candy)continue;if(!groups.has(r.candy))groups.set(r.candy,{name:r.candy,total:0,sources:{},counts:{}});const g=groups.get(r.candy);g.total+=r.amount;g.sources[r.method]=(g.sources[r.method]||0)+r.amount;g.counts[r.method]=(g.counts[r.method]||0)+1;}
  return [...groups.values()].sort((a,b)=>b.total-a.total||a.name.localeCompare(b.name,'ja'));
 }
 // 画像用の表示列を分割。集計済みの値・並び順は変更しません。
 function candyColumns(groups){
  const active=candySources.filter(([key])=>candySourceVisible(key,'types')&&groups.some(g=>g.sources[key]));
  const panels=[];for(let i=0;i<active.length;i+=2)panels.push(active.slice(i,i+2));
  return panels.length?panels:[[]];
 }
 const candyName=name=>name.replace(/のアメ$/,'');
 const candyValue=value=>value?value.toLocaleString('ja-JP'):'−';
 function candyList(records){
  const input=records;records=candyRecords(records,'types');
  $('candy-source-totals').replaceChildren();$('candy-source-totals').hidden=true;
  const root=$('candy-list');root.replaceChildren();
  const order=['help','mew','delibird','research','social','skill'],labels={research:'睡眠',skill:'その他'};
  const switches=el('div');filterControls(switches,'types',input);root.append(switches);
  const groups=candyGroups(records);
  if(!groups.length){root.append(el('p',order.some(key=>candySourceVisible(key,'types'))?'この条件のアメの記録はありません。':'集計対象の獲得方法が選択されていません。'));return;}
  const sources=order.filter(key=>candySourceVisible(key,'types')&&groups.some(g=>g.sources[key]));
  const scroll=el('div',undefined,'candy-table-scroll'),table=el('table',undefined,'candy-totals-table');
  scroll.tabIndex=0;scroll.setAttribute('role','region');scroll.setAttribute('aria-label','種類別アメの合計（横スクロール）');
  table.style.minWidth=(204+sources.length*88)+'px';
  table.setAttribute('aria-label','種類別アメの合計：回数・匹数とアメ個数');
  const head=el('thead'),header=el('tr');
  for(const label of ['アメの種類',...sources.map(key=>labels[key]||candySources.find(([k])=>k===key)[1]),'合計']){const th=el('th',label);th.setAttribute('scope','col');header.append(th);}
  head.append(header);table.append(head);const body=el('tbody');
  for(const g of groups){const line=el('tr'),name=el('th',candyName(g.name));name.setAttribute('scope','row');line.append(name);
   for(const key of sources){const cell=el('td');if(!g.counts[key]&&!g.sources[key])cell.append(el('span','—'));else{cell.append(qel('span',g.counts[key].toLocaleString('ja-JP')+(key==='research'?'匹':'回'),'candy-method-count'),qel('strong',g.sources[key]?g.sources[key].toLocaleString('ja-JP')+'個':'—','candy-method-amount'));}line.append(cell);}
   line.append(qel('td',g.total.toLocaleString('ja-JP')+'個','candy-table-total'));body.append(line);
  }
  table.append(body);scroll.append(table);root.append(scroll);
 }

 function monthly(kind,records,day){return CandyGraphs.monthly(records,day,kind);}
 // 画像専用レイアウト。実数・取得元の列は画面と同じ集計結果から描画する。
 function imagePages(groups,period){
  const panels=candyColumns(groups),pages=[],canvas=document.createElement('canvas');canvas.width=1200;
  const c=canvas.getContext('2d');if(!c)throw Error('画像描画に対応していません。');
  const ink='#202124',muted='#777C80',line='#ECEDEE',colors={help:'#567563',mew:'#a46f85',delibird:'#ae7568',skill:'#686b63',research:'#a89461',social:'#608896'};
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
   text('ポケモンのアメ一覧',60,78,44,true);
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
  for(const [kind,sources] of [['candy',candySources],['shard',shardSources]])for(const [key] of sources){const input=$('aggregate-'+kind+'-'+key);if(!input)continue;input.onchange=()=>commit({...state,settings:{...state.settings,[kind==='candy'?'aggregateCandy':'aggregateShards']:{...C.aggregationSettings(state.settings)[kind==='candy'?'aggregateCandy':'aggregateShards'],[key]:input.checked}}},null);}

  for(const [key,id] of Object.entries(settingKeys))$('setting-'+id).onchange=()=>commit({...state,settings:{...state.settings,[id]:$('setting-'+id).checked}},null);
  $('create-candy-image').onclick=()=>{try{const period=RangePicker.get('period');ImagePreview.open('ポケモンのアメ一覧',imagePages(candyGroups(candyRecords(filteredRecords(),'types')),summaryTitle(period)));}catch(e){notice('画像を作成できませんでした：'+e.message);}};
 }
 function settings(){for(const [kind,sources] of [['candy',candySources],['shard',shardSources]])for(const [key] of sources){const input=$('aggregate-'+kind+'-'+key);if(input)input.checked=aggregateVisible(kind,key);}for(const [key,id] of Object.entries(settingKeys))$('setting-'+id).checked=shardVisible(key);}
 return {otherVisible,orderedSources,allowedRecord,shardSourceVisible,shardRecords,visibleShardSources,aggregateVisible,localVisible,candySourceVisible,filterControls,periodCaption,candyRecords,visibleCandySources,recordSummary,sourceTotals,candySources,shardSources,shardKey,shardVisible,candyGroups,candyList,monthly,imagePages,init,settings};
})();
