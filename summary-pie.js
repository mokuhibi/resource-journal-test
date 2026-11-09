// 集計結果だけを描画する。切り替え状態は保存済みデータに含めない。
const SummaryPie=(()=>{
 const views={};
 const svgNS='http://www.w3.org/2000/svg';
 const node=(tag,attrs={})=>{const element=document.createElementNS(svgNS,tag);for(const [key,value] of Object.entries(attrs))element.setAttribute(key,String(value));return element;};
 const point=(angle,r,cx,cy)=>({x:cx+Math.cos(angle)*r,y:cy+Math.sin(angle)*r});
 const palette=['#4f78a8','#4f8666','#ad625b','#97762e','#a66883','#577e91','#96735f','#6b8280','#8b6b91','#8f824d','#92979a'];
 function pokemonGroups(groups){
  const positive=groups.filter(group=>group.total>0).sort((a,b)=>b.total-a.total||a.name.localeCompare(b.name,'ja'));
  const result=positive.slice(0,10).map((group,i)=>({name:group.name.replace(/のアメ$/,''),value:group.total,color:palette[i]}));
  const rest=positive.slice(10).reduce((sum,group)=>sum+group.total,0);
  if(rest)result.push({name:'その他',value:rest,color:palette[10]});
  return result;
 }
 function draw(root,items){
  root.replaceChildren();
  const rows=items.filter(item=>Number.isFinite(item.value)&&item.value>0),total=rows.reduce((sum,item)=>sum+item.value,0);
  if(!total){const empty=document.createElement('p');empty.textContent='この条件の記録はありません。';root.append(empty);return;}
  const outside=[];let angle=-Math.PI/2;
  for(const item of rows){const span=item.value/total*Math.PI*2,mid=angle+span/2;item._start=angle;item._end=angle+span;item._mid=mid;item._percent=Math.round(item.value/total*100);item._outside=item.value/total<.05||span<.56||item.name.length>7; if(item._outside)outside.push(item);angle+=span;}
  const left=outside.filter(item=>Math.cos(item._mid)<0),right=outside.filter(item=>Math.cos(item._mid)>=0);
  const height=Math.max(300,(Math.max(left.length,right.length)+1)*36+48),cx=180,cy=height/2,r=82;
  const svg=node('svg',{viewBox:`0 0 360 ${height}`,role:'img','aria-label':rows.map(item=>`${item.name} ${item._percent}%`).join('、')});
  const place=side=>{side.sort((a,b)=>Math.sin(a._mid)-Math.sin(b._mid));const gap=34,min=24,max=height-24;for(let i=0;i<side.length;i++)side[i]._labelY=Math.max(min+i*gap,Math.min(max-(side.length-1-i)*gap,cy+Math.sin(side[i]._mid)*(r+10)));for(let i=side.length-2;i>=0;i--)side[i]._labelY=Math.min(side[i]._labelY,side[i+1]._labelY-gap);};
  place(left);place(right);
  for(const item of rows){
   const start=point(item._start,r,cx,cy),end=point(item._end,r,cx,cy),full=item._end-item._start>Math.PI*2-.0001,half=point(item._start+Math.PI,r,cx,cy),shape=full?`M ${start.x} ${start.y} A ${r} ${r} 0 1 1 ${half.x} ${half.y} A ${r} ${r} 0 1 1 ${start.x} ${start.y} Z`:`M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${item._end-item._start>Math.PI?1:0} 1 ${end.x} ${end.y} Z`,path=node('path',{d:shape,fill:item.color,stroke:'#fff','stroke-width':1.5});
   const title=node('title');title.textContent=`${item.name} ${item.value.toLocaleString('ja-JP')}個 (${item._percent}%)`;path.append(title);svg.append(path);
   if(item._outside){
    const leftSide=Math.cos(item._mid)<0,edge=point(item._mid,r+2,cx,cy),bend=point(item._mid,r+14,cx,cy),labelX=leftSide?8:352,lineEnd=leftSide?104:256;
    svg.append(node('path',{d:`M ${edge.x} ${edge.y} L ${bend.x} ${bend.y} L ${lineEnd} ${item._labelY}`,fill:'none',stroke:item.color,'stroke-width':1.25}));
    const label=node('text',{x:labelX,y:item._labelY-3,'text-anchor':leftSide?'start':'end',fill:'#333','font-size':11,'font-weight':600});
    const name=node('tspan',{x:labelX});name.textContent=item.name;if(item.name.length>9){name.setAttribute('textLength','96');name.setAttribute('lengthAdjust','spacingAndGlyphs');}label.append(name);
    const percent=node('tspan',{x:labelX,dy:13});percent.textContent=item._percent+'%';label.append(percent);svg.append(label);
   }else{
    const p=point(item._mid,r*.62,cx,cy),label=node('text',{x:p.x,y:p.y-3,'text-anchor':'middle',fill:'#fff','font-size':11,'font-weight':700});
    const name=node('tspan',{x:p.x});name.textContent=item.name;label.append(name);const percent=node('tspan',{x:p.x,dy:13});percent.textContent=item._percent+'%';label.append(percent);svg.append(label);
   }
  }
  root.append(svg);
 }
 function drawPokemon(root,items,ranked=true){
  root.replaceChildren();
  const rows=items.filter(item=>Number.isFinite(item.value)&&item.value>0),total=rows.reduce((sum,item)=>sum+item.value,0);
  if(!total){const empty=document.createElement('p');empty.textContent='この条件の記録はありません。';root.append(empty);return;}
  root.classList.add(ranked?'summary-pie-pokemon':'summary-pie-sources');
  const svg=node('svg',{viewBox:'0 0 180 180',role:'img','aria-label':rows.map((item,i)=>`${ranked&&item.name!=='その他'?`${i+1}位 `:''}${item.name} ${Math.round(item.value/total*100)}%`).join('、')});
  const list=document.createElement('div');list.className='summary-pie-pokemon-list';
  let angle=-Math.PI/2;
  for(const [i,item] of rows.entries()){
   const span=item.value/total*Math.PI*2,mid=angle+span/2,start=point(angle,78,90,90),end=point(angle+span,78,90,90),half=point(angle+Math.PI,78,90,90);
   const full=span>Math.PI*2-.0001,shape=full?`M ${start.x} ${start.y} A 78 78 0 1 1 ${half.x} ${half.y} A 78 78 0 1 1 ${start.x} ${start.y} Z`:`M 90 90 L ${start.x} ${start.y} A 78 78 0 ${span>Math.PI?1:0} 1 ${end.x} ${end.y} Z`;
   const path=node('path',{d:shape,fill:item.color,stroke:'#fff','stroke-width':1.5});const title=node('title');title.textContent=`${item.name} ${item.value.toLocaleString('ja-JP')}個 (${Math.round(item.value/total*100)}%)`;path.append(title);svg.append(path);
   const other=item.name==='その他';if(span>=.4){const at=point(mid,49,90,90),text=node('text',{x:at.x,y:at.y+4,'text-anchor':'middle',fill:'#fff','font-size':ranked?(other?10:15):11,'font-weight':700});text.textContent=ranked?(other?'その他':String(i+1)):Math.round(item.value/total*100)+'%';svg.append(text);}
   const line=document.createElement('div');line.className=ranked?'summary-pie-pokemon-row':'summary-pie-source-row';line.dataset.value=String(item.value);
   const badge=document.createElement('span');badge.className='summary-pie-rank';badge.style.backgroundColor=item.color;badge.textContent=ranked&&!other?String(i+1):'';badge.setAttribute('aria-label',ranked&&!other?`${i+1}位`:item.name+'の色');
   const name=document.createElement('span');name.className='summary-pie-name';name.textContent=item.name;name.title=item.name;
   const percent=document.createElement('span');percent.className='summary-pie-percent';percent.textContent=String(Math.round(item.value/total*100));const percentUnit=document.createElement('span');percentUnit.className='summary-pie-unit';percentUnit.textContent='%';percent.append(percentUnit);
   const amount=document.createElement('span');amount.className='summary-pie-amount';amount.textContent=item.value.toLocaleString('ja-JP');const amountUnit=document.createElement('span');amountUnit.className='summary-pie-unit';amountUnit.textContent='個';amount.append(amountUnit);
   line.append(badge,name,percent,amount);list.append(line);angle+=span;
  }
  root.append(svg,list);
 }
 function attach(key,host,list,items){
  const controls=document.createElement('div');controls.className='summary-pie-switch';controls.setAttribute('role','group');controls.setAttribute('aria-label','表示方法');
  const chart=document.createElement('div');chart.className='summary-pie';chart.setAttribute('aria-label','円グラフ');
  const show=view=>{views[key]=view;list.hidden=view==='pie';chart.hidden=view!=='pie';for(const button of controls.children)button.setAttribute('aria-pressed',String(button.dataset.view===view));};
  for(const [view,label] of [['list','一覧'],['pie','円グラフ']]){const button=document.createElement('button');button.type='button';button.dataset.view=view;button.textContent=label;button.onclick=()=>show(view);controls.append(button);}
  const row=document.createElement('div');row.className='summary-view-head';
  if(key!=='pokemon-candy'){const amount=document.createElement('div');amount.className='summary-view-amount';for(const child of [host.querySelector?.(':scope > small'),host.querySelector?.(':scope > .total')])if(child)amount.append(child);row.append(amount);}
  row.append(controls);host.insertBefore(row,key==='pokemon-candy'?host.firstChild:list);host.insertBefore(chart,list.nextSibling);drawPokemon(chart,items,key==='pokemon-candy');show(views[key]||'list');
 }
 return {attach,pokemonGroups,draw};
})();
