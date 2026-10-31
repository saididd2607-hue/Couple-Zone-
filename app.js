(() => {
  const cfg = window.COUPLE_ZONE_CONFIG || {};
  const $ = id => document.getElementById(id);
  const authPanel=$('authPanel'), appPanel=$('appPanel'), msg=$('authMsg');
  let supabaseClient, mode='login', user=null, sw=false;
  const say = t => { msg.textContent=t; };
  if (!cfg.supabaseUrl || cfg.supabaseUrl.includes('PASTE_') || !cfg.supabasePublishableKey || cfg.supabasePublishableKey.includes('PASTE_')) {
    say('Setup required: add your Supabase URL and Publishable key in config.js.');
    $('authSubmit').disabled=true; return;
  }
  supabaseClient = window.supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);
  function setMode(m){mode=m;$('loginTab').classList.toggle('active',m==='login');$('signupTab').classList.toggle('active',m==='signup');$('nameWrap').classList.toggle('hidden',m!=='signup');$('authSubmit').textContent=m==='login'?(sw?'Ingia':'Log in'):(sw?'Jisajili':'Create account');$('password').autocomplete=m==='login'?'current-password':'new-password';say('');}
  $('loginTab').onclick=()=>setMode('login');$('signupTab').onclick=()=>setMode('signup');
  $('langBtn').onclick=()=>{sw=!sw;$('langBtn').textContent=sw?'English':'Kiswahili';$('welcome').textContent=sw?'Karibuni, mjenge ukaribu pamoja.':'Grow closer, together.';setMode(mode);};
  $('authForm').onsubmit=async e=>{e.preventDefault();say('Please wait…');const email=$('email').value.trim(),password=$('password').value;
    if(mode==='signup'&&!$('adult').checked){say('You must confirm that you are 18 or older.');return;}
    let result;
    if(mode==='signup'){result=await supabaseClient.auth.signUp({email,password,options:{data:{display_name:$('displayName').value.trim(),is_adult:true}}});}
    else {result=await supabaseClient.auth.signInWithPassword({email,password});}
    if(result.error){say(result.error.message);return;}
    if(mode==='signup'&&!result.data.session){say('Account created. Check your email to confirm, then log in.');return;}
    user=result.data.user; await ensureProfile(); showApp();
  };
  async function ensureProfile(){if(!user)return;const {error}=await supabaseClient.from('profiles').upsert({id:user.id,display_name:user.user_metadata?.display_name||user.email,is_adult:true},{onConflict:'id'});if(error)console.warn(error.message);}
  async function showApp(){authPanel.classList.add('hidden');appPanel.classList.remove('hidden');$('hello').textContent=(sw?'Karibu, ':'Welcome, ')+(user.user_metadata?.display_name||user.email);await refreshCouple();}
  async function refreshCouple(){const {data,error}=await supabaseClient.from('couple_members').select('couple_id').eq('user_id',user.id).limit(1).maybeSingle();$('coupleStatus').textContent=error?'Could not load couple space. Run the SQL setup in README.':data?'You are connected to a couple space.':'You have not connected a partner yet.';}
  $('createInvite').onclick=async()=>{const b=$('createInvite');b.disabled=true;$('inviteResult').textContent='Creating…';const {data,error}=await supabaseClient.rpc('create_couple_invite');b.disabled=false;if(error){$('inviteResult').textContent='Setup needed: '+error.message;return;}$('inviteResult').textContent=data;};
  $('joinInvite').onclick=async()=>{const code=$('joinCode').value.trim();if(!/^\d{6}$/.test(code)){alert('Enter a six-digit code.');return;}const {error}=await supabaseClient.rpc('join_couple_invite',{invite_code:code});if(error){alert(error.message);return;}alert('You joined the couple space!');await refreshCouple();};
  $('logout').onclick=async()=>{await supabaseClient.auth.signOut();user=null;appPanel.classList.add('hidden');authPanel.classList.remove('hidden');setMode('login');};
  supabaseClient.auth.getSession().then(async({data})=>{if(data.session){user=data.session.user;await ensureProfile();showApp();}});
})();