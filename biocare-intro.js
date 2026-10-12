/* Biocare intro overlay - independent of app boot sequence */
(()=>{
'use strict';
const PROJECT='jlibhpavbqfeegsehekm';
const API=`https://${PROJECT}.supabase.co`;
// Set to the existing project's PUBLIC anon/publishable key (never service_role).
const KEY='sb_publishable_XVOmCPOiqdUlG-pOPhrQ0g_rIV0R6tK';
const FALLBACK='ScreenRecording_10-12-2026 20-39-47_1.mov';
const el=document.createElement('div');el.id='biocareIntro';el.setAttribute('aria-label','فيديو افتتاح التطبيق');
el.innerHTML='<video playsinline webkit-playsinline muted autoplay preload="auto" aria-label="إعلان بيوكير"></video><button type="button" class="biocare-intro-skip">تخطي ✕</button>';
let finished=false;let timer;
function close(){if(finished)return;finished=true;clearTimeout(timer);const v=el.querySelector('video');v.pause();el.remove();}
function show(path,settings){
 if(!path || /(^\/|\.\.|\\|\?|#)/.test(path))return;
 const frequency=settings.frequency||'session';
 const stamp='biocare-intro:'+path;
 try{if(frequency==='session'&&sessionStorage.getItem(stamp))return;
 if(frequency==='daily'&&localStorage.getItem(stamp)===new Date().toISOString().slice(0,10))return;
 if(frequency==='session')sessionStorage.setItem(stamp,'1');
 if(frequency==='daily')localStorage.setItem(stamp,new Date().toISOString().slice(0,10));}catch{}
 const video=el.querySelector('video');
 const url=`${API}/storage/v1/object/public/intro-videos/${path.split('/').map(encodeURIComponent).join('/')}`;
 video.src=url;
 const skip=el.querySelector('button');skip.hidden=settings.show_skip===false;
 skip.addEventListener('click',close);
 video.addEventListener('ended',close,{once:true});video.addEventListener('error',close,{once:true});
 const duration=Math.min(60,Math.max(1,Number(settings.max_duration_seconds)||10));
 timer=setTimeout(close,duration*1000);
 document.body.appendChild(el);
 const p=video.play();if(p&&typeof p.catch==='function')p.catch(close);
}
async function init(){
 // Public settings should be queried with the existing project's public key.
 if(!KEY)return;
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),3500);
 try{const r=await fetch(`${API}/rest/v1/intro_video_settings?select=enabled,video_path,show_skip,frequency,max_duration_seconds&id=eq.1`,{headers:{apikey:KEY},signal:controller.signal});if(!r.ok)return;
 const rows=await r.json();const settings=rows?.[0];if(settings?.enabled)show(settings.video_path||FALLBACK,settings);
 }catch(e){console.warn('Biocare intro unavailable',e)}finally{clearTimeout(timeout)}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
