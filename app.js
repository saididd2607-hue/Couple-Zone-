
(() => {
'use strict';
const cfg=window.COUPLE_ZONE_CONFIG||{}, $=id=>document.getElementById(id);
let db,user,mode='login',sw=false,activeCategory='All',activities=[],currentActivity=null;
const icons={'Romance':'❤️','Deep Conversations':'🗣️','Fun Games':'🎲','Couple Challenges':'🏆','Love & Appreciation':'💕','Long Distance':'🌍','Relationship Growth':'🌱','Surprise Activities':'🎁','Bedroom Time':'💜','Memories':'📸','Future':'🔮','Activities':'🎯','Communication':'💬'};
const t=(en,swText)=>sw?swText:en;
const catSw={'Romance':'Mahaba','Deep Conversations':'Mazungumzo ya Kina','Fun Games':'Michezo ya Kufurahisha','Couple Challenges':'Changamoto za Wapenzi','Love & Appreciation':'Upendo na Shukrani','Long Distance':'Umbali','Relationship Growth':'Ukuaji wa Uhusiano','Surprise Activities':'Mshangao','Bedroom Time':'Wakati wa Chumbani','Memories':'Kumbukumbu','Future':'Wakati Ujao','Activities':'Shughuli','Communication':'Mawasiliano'};
const catName=c=>sw?(catSw[c]||c):c;
function toast(m){const e=document.createElement('div');e.className='toast';e.textContent=m;document.body.appendChild(e);setTimeout(()=>e.remove(),2600);}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function msg(s,error=false){$('authMsg').textContent=s;$('authMsg').style.color=error?'#ff9caa':'';}
function setMode(m){mode=m;$('password').type='password';$('togglePw').textContent='👁';$('loginTab').classList.toggle('active',m==='login');$('signupTab').classList.toggle('active',m==='signup');$('nameWrap').classList.toggle('hidden',m!=='signup');$('adultWrap').classList.toggle('hidden',m!=='signup');$('displayName').required=m==='signup';$('adult').required=m==='signup';$('forgotWrap').classList.toggle('hidden',m==='signup');$('authSubmit').textContent=t(m==='login'?'Log in':'Create account',m==='login'?'Ingia':'Fungua akaunti');msg('');}
function showView(v){['home','explore','favorites','profile','surprise','bedAdmin','memories','quiz'].forEach(x=>{$(x+'View').classList.toggle('hidden',x!==v);$(x+'View').classList.toggle('active-view',x===v);});document.querySelectorAll('.navitem').forEach(b=>b.classList.toggle('selected',b.dataset.view===v));if(v==='explore')renderExplore();if(v==='favorites')renderFavorites();if(v==='memories')renderMemories();if(v==='quiz')renderQuiz();}
async function ensureProfile(){const name=user.user_metadata?.display_name||(user.email||'').split('@')[0];const {error}=await db.from('profiles').upsert({id:user.id,display_name:name,email:user.email},{onConflict:'id'});if(error)console.warn(error.message);}
async function refreshCouple(){const {data,error}=await db.from('couple_members').select('couple_id').eq('user_id',user.id).limit(1);myCoupleId=!error&&data?.length?data[0].couple_id:null;$('coupleStatus').textContent=!error&&data?.length?t('Your couple space is connected.','Nafasi yenu imeunganishwa.'):t('You can enjoy Couple Zone without connecting a partner. Inviting someone is optional.','Unaweza kutumia Couple Zone bila kuunganisha mwenza. Kumwalika ni hiari.');}
async function loadActivities(){const {data,error}=await db.from('activities').select('*').range(0,999);if(error){console.error(error);activities=[];return;}activities=data||[];}
 let surpriseImages = [];

async function loadSurpriseImages(){
  const {data,error}=await db.storage
    .from('couple-zone-images')
    .list('bedroom',{limit:200});

  if(error){
    console.error('Picha hazijapakiwa:',error.message);
    return;
  }

  surpriseImages=(data||[])
    .filter(file=>file.id && /\.(jpg|jpeg|png|webp)$/i.test(file.name) && !/^file_0000000004808211/.test(file.name))
    .map(file=>({
      name:file.name,
      url:db.storage
        .from('couple-zone-images')
        .getPublicUrl('bedroom/'+file.name).data.publicUrl
    }));

  console.log('Picha zilizopatikana:',surpriseImages.length);
} 
let myCoupleId=null,qs={screen:"intro"},qMine=[],qPartner=[];
const QUIZ=[
["Your ideal free weekend?","Wikendi yako bora ya mapumziko?",[["Resting at home","Kupumzika nyumbani"],["Out with friends","Kutoka na marafiki"],["Traveling or exploring","Kusafiri au kutalii"],["Cooking or a hobby","Kupika au burudani binafsi"]]],
["Favorite kind of food?","Aina ya chakula unachopenda zaidi?",[["Home-cooked meals","Chakula cha nyumbani"],["Street food","Chakula cha mitaani"],["Restaurant dining","Mgahawani"],["Sweet treats","Vitu vitamu"]]],
["What relaxes you most after a long day?","Nini kinakupumzisha zaidi baada ya siku ndefu?",[["Music","Muziki"],["Sleep","Kulala"],["Talking with someone","Kuongea na mtu"],["TV or phone","TV au simu"]]],
["How do you most like to receive love?","Unapenda kupokea mapenzi vipi zaidi?",[["Kind words","Maneno mazuri"],["Quality time","Muda wa ubora pamoja"],["Gifts","Zawadi"],["Hugs and touch","Kumbatio na ukaribu"]]],
["Dream holiday?","Likizo ya ndoto?",[["Beach","Ufukweni"],["Mountains or safari","Milimani au safari"],["Big city","Mji mkubwa"],["Staying home","Kukaa nyumbani"]]],
["When are you most energetic?","Ni wakati gani una nguvu zaidi?",[["Early morning","Asubuhi na mapema"],["Afternoon","Mchana"],["Evening","Jioni"],["Late night","Usiku wa manane"]]],
["When you are upset, what do you need?","Ukiwa umekasirika, unahitaji nini?",[["Space","Nafasi ya peke yangu"],["To talk it out","Kuzungumza"],["A hug","Kumbatio"],["A distraction","Kuburudika"]]],
["Favorite weather?","Hali ya hewa unayopenda?",[["Sunny and hot","Jua kali"],["Rainy","Mvua"],["Cool and breezy","Baridi na upepo"],["Cloudy","Mawingu"]]],
["Best kind of date?","Miadi bora zaidi ni ipi?",[["Dinner out","Chakula nje"],["Movie at home","Filamu nyumbani"],["Outdoor adventure","Matembezi ya nje"],["Music and dancing","Muziki na kucheza"]]],
["Biggest dream?","Ndoto yako kubwa zaidi?",[["Own business","Biashara yangu mwenyewe"],["Travel the world","Kuzunguka dunia"],["A happy family","Familia yenye furaha"],["Career success","Mafanikio kazini"]]],
["How do you like to celebrate your birthday?","Unapenda kusherehekea siku yako ya kuzaliwa vipi?",[["Big party","Sherehe kubwa"],["Quiet dinner","Chakula tulivu"],["A surprise","Mshangao"],["Just a gift","Zawadi tu"]]],
["Which music do you enjoy most?","Muziki gani unaoupenda zaidi?",[["Bongo Flava","Bongo Flava"],["Gospel or Taarab","Injili au Taarab"],["R&B or Soul","R&B au Soul"],["Afrobeats","Afrobeats"]]]
];
const qo=(qi,ci)=>{const x=QUIZ[qi][2][ci];return x?(sw?x[1]:x[0]):"—";};
const qq=i=>sw?QUIZ[i][1]:QUIZ[i][0];
function optBtns(qi,attr,picked){return QUIZ[qi][2].map((o,ci)=>`<button type="button" class="opt-btn ${picked===ci?"picked":""}" data-${attr}="${ci}">${esc(sw?o[1]:o[0])}</button>`).join("");}
async function renderQuiz(){
  $("quizBody").innerHTML=`<p class="message">…</p>`;
  const {data,error}=await db.from("quiz_answers").select("*").limit(500);
  if(error){$("quizBody").innerHTML=`<p class="message">${esc(error.message)}</p>`;return;}
  const rows=data||[];
  qMine=rows.filter(r=>r.user_id===user.id);
  qPartner=rows.filter(r=>r.user_id!==user.id);
  qs=qMine.length>=QUIZ.length?{screen:"done"}:{screen:"intro"};
  drawQuiz();
}
function drawQuiz(){
  const box=$("quizBody");
  if(qs.screen==="q"){
    const i=qs.i,ready=qs.ownPick!=null&&qs.guessPick!=null;
    box.innerHTML=`<span class="eyebrow">${i+1} / ${QUIZ.length}</span><div class="quiz-bar"><i style="width:${(i/QUIZ.length)*100}%"></i></div><h2>${esc(qq(i))}</h2><h4>${t("Your answer","Jibu lako")}</h4><div class="opt-grid">${optBtns(i,"qown",qs.ownPick)}</div><h4>${t("What will your partner pick?","Mwenza wako atachagua nini?")}</h4><div class="opt-grid">${optBtns(i,"qguess",qs.guessPick)}</div><button id="quizNext" class="primary full" ${ready?"":"disabled"}>${i===QUIZ.length-1?t("Finish","Maliza"):t("Next","Endelea")}</button>`;
    return;
  }
  if(qs.screen==="done"){
    const pm={},mm={};qPartner.forEach(r=>pm[r.question_id]=r);qMine.forEach(r=>mm[r.question_id]=r);
    const hasP=qPartner.length>0;let my=0,their=0;
    QUIZ.forEach((_,i)=>{if(pm[i]&&mm[i]){if(mm[i].guess_choice===pm[i].own_choice)my++;if(pm[i].guess_choice===mm[i].own_choice)their++;}});
    const rows=QUIZ.map((_,i)=>{const m=mm[i],p=pm[i],ok=m&&p&&m.guess_choice===p.own_choice;
      return `<article class="quiz-res"><h4>${i+1}. ${esc(qq(i))}</h4><p>${t("You","Wewe")}: <b>${esc(m?qo(i,m.own_choice):"—")}</b></p><p>${t("Partner","Mwenza")}: <b>${esc(p?qo(i,p.own_choice):"—")}</b></p><p class="${p?(ok?"ok":"no"):""}">${t("You guessed","Ulibashiri")}: ${esc(m?qo(i,m.guess_choice):"—")} ${p?(ok?"✓":"✗"):""}</p></article>`;}).join("");
    box.innerHTML=`<h2>${t("Your results","Matokeo yenu")}</h2>${hasP?`<div class="quiz-score"><div><b>${my}/${QUIZ.length}</b><small>${t("You guessed right","Ulibashiri sahihi")}</small></div><div><b>${their}/${QUIZ.length}</b><small>${t("Partner guessed right","Mwenza alibashiri sahihi")}</small></div></div>`:`<p class="message">${t("Your partner has not played yet. Their answers will appear here once they finish.","Mwenza wako bado hajacheza. Majibu yake yataonekana hapa akimaliza.")}</p>`}${rows}<button id="quizRefresh" class="secondary full" type="button">${t("Refresh","Onyesha upya")}</button><button id="quizAgain" class="primary full" type="button">${t("Play again","Cheza tena")}</button>`;
    return;
  }
  box.innerHTML=`<span class="eyebrow">${t("PLAY TOGETHER","CHEZENI PAMOJA")}</span><h2>🎮 ${t("Partner Quiz","Maswali ya Wapenzi")}</h2><p class="message" style="color:var(--muted)">${t("For each question pick YOUR answer, then guess what your partner will pick. When you both finish, all the answers appear here.","Kwa kila swali chagua jibu LAKO, kisha bashiri mwenza wako atachagua nini. Mkimaliza wote, majibu yote yataonekana hapa.")}</p><p class="message" style="color:var(--muted)">${QUIZ.length} ${t("questions","maswali")}${myCoupleId?"":" · "+t("Connect your partner first so they can play too.","Mwalike mwenza wako kwanza ili naye acheze.")}</p><button id="quizStart" class="primary full" type="button">${t("Start","Anza")}</button>`;
}
async function finishQuiz(){
  const rows=QUIZ.map((_,i)=>({user_id:user.id,couple_id:myCoupleId,question_id:i,own_choice:qs.own[i],guess_choice:qs.guess[i],updated_at:new Date().toISOString()}));
  const {error}=await db.from("quiz_answers").upsert(rows,{onConflict:"user_id,question_id"});
  if(error){toast(error.message);qs.i=QUIZ.length-1;drawQuiz();return;}
  await renderQuiz();
}
async function quizClick(e){
  const b=e.target.closest("button");if(!b)return;
  if(b.dataset.qown!==undefined){qs.ownPick=+b.dataset.qown;drawQuiz();}
  else if(b.dataset.qguess!==undefined){qs.guessPick=+b.dataset.qguess;drawQuiz();}
  else if(b.id==="quizStart"){qs={screen:"q",i:0,own:[],guess:[],ownPick:null,guessPick:null};drawQuiz();}
  else if(b.id==="quizNext"){qs.own[qs.i]=qs.ownPick;qs.guess[qs.i]=qs.guessPick;qs.ownPick=null;qs.guessPick=null;qs.i++;if(qs.i>=QUIZ.length){b.disabled=true;await finishQuiz();}else drawQuiz();}
  else if(b.id==="quizAgain"){qs={screen:"intro"};drawQuiz();}
  else if(b.id==="quizRefresh"){renderQuiz();}
}
async function renderMemories(){
  $("memMsg").textContent="";
  $("memSub").textContent=myCoupleId?t("Write a memory and share it with your partner.","Andika kumbukumbu na umshirikishe mwenza wako."):t("Only you can see these until your partner joins.","Wewe tu ndiye unayeziona hadi mwenza wako ajiunge.");
  const {data,error}=await db.from("couple_memories").select("*").order("created_at",{ascending:false}).limit(100);
  if(error){$("memList").innerHTML=`<p class="message">${esc(error.message)}</p>`;return;}
  const list=data||[];
  $("memList").innerHTML=list.length?list.map(m=>`<article class="mem-card"><div class="mem-top"><b>${esc(m.author_id===user.id?t("You","Wewe"):(m.author_name||t("Partner","Mwenza")))}</b><small>${esc(new Date(m.created_at).toLocaleDateString(sw?"sw-TZ":"en-GB",{day:"numeric",month:"short",year:"numeric"}))}</small></div><p>${esc(m.content)}</p>${m.author_id===user.id?`<button class="linkbtn" type="button" data-memdel="${esc(m.id)}">${t("Delete","Futa")}</button>`:""}</article>`).join(""):`<p class="empty-note">${t("No memories yet. Write the first one 💜","Bado hakuna kumbukumbu. Andika ya kwanza 💜")}</p>`;
}
async function saveMemory(){
  const text=$("memText").value.trim();if(!text)return;
  $("memSave").disabled=true;
  const {error}=await db.from("couple_memories").insert({content:text,couple_id:myCoupleId,author_id:user.id,author_name:user.user_metadata?.display_name||(user.email||"").split("@")[0]});
  $("memSave").disabled=false;
  if(error){$("memMsg").textContent=error.message;return;}
  $("memText").value="";$("memCount").textContent="0/1000";toast(t("Memory shared 💜","Kumbukumbu imeshirikiwa 💜"));renderMemories();
}
async function deleteMemory(id){
  if(!confirm(t("Delete this memory?","Futa kumbukumbu hii?")))return;
  const {error}=await db.from("couple_memories").delete().eq("id",id);
  if(error)toast(error.message);else renderMemories();
}

let bedroom=[],currentBed=null;
const prettyName=n=>n.replace(/\.[a-z]+$/i,'').replace(/[_-]+/g,' ');
async function loadBedroom(){
  const {data,error}=await db.from('bedroom_time').select('*').order('sort_order',{ascending:true}).range(0,199);
  if(!error&&data?.length){
    bedroom=data.map(r=>({id:String(r.id),name_en:r.name_en,name_sw:r.name_sw||r.name_en,
      url:db.storage.from('couple-zone-images').getPublicUrl(r.image_path).data.publicUrl}));
    return;
  }
  if(error)console.warn(error.message);
  bedroom=surpriseImages.map((f,i)=>({id:'f'+i,name_en:prettyName(f.name),name_sw:prettyName(f.name),url:f.url}));
}
function pool(){
  if(!bedroom.length)return surpriseStyles;
  return bedroom.map(b=>({id:'b'+b.id,category:'Bedroom Time',icon:'💜',title:b.name_en,titleSw:b.name_sw,
    description:'A new idea for your time together.',descriptionSw:'Wazo jipya kwa muda wenu pamoja.',
    guide:'Go slowly, communicate, and only try what you both feel comfortable with.',
    guideSw:'Fanyeni taratibu, mwasiliane, na jaribuni tu kile ambacho wote mnajisikia vizuri.',image:b.url}));
}
function bedCard(b){const n=sw?b.name_sw:b.name_en;return `<article class="activity-card bed-card" data-bed="${esc(b.id)}"><img src="${esc(b.url)}" alt="${esc(n)}" loading="lazy"><div class="bed-row"><h3>${esc(n)}</h3><button class="heart-btn" data-bedfav="${esc(b.id)}">${isStyleFavorite('b'+b.id)?'♥':'♡'}</button></div></article>`;}
function renderBedroom(q){const list=bedroom.filter(b=>!q||(b.name_en+' '+b.name_sw).toLowerCase().includes(q));$('exploreActivities').innerHTML=list.length?list.map(bedCard).join(''):`<p class="message">${t('No activities found.','Hakuna shughuli zilizopatikana.')}</p>`;}
function toggleBedFav(id){const key='cz_style_favs_'+user.id,v='b'+id,l=styleFavs(),n=l.includes(v)?l.filter(x=>x!==v):[...l,v];try{localStorage.setItem(key,JSON.stringify(n));}catch{}renderExplore();renderFavorites();renderStyleFavorites();updateModal();}
function openBedroom(id){const b=bedroom.find(x=>x.id===String(id));if(!b)return;currentBed=b;currentActivity=null;$('modalCategory').textContent='💜 '+catName('Bedroom Time');$('modalTitle').textContent=sw?b.name_sw:b.name_en;$('modalDescription').textContent=t('Go slowly, communicate, and only try what you both feel comfortable with.','Fanyeni taratibu, mwasiliane, na jaribuni tu kile ambacho wote mnajisikia vizuri.');$('modalDuration').textContent='';$('modalImage').src=b.url;$('modalImage').alt=$('modalTitle').textContent;$('modalImage').classList.remove('hidden');updateModal();$('activityModal').classList.remove('hidden');}
function renderBedAdmin(){
  $('bedAdminList').innerHTML=bedroom.map(b=>`<div class="admin-row" data-adm-row="${esc(b.id)}"><img src="${esc(b.url)}" alt=""><div><input data-adm="en" value="${esc(b.name_en)}" placeholder="English name"><input data-adm="sw" value="${esc(b.name_sw)}" placeholder="Jina la Kiswahili"><small class="admin-status"></small></div></div>`).join('')||'<p class="message">Hakuna picha.</p>';
}
async function saveBedName(row){
  const id=row.dataset.admRow,st=row.querySelector('.admin-status');
  const en=row.querySelector('[data-adm=en]').value.trim(),sw=row.querySelector('[data-adm=sw]').value.trim();
  if(!en){st.textContent='Jina la Kiingereza linahitajika.';return;}
  if(id.startsWith('f')){st.textContent='Endesha bedroom_time.sql kwanza.';return;}
  st.textContent='Inahifadhi…';
  const {data,error}=await db.from('bedroom_time').update({name_en:en,name_sw:sw||en}).eq('id',id).select();
  if(error||!data?.length){st.textContent=error?error.message:'Hukuruhusiwa (angalia email kwenye SQL).';return;}
  const b=bedroom.find(x=>x.id===id);if(b){b.name_en=en;b.name_sw=sw||en;}
  st.textContent='✓ Imehifadhiwa';
}
async function showApp(u){

  user = u;

  $('authPanel').classList.add('hidden');
  $('appPanel').classList.remove('hidden');
  $('bottomNav').classList.remove('hidden');

  $('hello').textContent =
    t('Welcome','Karibu') +
    (u.user_metadata?.display_name
      ? ', ' + u.user_metadata.display_name
      : '');

  $('profileName').textContent =
    u.user_metadata?.display_name ||
    t('Your profile','Wasifu wako');

  $('profileEmail').textContent = u.email || '';
  $('openBedAdmin').classList.toggle('hidden', !(cfg.adminEmail && (u.email||'').toLowerCase()===cfg.adminEmail.toLowerCase()));

  await ensureProfile();

  await refreshCouple();

  await loadActivities();

  await loadSurpriseImages();
  await loadBedroom();

  renderAll();

  showView('home');
}
  const surpriseStyles = [
  {
    id: 'romantic-connection',
    category: 'Romantic Connection',
    icon: '❤️',
    title: 'Romantic Connection',
    titleSw: 'Muunganiko wa Kimapenzi',
    description: 'Spend quality time together, share loving words and enjoy each other’s company.',
    descriptionSw: 'Tumieni muda pamoja, semeni maneno ya upendo na kufurahia uwepo wenu.',
    guide: 'Take turns sharing three things you appreciate about each other.',
    guideSw: 'Zamu kwa zamu, taja mambo matatu unayoyathamini kwa mwenza wako.'
  },
  {
    id: 'couple-massage',
    category: 'Couple Massage',
    icon: '🌹',
    title: 'Relaxing Couple Massage',
    titleSw: 'Massage ya Wapenzi',
    description: 'Create a calm atmosphere and help each other relax.',
    descriptionSw: 'Tengenezeni mazingira tulivu na kusaidiana kupumzika.',
    guide: 'Use gentle movements and ask your partner what feels comfortable.',
    guideSw: 'Fanyeni kwa upole na muulizane kama kila mmoja anajisikia vizuri.'
  },
  {
    id: 'romantic-mood',
    category: 'Romantic Mood',
    icon: '🕯️',
    title: 'Candlelight Moments',
    titleSw: 'Muda wa Mshumaa',
    description: 'Enjoy a peaceful romantic evening together.',
    descriptionSw: 'Furahieni jioni tulivu yenye mahaba pamoja.',
    guide: 'Play your favourite music and talk about your dreams.',
    guideSw: 'Wekeni muziki mnaoupenda na zungumzieni ndoto zenu.'
  },
  {
    id: 'intimacy',
    category: 'Intimacy Styles',
    icon: '💞',
    title: 'Gentle Intimacy',
    titleSw: 'Ukaribu wa Upendo',
    description: 'Build closeness through affection, trust and communication.',
    descriptionSw: 'Jengeni ukaribu kupitia mapenzi, kuaminiana na mawasiliano.',
    guide: 'Talk openly about boundaries and what makes you both comfortable.',
    guideSw: 'Zungumzieni mipaka yenu na mambo yanayowafanya mjisikie salama.'
  }
];
function favs(){try{return JSON.parse(localStorage.getItem('cz_favs_'+user.id)||'[]');}catch{return [];}}
function favorite(id){return favs().includes(String(id));}
let currentSurprise = null;

function showRandomStyle(){
  const P=pool(); if(!P.length) return;

  let next;

  do {
    next = P[
      Math.floor(Math.random() * P.length)
    ];
  } while (
    P.length > 1 &&
    currentSurprise &&
    next.id === currentSurprise.id
  );

  currentSurprise = next;

  $('surpriseCategory').textContent = next.category;
  $('surpriseStyleTitle').textContent =
    sw ? next.titleSw : next.title;

  $('surpriseStyleDescription').textContent =
    sw ? next.descriptionSw : next.description;

  $('surpriseStyleGuide').textContent =
    sw ? next.guideSw : next.guide;

  $('surpriseImage').alt = next.title;
  $('surpriseImage').onerror = () => { $('surpriseImage').onerror = null; $('surpriseImage').src = createStyleImage(next.icon); };
  $('surpriseImage').classList.toggle('photo',!!next.image);
  $('surpriseImage').src = next.image || createStyleImage(next.icon);

  updateStyleFavBtn();
  renderStyleFavorites();
}

function updateStyleFavBtn(){
  if(!currentSurprise) return;
  $('styleFavoriteBtn').textContent=isStyleFavorite(currentSurprise.id)
    ?t('❤️ Remove from Favorites','❤️ Ondoa kwenye Vipendwa')
    :t('♡ Add to Favorites','♡ Ongeza kwenye Vipendwa');
}
function styleFavs(){
  try{
    return JSON.parse(localStorage.getItem('cz_style_favs_'+user.id)||'[]');
  }catch{
    return [];
  }
}
function isStyleFavorite(id){
  return styleFavs().includes(String(id));
}
function toggleStyleFavorite(){
  if(!currentSurprise) return;
  let saved=styleFavs();
  const id=String(currentSurprise.id);
  saved=saved.includes(id)?saved.filter(x=>x!==id):[...saved,id];
  try{localStorage.setItem('cz_style_favs_'+user.id,JSON.stringify(saved));}catch{}
  renderStyleFavorites();
  updateStyleFavBtn();
}
function renderStyleFavorites(){
  const box=$('styleFavorites');
  if(!box) return;
  const saved=styleFavs();
  const favorites=pool().filter(style=>saved.includes(String(style.id)));
  if(!favorites.length){
    box.innerHTML='<p class="empty-note">'+t('No favorite styles yet 💜','Bado huna mitindo uliyopenda 💜')+'</p>';
    return;
  }
  box.innerHTML=favorites.map(style=>`
    <div class="style-favorite-card">
      <img src="${esc(style.image||createStyleImage(style.icon))}" alt="${esc(style.title)}">
      <h4>${esc(sw?style.titleSw:style.title)}</h4>
      <button type="button" data-remove-style="${esc(style.id)}">❤️ ${t('Remove','Ondoa')}</button>
    </div>
  `).join('');
}
function removeStyleFavorite(id){
  const saved=styleFavs().filter(x=>x!==String(id));
  try{localStorage.setItem('cz_style_favs_'+user.id,JSON.stringify(saved));}catch{}
  renderStyleFavorites();
  updateStyleFavBtn();
}
function createStyleImage(icon){
  const svg=`
    <svg xmlns="http://www.w3.org/2000/svg" width="500" height="500">
      <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#7b55a6"/>
        <stop offset="100%" stop-color="#f18bb7"/>
      </linearGradient></defs>
      <rect width="500" height="500" rx="250" fill="url(#bg)"/>
      <text x="250" y="285" text-anchor="middle" font-size="150">${icon}</text>
    </svg>`;
  return 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg);
}
function card(a){const title=sw?(a.title_sw||a.title_en):(a.title_en||a.title_sw),desc=sw?(a.description_sw||a.description_en):(a.description_en||a.description_sw);return `<article class="activity-card" data-activity="${esc(a.id)}"><div class="activity-top"><span>${icons[a.category]||'✨'} ${esc(catName(a.category))}</span><button class="heart-btn" data-fav="${esc(a.id)}">${favorite(a.id)?'♥':'♡'}</button></div><h3>${esc(title)}</h3><p>${esc(desc)}</p><span class="activity-time">◷ 15 min</span></article>`;}
function cats(){return [...new Set(activities.map(a=>String(a.category||'').trim()).filter(Boolean))];}
function renderCategories(){$('homeCategories').innerHTML=(bedroom.length?['Bedroom Time']:[]).concat(cats()).map(c=>`<button class="category-card" data-category="${esc(c)}"><span>${icons[c]||'✨'}</span><b>${esc(catName(c))}</b><small>${c==='Bedroom Time'?bedroom.length:activities.filter(a=>a.category===c).length} ${t('activities','shughuli')}</small></button>`).join('');}
function renderHome(){renderCategories();$('homeCategories').insertAdjacentHTML('afterbegin',`<button class="category-card" data-go="quiz"><span>🎮</span><b>${t('Partner Quiz','Maswali ya Wapenzi')}</b><small>${QUIZ.length} ${t('questions','maswali')}</small></button>`);$('homeActivities').innerHTML=activities.slice(0,6).map(card).join('');}
function renderExplore(){const cs=['All',...(bedroom.length?['Bedroom Time']:[]),...cats()];$('exploreCategories').innerHTML=cs.map(c=>`<button class="chip ${activeCategory===c?'active':''}" data-category="${esc(c)}">${c==='All'?t('All','Zote'):esc(catName(c))}</button>`).join('');const q=$('searchInput').value.toLowerCase().trim();const list=activities.filter(a=>{const hay=[a.title_en,a.title_sw,a.description_en,a.description_sw,a.category].join(' ').toLowerCase();return(activeCategory==='All'||a.category===activeCategory)&&(!q||hay.includes(q));});if(activeCategory==='Bedroom Time'){renderBedroom(q);return;}$('exploreActivities').innerHTML=list.length?list.map(card).join(''):`<p class="message">${t('No activities found.','Hakuna shughuli zilizopatikana.')}</p>`;}
function renderFavorites(){const list=activities.filter(a=>favorite(a.id)),bf=bedroom.filter(b=>isStyleFavorite('b'+b.id));$('favoriteActivities').innerHTML=(list.length||bf.length)?list.map(card).join('')+bf.map(bedCard).join(''):`<p class="message">${t('You have not saved any activities yet.','Bado hujahifadhi shughuli yoyote.')}</p>`;}
function renderAll(){renderHome();renderExplore();renderFavorites();}
function toggleFav(id){const key='cz_favs_'+user.id,v=String(id),list=favs(),next=list.includes(v)?list.filter(x=>x!==v):[...list,v];try{localStorage.setItem(key,JSON.stringify(next));}catch{}renderAll();if(currentActivity&&String(currentActivity.id)===v)updateModal();}
function openActivity(id){const a=activities.find(x=>String(x.id)===String(id));if(!a)return;currentActivity=a;currentBed=null;$('modalImage').classList.add('hidden');$('modalCategory').textContent=(icons[a.category]||'✨')+' '+catName(a.category);$('modalTitle').textContent=sw?(a.title_sw||a.title_en):(a.title_en||a.title_sw);$('modalDescription').textContent=sw?(a.description_sw||a.description_en):(a.description_en||a.description_sw);$('modalDuration').textContent='◷ 15 min';updateModal();$('activityModal').classList.remove('hidden');}
function updateModal(){const on=currentBed?isStyleFavorite('b'+currentBed.id):(currentActivity&&favorite(currentActivity.id));$('modalFavorite').textContent=on?t('♥ Remove from favorites','♥ Ondoa kwenye vipendwa'):t('☆ Save to favorites','☆ Hifadhi kwenye vipendwa');}
async function authSubmit(e){e.preventDefault();$('authSubmit').disabled=true;msg(t('Please wait…','Tafadhali subiri…'));try{const email=$('email').value.trim(),password=$('password').value;if(mode==='signup'){if(!$('adult').checked)throw Error(t('Please confirm you are 18 or older.','Thibitisha kuwa una miaka 18 au zaidi.'));const {data,error}=await db.auth.signUp({email,password,options:{data:{display_name:$('displayName').value.trim()}}});if(error)throw error;if(data.session)await showApp(data.user);else msg(t('Account created. Please log in.','Akaunti imefunguliwa. Tafadhali ingia.'));}else{const {data,error}=await db.auth.signInWithPassword({email,password});if(error)throw error;await showApp(data.user);}}catch(e){msg(e.message||'Something went wrong.',true);}finally{$('authSubmit').disabled=false;}}
async function createInvite(){$('inviteResult').textContent=t('Creating…','Inatengeneza…');const {data,error}=await db.rpc('create_couple_invite');if(error){$('inviteResult').textContent=error.message;return;}const row=Array.isArray(data)?data[0]:data;const code=String(row?.invite_code||row?.code||row||'');$('inviteResult').textContent=code||t('Invite created','Mwaliko umetengenezwa');if(code&&navigator.clipboard){navigator.clipboard.writeText(code).then(()=>toast(t('Code copied','Msimbo umenakiliwa')),()=>{});}}
async function joinInvite(){const code=$('joinCode').value.trim();if(!/^\d{6}$/.test(code)){$('inviteResult').textContent=t('Enter the 6-digit code.','Weka msimbo wa tarakimu 6.');return;}const {error}=await db.rpc('join_couple_invite',{invite_code:code});$('inviteResult').textContent=error?error.message:t('Partner connected!','Mmeunganishwa!');if(!error)await refreshCouple();}
async function forgotPassword(){
  const email=$('email').value.trim();
  if(!email){msg(t('Enter your email first.','Andika barua pepe yako kwanza.'),true);return;}
  const {error}=await db.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});
  msg(error?error.message:t('Check your email for a reset link.','Angalia barua pepe yako kwa kiungo cha kubadilisha nenosiri.'),!!error);
}
async function logout(){await db.auth.signOut();user=null;currentSurprise=null;myCoupleId=null;$('appPanel').classList.add('hidden');$('bottomNav').classList.add('hidden');$('authPanel').classList.remove('hidden');$('authForm').reset();setMode('login');}
function language(){sw=!sw;document.documentElement.lang=sw?'sw':'en';
$('heroEyebrow').textContent=t('A LITTLE CLOSER, EVERY DAY','KARIBIANENI KILA SIKU');
$('welcome').innerHTML=sw?'Karibiana,<br><em>pamoja.</em>':'Grow closer,<br><em>together.</em>';
$('heroText').textContent=t('Make time for connection, laughter and meaningful moments.','Tengeneni muda wa ukaribu, vicheko na nyakati zenye maana.');
$('loginTab').textContent=t('Log in','Ingia');$('signupTab').textContent=t('Create account','Fungua akaunti');
$('forgotBtn').textContent=t('Forgot password?','Umesahau nenosiri?');
$('logout').textContent=t('Log out','Toka');$('surpriseBack').textContent=t('← Back','← Rudi');
$('surpriseHeading').textContent=t('💜 Surprise Us','💜 Tushangaze');
$('surpriseSub').textContent=t('Discover a new romantic experience together.','Gundueni uzoefu mpya wa kimapenzi pamoja.');
$('surpriseFavTitle').textContent=t('❤️ My Favorite Styles','❤️ Mitindo Niliyopenda');
$('nextSurpriseBtn').textContent=t('🎲 Next Surprise','🎲 Mshangao Unaofuata');
$('searchInput').placeholder=t('Search activities…','Tafuta shughuli…');
$('joinCode').placeholder=t('6-digit code','Msimbo wa tarakimu 6');
$('modalFavorite').textContent=$('modalFavorite').textContent;
$('navMemories').textContent=t('Memories','Kumbukumbu');$('memHeading').textContent=t('Our Memories','Kumbukumbu Zetu');$('memEyebrow').textContent=t('SHARED WITH LOVE','ZIMESHIRIKIWA KWA UPENDO');$('memSave').textContent=t('Share memory','Shiriki kumbukumbu');$('memText').placeholder=t('Write a memory…','Andika kumbukumbu…');$('quizEntry').textContent=t('🎮 Partner Quiz','🎮 Maswali ya Wapenzi');$('quizBack').textContent=t('← Back','← Rudi');
if(user&&!$('memoriesView').classList.contains('hidden'))renderMemories();if(user&&!$('quizView').classList.contains('hidden'))drawQuiz();
if(!user)setMode(mode);
else{$('hello').textContent=t('Welcome','Karibu')+(user.user_metadata?.display_name?', '+user.user_metadata.display_name:'');refreshCouple();}
if(currentSurprise){$('surpriseStyleTitle').textContent=sw?currentSurprise.titleSw:currentSurprise.title;$('surpriseStyleDescription').textContent=sw?currentSurprise.descriptionSw:currentSurprise.description;$('surpriseStyleGuide').textContent=sw?currentSurprise.guideSw:currentSurprise.guide;updateStyleFavBtn();renderStyleFavorites();}
if(!$('activityModal').classList.contains('hidden')){if(currentBed)openBedroom(currentBed.id);else if(currentActivity)openActivity(currentActivity.id);}
$('langBtn').textContent=sw?'English':'Kiswahili';$('exploreHeading').textContent=t('Explore','Chunguza');$('exploreSub').textContent=t('Small moments can make a big difference.','Matukio madogo yanaweza kuleta tofauti kubwa.');$('favoritesHeading').textContent=t('Favorites','Vipendwa');$('favoritesSub').textContent=t('Your saved moments, all in one place.','Shughuli ulizohifadhi zipo hapa.');$('profileHeading').textContent=t('Profile','Wasifu');$('navHome').textContent=t('Home','Nyumbani');$('navExplore').textContent=t('Explore','Chunguza');$('navFavorites').textContent=t('Favorites','Vipendwa');$('navProfile').textContent=t('Profile','Wasifu');$('surpriseTitle').textContent=t('A little surprise?','Mshangao mdogo?');$('surpriseText').textContent=t('Let us choose something lovely for you two.','Tukuchagulie jambo zuri la kufanya pamoja.');$('surpriseBtn').textContent=t('Surprise us ↗','Tushangaze ↗');$('homeExploreTitle').textContent=t('Explore activities','Chunguza shughuli');$('featuredTitle').textContent=t('Picked for you','Tumekuchagulia');$('connectTitle').textContent=t('Your couple space','Nafasi yenu ya wapenzi');$('connectHint').textContent=t('Invite your partner to join you.','Mwalike mwenza wako ajiunge.');$('createInvite').textContent=t('Create invite','Tengeneza mwaliko');$('joinInvite').textContent=t('Join','Jiunge');renderAll();}
function init(){
  $('loginTab').onclick=()=>setMode('login');
  $('signupTab').onclick=()=>setMode('signup');
  
  $('authForm').onsubmit=authSubmit;

  $('langBtn').onclick=language;
  $('memSave').onclick=saveMemory;
  $('memText').oninput=()=>{$('memCount').textContent=$('memText').value.length+'/1000';};
  $('quizBody').addEventListener('click',quizClick);
  $('quizBack').onclick=()=>showView('home');
  $('openBedAdmin').onclick=()=>{renderBedAdmin();showView('bedAdmin');};
  $('bedAdminBack').onclick=()=>{renderAll();showView('profile');};
  $('bedAdminList').addEventListener('change',e=>{const r=e.target.closest('[data-adm-row]');if(r)saveBedName(r);});
  $('togglePw').onclick=()=>{const i=$('password'),show=i.type==='password';i.type=show?'text':'password';$('togglePw').textContent=show?'🙈':'👁';$('togglePw').setAttribute('aria-label',show?t('Hide password','Ficha nenosiri'):t('Show password','Onyesha nenosiri'));};
  $('forgotBtn').onclick=forgotPassword;
  document.addEventListener('keydown',e=>{if(e.key==='Escape')$('activityModal').classList.add('hidden');});
  $('logout').onclick=logout;

  $('createInvite').onclick=createInvite;
  $('joinInvite').onclick=joinInvite;

  $('searchInput').oninput=renderExplore;

  $('surpriseBtn').onclick=()=>{
    showView('surprise');
    showRandomStyle();
  };

  $('surpriseBack').onclick=()=>showView('home');
  $('nextSurpriseBtn').onclick=showRandomStyle;
  $('styleFavoriteBtn').onclick=toggleStyleFavorite;

  $('closeModal').onclick=()=>{
    $('activityModal').classList.add('hidden');
  };

  $('activityModal').onclick=e=>{
    if(e.target===$('activityModal')){
      $('activityModal').classList.add('hidden');
    }
  };

  $('modalFavorite').onclick=()=>{
    if(currentBed)toggleBedFav(currentBed.id);else if(currentActivity)toggleFav(currentActivity.id);
  };

  $('bottomNav').onclick=e=>{
    const b=e.target.closest('[data-view]');
    if(b) showView(b.dataset.view);
  };

  document.addEventListener('click',e=>{
    const go=e.target.closest('[data-go]');
    if(go) showView(go.dataset.go);

    const c=e.target.closest('[data-category]');
    if(c){
      activeCategory=c.dataset.category;
      showView('explore');
      renderExplore();
    }

    const f=e.target.closest('[data-fav]');
    if(f){
      e.stopPropagation();
      toggleFav(f.dataset.fav);
      return;
    }

    const r=e.target.closest('[data-remove-style]');
    if(r){ removeStyleFavorite(r.dataset.removeStyle); return; }

    const md=e.target.closest('[data-memdel]');
    if(md){ deleteMemory(md.dataset.memdel); return; }
    const bf=e.target.closest('[data-bedfav]');
    if(bf){ e.stopPropagation(); toggleBedFav(bf.dataset.bedfav); return; }
    const bd=e.target.closest('[data-bed]');
    if(bd){ openBedroom(bd.dataset.bed); return; }
    const a=e.target.closest('[data-activity]');
    if(a) openActivity(a.dataset.activity);
  });

  setMode('login');

  if(!cfg.supabaseUrl||!cfg.supabasePublishableKey||!window.supabase){
    msg('Configuration error: check config.js.',true);
    return;
  }

  db=window.supabase.createClient(
    cfg.supabaseUrl,
    cfg.supabasePublishableKey
  );

  db.auth.onAuthStateChange((ev)=>{if(ev==='PASSWORD_RECOVERY'){const p=prompt(t('Enter your new password (at least 6 characters):','Weka nenosiri jipya (angalau herufi 6):'));if(p&&p.length>=6)db.auth.updateUser({password:p}).then(({error})=>toast(error?error.message:t('Password updated.','Nenosiri limebadilishwa.')));}});
  db.auth.getSession().then(({data,error})=>{
    if(error) console.error(error);
    if(data?.session?.user) showApp(data.session.user);
  });
}
init();
})();
