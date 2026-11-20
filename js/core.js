// Jádro: stav, směrování, sdílené komponenty. Bez závislostí, běží ze souboru.
const ACT_LATE=[];
const KEY='saver-proto-v13';
let DB; try{DB=JSON.parse(localStorage.getItem(KEY));}catch(e){} if(!DB)DB=seedData();
let ME; try{ME=localStorage.getItem(KEY+'-me');}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(DB));}catch(e){}};
const setMe=id=>{ME=id;delete UI.dash;try{id?localStorage.setItem(KEY+'-me',id):localStorage.removeItem(KEY+'-me');}catch(e){}};
const resetAll=()=>{try{localStorage.removeItem(KEY);}catch(e){} DB=seedData();Object.keys(UI).forEach(k=>delete UI[k]);save();toast('Ukázková data jsou obnovená');render();};
const UI={}; // stav obrazovek: filtry a stránkování se při návratu zachovají
const ui=(k,d)=>UI[k]||(UI[k]=d);
const isMgr=()=>ME==='JD';
const isAdmin=()=>ME==='PN';
const me=()=>user(ME)||user('AN');

const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ic=(n,c='')=>{const i=ICONS[n];return i?`<span class="ic ${c}"><svg viewBox="${i[0]}" fill="none">${i[1]}</svg></span>`:'';};
const icN=n=>{const i=ICONS[n];if(!i)return '';const v=i[0].split(' ');return `<svg width="${v[2]}" height="${v[3]}" viewBox="${i[0]}" fill="none">${i[1]}</svg>`;};
const fmt=d=>{if(!d)return 'Bez termínu';const[y,m,dd]=d.split('-');return `${+dd}. ${+m}. ${y}`;};
const user=id=>DB.users.find(u=>u.id===id);
const contact=id=>DB.contacts.find(c=>c.id===id);
const project=id=>DB.projects.find(p=>p.id===id);
const task=id=>DB.tasks.find(t=>t.id===id);
const shortName=id=>{const u=user(id);if(!u)return '';const p=u.name.split(' ');return p[0][0]+'. '+p.slice(1).join(' ');};
const av=(id,size='')=>{if(id==='S')return `<span class="av ${size}" style="background:var(--gray)">S</span>`;return `<span class="av ${size}">${esc(id)}</span>`;};
const who=(id,full=true)=>{const u=user(id);return `<span class="who">${av(id)}${esc(u?(full?u.name:shortName(id)):id==='S'?'Systém':id)}</span>`;};
const isOn=(t,id)=>t.who===id||(t.team||[]).includes(id);
const bucket=t=>t.done?'done':!t.due?'none':t.due<TODAY?'late':t.due===TODAY?'today':'next';
const dayName=()=> 'Pondělí';
const csSort=(a,b)=>String(a).localeCompare(String(b),'cs');
const AVAIL={'Dostupná':['tick-circle','grn'],'Dostupný':['tick-circle','grn'],'Přestávka':['coffee','amb'],'Dovolená':['sun-2','vio'],'Offline':['close-circle','mute'],'—':['close-circle','mute']};
const availBadge=a=>{if(!a||a==='—')return '<span class="mute">—</span>';const x=AVAIL[a]||AVAIL['—'];return `<span class="row ${x[1]}">${ic(x[0],'s16')}${esc(a)}</span>`;};
// Každý typ aktivity má svou barvu. Stejná barva platí v časové ose i u úkolu stejného typu.
const KIND={Hovor:'call','E-mail':'mail',SMS:'mail','Schůzka':'meet','Poznámka':'note','Úkol':'task',Dokument:'doc'};
const kindCls=k=>'k-'+(KIND[k]||'sys');
const catBadge=c=>`<span class="badge ${c==='Hotovo'?'b-grn':kindCls(c)}">${esc(c)}</span>`;
const statusDot=s=>{const m={'Aktuální':'grn','Potenciální':'amb','Odložený':'mute','Nezajímavý':'red'};return `<span class="st ${m[s]||''}"><i></i><span style="color:var(--n900)">${esc(s)}</span></span>`;};
const healthB=h=>{const m={'V riziku':'b-red','Podle plánu':'b-grn','Dokončeno':'b-grn','Pozastaveno':''};return `<span class="badge ${m[h]}">${esc(h)}</span>`;};
const rateOn=()=>!(DB.settings&&DB.settings.org&&DB.settings.org.rating===false);
const rating=r=>`<span class="rate r${r}" data-tip="Hodnocení ${r} z 5: celkové hodnocení vztahu s kontaktem" aria-label="Hodnocení ${r} z 5">${r}</span>`;
// Ikona poslední aktivity v seznamu kontaktů: stejné barvy jako v časové ose
const ACT_K={call:'Hovor',mail:'E-mail',meet:'Schůzka',note:'Poznámka'};
const actIcon=t=>`<span class="act-ic ${kindCls(ACT_K[t])}" title="${ACT_K[t]||''}" aria-label="${ACT_K[t]||''}">${ic({call:'call',mail:'sms',meet:'people',note:'note-text'}[t]||'note-text')}</span>`;

