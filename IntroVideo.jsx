import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient'; // Adjust to your project's existing client import

export default function IntroVideo({ children }) {
  const [settings, setSettings] = useState(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.from('app_intro_settings').select('*').eq('id',1).maybeSingle();
      if (!active || !data?.enabled || !data.video_path) return;
      const key = 'biocare_intro_' + data.updated_at;
      const today = new Date().toLocaleDateString('en-CA');
      if (data.frequency === 'session' && sessionStorage.getItem(key)) return;
      if (data.frequency === 'daily' && localStorage.getItem(key) === today) return;
      if (data.frequency === 'session') sessionStorage.setItem(key,'1');
      if (data.frequency === 'daily') localStorage.setItem(key,today);
      setSettings(data); setVisible(true);
    })();
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!visible || !settings?.max_seconds) return;
    const timeout = setTimeout(() => setVisible(false), settings.max_seconds * 1000);
    return () => clearTimeout(timeout);
  }, [visible,settings]);
  const url = settings?.video_path ? supabase.storage.from('intro-videos').getPublicUrl(settings.video_path).data.publicUrl : '';
  return <>{children}{visible && <div role="dialog" aria-label="Biocare introduction" style={{position:'fixed',inset:0,zIndex:99999,background:'#000'}}>
    <video src={url} autoPlay muted playsInline onEnded={()=>setVisible(false)} onError={()=>setVisible(false)} style={{width:'100%',height:'100%',objectFit:'cover'}} />
    {settings.show_skip && <button onClick={()=>setVisible(false)} style={{position:'absolute',top:30,right:20,padding:'10px 18px',borderRadius:24,background:'#ffffffdd',border:0,cursor:'pointer'}}>تخطي ×</button>}
  </div>}</>;
}
