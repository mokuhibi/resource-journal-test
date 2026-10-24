'use strict';
// Calendar navigation is independent of the recording date/field and never changes records.
const EventsUI=(()=>{
 let selected=C.gameDay(new Date()),month=selected.slice(0,7),view='settings';
 const colors=['var(--mh-accent)','var(--shard-skill-color)','var(--shard-other-color)','var(--shard-research-color)'];
 const day=d=>new Date(d).toISOString().slice(0,10);
 function weeks(value,events){
  const first=new Date(value+'-01T00:00:00Z'),start=new Date(first);start.setUTCDate(1-(first.getUTCDay()+6)%7);
  const last=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0)),result=[];
  for(let time=start.getTime();time<=last.getTime();time+=7*86400000){
   const dates=Array.from({length:7},(_,i)=>day(time+i*86400000)),bands=events.filter(e=>e.start<=dates[6]&&e.end>=dates[0]).sort((a,b)=>a.start.localeCompare(b.start)||a.id.localeCompare(b.id)).map(e=>({event:e,start:Math.max(0,dates.findIndex(d=>d>=e.start)),end:dates.filter(d=>d<=e.end).length-1}));result.push({dates,bands});
  }return result;
 }
 function show(next){view=next;for(const key of ['settings','events']){const on=key===view;$(key+'-settings-panel').hidden=!on;const b=$('settings-view-'+key);b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;}if(view==='events')render();}
 function render(){
  const root=$('events-settings-panel');if(!root)return;root.replaceChildren();const calendar=el('section',undefined,'event-calendar'),head=el('div',undefined,'event-calendar-head');calendar.setAttribute('aria-label','イベントカレンダー');calendar.dataset.month=month;
  const move=n=>{month=PeriodPicker.shift(month+'-01','month',n).slice(0,7);render();};
  const prev=button('＜',()=>move(-1)),next=button('＞',()=>move(1));prev.setAttribute('aria-label','イベントカレンダーの前月');next.setAttribute('aria-label','イベントカレンダーの翌月');head.append(prev,el('strong',month.replace('-','年')+'月'),next,button('今日',()=>{selected=C.gameDay(new Date());month=selected.slice(0,7);render();}));calendar.append(head);
  const weekdays=el('div',undefined,'event-calendar-weekdays');for(const name of ['月','火','水','木','金','土','日'])weekdays.append(el('small',name));calendar.append(weekdays);
  const events=SleepPickups.list(),today=C.gameDay(new Date());
  for(const week of weeks(month,events)){
   const row=el('div',undefined,'event-calendar-week'),dates=el('div',undefined,'event-calendar-dates');
   for(const value of week.dates){const b=button(String(Number(value.slice(-2))),()=>{selected=value;month=value.slice(0,7);render();});b.dataset.date=value;b.setAttribute('aria-label',C.displayDate(value));b.setAttribute('aria-pressed',String(value===selected));if(value===today)b.setAttribute('aria-current','date');b.classList.toggle('event-outside-month',value.slice(0,7)!==month);dates.append(b);}row.append(dates);
   const bands=el('div',undefined,'event-calendar-bands');week.bands.forEach(({event,start,end},i)=>{const b=button(event.name,()=>{selected=week.dates[start];render();},'event-band');b.title=event.name+' '+event.start+'〜'+event.end;b.style.gridColumn=(start+1)+' / '+(end+2);b.style.gridRow=String(i+1);b.style.setProperty('--event-color',colors[events.findIndex(e=>e.id===event.id)%colors.length]);b.dataset.eventId=event.id;bands.append(b);});row.append(bands);calendar.append(row);
  }
  root.append(calendar,el('h3',C.displayDate(selected),'event-selected-date'));const details=el('div');root.append(details);SleepPickups.render(details,render,selected,undefined,{browse:true});
 }
 function init(){
  const root=$('settings'),content=el('div'),events=el('div'),tabs=el('div',undefined,'app-subtabs settings-switch');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','設定の表示');content.id='settings-settings-panel';events.id='events-settings-panel';content.setAttribute('role','tabpanel');content.setAttribute('aria-labelledby','settings-view-settings');events.setAttribute('role','tabpanel');events.setAttribute('aria-labelledby','settings-view-events');for(const n of [...root.children])if(!n.classList.contains('editorial-page-title'))content.append(n);
  for(const [key,title,icon] of [['settings','設定','settings'],['events','イベント','calendar-days']]){const b=button(title,()=>show(key));b.id='settings-view-'+key;b.setAttribute('role','tab');b.setAttribute('aria-controls',key+'-settings-panel');TabIcons.add(b,icon);tabs.append(b);}const buttons=[...tabs.children];tabs.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();let i=buttons.indexOf(document.activeElement);i=e.key==='Home'?0:e.key==='End'?1:(i+1)%2;buttons[i].click();buttons[i].focus();};root.append(tabs,content,events);show(view);
 }
 return {init,show,render,weeks};
})();
EventsUI.init();
