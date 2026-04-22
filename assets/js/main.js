// === THEME SWITCH ===
const THEME_KEY='thomaspjl-theme';
const themeRoot=document.documentElement;
const mediaTheme=window.matchMedia('(prefers-color-scheme: dark)');
const mobileViewport=window.matchMedia('(max-width: 620px)');

function getStoredTheme(){
  const value=localStorage.getItem(THEME_KEY);
  return value==='light'||value==='dark'||value==='auto'?value:'auto';
}

function applyTheme(theme){
  if(theme==='light'||theme==='dark'){
    themeRoot.dataset.theme=theme;
  }else{
    delete themeRoot.dataset.theme;
  }
}

function syncThemeButtons(theme){
  document.querySelectorAll('.theme-switch button').forEach(button=>{
    const active=button.dataset.themeValue===theme;
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed',String(active));
  });

  const mobileToggle=document.querySelector('.mobile-theme-toggle');
  if(mobileToggle){
    const effective=theme==='auto'?(mediaTheme.matches?'dark':'light'):theme;
    mobileToggle.textContent=effective==='dark'?'Passer en clair':'Passer en sombre';
    mobileToggle.setAttribute('aria-label',mobileToggle.textContent);
  }
}

function setTheme(theme){
  localStorage.setItem(THEME_KEY,theme);
  applyTheme(theme);
  syncThemeButtons(theme);
}

function renderThemeSwitch(){
  const navContainer=document.querySelector('.nav .container');
  if(!navContainer||navContainer.querySelector('.theme-switch'))return;

  const wrapper=document.createElement('div');
  wrapper.className='theme-switch';
  wrapper.setAttribute('role','group');
  wrapper.setAttribute('aria-label','Choix du theme');

  [
    ['auto','Auto'],
    ['light','Clair'],
    ['dark','Sombre']
  ].forEach(([value,label])=>{
    const button=document.createElement('button');
    button.type='button';
    button.dataset.themeValue=value;
    button.textContent=label;
    button.setAttribute('aria-pressed','false');
    button.addEventListener('click',()=>setTheme(value));
    wrapper.appendChild(button);
  });

  const burger=navContainer.querySelector('.burger');
  if(burger){
    navContainer.insertBefore(wrapper,burger);
  }else{
    navContainer.appendChild(wrapper);
  }
}

function renderMobileThemeToggle(){
  const navList=document.querySelector('.nav-links');
  if(!navList||navList.querySelector('.mobile-theme-item'))return;

  const item=document.createElement('li');
  item.className='mobile-theme-item';

  const button=document.createElement('button');
  button.type='button';
  button.className='mobile-theme-toggle';
  button.addEventListener('click',()=>{
    const current=getStoredTheme();
    const effective=current==='auto'?(mediaTheme.matches?'dark':'light'):current;
    setTheme(effective==='dark'?'light':'dark');
  });

  item.appendChild(button);
  const commanderLink=navList.querySelector('a.btn-primary');
  const commanderItem=commanderLink?commanderLink.closest('li'):null;
  if(commanderItem){
    commanderItem.insertAdjacentElement('afterend',item);
  }else{
    navList.appendChild(item);
  }
}

applyTheme(getStoredTheme());
renderThemeSwitch();
renderMobileThemeToggle();
syncThemeButtons(getStoredTheme());

if(typeof mediaTheme.addEventListener==='function'){
  mediaTheme.addEventListener('change',()=>{
    if(getStoredTheme()==='auto')applyTheme('auto');
  });
}

// === HELPERS ===
function isMobileLayout(){
  return mobileViewport.matches;
}

function ensureGalleryButton(grid,label){
  let button=grid.parentElement.querySelector('.gallery-more');
  if(!button){
    button=document.createElement('button');
    button.type='button';
    button.className='btn btn-ghost gallery-more';
    grid.insertAdjacentElement('afterend',button);
  }

  button.innerHTML=`${label} <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>`;
  return button;
}

