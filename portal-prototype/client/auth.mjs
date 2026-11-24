// Staging-only Supabase Auth client. Publishable key is safe for browser use;
// never put service-role/secret keys here. Private portal tables have no browser grants.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
const supabase=createClient('https://nzoogwpabqvyojptivom.supabase.co','sb_publishable_Sf_5TL3lZvGrcrD4IIJ_BQ_prCHUsPp');
const byId=id=>document.getElementById(id);
const message=(text)=>{byId('auth-status').textContent=text;};
const update=async()=>{
 const {data:{user}}=await supabase.auth.getUser();
 byId('session-status').textContent=user?.email_confirmed_at?'Signed in: '+user.email:'Not signed in';
 byId('logout').disabled=!user;
 // Activation remains unavailable until trusted server redemption endpoint is deployed.
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
byId('logout').addEventListener('click',async()=>{
 await supabase.auth.signOut();message('Signed out.');await update();
});
supabase.auth.onAuthStateChange(()=>{void update();});
await update();
