// Staging-only Supabase Auth client. Publishable key is safe for browser use;
// never put service-role/secret keys here. Private portal tables have no browser grants.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
const supabase=createClient('https://nzoogwpabqvyojptivom.supabase.co','sb_publishable_Sf_5TL3lZvGrcrD4IIJ_BQ_prCHUsPp');
const byId=id=>document.getElementById(id);
// Set window.NEXTGEN_STAGING_API_ORIGIN from a staging-only HTML config.
// No production fallback: fail closed until a reviewed HTTPS API is deployed.
const apiOrigin=window.NEXTGEN_STAGING_API_ORIGIN;
const apiReady=typeof apiOrigin==='string'&&/^https:\/\/[^/]+$/.test(apiOrigin);
async function api(path,body={}){
 if(!apiReady)throw Error('staging_api_not_configured');
 const {data:{session}}=await supabase.auth.getSession();
 if(!session?.access_token)throw Error('sign_in_required');
 const response=await fetch(apiOrigin+'/api/client/'+path,{
  method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
  body:JSON.stringify(body),cache:'no-store'
 });
 if(!response.ok)throw Error('request_denied');
 return response.json();
}
function showItems(id,items,render){
 const list=byId(id);list.replaceChildren();
 for(const item of items){
  const li=document.createElement('li');
  li.textContent=render(item);
  list.append(li);
 }
}
async function loadDashboard(){
 for(const [path,statusId,listId,field,render] of [
  ['my-services','services-status','services-list','services',x=>x.title],
  ['documents/list','documents-status','documents-list','documents',x=>x.filename]
 ]){
  try{
   const data=await api(path);
   const items=Array.isArray(data[field])?data[field]:[];
   showItems(listId,items,render);
   byId(statusId).textContent=items.length?'': 'No items yet.';
  }catch{
   showItems(listId,[],x=>x);
   byId(statusId).textContent=apiReady?'Unable to load. Try again later.':'Staging API not configured.';
  }
 }
}
const message=(text)=>{byId('auth-status').textContent=text;};
const update=async()=>{
 const {data:{user}}=await supabase.auth.getUser();
 byId('session-status').textContent=user?.email_confirmed_at?'Signed in: '+user.email:'Not signed in';
 byId('logout').disabled=!user;
 byId('code').disabled=!(user?.email_confirmed_at&&apiReady);
 byId('activate').disabled=!(user?.email_confirmed_at&&apiReady);
 byId('document-file').disabled=!(user?.email_confirmed_at&&apiReady);
 byId('upload-button').disabled=!(user?.email_confirmed_at&&apiReady);
 if(user?.email_confirmed_at)await loadDashboard();
 else {
  showItems('services-list',[],x=>x);showItems('documents-list',[],x=>x);
  byId('services-status').textContent='Sign in to load your services.';
  byId('documents-status').textContent='Sign in to load your documents.';
 }
};
byId('signup').addEventListener('submit',async event=>{
 event.preventDefault();
 const email=byId('email').value.trim(),password=byId('password').value;
 message('Submitting registration...');
 const {error}=await supabase.auth.signUp({email,password,options:{emailRedirectTo:location.origin+location.pathname}});
 message(error?'Registration failed. Please check your details.':'Check your email for a confirmation link before signing in.');
});
byId('signin').addEventListener('submit',async event=>{
 event.preventDefault();
 const {error}=await supabase.auth.signInWithPassword({email:byId('login-email').value.trim(),password:byId('login-password').value});
 message(error?'Sign-in failed. Verify your email and credentials.':'Signed in. Paid services remain locked until activation.');
 await update();
});
byId('activate').addEventListener('click',async()=>{
 const code=byId('code').value.trim();
 if(!/^[A-Za-z0-9_-]{43}$/.test(code)){message('Enter a valid activation code.');return;}
 byId('activate').disabled=true;
 try{
  await api('redeem-code',{code});
  byId('code').value='';
  message('Service activated.');
  await loadDashboard();
 }catch{message('Activation unavailable or code invalid.');}
 finally{const {data:{user}}=await supabase.auth.getUser();byId('activate').disabled=!(user?.email_confirmed_at&&apiReady);}
});
byId('upload-form').addEventListener('submit',async event=>{
 event.preventDefault();
 const file=byId('document-file').files?.[0];
 if(!file)return;
 if(!['application/pdf','image/png','image/jpeg'].includes(file.type)||file.size<1||file.size>10485760){
  message('Choose a PDF, PNG or JPEG under 10 MB.');return;
 }
 byId('upload-button').disabled=true;
 try{
  const ticket=await api('documents/begin-upload',{
   mimeType:file.type,sizeBytes:file.size,originalFilename:file.name
  });
  if(typeof ticket.objectPath!=='string'||typeof ticket.uploadToken!=='string')throw Error('invalid_ticket');
  const {error}=await supabase.storage.from('nextgenca-client-documents')
   .uploadToSignedUrl(ticket.objectPath,ticket.uploadToken,file,{
    contentType:file.type,upsert:false
   });
  if(error)throw error;
  await api('documents/complete-upload',{documentId:ticket.documentId});
  byId('document-file').value='';
  message('Document uploaded securely.');
  await loadDashboard();
 }catch{
  message('Upload could not be completed. Please try again later.');
 }finally{
  const {data:{user}}=await supabase.auth.getUser();
  byId('upload-button').disabled=!(user?.email_confirmed_at&&apiReady);
 }
});
byId('logout').addEventListener('click',async()=>{
 await supabase.auth.signOut();message('Signed out.');await update();
});
supabase.auth.onAuthStateChange(()=>{void update();});
await update();