function resolveSocialLink(link){
  const href=link.dataset.webUrl||link.getAttribute('href')||'';
  if(!href||href.startsWith('#'))return null;

  const lowerHref=href.toLowerCase();
  const isAndroid=/Android/i.test(navigator.userAgent);

  // Leave Discord invite links to the browser/app default behavior on mobile.
  if(lowerHref.includes('discord.gg/')||lowerHref.includes('discord.com/invite/')){
    return null;
  }

  if(link.dataset.appUrl||link.dataset.appAndroid){
    return {
      webUrl:link.dataset.webUrl||href,
      appUrl:(isAndroid&&link.dataset.appAndroid)||link.dataset.appUrl||''
    };
  }

  if(lowerHref.includes('instagram.com/')){
    return {
      webUrl:href,
      appUrl:isAndroid
        ? 'intent://instagram.com/_u/thomaspjl_miniamaker#Intent;package=com.instagram.android;scheme=https;end'
        : 'instagram://user?username=thomaspjl_miniamaker'
    };
  }

  if(lowerHref.includes('tiktok.com/')){
    return {
      webUrl:href,
      appUrl:isAndroid
        ? 'intent://www.tiktok.com/@thomaspjl_miniamaker#Intent;package=com.zhiliaoapp.musically;scheme=https;end'
        : 'snssdk1233://user/profile/thomaspjl_miniamaker'
    };
  }

  if(lowerHref.includes('discord.com/app')||lowerHref.includes('discord.gg/')){
    return {
      webUrl:href,
      appUrl:isAndroid
        ? 'intent://discord.com/app#Intent;scheme=https;package=com.discord;end'
        : 'discord://channels/@me'
    };
  }

  if(lowerHref.includes('youtube.com/')||lowerHref.includes('youtu.be/')){
    return null;
  }

  return null;
}

function setupMobileAppLinks(){
  const links=document.querySelectorAll('a[href], a[data-web-url]');
  if(!links.length)return;

  const isAndroid=/Android/i.test(navigator.userAgent);
  const isIOS=/iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isPhoneLike=isAndroid||isIOS;

  links.forEach(link=>{
    if(link.dataset.mobileAppReady==='true')return;
    const target=resolveSocialLink(link);
    if(!target)return;
    link.dataset.mobileAppReady='true';

    link.addEventListener('click',event=>{
      if(!isPhoneLike)return;

      const webUrl=target.webUrl;
      const appUrl=target.appUrl;
      if(!appUrl){
        window.location.href=webUrl;
        event.preventDefault();
        return;
      }

      event.preventDefault();

      let didHide=false;
      const onVisibility=()=>{
        if(document.hidden)didHide=true;
      };

      document.addEventListener('visibilitychange',onVisibility);
      window.location.href=appUrl;

      window.setTimeout(()=>{
        document.removeEventListener('visibilitychange',onVisibility);
        if(!didHide){
          window.location.href=webUrl;
        }
      },900);
    });
  });
}

function setupMobilePricing(){
  const cards=document.querySelectorAll('.price-card');
  if(!cards.length)return;

  cards.forEach(card=>{
    let details=card.querySelector('.price-card__details');
    let toggle=card.querySelector('.mobile-price-toggle');

    if(!details){
      details=document.createElement('div');
      details.className='price-card__details';

      const children=[...card.children].filter(child=>{
        if(child.classList.contains('soon-tag'))return false;
        if(child.classList.contains('mobile-price-toggle'))return false;
        if(child.classList.contains('price-card__details'))return false;
        if(child.classList.contains('eyebrow'))return false;
        return child.tagName==='P'||child.tagName==='UL'||child.classList.contains('btn')||child.classList.contains('mini-order-highlight');
      });

      children.forEach(child=>details.appendChild(child));
      card.appendChild(details);
    }

    if(!toggle){
      toggle=document.createElement('button');
      toggle.type='button';
      toggle.className='mobile-price-toggle';
      card.appendChild(toggle);
    }

    const setExpanded=expanded=>{
      card.dataset.mobileExpanded=expanded?'true':'false';
      toggle.textContent=expanded?'Refermer le detail':'Voir le detail';
      toggle.setAttribute('aria-expanded',String(expanded));
      if(isMobileLayout()){
        details.style.display=expanded?'flex':'none';
      }else{
        details.style.display='';
      }
    };

    toggle.onclick=()=>setExpanded(card.dataset.mobileExpanded!=='true');

    if(isMobileLayout()){
      setExpanded(false);
      toggle.style.display='inline-flex';
    }else{
      card.dataset.mobileExpanded='false';
      toggle.removeAttribute('aria-expanded');
      toggle.style.display='';
      details.style.display='';
    }
  });
}

// === NAV SCROLL ===
const nav=document.querySelector('.nav');
if(nav){
  const onScroll=()=>nav.classList.toggle('scrolled',window.scrollY>40);
  window.addEventListener('scroll',onScroll,{passive:true});
  onScroll();
}