// Směrování
let routeNow=[];let dirty=null;
// Historie: každý záznam si nese pořadí, aby šlo poznat krok zpět. Záložky a přechod náhled–editace záznam nepřidávají.
let navI=(history.state&&history.state.i)||0,navSkip=false,navRepFlag=false,leaveTo=null;
try{if(!history.state)history.replaceState({i:0},'',location.href);}catch(e){}
// Adresy v historii podle pořadí: když cíl po uložení odpovídá předchozí stránce, vrátíme se na ni (Zpět pak nevede do formuláře).
const navHist={};navHist[navI]=location.hash;
function leaveRun(t){dirty=null;if(t.delta)history.go(t.delta);else if(t.rep)navRep(t.to);else if(location.hash===t.to)render();else location.hash=t.to;}
const go=h=>{if(leaveTo){const t=leaveTo;leaveTo=null;leaveRun(t);return;}if(location.hash===h)render();else location.hash=h;};
function navRep(h){if(leaveTo){const t=leaveTo;leaveTo=null;leaveRun(t);return;}if(dirty&&!dirtySame(h)&&dirtyChanged()){confirmLeave({to:h,rep:true});return;}if(location.hash===h){render();return;}if(navI>0&&navHist[navI-1]===h){history.back();return;}navRepFlag=true;location.replace(h);}
// Rozepsaný formulář: hodnoty se porovnávají s výchozími, přepnutí záložky je neztratí.
const dirtyFields=()=>[...document.querySelectorAll('[data-form] input,[data-form] select,[data-form] textarea')].filter(i=>i.type!=='file');
const dirtyKey=i=>i.name||i.id||i.dataset.co||'';
const dirtyVal=i=>i.type==='checkbox'||i.type==='radio'?(i.checked?'1':''):i.value;
const dirtySame=h=>!!dirty&&(dirty.scope?h.startsWith(dirty.scope):h===dirty.at);
function dirtyInit(){if(!dirty)return;dirty.base=dirty.base||{};dirty.draft=dirty.draft||{};dirtyFields().forEach(i=>{const k=dirtyKey(i);if(!k)return;if(dirty.base[k]===undefined)dirty.base[k]=dirtyVal(i);const d=dirty.draft[k];if(d!==undefined){if(i.type==='checkbox'||i.type==='radio')i.checked=d==='1';else i.value=d;}});if(window.photoSync)window.photoSync();}
function dirtyCollect(){if(!dirty)return;dirty.draft=dirty.draft||{};dirtyFields().forEach(i=>{const k=dirtyKey(i);if(k)dirty.draft[k]=dirtyVal(i);});}
function dirtyChanged(){if(!dirty)return false;dirtyCollect();const b=dirty.base||{};return Object.keys(dirty.draft).some(k=>dirty.draft[k]!==b[k]);}
window.addEventListener('hashchange',()=>{document.body.classList.remove('nav-open');
  if(navSkip){navSkip=false;return;}
  const to=location.hash,st=history.state,trav=!!(st&&st.i!=null)&&!navRepFlag,back=trav&&st.i<navI;
  if(dirty){
    if(dirtySame(to))dirtyCollect();
    else if(dirtyChanged()){navSkip=true;if(trav)history.go(navI-st.i);else history.back();confirmLeave(back&&dirty.backTo?{to:dirty.backTo,rep:true}:trav?{delta:st.i-navI}:{to});return;}
    else{const bt=back&&dirty.backTo;dirty=null;if(bt){navI=st.i;location.hash=bt;return;}}
  }
  if(navRepFlag){navRepFlag=false;history.replaceState({i:navI},'',to);}
  else if(trav)navI=st.i;
  else{navI++;history.replaceState({i:navI},'',to);}
  navHist[navI]=to;render();window.scrollTo(0,0);
});
function confirmLeave(t){modal(`<h2>Uložit změny?</h2><div class="ft"><button class="btn" data-close>Zůstat</button><button class="btn" id="lv">Neukládat</button><button class="btn pri" id="lvs">Uložit</button></div>`);
  document.getElementById('lv').onclick=()=>{closeLayer();leaveRun(t);};
  document.getElementById('lvs').onclick=()=>{closeLayer();const b=document.querySelector('.form-foot .btn.pri');leaveTo=t;if(b)b.click();leaveTo=null;};}
// Ženské tvary v záznamech: Změnil -> Změnila podle toho, kdo akci udělal.
const femV=(id,t)=>{const u=user(id);return u&&u.g==='f'?String(t).replace(/^(\p{Lu}\p{L}+l)(?=\s)/u,'$1a'):t;};
// Detail kontaktu: hlavička i shrnutí odjedou s obsahem, nic nemění výšku (obsah neposkakuje).
// Jakmile se pruh se záložkami přilepí nahoře, ukáže se nad ním úzký řádek se jménem a akcemi.
function detScroll(m){const d=document.querySelector('.det-bar#dt');if(!d)return;const mini=d.querySelector('.det-mini');if(!mini)return;
  const on=d.getBoundingClientRect().top-m.getBoundingClientRect().top<=mini.offsetHeight+1&&m.scrollTop>0;
  if(on!==d.classList.contains('stuck')){d.classList.toggle('stuck',on);mini.inert=!on;if(!on&&typeof detSum==='function')detSum(false);}}

