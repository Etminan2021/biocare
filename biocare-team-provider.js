/* Verified live location for signed-in patients only */
(()=>{'use strict';
window.BIOCARE_TEAM_LOCATION_PROVIDER={
 async getLocation(number){
  if(typeof initAuth!=='function')throw Error('Login unavailable');
  await initAuth();
  if(!authUser)throw Error('Sign in first');
  const{data,error}=await supabaseClient.rpc('care_patient_team_location',{p_order_number:number});
  if(error)throw error;
  const p=data?.[0];
  return p?{lat:p.lat,lon:p.lon,updated_at:new Date(p.updated_at).toLocaleString('ar-SA'),active:p.active}:null;
 }
};
})();