// === BURGER ===
const burger=document.querySelector('.burger');
const navLinks=document.querySelector('.nav-links');
if(burger&&navLinks){
  const closeMenu=()=>{
    burger.classList.remove('open');
    navLinks.classList.remove('open');
    document.body.classList.remove('nav-open');
    if(nav)nav.classList.remove('menu-open');
  };

  burger.addEventListener('click',()=>{
    const open=!burger.classList.contains('open');
    burger.classList.toggle('open',open);
    navLinks.classList.toggle('open',open);
    document.body.classList.toggle('nav-open',open);
    if(nav)nav.classList.toggle('menu-open',open);
  });

  navLinks.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
  window.addEventListener('resize',()=>{if(window.innerWidth>980)closeMenu()});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu()});
}

// === REVEAL ===
const io=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add('visible');
      io.unobserve(entry.target);
    }
  });
},{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

// === LIGHTBOX ===
const lb=document.querySelector('.lightbox');
if(lb){
  const lbImg=lb.querySelector('img');
  document.addEventListener('click',event=>{
    const item=event.target.closest('.gallery-item, .lightbox-item');
    if(item){
      const image=item.querySelector('img');
      if(image){
        lbImg.src=image.src;
        lb.classList.add('open');
        document.body.style.overflow='hidden';
      }
    }
    if(event.target.matches('.lightbox-close')||event.target===lb){
      lb.classList.remove('open');
      document.body.style.overflow='';
    }
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'){
      lb.classList.remove('open');
      document.body.style.overflow='';
    }
  });
}

// === GALLERY DATA ===
const MINIATURES={
  "Gaming":["15.jpg","Alfajer_Duel_Derke.jpg","apEX_BackOnTwitch.jpg","Aspas_CommeDHAB.jpg","Aspas_DestroyedSentinels.jpg","Atow_featZEN.jpg","BasicOllie_2xmursnoeffect.jpg","BasicOllie_6Tips.jpg","BasicOllie_Oopsyv1.2.jpg","Goosebreeder_flyquestprovoice.jpg","Gotaga_ConceptMiniature.png","Kaydop_AlphaConsole2.jpg","Kaydop_DETRUIT LA RANKED AVEC DRKU.jpg","Kaydop_FullWinSSL.jpg","Kaydop_RisingLeague.jpg","MobilePear_Abyss.jpg","MobilePear_Abyss2eme.jpg","QCK_30KillsCrazy.jpg","Sayonara_SolocarryingCrazy.jpg","ScreaM_Focusing.jpg","sdy_Beat_NaVi.jpg","sdy_ESLPROLEAGUE.jpg","shox_ace_V2.jpg","shox_Stream_game_avec_du_monde_V2.jpg","Styko_GameTheraV1.jpg","Styko_Tierlist2.jpg","TenZReplay_SentinelsShowMatch.jpg","TenZ_ChamberMeta.jpg","TenZ_GetsHisRank.jpg","TenZ_March\u00e9NoirNewbundles.jpg","Vatira_DomineVita.jpg","Zekken_+30kills_Raze.jpg","Zekken_CITY CLASSIC HIGHLIGHTS.jpg","Zekken_CrazyPlaysV2.jpg","Zekken_firstgamenewmates.jpg","Zen_20minFullWin.jpg","zen_Musty.jpg","zen_Recap_Saison_2023.jpg","zen_rw9.jpg","zen_vatira_incroyable.jpg","ZywOo_37killsFaceit.jpg","ZywOo_ApeX_Spinx.jpg","ZywOo_FullVita.jpg","ZywOo_POVcs2Anubis.jpg","ZywOo_WorldGuinnessBook.jpg"],
  "Sport":["Alex_Callisth\u00e9nieDifficile.jpg","Alex_PoidsCallisth\u00e9nie1.5.jpg","Alex_progresserintelligemment3.jpg","Amaury_AvantApr\u00e8s4mois_V2-5_Vcourte.jpg","Amaury_BodybuilderV2.jpg","Amaury_clash_crossfit_coach_V2.jpg","Amaury_EchecGaranti.jpg","Amaury_Gym2.0WOAW.jpg","Amaury_Handstand_V1.jpg","Amaury_MicroTrottoir_V2.jpg","Amaury_Process1%_V2.jpg","Amaury_ProcessParis.jpg","Amaury_Retour.jpg","Amaury_TransfoLoic.jpg","Amaury_VlogTrainingV3.jpg","David_FAQ.jpg","Enzo_VlogStreetLifting.jpg","fitnesslogik_ReactJakeV2.jpg","Liftrainer_CompeteTranquillou.jpg","Liftrainer_FinalRep.jpg","Liftrainer_LTGLEVELUP.jpg","Liftrainer_Prog.jpg","Liftrainer_R\u00e9ussirComp\u00e8te.jpg","Liftrainer_SalleStreetlifting.jpg","Liftrainer_Vlog.jpg","Liftrainer_VlogPremierPas2.jpg","ParlonsPeuParlonsSport_FootSuisse.jpg","ParlonsPeuParlonsSport_Hockey.jpg","Tom_10conseils2.jpg","Tom_Secrets2.jpg","Tom_Vlog.jpg"],
  "Business":["12_Meikyu_TechnologieLocationVoiture.jpg","AntoineB_PubYouTube1000e24h.jpg","AntoineB_PubYouTube1000e24hV2.jpg","Corentin_Inox2.jpg","Corentin_Najbfit2.jpg","Corentin_SousTitre.jpg","Corentin_Tierlist2.jpg","Hugo_RegardDesAutres.jpg","Lyad_Guide.jpg","Lyad_Podcast.jpg","Lyad_Vlog2.jpg","Max_12000Formations.jpg","Meikyu_Minia1.jpg","Meikyu_Minia7-2.jpg","Meikyu_Resultat2ansAtypiques.jpg","Me\u00efkyu_1.jpg","Me\u00efkyu_10.jpg","Me\u00efkyu_11.jpg","Me\u00efkyu_8.jpg","Me\u00efkyu_MarchandDeBien.jpg","Sylvain_5\u00e9tapesMonteurPro.jpg","Sylvain_AnimateIman.jpg"],
  "Podcast":["Amaury_Podcast3.jpg","Liftrainer_LiftingExpert_2.jpg","Liftrainer_Podcast11-2.jpg","Liftrainer_Podcast13.jpg","Liftrainer_Podcast14.jpg","Liftrainer_Podcast7.jpg"],
  "Divertissement":["ADALASS_PlaneteVal.jpg","Hugo_ChallengeSansSucre.jpg","Sylvain_AfficheDesert.jpg"],
  "Manga":["Adrien_AkatsukiV2.jpg","Adrien_HokagesBest.jpg","Adrien_MeilleureTechniqueHokage2.jpg","Adrien_NouvelleTechniqueBoruto.jpg"]
};