function render(){
  closeLayer();const h=location.hash.replace(/^#\/?/,'');routeNow=h.split('/');
  const app=document.getElementById('app');
  if(!ME||routeNow[0]==='login'||routeNow[0]===''&&!ME){app.innerHTML=viewLogin();return;}
  if(!routeNow[0]){location.hash='#/prehled';return;}
  const r=route(routeNow);
  if(!r.html.includes('class="crumbs"')&&r.html.includes('page-head')){const t=r.html.match(/<h1[^>]*>(.*?)<\/h1>/);if(t)r.html=`<div class="crumbs">${t[1]}</div>`+r.html;}
  app.innerHTML=shell(r.html,r.nav,r.foot);
  if(r.after)r.after();
  dirtyInit();
}
function route(p){
  const [a,b,c,d]=p;
  switch(a){
    case 'prehled':return {nav:'prehled',html:viewDashboard()};
    case 'kontakty':return viewContactList(b||'osoby');
    case 'kontakt':return c==='upravit'?viewContactForm(b,d||'zakladni'):viewContact(b,c||'zakladni');
    case 'ukoly':return viewTasks();
    case 'ukol':return c==='upravit'?viewTaskForm(b):viewTask(b);
    case 'projekty':return viewProjects();
    case 'projekt':return c==='upravit'?viewProjectForm(b):viewProject(b,c||'prehled');
    case 'dochazka':return viewAttendance(b||'moje');
    case 'uzivatele':return viewUsers();
    case 'uzivatel':return c==='upravit'?viewUserForm(b,d||'prehled'):viewUser(b,c||'prehled');
    case 'nastaveni':return viewSettings(b||'notifikace');
    case 'kalendar':return viewCalendar(b||'mesic');
    case 'oslavy':return viewCelebrate();
    case 'napoveda':return viewHelp(b);
    case 'dokumenty':return b==='detail'?viewDoc(c):viewDocs();
    case 'export':return viewExport(b||'export');
    case 'obchod':return b==='detail'?viewDeal(c):b==='upravit'?viewDealForm(c):viewDeals(b||'pipeline');
    default:return viewMissing(a);
  }
}
function viewMissing(a){const erp=[...NAV_BASE,...NAV_ERP].flatMap(g=>g.items).find(i=>i[0]===a);const names={kalendar:'Kalendář',obchod:'Obchod',dokumenty:'Dokumenty',export:'Export & Import',nastaveni:'Nastavení'};
  return {nav:a,html:`<div class="page-head"><h1>${esc((DB.settings&&DB.settings.names[a])||names[a]||(erp?erp[2]:'Stránka nenalezena'))}</h1></div><div class="card empty">${ic('flag')}<h3>Tento modul zatím není navržený</h3><a class="btn" href="#/prehled">Zpět na Přehled</a></div>`};}

// Boční menu: Přehled nahoře, skupiny uprostřed, nastavení dole. Viz Figma, sekce Menu V2.
const NAV_BASE=[{g:'Práce',items:[['kontakty','user','Kontakty','#/kontakty/osoby',[['firmy','Organizace','#/kontakty/firmy'],['osoby','Osoby','#/kontakty/osoby']]],['work','task-square','Projekty & Úkoly','#/ukoly',[['projekty','Projekty','#/projekty'],['ukoly','Úkoly','#/ukoly']]],['kalendar','calendar','Kalendář','#/kalendar'],['obchod','briefcase','Obchod','#/obchod'],['dokumenty','document','Dokumenty','#/dokumenty']]},{g:'Lidé',items:[['dochazka','calendar-tick','Docházka','#/dochazka'],['uzivatele','people','Uživatelé','#/uzivatele']]}];
const NAV_ERP=[{g:'Prodej',items:[['erp-nabidky','note-text','Nabídky','#/erp-nabidky'],['erp-objednavky','task','Objednávky','#/erp-objednavky'],['erp-faktury','document','Fakturace','#/erp-faktury']]},{g:'Finance',items:[['erp-ucetnictvi','chart','Účetnictví','#/erp-ucetnictvi'],['erp-banka','wallet-money','Banka','#/erp-banka'],['erp-pokladna','wallet','Pokladna','#/erp-pokladna']]},{g:'Sklad',items:[['erp-zasoby','folder','Zásoby','#/erp-zasoby'],['erp-nakup','briefcase','Nákup','#/erp-nakup']]},{g:'Personalistika',items:[['erp-mzdy','wallet-money','Mzdy','#/erp-mzdy'],['erp-nabor','user-add','Nábor','#/erp-nabor']]},{g:'Provoz',items:[['erp-majetek','buildings','Majetek','#/erp-majetek'],['erp-servis','setting-4','Servis','#/erp-servis']]}];
const navGroups=()=>DB.navErp?[...NAV_BASE,...NAV_ERP]:NAV_BASE;
const navOn=(it,nav)=>nav===it[0]||(it[4]&&it[4].some(s=>s[0]===nav));
let navSub={},navCur=null;
const navSubOpen=(it,nav)=>navSub[it[0]]!==undefined?navSub[it[0]]:navOn(it,nav);
function navItem(it,nav){const on=navOn(it,nav),rail=DB.navRail,kids=it[4]&&!rail,open=kids&&navSubOpen(it,nav);const inner=`<span class="nib">${icN(it[1])}</span><span class="lbl">${esc((DB.settings&&DB.settings.names[it[0]])||it[2])}</span>`;const a=kids?`<button class="nav ${on?'on':''}" data-a="navsub" data-id="${it[0]}" aria-expanded="${open}">${inner}<span class="nch">${icN(open?'arrow-up-2':'arrow-down')}</span></button>`:`<a class="nav ${on?'on':''}" href="${it[3]}" ${rail?`data-tip="${it[2]}" aria-label="${it[2]}"`:''}>${inner}</a>`;return open?`<div class="navgroup">${a}<div class="subnav">${it[4].map(s=>`<a class="sub ${nav===s[0]?'on':''}" href="${s[2]}">${s[1]}</a>`).join('')}</div></div>`:a;}
function sidebar(nav){if(nav!==navCur){navSub={};navCur=nav;}const closed=DB.navClosed||[];const groups=navGroups().map(g=>{const hasOn=g.items.some(i=>navOn(i,nav));const open=DB.navRail||!closed.includes(g.g);/* Sekce se sbalí kliknutím na název, šipka u nich není */return `<div class="ngroup">${DB.navRail?'<hr class="nsep">':`<button class="nhead ${hasOn&&!open?'on':''}" data-a="navgroup" data-g="${g.g}" aria-expanded="${open}"><span>${g.g}</span></button>`}${open?g.items.map(i=>navItem(i,nav)).join(''):''}</div>`;}).join('');
  return `<nav class="sidebar" aria-label="Hlavní menu"><div class="ntop">${navItem(['prehled','home-2','Přehled','#/prehled'],nav)}</div><div class="nmid"><div class="nscroll" id="nscroll">${groups}</div><button class="nmore" data-a="navmore" aria-label="Další položky menu" tabindex="-1">${icN('arrow-down')}</button></div><div class="nbot">${navItem(['export','arrow-swap-horizontal','Export & Import','#/export'],nav)}${navItem(['nastaveni','setting-2','Nastavení','#/nastaveni'],nav)}<div class="nav-m">${navItem(['napoveda','question-circle','Nápověda','#/napoveda'],nav)}<button class="nav" data-a="j_credits"><span class="nib">${icN('wallet')}</span><span class="lbl">666 kreditů</span></button></div><button class="nav ncollapse" data-a="navrail" ${DB.navRail?'data-tip="Rozbalit menu" aria-label="Rozbalit menu"':''}><span class="nib">${icN(DB.navRail?'arrow-right-2':'arrow-left-2')}</span><span class="lbl">Sbalit menu</span></button></div></nav>`;}
ACT_LATE.push(()=>{
  ACT.navgroup=el=>{const g=el.dataset.g;DB.navClosed=DB.navClosed||[];DB.navClosed=DB.navClosed.includes(g)?DB.navClosed.filter(x=>x!==g):[...DB.navClosed,g];save();render();};
  ACT.navsub=el=>{const id=el.dataset.id,it=navGroups().flatMap(g=>g.items).find(i=>i[0]===id);navSub[id]=!navSubOpen(it,navCur);const s=document.querySelector('.sidebar');if(s)s.outerHTML=sidebar(navCur);const n=document.getElementById('nscroll');if(n)n.scrollTop=navTop;navHint();const b=document.querySelector(`[data-a=navsub][data-id="${id}"]`);if(b)b.focus();};
  ACT.navopen=()=>{const o=document.body.classList.toggle('nav-open');const b=document.querySelector('.burger');if(b)b.setAttribute('aria-expanded',o);};
  ACT.navclose=()=>document.body.classList.remove('nav-open');
  ACT.gsopen=()=>gsOpen();
  ACT.navrail=()=>{DB.navRail=!DB.navRail;save();render();};
  ACT.navmore=()=>{const n=document.getElementById('nscroll');if(n)n.scrollBy({top:n.clientHeight*.7,behavior:'smooth'});};
  ACT.naverp=()=>{DB.navErp=!DB.navErp;save();closeLayer();render();};
});
function navHint(){const n=document.getElementById('nscroll');if(!n)return;const box=n.parentElement;box.classList.toggle('hasmore',n.scrollTop+n.clientHeight<n.scrollHeight-4);box.classList.toggle('prev',n.scrollTop>4);}
let navTop=0,mainTop={h:'',t:0};
document.addEventListener('scroll',e=>{const t=e.target;if(!t.classList)return;if(t.id==='nscroll'){navTop=t.scrollTop;navHint();}if(t.classList.contains('tbl-card'))t.classList.toggle('scrolled',t.scrollLeft>0);if(t.classList.contains('main')){detScroll(t);mainTop={h:location.hash,t:t.scrollTop};if(layer()&&layer().querySelector('.pop'))closeLayer();}},true);
addEventListener('resize',navHint);
new MutationObserver(()=>{const m=document.querySelector('.main');document.body.classList.toggle('in-app',!!m);document.body.classList.toggle('rail',!!(DB&&DB.navRail));if(m&&mainTop.h===location.hash)m.scrollTop=mainTop.t;const n=document.getElementById('nscroll');if(n)n.scrollTop=navTop;navHint();tabsInit();}).observe(document.getElementById('app'),{childList:true});
const nameHead=(a,s,t)=>{const on=s.sort==='lastSort'||s.sort==='firstSort';return `<th class="sort" data-a="${a}" ${t?`data-t="${t}"`:''} aria-haspopup="menu">Jméno${on?ic(s.dir>0?'arrow-up-2':'arrow-down'):ic('arrow-down')}</th>`;};
const sortMenu=(el,s)=>{const it=(k,d,l)=>({t:l,ic:s.sort===k&&s.dir===d?'tick-circle':null,fn:()=>{s.sort=k;s.dir=d;s.page=0;render();}});openMenu(el,[it('lastSort',1,'Příjmení A–Z'),it('lastSort',-1,'Příjmení Z–A'),'-',it('firstSort',1,'Křestní jméno A–Z'),it('firstSort',-1,'Křestní jméno Z–A')],224);const p=layer().querySelector('.pop');const r=el.getBoundingClientRect();if(p)p.style.left=r.left+'px';};
const tabScroll={};
const tabKey=t=>[...t.querySelectorAll('.tab')].map(x=>x.textContent.replace(/\s*\(\d+\)/,'')).join('|');
function tabHint(t){const w=t.parentElement;if(!w||!w.classList.contains('tabbar'))return;const max=t.scrollWidth-t.clientWidth;w.classList.toggle('l',t.scrollLeft>2);w.classList.toggle('r',t.scrollLeft<max-2);}
function tabsInit(){document.querySelectorAll('nav.tabs').forEach(t=>{if(t.parentElement.classList.contains('tabbar'))return;const w=document.createElement('div');w.className='tabbar';t.parentNode.insertBefore(w,t);w.appendChild(t);if(t.style.margin){w.style.flex='none';}
  w.insertAdjacentHTML('beforeend',`<button class="tab-ov to-l" data-a="tabscroll" data-v="-1" aria-label="Předchozí záložky">${icN('arrow-left-2')}</button><button class="tab-ov to-r" data-a="tabscroll" data-v="1" aria-label="Další záložky">${icN('arrow-right-2')}</button>`);
  const k=tabKey(t);if(tabScroll[k]!=null)t.scrollLeft=tabScroll[k];const on=t.querySelector('.tab.on');if(on){const pad=48;if(on.offsetLeft-t.offsetLeft<t.scrollLeft+pad)t.scrollLeft=on.offsetLeft-t.offsetLeft-pad;else if(on.offsetLeft-t.offsetLeft+on.offsetWidth>t.scrollLeft+t.clientWidth-pad)t.scrollLeft=on.offsetLeft-t.offsetLeft+on.offsetWidth-t.clientWidth+pad;}
  tabScroll[k]=t.scrollLeft;tabHint(t);
  t.addEventListener('scroll',()=>{tabScroll[k]=t.scrollLeft;tabHint(t);});
  // Záložky se posouvají jen šipkami, ne kolečkem myši ani tažením.
});}
ACT_LATE.push(()=>{ACT.tabscroll=el=>{const t=el.parentElement.querySelector('nav.tabs');t.scrollBy({left:(+el.dataset.v)*Math.round(t.clientWidth*.5),behavior:'smooth'});};});
addEventListener('resize',()=>document.querySelectorAll('nav.tabs').forEach(tabHint));
function shell(content,nav,foot){
  const unread=DB.notifications.filter(n=>n.un&&(n.to===(isMgr()?'manager':'user')||isAdmin()&&n.to==='admin')).length;
  return `<header class="header"><button class="head-btn burger" data-a="navopen" aria-label="Menu" aria-expanded="false">${icN('menu')}</button><a class="logo" href="#/prehled" aria-label="S-aver, Přehled">${LOGO}</a>
    <div class="search" id="gs"><div class="box"><span class="sib">${icN('search-normal')}</span><input id="gsi" placeholder="Hledat..." autocomplete="off" aria-label="Hledat..." readonly></div></div><button class="head-btn head-search" data-a="gsopen" aria-label="Hledat">${icN('search-normal')}</button>
    ${typeof workPills==='function'?workPills():''}<div class="head-actions">${typeof attHead==='function'?attHead():''}<button class="head-btn" data-a="notif" aria-label="Notifikace">${icN('notification')}${unread?`<span class="dot">${unread}</span>`:''}</button>
    <button class="head-btn credits" data-a="j_credits" aria-haspopup="dialog"><span class="nib">${icN('wallet')}</span>666 kreditů</button>
    <a class="head-btn" href="#/napoveda" aria-label="Nápověda" data-tip="Nápověda">${icN('question-circle')}</a>
    <span class="head-btn"><img class="me" src="assets/img/uzivatel.png" alt="Účet" data-a="account"></span></div></header>
  ${sidebar(nav)}<div class="nav-scrim" data-a="navclose"></div>
  <main class="main ${foot?'has-foot':''}"><div class="wrap">${content}</div>${foot||''}</main>`;
}

// Vrstvy
const layer=()=>document.getElementById('layer');
function closeLayer(){const l=layer();if(l)l.innerHTML='';}
function modal(html,cls=''){layer().innerHTML=`<div class="ov" data-ov><div class="modal ${cls}" role="dialog" aria-modal="true"><button class="modal-x" data-close aria-label="Zavřít" data-tip="Zavřít">${icN('close')}</button>${html}</div></div>`;j_modalFit(layer().querySelector('.modal'));const f=layer().querySelector('input,select,textarea');if(f)f.focus();}
// Okno nikdy nepřesáhne obrazovku: nadpis a tlačítka zůstávají, posouvá se jen obsah mezi nimi.
function j_modalFit(m){if(!m)return;const kids=[...m.children].filter(x=>!x.classList.contains('modal-x'));if(!kids.length)return;let i=0;const h=kids.findIndex(x=>x.tagName==='H2');if(h>=0&&h<2){i=h+1;if(kids[i]&&kids[i].tagName==='P'&&/small|mute/.test(kids[i].className)&&kids[i].textContent.length<160)i++;}
  const last=kids[kids.length-1],ft=last&&last.classList.contains('ft')?last:null,body=kids.slice(i,ft?kids.length-1:kids.length);if(!body.length)return;const b=document.createElement('div');b.className='modal-b';body[0].before(b);body.forEach(x=>b.appendChild(x));
  const sc=()=>b.classList.toggle('sc',b.scrollHeight>b.clientHeight+1);sc();b.addEventListener('scroll',()=>b.classList.toggle('sct',b.scrollTop>0));new ResizeObserver(()=>requestAnimationFrame(sc)).observe(b);}
function popover(anchor,html,w=216){closeLayer();const r=anchor.getBoundingClientRect();w=Math.min(w,innerWidth-16);const left=Math.min(r.right+scrollX-w,innerWidth-w-8);layer().innerHTML=`<div class="pop" style="top:${r.bottom+scrollY+4}px;left:${Math.max(left,8)}px;width:${w}px">${html}</div>`;
  const p=layer().querySelector('.pop');j_popFit(p,r);}
// Popover se vejde na obrazovku: dolů, nebo nahoru, jinak na větší stranu s posunem uvnitř.
function j_popFit(p,r){if(!p)return;const H=p.scrollHeight,below=innerHeight-r.bottom-12,above=r.top-12;p.style.maxHeight='';
  if(H<=below)p.style.top=(r.bottom+scrollY+4)+'px';else if(H<=above)p.style.top=(r.top+scrollY-H-4)+'px';
  else if(below>=above){p.style.top=(r.bottom+scrollY+4)+'px';p.style.maxHeight=below+'px';}else{p.style.top=(scrollY+8)+'px';p.style.maxHeight=(r.top-16)+'px';}}
function toast(msg,undo,kind){document.querySelectorAll('.toast').forEach(t=>t.remove());const t=document.createElement('div');t.className='toast';t.setAttribute('role','status');t.innerHTML=ic(kind==='err'?'danger':'tick-circle','s16')+`<span>${esc(msg)}</span>`;if(undo){const b=document.createElement('button');b.textContent='Vrátit';b.onclick=()=>{undo();t.remove();render();};t.appendChild(b);}document.body.appendChild(t);setTimeout(()=>t.remove(),undo?7000:4000);}
const menu=(anchor,items,w)=>popover(anchor,items.map(i=>i==='-'?'<hr>':`<button class="it ${i.dng?'dng':''}" data-m="${i.id}">${i.ic?ic(i.ic,'s16'):''}${esc(i.t)}</button>`).join(''),w);
let MENU={};const openMenu=(anchor,items,w)=>{MENU={};items.forEach(i=>{if(i!=='-'){i.id=Math.random().toString(36).slice(2);MENU[i.id]=i.fn;}});menu(anchor,items,w);};
const sensitive=(masked,full,ok=true)=>!ok?`<span class="sens"><span>${esc(masked)}</span><span class="sens-lock" data-tip="Nemáte oprávnění zobrazit citlivý údaj" aria-label="Bez oprávnění">${ic('lock','s16')}</span></span>`:`<span class="sens"><span data-sv="${esc(masked)}" data-sf="${esc(full)}">${esc(masked)}</span><button data-a="reveal" aria-label="Zobrazit" data-tip="Zobrazit">${ic('eye','s16')}</button><button data-a="copy" data-v="${esc(full)}" aria-label="Kopírovat" data-tip="Kopírovat">${ic('copy','s16')}</button></span>`;
const pageSel=(st,total,cb)=>{};
// Hromadné akce: jedno okno s nabídkou. items = [{ic,t,sub,fn,dng}]; fn se zavolá po výběru (většinou otevře další okno).
let BULK_FN=[];
function bulkPick(n,items){BULK_FN=items.filter(Boolean);modal(`<h2>Hromadné akce</h2><p class="small mute">Vybráno: ${n}</p><div class="bk-list">${BULK_FN.map((x,i)=>`<button class="bk-it ${x.dng?'dng':''}" data-a="bulkgo" data-i="${i}"><span class="bk-ic">${ic(x.ic,'s16')}</span><span class="bk-b"><span class="med">${esc(x.t)}</span>${x.sub?`<span class="small mute">${esc(x.sub)}</span>`:''}</span>${ic('arrow-right-2','s16')}</button>`).join('')}</div>`);}
ACT_LATE.push(()=>{ACT.bulkgo=el=>{const f=BULK_FN[+el.dataset.i];closeLayer();if(f&&f.fn)f.fn();};});
const footer=(k,shown,total,pages)=>{const s=UI[k];return `<div class="foot"><span><span class="f-l">Zobrazeno: </span>${shown} z ${total}</span><label class="f-size">Zobrazit <select data-a="pagesize" data-k="${k}">${[24,48,96].map(n=>`<option ${s.size===n?'selected':''} value="${n}">${n} položek</option>`).join('')}</select></label><div class="pg"><span class="f-l">Strana:</span> <input value="${s.page+1}" data-a="pagego" data-k="${k}" aria-label="Strana"> z ${pages}<button data-a="pageprev" data-k="${k}" ${s.page<=0?'disabled':''} aria-label="Předchozí">${ic('arrow-left-2','s16')}</button><button data-a="pagenext" data-k="${k}" ${s.page>=pages-1?'disabled':''} aria-label="Další">${ic('arrow-right-2','s16')}</button></div></div>`;};

// Akce přes delegaci. Moduly přidávají vlastní přes ACT.x = fn(el, ev)
const ACT={};ACT_LATE.forEach(f=>f());
document.addEventListener('click',e=>{
  const rp=e.target.closest('a.tab[href],a[data-rep]');if(rp&&!e.defaultPrevented&&!e.ctrlKey&&!e.metaKey){e.preventDefault();navRep(rp.getAttribute('href'));return;}
  const m=e.target.closest('[data-m]');if(m){const fn=MENU[m.dataset.m];closeLayer();if(fn)fn();return;}
  if(e.target.closest('[data-close]')){closeLayer();return;}
  if(e.target.matches('[data-ov]')){closeLayer();return;}
  const a=e.target.closest('[data-a]');
  if(a&&(a.dataset.on==='change'||a.tagName==='SELECT'||(a.tagName==='INPUT'&&a.type!=='checkbox')))return;
  if(a&&ACT[a.dataset.a]){if(a.tagName!=='SELECT'&&a.tagName!=='INPUT'&&a.type!=='checkbox')e.preventDefault();e.stopPropagation();ACT[a.dataset.a](a,e);return;}
  const g=e.target.closest('[data-go]');if(g&&!e.target.closest('a,button,input,label')){go(g.dataset.go);return;}
  if(!e.target.closest('.pop,.panel,.modal')){const l=layer();if(l&&l.querySelector('.pop,.panel'))closeLayer();}
});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches&&e.target.matches('.next-c')){e.target.click();return;}if(e.key==='Escape'){closeLayer();}if(e.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){e.preventDefault();gsOpen();}});
document.addEventListener('change',e=>{const a=e.target.closest('[data-a]');if(a&&a.dataset.on==='change'&&ACT[a.dataset.a])ACT[a.dataset.a](a,e);else if(a&&(a.dataset.a==='pagesize')){ACT.pagesize(a);}else if(a&&a.dataset.a==='pagego')ACT.pagego(a);});
document.addEventListener('input',e=>{if(e.target.id==='gsq')gsRes();const a=e.target.closest('[data-input]');if(a&&ACT[a.dataset.input])ACT[a.dataset.input](a,e);if(dirty&&e.target.closest('[data-form]'))dirty.changed=true;});
// Bublina
let tipEl;document.addEventListener('mouseover',e=>{const t=e.target.closest('[data-tip]');if(!t){if(tipEl){tipEl.remove();tipEl=null;}return;}if(tipEl)tipEl.remove();tipEl=document.createElement('div');tipEl.className='tip';tipEl.textContent=t.dataset.tip;document.body.appendChild(tipEl);const r=t.getBoundingClientRect(),w=tipEl.offsetWidth,h=tipEl.offsetHeight;tipEl.style.left=Math.max(8,Math.min(r.left+r.width/2-w/2,innerWidth-w-8))+'px';tipEl.style.top=(r.top-h-8<8?r.bottom+8:r.top-h-8)+'px';});

