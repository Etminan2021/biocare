import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient'; // Adjust import

// The caller MUST restrict access to verified admins. The server endpoint MUST also enforce admin authorization.
export default function AdminIntro() {
 const [config,setConfig] = useState({enabled:false,show_skip:true,frequency:'session',max_seconds:null,video_path:null});
 const [file,setFile] = useState(null);
 const [message,setMessage] = useState('');
 useEffect(()=>{supabase.from('app_intro_settings').select('*').eq('id',1).single().then(({data})=>{if(data)setConfig(data);});},[]);
 async function save(e){
  e.preventDefault();setMessage('جاري الحفظ...');
  const {data:{session}}=await supabase.auth.getSession();
  if(!session){setMessage('يرجى تسجيل الدخول');return;}
  // This API must validate the caller's administrator role on the server.
  const form = new FormData();form.append('settings',JSON.stringify(config));if(file)form.append('video',file);
  const res=await fetch('/api/admin/intro',{method:'POST',headers:{Authorization:`Bearer ${session.access_token}`},body:form});
  const result=await res.json().catch(()=>({error:'تعذر قراءة الاستجابة'}));
  if(!res.ok){setMessage(result.error||'فشل الحفظ');return;}
  setConfig(result.settings);setMessage('تم حفظ الإعدادات');
 }
 return <form onSubmit={save} dir="rtl" style={{display:'grid',gap:14,maxWidth:500}}>
  <h2>إدارة فيديو افتتاح Biocare</h2>
  <label><input type="checkbox" checked={config.enabled} onChange={e=>setConfig({...config,enabled:e.target.checked})}/> تفعيل الفيديو</label>
  <label>استبدال الفيديو (MP4 أو WebM حتى 50MB)<input type="file" accept="video/mp4,video/webm" onChange={e=>setFile(e.target.files?.[0]||null)}/></label>
  <label>التكرار <select value={config.frequency} onChange={e=>setConfig({...config,frequency:e.target.value})}><option value="always">كل فتح</option><option value="session">مرة لكل جلسة</option><option value="daily">مرة يوميًا</option></select></label>
  <label>الحد الأقصى للعرض بالثواني (اتركه فارغًا حتى ينتهي الفيديو)<input type="number" min="1" max="60" value={config.max_seconds??''} onChange={e=>setConfig({...config,max_seconds:e.target.value?Number(e.target.value):null})}/></label>
  <label><input type="checkbox" checked={config.show_skip} onChange={e=>setConfig({...config,show_skip:e.target.checked})}/> إظهار زر تخطي</label>
  <button type="submit">حفظ ونشر</button><p role="status">{message}</p>
 </form>;
}
