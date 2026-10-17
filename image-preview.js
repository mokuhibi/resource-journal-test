'use strict';
// 画像の閲覧・保存・共有だけを担当し、記録や集計の状態には触れない。
const ImagePreview=(()=>{
 let dialog,content,heading,opener,scrollY=0,bodyStyle,urls=[];
 const element=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
 function cleanup(){
  document.body.style.cssText=bodyStyle;window.scrollTo(0,scrollY);
  urls.forEach(url=>URL.revokeObjectURL(url));urls=[];content.replaceChildren();opener?.focus({preventScroll:true});
 }
 function setup(){
  dialog=element('dialog');dialog.id='image-preview-dialog';dialog.setAttribute('aria-labelledby','image-preview-title');
  const header=element('header');heading=element('h2');heading.id='image-preview-title';
  const close=element('button','閉じる');close.type='button';close.onclick=()=>dialog.close();header.append(heading,close);
  content=element('div');content.className='image-preview-content';dialog.append(header,content);document.body.append(dialog);
  dialog.addEventListener('close',cleanup);
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
 }
 function fileFrom(url,name){const raw=atob(url.split(',')[1]),bytes=Uint8Array.from(raw,ch=>ch.charCodeAt(0));return new File([bytes],name,{type:'image/png'});}
 function open(title,images){
  if(!dialog)setup();if(dialog.open)dialog.close();
  opener=document.activeElement;scrollY=window.scrollY;bodyStyle=document.body.style.cssText;
  heading.textContent=title;content.replaceChildren();
  const hint=element('p','画像を長押しして保存できます。');hint.className='image-preview-hint';content.append(hint);
  images.forEach((url,i)=>{
   const figure=element('figure'),img=element('img');img.src=url;img.alt=title+(images.length>1?' '+(i+1)+' / '+images.length:'');
   const name='resource-journal-'+new Date().toISOString().slice(0,10)+'-'+(i+1)+'.png';
   const actions=element('div');actions.className='image-preview-actions';
   const save=element('a','画像を保存');save.href=url;save.download=name;actions.append(save);
   // Fileを先に用意し、共有ボタンのユーザー操作をそのまま共有APIへ渡す。
   let file;try{file=fileFrom(url,name);}catch(e){/* 長押しとダウンロードは引き続き利用可能。 */}
   if(file){save.href=URL.createObjectURL(file);urls.push(save.href);}
   if(file&&navigator.share&&navigator.canShare?.({files:[file]})){
    const share=element('button','共有');share.type='button';
    share.onclick=async()=>{try{await navigator.share({title,files:[file]});}catch(e){if(e.name!=='AbortError')status.textContent='共有できませんでした。画像の保存または長押しをご利用ください。';}};actions.append(share);
   }
   const status=element('p');status.className='image-preview-hint';status.setAttribute('role','status');
   figure.append(actions,img,status);content.append(figure);
  });
  document.body.style.position='fixed';document.body.style.top=-scrollY+'px';document.body.style.width='100%';document.body.style.overflow='hidden';
  try{dialog.showModal();content.scrollTop=0;}catch(e){cleanup();throw e;}
 }
 return {open};
})();