ACT.pagesize=el=>{const s=UI[el.dataset.k];s.size=+el.value;s.page=0;render();};
ACT.pageprev=el=>{UI[el.dataset.k].page--;render();window.scrollTo(0,0);};
ACT.pagenext=el=>{UI[el.dataset.k].page++;render();window.scrollTo(0,0);};
ACT.pagego=el=>{const s=UI[el.dataset.k];s.page=Math.max(0,(parseInt(el.value)||1)-1);render();};
ACT.reveal=el=>{const sp=el.parentElement.querySelector('[data-sv]');const open=sp.textContent===sp.dataset.sf;sp.textContent=open?sp.dataset.sv:sp.dataset.sf;el.innerHTML=ic(open?'eye':'eye-slash','s16');};
ACT.copy=el=>{const v=el.dataset.v;if(navigator.clipboard)navigator.clipboard.writeText(v).catch(()=>{});toast('Zkopírováno: '+v);};
ACT.account=el=>{const u=me();popover(el,`<div style="padding:8px"><div class="sb">${esc(u.name)}</div><div class="small mute">${esc(u.pos)} · ${isAdmin()?'Administrátor':isMgr()?'Nadřízený':'Uživatel'}</div></div><hr><a class="it" href="#/uzivatel/${u.id}/prehled">${ic('user','s16')}Můj profil</a><button class="it" data-a="switch">${ic('people','s16')}Přepnout na ${ME==='AN'?'Janu (nadřízená)':ME==='JD'?'Petru (administrátor)':'Alenu (uživatelka)'}</button><button class="it" data-a="naverp">${ic('task','s16')}${DB.navErp?'Skrýt ukázku ERP modulů':'Ukázat menu s ERP moduly'}</button><button class="it" data-a="reset">${ic('refresh','s16')}Obnovit ukázková data</button><hr><button class="it" data-a="logout">${ic('logout','s16')}Odhlásit se</button>`,264);};
ACT.j_credits=el=>popover(el,`<div style="padding:8px"><div class="small mute">Zůstatek</div><b style="font:600 22px/28px Poppins">666 kreditů</b><div class="small mute" style="margin-top:8px">Kredity se čerpají za SMS, elektronické podpisy a ověření v registrech.</div></div><hr>${isAdmin()?`<a class="it" href="#/nastaveni/fakturace">${ic('wallet','s16')}Dobít a vyúčtování</a>`:`<div class="small mute" style="padding:8px">Kredity dobíjí administrátor.</div>`}`,264);
ACT.switch=()=>{setMe(ME==='AN'?'JD':ME==='JD'?'PN':'AN');closeLayer();location.hash='#/prehled';render();toast('Přihlášeni jako '+me().name);};
ACT.reset=()=>{closeLayer();resetAll();};
ACT.logout=()=>{setMe(null);closeLayer();location.hash='#/login';render();};
ACT.notif=el=>{const k=isMgr()?'manager':'user';const st=ui('notif',{only:false});const list=DB.notifications.filter(n=>(n.to===k||isAdmin()&&n.to==='admin')&&(!st.only||n.un));const un=DB.notifications.filter(n=>(n.to===k||isAdmin()&&n.to==='admin')&&n.un).length;
  layer().innerHTML=`<div class="panel" role="dialog"><div class="row" style="justify-content:space-between;margin-bottom:8px"><h2 style="font:600 16px/24px Poppins">Notifikace</h2><a data-a="notifread" class="small">Označit vše jako přečtené</a></div><div class="row" style="margin-bottom:8px"><button class="btn ${st.only?'':'pri'}" data-a="notiffilter" data-v="0">Vše</button><button class="btn ${st.only?'pri':''}" data-a="notiffilter" data-v="1">Nepřečtené (${un})</button></div>${list.length?list.map(n=>`<div class="noti ${n.un?'un':''}" data-a="notifgo" data-id="${n.id}"><span class="d ${n.un?'':'o'}"></span><div><div class="m">${esc(n.m)}</div><div class="small mute">${esc(n.d)} · ${esc(n.k)}</div></div></div>`).join(''):`<div class="empty" style="padding:24px">${ic('notification')}<h3>Máte všechno přečtené</h3></div>`}</div>`;};
