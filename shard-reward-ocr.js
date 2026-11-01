'use strict';
// Read the two reward amounts from a local screenshot. This module does not save records.
const ShardRewardOCR=(()=>{
 const colors={researchExp:(r,g,b)=>b>155&&b>r*1.3&&b>g*1.08,baseAmount:(r,g,b)=>r>175&&g>80&&g<205&&b<125&&r>b*1.8};
 function band(canvas,kind){const w=canvas.width,h=canvas.height,ctx=canvas.getContext('2d',{willReadFrequently:true}),data=ctx.getImageData(0,0,w,h).data;let best=0,peak=-1;
  for(let y=Math.floor(h*.48);y<Math.floor(h*.82);y+=2){let count=0;for(let x=Math.floor(w*.27);x<Math.floor(w*.56);x+=2){const p=(y*w+x)*4;if(colors[kind](data[p],data[p+1],data[p+2]))count++;}if(count>best){best=count;peak=y;}}
  return best>w*.025?peak:-1;
 }
 function amount(text,confidence){const raw=String(text||'').normalize('NFKC').replace(/\s/g,'');if(confidence<85||!(/^(?:\d{1,3}(?:,\d{3})+|\d+)$/.test(raw)))return null;const n=Number(raw.replace(/,/g,''));return Number.isSafeInteger(n)&&n>=0&&n<=1000000000?n:null;}
 function zoomCrop(canvas,x,y,w,h){const crop=SleepOCR.crop(canvas,x,y,w,h),zoom=document.createElement('canvas');zoom.width=crop.width*2;zoom.height=crop.height*2;const ctx=zoom.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(crop,0,0,zoom.width,zoom.height);crop.width=crop.height=1;return zoom;}
 function isLabel(kind,text){const label=String(text||'').normalize('NFKC').replace(/\s/g,'');return kind==='researchExp'?/リサーチEXP/i.test(label):/ゆめの[かが]けら/.test(label);}
 async function read(file){const canvas=await SleepOCR.image(file),w=canvas.width,ocr=await SleepOCR.worker();const result={researchExp:null,baseAmount:null};try{
  for(const kind of ['researchExp','baseAmount']){const y=band(canvas,kind);if(y<0)continue;
   await ocr.setParameters({tessedit_pageseg_mode:'6',tessedit_char_whitelist:''});const label=(await ocr.recognize(SleepOCR.crop(canvas,.27*w,y-.035*w,.34*w,.085*w))).data.text;
   if(!isLabel(kind,label)&&!isLabel(kind,(await ocr.recognize(zoomCrop(canvas,.27*w,y-.035*w,.34*w,.085*w))).data.text))continue;
   await ocr.setParameters({tessedit_pageseg_mode:'7',tessedit_char_whitelist:'0123456789,'});const recognized=(await ocr.recognize(SleepOCR.crop(canvas,.65*w,y-.04*w,.30*w,.09*w))).data;
   result[kind]=amount(recognized.text,recognized.confidence);
   if(result[kind]===null){const retried=(await ocr.recognize(zoomCrop(canvas,.65*w,y-.04*w,.30*w,.09*w))).data;result[kind]=amount(retried.text,retried.confidence);}
  }
  return result;
 }finally{await ocr.terminate();canvas.width=canvas.height=1;}}
 return {read,amount,band};
})();
if(typeof module!=='undefined')module.exports=ShardRewardOCR;