const AFFICHES=["FNSL_AfficheInterRegionSudOuestV2.png","Liftrainer_AfficheChampionnatDeBretagneModifTshit.png","Liftrainer_AfficheCompeteINTER-R\u00c9GION Grand Ouest.png","Liftrainer_AfficheWorldFinalRep.png","Liftrainer_Aghiles.png","Liftrainer_AnnonceCoachFinAnn\u00e9e.png","Liftrainer_BilalInstano.png","Liftrainer_FNSLELITE.png","Liftrainer_affiche.png"];
const portfolioState={category:'all'};

function renderPortfolioGallery(category=portfolioState.category,reset=false){
  const grid=document.querySelector('.gallery[data-gallery="minia"]');
  if(!grid)return;

  const data=category==='all'
    ? Object.entries(MINIATURES).flatMap(([group,files])=>files.map(file=>[group,file]))
    : MINIATURES[category].map(file=>[category,file]);

  portfolioState.category=category;
  grid.innerHTML=data.map(([group,file])=>`<figure class="gallery-item"><img loading="lazy" src="Ressources/Miniatures/${group}/${encodeURIComponent(file)}" alt="${file.split('.')[0]}"></figure>`).join('');
  if(reset&&isMobileLayout()){
    grid.scrollLeft=0;
  }
}

function bindTabs(){
  const tabs=document.querySelectorAll('.tab[data-cat]');
  tabs.forEach(tab=>{
    tab.addEventListener('click',()=>{
      tabs.forEach(item=>item.classList.remove('active'));
      tab.classList.add('active');
      renderPortfolioGallery(tab.dataset.cat,true);
    });
  });
}

if(document.querySelector('.gallery[data-gallery="minia"]')){
  renderPortfolioGallery('all',true);
  bindTabs();
  document.querySelectorAll('.gallery-more').forEach(button=>button.remove());
}