ACT.notiffilter=el=>{UI.notif.only=el.dataset.v==='1';ACT.notif();};
ACT.notifread=()=>{DB.notifications.forEach(n=>n.un=false);save();render();ACT.notif();};
ACT.notifgo=el=>{const n=DB.notifications.find(x=>x.id===el.dataset.id);n.un=false;save();closeLayer();go(n.go);};

// Globální hledání: hledá v celém systému. Po kliknutí do pole se otevře okno s upřesněním (kde hledat, jen moje, i archiv).
const GS_SC=[['','Vše'],['c','Kontakty'],['t','Úkoly'],['p','Projekty'],['d','__deal'],['f','Dokumenty'],['e','Kalendář'],['u','Uživatelé']];
const gsUi=()=>ui('gs',{sc:'',mine:false,arch:false});
function gsData(q){if(typeof docActive==='function')docActive();const s=gsUi(),norm=x=>String(x||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase(),n=norm(q),m=(...a)=>a.some(x=>norm(x).includes(n));
  const dw=typeof dealWord==='function'?dealWord():'Obchod';
  const G=[
   ['c','Kontakty',DB.contacts.filter(x=>(s.arch||x.active)&&(!s.mine||x.owner===ME||(x.managers||[]).includes(ME))&&m(x.name,x.phone,x.email,x.ico,x.company)),x=>[`#/kontakt/${x.id}/zakladni`,x.name,[x.type==='organizace'?'Organizace':'Osoba',x.phone].filter(Boolean).join(' · '),x.type==='organizace'?'buildings':'user']],
   ['t','Úkoly',DB.tasks.filter(x=>(s.arch||!x.done)&&(!s.mine||isOn(x,ME))&&m(x.title)),x=>[`#/ukol/${x.id}`,x.title,(x.done?'Hotovo · ':'')+fmt(x.due),'task-square']],
   ['p','Projekty',DB.projects.filter(x=>(!s.mine||x.owner===ME||(x.team||[]).includes(ME))&&m(x.name,x.client)),x=>[`#/projekt/${x.id}/prehled`,x.name,x.client,'folder']],
   ['d',dw,(DB.deals||[]).filter(x=>(s.arch||!x.state||x.state==='open')&&(!s.mine||x.owner===ME)&&m(x.title,(contact(x.contact)||{}).name)),x=>[`#/obchod/detail/${x.id}`,x.title,(contact(x.contact)||{}).name||'','briefcase']],
   ['f','Dokumenty',(DB.documents||[]).filter(x=>(s.arch||x.active!==false)&&(!s.mine||x.owner===ME)&&m(x.title,x.number,x.fileName)),x=>[`#/dokumenty/detail/${x.id}`,x.title,[x.type,x.number].filter(Boolean).join(' · '),'__f:'+(x.file||'')]],
   ['e','Kalendář',(DB.events||[]).filter(x=>(!s.mine||(x.who||[]).includes(ME))&&m(x.title,x.place)),x=>['#/kalendar/den',x.title,fmt(x.date)+(x.start?' · '+x.start:''),'calendar',x.date]],
   ['u','Uživatelé',DB.users.filter(x=>m(x.name,x.pos,x.email)),x=>[`#/uzivatel/${x.id}/prehled`,x.name,x.pos,'people']]];
  return G.filter(g=>!s.sc||g[0]===s.sc);}
// Okno hledání: pole v hlavičce je jen spouštěč (klik nebo klávesa „/“), hledá se v modálním okně.
function gsOpen(){const s=gsUi(),dw=typeof dealWord==='function'?dealWord():'Obchod';
  layer().innerHTML=`<div class="ov gs-ov" data-ov><div class="modal gsm" role="dialog" aria-modal="true" aria-label="Hledat"><button class="modal-x" data-close aria-label="Zavřít" data-tip="Zavřít">${icN('close')}</button>
  <div class="gs-in">${icN('search-normal')}<input id="gsq" placeholder="Hledat..." autocomplete="off" aria-label="Hledat" value="${esc(s.q||'')}"></div>
  <div class="gs-sc" role="group" aria-label="Kde hledat">${GS_SC.map(([k,l])=>`<button class="chip ${s.sc===k?'on':''}" data-a="gssc" data-v="${k}" aria-pressed="${s.sc===k}">${l==='__deal'?esc(dw):l}</button>`).join('')}</div>
  <div class="gs-opt"><label class="row"><input type="checkbox" data-a="gsopt" data-on="change" data-k="mine" ${s.mine?'checked':''}> Jen moje</label><label class="row"><input type="checkbox" data-a="gsopt" data-on="change" data-k="arch" ${s.arch?'checked':''}> Včetně hotových a neaktivních</label></div>
  <div class="gs-body" id="gsb"></div></div></div>`;
  gsRes();const i=document.getElementById('gsq');i.focus();i.select();}
function gsRes(){const i=document.getElementById('gsq'),box=document.getElementById('gsb');if(!i||!box)return;const q=i.value.trim(),s=gsUi();s.q=i.value;
  let body='';
  if(q.length<2){const r=(DB.recent||[]);body=r.length?`<h4>Naposledy otevřené</h4>${r.map(x=>`<a class="gs-it" href="${x.href}">${ic('clock','s16')}<span class="spacer">${esc(x.label)}</span><small>${esc(x.kind)}</small></a>`).join('')}`:'<div class="gs-none">Napište alespoň 2 znaky.</div>';}
  else{const G=gsData(q),lim=s.sc?30:4;let any=0;
    body=G.map(([k,t,arr,f])=>{if(!arr.length)return '';any++;return `<h4>${esc(t)} <span>${arr.length}</span></h4>`+arr.slice(0,lim).map(x=>{const [h,ti,sub,icn,d]=f(x);return `<a class="gs-it" href="${h}" ${d?`data-a="gsev" data-d="${d}"`:''}>${icn.startsWith('__f:')&&typeof fileIc==='function'?fileIc(icn.slice(4),'s'):ic(icn,'s16')}<span class="spacer">${esc(ti)}</span><small>${esc(sub||'')}</small></a>`;}).join('')+(arr.length>lim?`<button class="gs-more" data-a="gssc" data-v="${k}">Zobrazit všechny (${arr.length})</button>`:'');}).join('');
    if(!any)body=`<div class="gs-none">Nic jsme nenašli${s.sc||s.mine||!s.arch?`. <a data-a="gsall">Hledat všude</a>`:''}</div>`;}
  box.innerHTML=body;box.scrollTop=0;}
function globalSearch(){gsOpen();}
const j_gsChips=()=>{const s=gsUi();document.querySelectorAll('.gsm [data-a=gssc]').forEach(b=>{if(b.closest('.gs-sc')){const on=b.dataset.v===s.sc;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on);}});};
ACT_LATE.push(()=>{
  ACT.gsopen=()=>gsOpen();
  ACT.gssc=el=>{gsUi().sc=el.dataset.v;j_gsChips();gsRes();document.getElementById('gsq').focus();};
  ACT.gsopt=el=>{gsUi()[el.dataset.k]=el.checked;gsRes();document.getElementById('gsq').focus();};
  ACT.gsall=()=>{const s=gsUi();s.sc='';s.mine=false;s.arch=true;gsOpen();};
  ACT.gsev=el=>{if(typeof calUi==='function')calUi().date=el.dataset.d;closeLayer();go('#/kalendar/den');};
});
document.addEventListener('keydown',e=>{const box=document.getElementById('gsb');if(!box||!e.target.closest||!e.target.closest('.gsm'))return;
  const it=[...box.querySelectorAll('.gs-it')];if(!it.length)return;const i=it.indexOf(document.activeElement);
  if(e.key==='ArrowDown'){e.preventDefault();(it[i+1]||it[0]).focus();}else if(e.key==='ArrowUp'){e.preventDefault();if(i<=0)document.getElementById('gsq').focus();else it[i-1].focus();}
  else if(e.key==='Enter'&&e.target.id==='gsq'){e.preventDefault();it[0].click();}});
document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('.gsm a.gs-it[href]');if(a&&!a.dataset.a)setTimeout(closeLayer,0);});
document.addEventListener("click",e=>{if(e.target.id==="gsi")gsOpen();});
document.addEventListener("keydown",e=>{if(e.target.id==="gsi"&&(e.key==="Enter"||e.key===" ")){e.preventDefault();gsOpen();}});

const addHistory=(c,f,t)=>{(c.history=c.history||[]).unshift({who:ME,f,t,d:'14. 9. 2026, '+NOW});};
function remember(kind,label,href){DB.recent=[{kind,label,href,d:'dnes '+NOW},...DB.recent.filter(r=>r.href!==href)].slice(0,4);save();}
