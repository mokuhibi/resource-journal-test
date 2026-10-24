'use strict';
// Reminder metadata is local to this device, outside the existing CSV/state format.
const BackupReminder=(()=>{
 const defaults={enabled:true,days:30,records:100},day=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
 const count=data=>(data.records||[]).length+(data.shardRecords||[]).length+(data.sleepSessions||[]).filter(s=>!s.legacyResearchId).length;
 function normalize(value,now=new Date()){
  const v=value&&typeof value==='object'?value:{},valid=s=>typeof s==='string'&&Number.isFinite(Date.parse(s));
  return {...defaults,...v,enabled:v.enabled!==false,days:[7,14,30,90].includes(v.days)?v.days:30,records:[0,50,100,200].includes(v.records)?v.records:100,firstUsedAt:valid(v.firstUsedAt)?v.firstUsedAt:now.toISOString(),lastBackupAt:valid(v.lastBackupAt)?v.lastBackupAt:null,baseline:Number.isSafeInteger(v.baseline)&&v.baseline>=0?v.baseline:0,dismissedAt:valid(v.dismissedAt)?v.dismissedAt:null};
 }
 function due(meta,data,now=new Date()){
  const m=normalize(meta,now),total=count(data);if(!m.enabled||!total||m.dismissedAt&&day(new Date(m.dismissedAt))===day(now))return null;
  const since=new Date(m.lastBackupAt||m.firstUsedAt),elapsed=Math.floor((Date.UTC(now.getFullYear(),now.getMonth(),now.getDate())-Date.UTC(since.getFullYear(),since.getMonth(),since.getDate()))/86400000),added=Math.max(0,total-m.baseline);
  return elapsed>=m.days?{kind:'days',value:elapsed}:m.records&&added>=m.records?{kind:'records',value:added}:null;
 }
 function filename(meta,now=new Date()){
  const minute=day(now)+'-'+String(now.getHours()).padStart(2,'0')+String(now.getMinutes()).padStart(2,'0'),sequence=meta.filenameMinute===minute?(meta.filenameSequence||1)+1:1;
  return {name:'resource-journal-backup-'+minute+(sequence>1?'-'+sequence:'')+'.csv',filenameMinute:minute,filenameSequence:sequence};
 }
 const key=()=>KEY+'-backup-reminder';let panel;
 function read(){let raw;try{raw=JSON.parse(localStorage.getItem(key())||'null');}catch{}return normalize(raw);}
 function write(meta){localStorage.setItem(key(),JSON.stringify(meta));}
 function update(values){try{write({...read(),...values});sync();renderBanner();return true;}catch(e){notice('バックアップ通知の設定を保存できません：'+e.message,true);sync();return false;}}
 function exportCSV(){let url;
  try{
   const data=blocked?JSON.parse(localStorage.getItem(KEY)):state,now=new Date(),meta=read(),file=filename(meta,now),csv=CandyBackup.encode(data),a=el('a');
   url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.href=url;a.download=file.name;document.body.append(a);a.click();a.remove();
   // The browser accepts the download request; saving to the user's disk cannot be verified.
   try{write({...meta,lastBackupAt:now.toISOString(),baseline:count(data),filenameMinute:file.filenameMinute,filenameSequence:file.filenameSequence,dismissedAt:null});sync();renderBanner();notice('CSVバックアップのダウンロードを開始');}
   catch(e){notice('CSVのダウンロードは開始しましたが、バックアップ日時を保存できません：'+e.message,true);}
   return true;
  }catch(e){notice('バックアップを書き出せませんでした：'+e.message,true);return false;}
  finally{if(url)setTimeout(()=>URL.revokeObjectURL(url),1000);}
 }
 function sync(){if(!panel)return;const m=read();$('backup-reminder-enabled').checked=m.enabled;$('backup-reminder-days').value=String(m.days);$('backup-reminder-records').value=String(m.records);$('backup-reminder-days').disabled=$('backup-reminder-records').disabled=!m.enabled;$('backup-last-at').textContent=m.lastBackupAt?new Date(m.lastBackupAt).toLocaleString('ja-JP',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}):'まだありません';}
 function renderBanner(){
  const old=$('backup-reminder-banner');if(old)old.remove();const m=read(),reason=due(m,state);if(!reason)return;
  const banner=el('aside',undefined,'backup-reminder');banner.id='backup-reminder-banner';banner.setAttribute('aria-label','バックアップのお知らせ');const initial=!m.lastBackupAt,message=reason.kind==='days'?(initial?'利用開始から':'バックアップから')+reason.value+'日が経過しました。記録を保存しておきましょう。':(initial?'記録が':'バックアップ後に')+reason.value+'件'+(initial?'あります。':'追加されました。')+'バックアップをおすすめします。';
  banner.append(el('p',message));const actions=el('div',undefined,'backup-actions');actions.append(button('バックアップ',exportCSV),button('あとで',()=>update({dismissedAt:new Date().toISOString()})));banner.append(actions);document.querySelector('.app>header').after(banner);
 }
 function init(){
  panel=$('export').closest('.card');panel.id='backup-data-settings';$('export').textContent='今すぐバックアップ';
  const toggle=el('label',undefined,'setting-row'),control=el('span',undefined,'setting-control'),input=el('input');Object.assign(input,{id:'backup-reminder-enabled',type:'checkbox'});input.setAttribute('role','switch');control.append(input,el('span',undefined,'setting-state'));control.lastChild.setAttribute('aria-hidden','true');toggle.append(el('span','バックアップ通知'),control);panel.querySelector('.backup-actions').before(toggle);
  input.onchange=()=>update({enabled:input.checked});
  for(const [id,title,choices,prop] of [['days','通知間隔',[[7,'7日'],[14,'14日'],[30,'30日'],[90,'90日']],'days'],['records','追加記録件数',[[50,'50件'],[100,'100件'],[200,'200件'],[0,'通知しない']],'records']]){const row=el('label',undefined,'setting-row'),select=el('select');select.id='backup-reminder-'+id;select.setAttribute('aria-label',title);for(const [value,name] of choices)select.add(new Option(name,String(value)));select.onchange=()=>update({[prop]:Number(select.value)});row.append(el('span',title),select);panel.querySelector('.backup-actions').before(row);}
  const last=el('div',undefined,'setting-row');last.append(el('span','前回のバックアップ'));const text=el('span');text.id='backup-last-at';last.append(text);panel.querySelector('.backup-actions').before(last);
  try{write(read());}catch(e){notice('バックアップ通知の状態を保存できません：'+e.message,true);}sync();renderBanner();
  window.addEventListener('storage',e=>{if(e.key===key()){sync();renderBanner();}});
 }
 return {defaults,count,normalize,due,filename,read,exportCSV,init};
})();
if(typeof module!=='undefined')module.exports=BackupReminder;
else document.addEventListener('DOMContentLoaded',()=>BackupReminder.init());