function renderInstagramGallery(reset=false){
  const grid=document.querySelector('.gallery[data-gallery="ig"]');
  if(!grid)return;
  grid.innerHTML=AFFICHES.map(file=>`<figure class="gallery-item"><img loading="lazy" src="Ressources/Affiches Instagram/${encodeURIComponent(file)}" alt=""></figure>`).join('');
}

if(document.querySelector('.gallery[data-gallery="ig"]')){
  renderInstagramGallery(true);
  document.querySelectorAll('.gallery-more').forEach(button=>button.remove());
}

// === HERO MARQUEE ===
const heroThumbs=document.querySelector('.hero-thumbs');
if(heroThumbs){
  const all=Object.entries(MINIATURES).flatMap(([group,files])=>files.map(file=>[group,file]));
  const rows=heroThumbs.querySelectorAll('.thumb-row');
  const perRow=Math.ceil(all.length/rows.length);

  rows.forEach(row=>{
    const pool=[...all];
    for(let i=pool.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [pool[i],pool[j]]=[pool[j],pool[i]];
    }
    const slice=pool.slice(0,perRow);
    const html=slice.map(([group,file])=>`<img loading="lazy" src="Ressources/Miniatures/${group}/${encodeURIComponent(file)}" alt="">`).join('');
    row.innerHTML=html+html;
  });
}

// === HOME PREVIEW ===
const preview=document.querySelector('.gallery[data-gallery="preview"]');
if(preview){
  const desktopPicks=["Aspas_CommeDHAB.jpg","Zekken_CITY CLASSIC HIGHLIGHTS.jpg","Adrien_NouvelleTechniqueBoruto.jpg","Tom_Vlog.jpg","Amaury_ProcessParis.jpg","Hugo_RegardDesAutres.jpg","Max_12000Formations.jpg","Hugo_ChallengeSansSucre.jpg","BasicOllie_6Tips.jpg"];
  const desktopCats=["Gaming","Gaming","Manga","Sport","Sport","Business","Business","Divertissement","Gaming"];
  const mobilePicks=desktopPicks.filter(file=>file!=="Hugo_ChallengeSansSucre.jpg");
  const mobileCats=desktopCats.filter((_,index)=>desktopPicks[index]!=="Hugo_ChallengeSansSucre.jpg");
  const picks=isMobileLayout()?mobilePicks:desktopPicks;
  const cats=isMobileLayout()?mobileCats:desktopCats;
  preview.innerHTML=picks.map((file,index)=>`<figure class="gallery-item"><img loading="lazy" src="Ressources/Miniatures/${cats[index]}/${encodeURIComponent(file)}" alt=""></figure>`).join('');
}

setupMobilePricing();
setupMobileAppLinks();

function setupMiniatureOrderForm(){
  const form=document.querySelector('[data-miniature-order-form]');
  if(!form)return;

  const contactFields=[...form.querySelectorAll('[data-contact-method]')];
  const contactMarks=[...form.querySelectorAll('[data-contact-required-mark]')];
  const paymentRedirect='maintenance.html';

  const syncContactRequirement=()=>{
    const hasValue=contactFields.some(field=>field.value.trim()!=='');

    contactFields.forEach(field=>{
      field.required=!hasValue;
      field.setCustomValidity('');
    });

    contactMarks.forEach(mark=>{
      mark.hidden=hasValue;
    });

    if(!hasValue){
      const message='Renseignez au minimum votre WhatsApp ou votre Instagram.';
      contactFields.forEach(field=>field.setCustomValidity(message));
    }
  };

  contactFields.forEach(field=>{
    field.addEventListener('input',syncContactRequirement);
    field.addEventListener('blur',syncContactRequirement);
  });

  form.addEventListener('submit',event=>{
    syncContactRequirement();

    if(!form.checkValidity()){
      event.preventDefault();
      form.reportValidity();
      return;
    }

    event.preventDefault();
    window.location.href=paymentRedirect;
  });

  syncContactRequirement();
}

setupMiniatureOrderForm();

if(typeof mobileViewport.addEventListener==='function'){
  mobileViewport.addEventListener('change',()=>{
    if(document.querySelector('.gallery[data-gallery="minia"]')){
      renderPortfolioGallery(portfolioState.category,true);
    }
    if(document.querySelector('.gallery[data-gallery="ig"]')){
      renderInstagramGallery(true);
    }
    setupMobilePricing();
  });
}
