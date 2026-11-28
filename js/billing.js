// Příprava fakturace (návrh 28. 11. 2026, jen v prototypu, čeká na schválení):
// podprojekty, nastavení fakturace projektu, hodinové sazby, výkazy času se stavy a schvalováním, účetní export.
// Pravidla od uživatelky:
// - Faktura je vždy na kontakt. Nemusí být navázaná na projekt (úkol s kontaktem stačí).
// - Podprojekt přebírá nastavení fakturace hlavního projektu (kdo fakturuje, schvalování, sazba, odběratel).
// - Vyfakturovaný čas se do další faktury už nenabídne. Čas jde označit „Neúčtovat“ (interní práce).
// - OSVČ fakturuje sám (Nastavení > Výkazy času > Pracuji sám), ve firmě podle nastavení projektu a oprávnění.
// - Sazby jsou variabilní: projekt → klient → uživatel → výchozí sazba organizace (použije se první vyplněná).
// Samotné vystavení faktury (modul Fakturace) zatím navržené není.

const B_MODES=[['hod','Hodinová sazba'],['pevna','Pevná cena'],['ne','Neúčtuje se']];
const B_APPR=[['ne','Bez schvalování'],['vlastnik','Schvaluje vlastník projektu'],['nadrizeny','Schvaluje nadřízený řešitele']];
const B_WHO=[['vlastnik','Vlastník projektu'],['opravneni','Kdokoli s oprávněním Fakturovat']];
const bLab=(arr,v)=>(arr.find(x=>x[0]===v)||arr[0])[1];
const bKc=n=>Math.round(n).toLocaleString('cs-CZ')+' Kč';
const bH=min=>{const h=Math.floor(min/60),m=min%60;return h?`${h} h${m?' '+m+' min':''}`:`${m} min`;};
const bSolo=()=>!!pv('org','bSolo',false);
const projRoot=p=>{let n=0;while(p&&p.parent&&project(p.parent)&&n++<9)p=project(p.parent);return p;};
const projKids=id=>DB.projects.filter(p=>p.parent===id);
const projTree=id=>[id,...projKids(id).flatMap(k=>projTree(k.id))];
const bCfg=p=>projRoot(p)||{};
const bContact=v=>v?(contact(v)||DB.contacts.find(c=>c.name===v)):null;
const bClient=t=>{const p=t.project&&project(t.project),r=p&&bCfg(p);return bContact((r&&r.contact)||(r&&r.client!=='Interní'&&r.client)||t.contact);};
const bPeriods=[['tm','Září 2026','2026-09-01','2026-09-30'],['lm','Srpen 2026','2026-08-01','2026-08-31'],['tw','Tento týden','2026-09-14','2026-09-20'],['all','Celé období','0000','9999']];

// ---------- Ukázková data ----------
function bSeed(){if(DB._bill)return;DB._bill=1;
  const P=(id,o)=>{const p=project(id);if(p)Object.assign(p,o);};
  P('p1',{bMode:'hod',bRate:'',bApprove:'vlastnik',bWho:'vlastnik'});
  P('p2',{bMode:'pevna',bPrice:'85000',bApprove:'ne',bWho:'vlastnik'});
  P('p3',{bMode:'hod',bRate:'1200',bApprove:'nadrizeny',bWho:'opravneni'});
  P('p4',{bMode:'pevna',bPrice:'60000',bApprove:'ne',bWho:'opravneni'});
  P('p5',{bMode:'hod',bRate:'',bApprove:'ne',bWho:'vlastnik'});
  P('p6',{bMode:'ne',bApprove:'ne',bWho:'vlastnik'});
  const sub=(id,name,parent,owner,total,done,due,desc)=>{const r=project(parent);if(!r||project(id))return;DB.projects.push({id,name,parent,health:'Podle plánu',client:r.client,phase:'Probíhá',total,done,due,owner,budget:'—',created:'5. 9. 2026',why:'',desc});};
  sub('p7','Elektroinstalace','p1','PS',4,2,'2026-10-10','Nové rozvody a osvětlení ve všech kancelářích.');
  sub('p8','Podlahy a malby','p1','AN',3,1,'2026-10-20','Pokládka podlah a malování po elektroinstalaci.');
  sub('p9','Sociální sítě','p3','BS',5,1,'2026-11-15','Obsah a placená reklama na sociálních sítích.');
  // Odběratelé projektů jako kontakty (Dušek Trading záměrně chybí: ukázka stavu „Chybí odběratel“)
  const base=DB.contacts.find(c=>c.name==='Javor s.r.o.');
  if(base)[['nmedia','Nová Media s.r.o.','info@novamedia.example','28455102','Karlínské náměstí 12','186 00','Praha 8'],['kolarova','Kolářová & partneři','kancelar@kolarova.example','07216634','Údolní 33','602 00','Brno']].forEach(([id,name,email,ico,street,zip,city])=>{if(!contact(id))DB.contacts.push({...base,id,name,email,ico,dic:'CZ'+ico,addresses:[{id:'a1',type:'Sídlo',def:true,street,zip,city,state:'Česká republika'}],tags:[],sharedWith:[],status:'Aktuální',rel:'Odběratel'});});
  DB.projects.forEach(p=>{if(!p.contact){const c=DB.contacts.find(c=>c.name===p.client);if(c)p.contact=c.id;}});
  const T=(id,title,cat,due,who,proj,done)=>{if(!task(id))DB.tasks.push({id,title,cat,due,time:'',who,contact:null,project:proj,done:!!done,desc:'',prio:'Střední',by:'TH',created:'7. 9. 2026',team:[]});};
  T('t70','Nové rozvody v prvním patře','Realizace','2026-09-09','PS','p7',1);T('t71','Revize elektroinstalace','Kontrola','2026-09-25','PS','p7');
  T('t72','Pokládka podlah v zasedačce','Realizace','2026-09-11','AN','p8',1);T('t73','Série příspěvků na říjen','Materiál','2026-09-30','BS','p9');
  // Záznamy času: září (část ke schválení, část neúčtovaná), srpen už vyfakturovaný
  const pool=['t1','t5','t9','t10','t17','t70','t71','t72','t3','t11','t18','t6','t19','t73','t4','t2','t7','t20','t90','t91','t12'];
  const notes=['Konzultace s klientem','Příprava podkladů','Práce na místě','Kontrola a úpravy','Telefonát s dodavatelem','Interní porada','Cesta ke klientovi'];
  for(let i=0;i<64;i++){const t=task(pool[i%pool.length]);if(!t)continue;const aug=i%4===3,d=aug?1+(i*7)%30:1+(i*5)%14;
    const e={who:i%5===4&&(t.team||[])[0]?t.team[0]:t.who,date:`2026-${aug?'08':'09'}-${String(d).padStart(2,'0')}`,min:[30,45,60,90,120,25,180,15][i%8],note:notes[i%notes.length],how:i%3?'Ručně':'Měření'};
    if(e.note==='Interní porada'||(!t.project&&!t.contact))e.bill=false;
    if(aug&&e.bill!==false)e.inv='FV-2026-0'+(31+i%3);
    else if(i%3)e.ok=true;
    (t.log=t.log||[]).push(e);}
  DB.tasks.forEach(t=>{if(t.log)t.log.sort((a,b)=>b.date.localeCompare(a.date));});
  const s=DB.settings;s.rates=s.rates||{u:{JD:1500,PN:1800,TH:1300,AN:1100,PS:1100,BS:1000},cl:{}};
  const zd=DB.contacts.find(c=>c.id==='zdvur');if(zd)s.rates.cl[zd.id]=1300;
  if(ME===SOLO)soloFix(DB);
  save();}

// ---------- Stav, sazba, částka ----------
const EST={ready:['K fakturaci','b-tea'],wait:['Ke schválení','b-amb'],fix:['V pevné ceně',''],ne:['Neúčtovat',''],nocl:['Chybí odběratel','b-red'],inv:['Vyfakturováno','b-grn']};
function eSt(e,t){const p=t.project&&project(t.project),r=p&&bCfg(p);
  if(e.inv)return 'inv';if(e.bill===false||(r&&r.bMode==='ne'))return 'ne';
  if(!bClient(t))return 'nocl';
  if(!bSolo()&&r&&r.bApprove&&r.bApprove!=='ne'&&!e.ok)return 'wait';
  if(r&&r.bMode==='pevna')return 'fix';return 'ready';}
function eRate(e,t){const p=t.project&&project(t.project),r=p&&bCfg(p),c=bClient(t),R=DB.settings.rates||{u:{},cl:{}};
  if(r&&+r.bRate)return [+r.bRate,'Sazba projektu'];
  if(c&&+R.cl[c.id])return [+R.cl[c.id],'Sazba klienta'];
  if(+R.u[e.who])return [+R.u[e.who],'Sazba uživatele'];
  return [+(orgS().rateDef||900),'Výchozí sazba'];}
// Fakturovaný čas: zaokrouhlený nahoru podle Nastavení > Výkazy času (zapsaný čas zůstává přesný)
const bMin=e=>{const r=+pv('org','bRound','0');return r>0?Math.ceil(e.min/r)*r:e.min;};
const eAmt=(e,t,st)=>['ready','wait','inv'].includes(st)?bMin(e)/60*eRate(e,t)[0]:0;
const bBillDef=t=>{const p=t.project&&project(t.project),r=p&&bCfg(p);if(r)return r.bMode!=='ne';return !!t.contact&&pv('org','bBillDef',true);};
// Kdo vidí částky (Nastavení > Výkazy času)
const canMoney=()=>{if(isAdmin()||bSolo())return true;const m=pv('org','bMoney','mgr');return m==='all'||(m==='mgr'&&isMgr());};
// Kdo smí schválit: podle nastavení hlavního projektu
function canApprove(e,t){if(bSolo())return false;if(isAdmin())return true;const p=t.project&&project(t.project),r=p&&bCfg(p);if(!r)return false;
  if(r.bApprove==='vlastnik')return r.owner===ME;if(r.bApprove==='nadrizeny'){const u=user(e.who);return !!u&&u.boss===ME;}return false;}
// Čí čas vidím: svůj, nadřízený i svého týmu a svých projektů, administrátor vše
const eVisible=(e,t)=>{if(isAdmin()||bSolo()||e.who===ME)return true;if(!isMgr())return false;const u=user(e.who),p=t.project&&project(t.project);return (u&&u.boss===ME)||(p&&bCfg(p).owner===ME);};
const allEntries=()=>{bSeed();if(!DB.invoices&&typeof iSeed==="function")iSeed();return DB.tasks.flatMap(t=>(t.log||[]).map((e,i)=>({e,t,i,st:eSt(e,t)})));};

// ---------- Tabulka záznamů (Výkazy času i projekt) ----------
function eTable(rows,key,opt={}){const s=ui(key,{});if(s.page==null)s.page=0;if(!s.size)s.size=24;s.sel=(s.sel||[]).filter(k=>rows.some(r=>rk(r)===k));const money=canMoney();
  const pick=rows.filter(r=>s.sel.includes(rk(r))),apr=pick.filter(r=>r.st==='wait'&&canApprove(r.e,r.t)).length,free=pick.filter(r=>r.st!=='inv').length;
  const selectable=rows.filter(r=>r.st!=='inv'),allOn=selectable.length>0&&selectable.every(r=>s.sel.includes(rk(r)));
  const invOk=canBillAny()&&pick.some(r=>iBillable(r.st));
  const bulk=s.sel.length?`<div class="bulk"><b class="sb">Vybráno ${s.sel.length}${selectable.length>s.sel.length?` z ${selectable.length}`:''}</b>${selectable.length>s.sel.length?`<button class="btn bulk-main" data-a="eselall" data-k="${key}" data-v="1">Vybrat všech ${selectable.length}</button>`:''}<span class="spacer"></span>${invOk?`<button class="btn bulk-main" data-a="einv" data-k="${key}">${ic('wallet-money','s16')}Vyfakturovat</button>`:''}${apr?`<button class="btn bulk-main" data-a="ebulk" data-k="${key}" data-v="ok">${ic('tick-circle','s16')}Schválit (${apr})</button>`:''}${free?`<button class="btn bulk-main" data-a="ebulk" data-k="${key}" data-v="ne">Neúčtovat</button><button class="btn bulk-main" data-a="ebulk" data-k="${key}" data-v="ano">Účtovat</button>`:''}<button class="btn bulk-main" data-a="eclear" data-k="${key}">Zrušit výběr</button></div>`:'';
  const pg=rows.slice(s.page*s.size,(s.page+1)*s.size);
  const head=`<tr><th style="width:40px">${selectable.length?`<input type="checkbox" class="cb" data-a="eselall" data-on="change" data-k="${key}" ${allOn?'checked':''} aria-label="Vybrat všechny záznamy v seznamu" data-tip="Vybrat všech ${selectable.length} (všechny stránky)">`:''}</th><th>Datum</th><th>Kdo</th><th>Úkol</th>${opt.noClient?'':'<th>Odběratel</th>'}<th class="num">Čas</th>${money?'<th class="num">Částka</th>':''}<th>Stav</th><th style="width:48px"></th></tr>`;
  const body=pg.map(r=>{const {e,t,st}=r,c=bClient(t),p=t.project&&project(t.project),[rate,src]=eRate(e,t),k=rk(r),[sl,sc]=EST[st];
    return `<tr class="${s.sel.includes(k)?'picked':''}" style="cursor:default"><td class="vk-cb">${st==='inv'?'':`<input type="checkbox" class="cb" data-a="esel" data-on="change" data-k="${key}" data-v="${k}" ${s.sel.includes(k)?'checked':''} aria-label="Vybrat záznam">`}</td><td class="nw vk-d">${fmt(e.date)}</td><td class="vk-k">${who(e.who,false)}</td><td class="vk-t vk-w"><a href="#/ukol/${t.id}" class="med">${esc(t.title)}</a><div class="small mute">${p?esc(p.name):'Bez projektu'}${e.note?' · '+esc(e.note):''}</div></td>${opt.noClient?'':`<td class="vk-w vk-c">${c?`<a href="#/kontakt/${c.id}/zakladni">${esc(c.name)}</a>`:'<span class="mute">—</span>'}</td>`}<td class="num nw med vk-h">${bH(e.min)}</td>${money?`<td class="num nw vk-a">${['ready','wait','inv'].includes(st)?`${bKc(eAmt(e,t,st))}<div class="small mute" data-tip="${src}">${bKc(rate)}/h</div>`:'<span class="mute">—</span>'}</td>`:''}<td class="vk-s"><span class="badge ${sc}" ${st==='inv'?`data-tip="Faktura ${esc(e.inv)}"`:''}>${sl}</span></td><td class="vk-m"><button class="more" data-a="emenu" data-k="${k}" aria-label="Další akce">${ic('more','s16')}</button></td></tr>`;}).join('');
  UI['_rows_'+key]=selectable.map(rk);UI['_foot_'+key]=rows.length>s.size?footer(key,pg.length,rows.length,Math.ceil(rows.length/s.size)):'';
  return `${bulk}<div class="tbl-card"><table class="tbl vk-tbl"><thead>${head}</thead><tbody>${body||`<tr style="cursor:default"><td colspan="9" class="mute" style="text-align:center;height:96px">${opt.empty||'V tomto období není žádný záznam času.'}</td></tr>`}</tbody></table></div>`;}
const rk=r=>r.t.id+'~'+r.t.log.indexOf(r.e);
const rFind=k=>{const [tid,i]=k.split('~'),t=task(tid),e=t&&t.log[+i];return e?{e,t,st:eSt(e,t)}:null;};
ACT.esel=el=>{const s=UI[el.dataset.k],v=el.dataset.v;s.sel=el.checked?[...s.sel,v]:s.sel.filter(x=>x!==v);render();};
ACT.eclear=el=>{UI[el.dataset.k].sel=[];render();};
// Vybrat vše: všechny záznamy odpovídající filtru, napříč stránkami (vyfakturované se vybrat nedají)
ACT.eselall=el=>{const k=el.dataset.k,s=UI[k],all=UI['_rows_'+k]||[];s.sel=el.dataset.v==='1'||el.checked?[...all]:[];render();};
// Vyfakturovat vybrané: jen záznamy K fakturaci jednoho odběratele
ACT.einv=el=>{const s=UI[el.dataset.k],keys=[...s.sel];s.sel=[];iQuick({keys,fix:[],title:`Vybrané záznamy času (${keys.length})`});};
// Kdo smí fakturovat: OSVČ a administrátor vše, jinak podle nastavení hlavního projektu
const canBillProj=p=>{if(bSolo()||isAdmin())return true;const r=p&&bCfg(p);return !!r&&r.bWho==='vlastnik'&&r.owner===ME;};
const canBillEntry=r=>{const p=r.t.project&&project(r.t.project);return p?canBillProj(p):bSolo()||isAdmin();};
const canBillAny=()=>bSolo()||isAdmin()||DB.projects.some(p=>!p.parent&&canBillProj(p));
ACT.ebulk=el=>{const s=UI[el.dataset.k],v=el.dataset.v,keys0=[...s.sel];let n=0;s.sel.map(rFind).filter(Boolean).forEach(({e,t,st})=>{if(st==='inv')return;
    if(v==='ok'&&st==='wait'&&canApprove(e,t)){e.ok=true;n++;}if(v==='ne'){e.bill=false;n++;}if(v==='ano'){delete e.bill;if(canApprove(e,t))e.ok=true;n++;}});
  const after=keys0.map(rFind).filter(Boolean),cnt=k=>after.filter(r=>r.st===k).length;s.sel=[];save();
  if(v==='ano'){const parts=[[cnt('ready'),'k fakturaci'],[cnt('wait'),'čeká na schválení'],[cnt('nocl'),'bez odběratele'],[cnt('ne'),'projekt se neúčtuje'],[cnt('fix'),'pevná cena projektu']].filter(x=>x[0]).map(x=>x[1]+': '+x[0]);toast('Označeno k účtování. '+parts.join(', ')+(cnt('ready')&&canBillAny()?'. Vyfakturujete je tlačítkem Vyfakturovat.':''));}
  else toast(v==='ok'?`Schváleno: ${n}`:`Neúčtuje se: ${n}`);render();};
ACT.emenu=el=>{const r=rFind(el.dataset.k);if(!r)return;const {e,t,st}=r,it=[{t:'Otevřít úkol',ic:'eye',fn:()=>go('#/ukol/'+t.id)}];
  if(st==='inv'||st==='drf'){const f=st==='inv'?DB.invoices.find(x=>x.no===e.inv):inv(e.dr);openMenu(el,[...it,...(f&&canBillAny()?[{t:st==='inv'?`Otevřít fakturu ${e.inv}`:'Otevřít koncept faktury',ic:'wallet-money',fn:()=>go('#/faktura/'+f.id)}]:[]),{t:st==='inv'?'Vyfakturovaný čas nejde měnit':'Čas je v konceptu faktury',ic:'lock',fn:()=>{}}]);return;}
  if(canBillAny()&&iBillable(st))it.push({t:'Vyfakturovat',ic:'wallet-money',fn:()=>iQuick({keys:[el.dataset.k],fix:[],title:t.title})});
  if(st==='wait'&&canApprove(e,t))it.push({t:'Schválit',ic:'tick-circle',fn:()=>{e.ok=true;save();toast('Záznam je schválený');render();}});
  it.push(e.bill===false?{t:'Účtovat klientovi',ic:'wallet-money',fn:()=>{delete e.bill;save();toast('Záznam se bude účtovat');render();}}:{t:'Neúčtovat',ic:'close-circle',fn:()=>{e.bill=false;save();toast('Záznam se nebude účtovat');render();}});
  openMenu(el,it);};

// Souhrnné dlaždice
function eTiles(rows,key,cols='g5'){const s=ui(key,{});const sum=f=>rows.filter(f).reduce((a,r)=>a+r.e.min,0),amt=f=>rows.filter(f).reduce((a,r)=>a+eAmt(r.e,r.t,r.st),0),m=canMoney();
  const T=[['','Odpracováno',sum(()=>1),''],['ready','K fakturaci',sum(r=>r.st==='ready'),m?bKc(amt(r=>r.st==='ready')):''],['wait','Ke schválení',sum(r=>r.st==='wait'&&canApprove(r.e,r.t)),''],['ne','Neúčtovat',sum(r=>r.st==='ne'),''],['inv','Vyfakturováno',sum(r=>r.st==='inv'),m?bKc(amt(r=>r.st==='inv')):'']];
  const appr=!bSolo()&&rows.some(r=>r.st==='wait'&&canApprove(r.e,r.t)),TT=appr?T:T.filter(x=>x[0]!=='wait');return `<div class="grid ${appr?cols:'g4'} vk-tiles" style="margin-bottom:16px">${TT.map(([k,l,v,sub])=>`<button class="stat ${k&&s.st===k?'on':''}" data-a="etile" data-k="${key}" data-v="${k}" aria-pressed="${!!k&&s.st===k}"><b class="${k==='wait'&&v?'amb':''}" style="font-size:16px;line-height:24px">${bH(v)}</b><span>${l}</span>${sub?`<div class="small mute" style="margin-top:4px">${sub}</div>`:''}</button>`).join('')}</div>`;}
ACT.etile=el=>{const s=UI[el.dataset.k];s.st=el.dataset.v&&s.st!==el.dataset.v?el.dataset.v:'';s.page=0;render();};

// ---------- Stránka Výkazy času ----------
function viewVykazy(){const s=ui('vyk',{per:'tm',kdo:isAdmin()?'vse':isMgr()?'tym':'ja',proj:'',st:'',sel:[],page:0,size:24});
  if(!s.od){s.od='2026-09-01';s.do=TODAY;}
  const per=s.per==='own'?['own','',s.od||'0000',s.do||'9999']:bPeriods.find(x=>x[0]===s.per)||bPeriods[0];
  let rows=allEntries().filter(r=>eVisible(r.e,r.t)&&r.e.date>=per[2]&&r.e.date<=per[3]);
  if(s.kdo==='ja')rows=rows.filter(r=>r.e.who===ME);
  if(s.kdo==='tym')rows=rows.filter(r=>r.e.who!==ME);
  if(s.proj)rows=rows.filter(r=>s.proj==='-'?!r.t.project:projTree(s.proj).includes(r.t.project));
  rows.sort((a,b)=>b.e.date.localeCompare(a.e.date));
  const shown=s.st?rows.filter(r=>r.st===s.st):rows;
  const kdo=bSolo()?[]:[['ja','Můj čas'],...(isMgr()||isAdmin()?[['tym',isAdmin()?'Ostatní':'Můj tým a projekty']]:[]),...(isMgr()||isAdmin()?[['vse','Všechno']]:[])];
  const projOpts=projOrder(DB.projects).map(p=>`<option value="${p.id}" ${s.proj===p.id?'selected':''}>${p.parent?'– ':''}${esc(p.name)}</option>`).join('');
  const sel=(a,l,opts)=>`<label class="vk-f"><span class="small mute">${l}</span><select class="inp" data-a="${a}" data-on="change">${opts}</select></label>`;
  const nWait=rows.filter(r=>r.st==='wait'&&canApprove(r.e,r.t)).length;
  return {nav:'vykazy',html:`<div class="crumbs">Projekty & Úkoly<span>/</span>Výkazy času</div><div class="page-head">${ic('timer-start','s32')}<h1>Výkazy času</h1><div class="acts"><button class="btn" data-a="vkexport">${ic('export','s16')}Export</button>${isAdmin()?`<a class="btn" href="#/nastaveni/sazby">${ic('setting-2','s16')}Sazby</a>`:''}</div></div>
  <div class="vk-bar">${sel('vkper','Období',[...bPeriods,['own','Vlastní (od – do)']].map(([v,l])=>`<option value="${v}" ${s.per===v?'selected':''}>${l}</option>`).join(''))}${s.per==='own'?`<label class="vk-f vk-dt"><span class="small mute">Od</span><input class="inp" type="date" data-a="vkod" data-on="change" value="${s.od}" max="${s.do}"></label><label class="vk-f vk-dt"><span class="small mute">Do</span><input class="inp" type="date" data-a="vkdo" data-on="change" value="${s.do}" min="${s.od}"></label>`:''}${sel('vkst','Stav',[['','Všechny stavy'],...Object.entries(EST).map(([k,[l]])=>[k,l])].map(([v,l])=>`<option value="${v}" ${s.st===v?'selected':''}>${l}</option>`).join(''))}${kdo.length>1?sel('vkkdo','Čí čas',kdo.map(([v,l])=>`<option value="${v}" ${s.kdo===v?'selected':''}>${l}</option>`).join('')):''}${sel('vkproj','Projekt',`<option value="">Všechny projekty</option>${projOpts}<option value="-" ${s.proj==='-'?'selected':''}>Bez projektu</option>`)}</div>
  ${nWait&&s.st!=='wait'?`<div class="banner" style="margin-bottom:16px">${ic('info-circle','s16')}<span class="spacer">Na vaše schválení čeká ${nWait} ${nWait===1?'záznam':nWait<5?'záznamy':'záznamů'} času.</span><button class="btn" data-a="etile" data-k="vyk" data-v="wait">Zobrazit</button></div>`:''}
  ${eTiles(rows,'vyk')}${eTable(shown,'vyk')}`,foot:UI._foot_vyk};}
ACT.vkper=el=>{UI.vyk.per=el.value;UI.vyk.page=0;render();};ACT.vkst=el=>{UI.vyk.st=el.value;UI.vyk.page=0;render();};
ACT.vkod=el=>{UI.vyk.od=el.value;UI.vyk.page=0;render();};ACT.vkdo=el=>{UI.vyk.do=el.value;UI.vyk.page=0;render();};ACT.vkkdo=el=>{UI.vyk.kdo=el.value;UI.vyk.page=0;render();};ACT.vkproj=el=>{UI.vyk.proj=el.value;UI.vyk.page=0;render();};
ACT.vkexport=()=>{const s=ui('xexp',{what:'osoby',sc:'mine',fmt:'xlsx',cols:'list',sens:false});s.what='vykazy';s.sc=UI.vyk&&UI.vyk.per==='all'?'tm':(UI.vyk&&UI.vyk.per)||'tm';go('#/export/export');};

// Projekty: podprojekty hned pod hlavním projektem
function projOrder(list){bSeed();const inL=new Set(list.map(p=>p.id)),out=[];const add=p=>{out.push(p);list.filter(k=>k.parent===p.id).forEach(add);};list.filter(p=>!p.parent||!inL.has(p.parent)).forEach(add);return out;}

// ---------- Projekt: záložka Čas a fakturace ----------
function projBilling(p){const r=bCfg(p),ids=projTree(p.id),rows=allEntries().filter(x=>ids.includes(x.t.project)&&eVisible(x.e,x.t)).sort((a,b)=>b.e.date.localeCompare(a.e.date)),key='vyk-'+p.id,s=ui(key,{st:''});
  const shown=s.st?rows.filter(x=>x.st===s.st):rows,c=bContact(r.contact||r.client),kids=projKids(p.id),m=canMoney();
  const rate=r.bMode==='hod'?(+r.bRate?bKc(+r.bRate)+'/h':'Podle sazeb klienta a uživatelů'):r.bMode==='pevna'?(m&&r.bPrice?bKc(+r.bPrice):'Pevná cena'):'—';
  const cfg=`<section class="card"><div class="card-head"><h3 class="sec-t" style="margin:0">Nastavení fakturace</h3><div class="r">${p.parent?'':`<a class="btn" href="#/projekt/${p.id}/upravit">${ic('edit-2','s16')}Upravit</a>`}${(rows.some(x=>x.st==='ready')||(r.bMode==='pevna'&&!r.bInv))&&canBillProj(r)&&c?`<button class="btn pri" data-a="pinv" data-id="${p.id}">${ic('wallet-money','s16')}Vyfakturovat</button>`:''}</div></div>${p.parent?`<div class="banner" style="margin-bottom:16px">${ic('info-circle','s16')}<span>Podprojekt přebírá nastavení hlavního projektu <a href="#/projekt/${r.id}/cas">${esc(r.name)}</a>.</span></div>`:''}<div class="grid g3">${F('Odběratel',c?`<a href="#/kontakt/${c.id}/zakladni">${esc(c.name)}</a>`:'<span class="red">Chybí, vyberte kontakt</span>')}${F('Způsob účtování',bLab(B_MODES,r.bMode))}${F(r.bMode==='pevna'?'Cena':'Sazba',rate)}${bSolo()?'':F('Schvalování času',bLab(B_APPR,r.bApprove))}${bSolo()?'':F('Kdo fakturuje',r.bWho==='vlastnik'?who(r.owner):bLab(B_WHO,r.bWho))}</div></section>`;
  const sub=kids.length?`<section class="card"><h3 class="sec-t">Podprojekty</h3>${kids.map(k=>{const kr=allEntries().filter(x=>projTree(k.id).includes(x.t.project)&&eVisible(x.e,x.t));return `<a class="tl row" href="#/projekt/${k.id}/cas" style="color:inherit"><span class="spacer"><span class="med">${esc(k.name)}</span><span class="small mute" style="display:block">${who(k.owner,false)}</span></span><span class="small mute">Odpracováno</span><b>${bH(kr.reduce((a,x)=>a+x.e.min,0))}</b></a>`;}).join('')}</section>`:'';
  return eTiles(rows,key)+cfg+sub+`<h3 class="sec-t" style="margin-top:8px">Záznamy času${kids.length?' včetně podprojektů':''}</h3>`+eTable(shown,key,{noClient:true,empty:'K projektu zatím nikdo nezapsal čas.'});}

// Formulář projektu: karta Fakturace (u podprojektu jen odkaz na hlavní projekt)
function projBillForm(p){const r=p&&bCfg(p),solo=bSolo();
  if(p&&p.parent)return `<section class="card"><h3 class="sec-t">Fakturace</h3><p class="mute">Podprojekt přebírá nastavení fakturace hlavního projektu <a href="#/projekt/${r.id}/upravit">${esc(r.name)}</a>.</p></section>`;
  const v=(k,d)=>p&&p[k]!=null&&p[k]!==''?p[k]:pv('org',k+'Def',d);
  const so=(n,l,arr,cur,hint)=>`<div class="field"><label for="f-${n}">${l}</label><select class="inp" id="f-${n}" name="${n}">${arr.map(([a,b])=>`<option value="${a}" ${cur===a?'selected':''}>${b}</option>`).join('')}</select>${hint?`<div class="small mute set-hint">${hint}</div>`:''}</div>`;
  return `<section class="card"><h3 class="sec-t">Fakturace</h3><p class="small mute" style="margin:-8px 0 16px">Platí i pro všechny podprojekty.</p><div class="grid g3">${so('bMode','Způsob účtování',B_MODES,v('bMode','hod'))}<div class="field"><label for="f-bRate">Sazba projektu (Kč/h)</label><input class="inp" id="f-bRate" name="bRate" type="number" min="0" step="50" value="${esc(v('bRate',''))}" placeholder="Podle klienta a uživatelů"><div class="small mute set-hint">Prázdné = sazba klienta, jinak uživatele.</div></div><div class="field"><label for="f-bPrice">Pevná cena (Kč)</label><input class="inp" id="f-bPrice" name="bPrice" type="number" min="0" step="1000" value="${esc(v('bPrice',''))}"></div>${solo?'':so('bApprove','Schvalování času',B_APPR,v('bApprove','ne'),'Neschválený čas nejde vyfakturovat.')+so('bWho','Kdo fakturuje',B_WHO,v('bWho','vlastnik'))}</div></section>`;}
const projParentSel=p=>{const bad=p?projTree(p.id):[];return `<div class="field"><label for="f-parent">Nadřazený projekt</label><select class="inp" id="f-parent" name="parent"><option value="">Žádný (hlavní projekt)</option>${projOrder(DB.projects).filter(x=>!bad.includes(x.id)).map(x=>`<option value="${x.id}" ${p&&p.parent===x.id?'selected':''}>${x.parent?'– ':''}${esc(x.name)}</option>`).join('')}</select></div>`;};
const clientList=()=>`<datalist id="dl-cl">${DB.contacts.filter(c=>c.active!==false).map(c=>`<option value="${esc(c.name)}">`).join('')}</datalist>`;

// Záznam času u úkolu: stav vedle záznamu
const tlogBadge=(t,x)=>{bSeed();const st=eSt(x,t);if(st==='ready')return '';const [l,c]=EST[st];const f=st==='inv'&&canBillAny()&&DB.invoices&&DB.invoices.find(v=>v.no===x.inv);if(f)return ` <a class="badge ${c}" style="margin-left:8px" href="#/faktura/${f.id}" data-tip="Otevřít fakturu ${esc(x.inv)}">${l} · ${esc(x.inv)}</a>`;return ` <span class="badge ${c}" style="margin-left:8px" ${x.inv?`data-tip="Faktura ${esc(x.inv)}"`:''}>${l}</span>`;};

// ---------- Nastavení: Hodinové sazby, Výkazy času ----------
(()=>{const org=SSEC.find(g=>g.admin);const i=org.items.findIndex(x=>x[0]==='dochazka')+1;
  org.items.splice(i,0,['sazby','Hodinové sazby','wallet-money','sazba hodina cena klient uživatel projekt fakturace'],['vykazy','Výkazy času','timer-start','měření času schvalování zaokrouhlení neúčtovat osvč samostatně částky']);
  SDESC.sazby='Ocenění odpracovaného času. Částky vidí jen ten, komu to povolíte v Nastavení > Výkazy času.';
  SDESC.vykazy='Jak se zapisuje, schvaluje a účtuje odpracovaný čas.';
  PERMS.push(['vykazy','Výkazy a fakturace',['Jen svůj čas','Schvaluje','Fakturuje'],['Jen svůj čas','Schvaluje','Fakturuje','Jen svůj čas','Jen svůj čas']]);})();
SBODY.sazby=()=>{bSeed();const R=DB.settings.rates,def=+(orgS().rateDef||900);
  const urow=u=>`<tr style="cursor:default"><td>${who(u.id)}</td><td class="mute">${esc(u.pos||'')}</td><td class="num"><input class="inp vk-rate" type="number" min="0" step="50" data-a="rateset" data-on="change" data-t="u" data-id="${u.id}" value="${R.u[u.id]||''}" placeholder="${def}" aria-label="Sazba: ${esc(u.name)}"></td></tr>`;
  const crow=Object.keys(R.cl).map(id=>{const c=contact(id);return c?`<tr style="cursor:default"><td><a href="#/kontakt/${c.id}/zakladni">${esc(c.name)}</a></td><td class="num"><input class="inp vk-rate" type="number" min="0" step="50" data-a="rateset" data-on="change" data-t="cl" data-id="${id}" value="${R.cl[id]}" aria-label="Sazba: ${esc(c.name)}"></td><td style="width:48px"><button class="more" data-a="ratedel" data-id="${id}" aria-label="Odebrat">${ic('trash','s16')}</button></td></tr>`:'';}).join('');
  return sCard('Která sazba se použije',`<ol class="vk-ord"><li><b>Sazba projektu</b> <span class="mute">– v nastavení fakturace projektu, platí i pro podprojekty</span></li><li><b>Sazba klienta</b> <span class="mute">– pro všechny projekty a úkoly daného kontaktu</span></li><li><b>Sazba uživatele</b> <span class="mute">– podle toho, kdo práci odvedl</span></li><li><b>Výchozí sazba</b> <span class="mute">– když není vyplněné nic z toho</span></li></ol>`,'','Použije se první vyplněná. Pevná cena projektu má přednost před hodinovými sazbami.')
  +sCard('Výchozí sazba',`<div class="grid g3">${sInp('org','rateDef','Kč za hodinu bez DPH',900,'number','',`min="0" step="50"`)}</div>`)
  +sCard('Sazby uživatelů',`<div class="tbl-card"><table class="tbl"><thead><tr><th>Uživatel</th><th>Pozice</th><th class="num">Kč/h</th></tr></thead><tbody>${DB.users.filter(u=>u.state!=='Neaktivní').map(urow).join('')}</tbody></table></div>`,'','Prázdné = výchozí sazba.')
  +sCard('Sazby podle klienta',`<div class="tbl-card"><table class="tbl"><thead><tr><th>Klient</th><th class="num">Kč/h</th><th></th></tr></thead><tbody>${crow||emptyRow(3,'Zatím žádný klient s vlastní sazbou.')}</tbody></table></div>`,`<button class="btn" data-a="rateadd">${ic('add','s16')}Přidat klienta</button>`);};
ACT.rateset=el=>{const R=DB.settings.rates[el.dataset.t],v=+el.value;if(v>0)R[el.dataset.id]=v;else delete R[el.dataset.id];save();toast('Uloženo');};
ACT.ratedel=el=>{const R=DB.settings.rates.cl,id=el.dataset.id,old=R[id];delete R[id];save();toast('Sazba klienta je odebraná',()=>{R[id]=old;save();render();});render();};
ACT.rateadd=()=>sModal('Sazba klienta',`<div class="field"><label for="ra-c">Klient *</label><input class="inp" id="ra-c" list="dl-cl" placeholder="Začněte psát název">${clientList()}<div class="err-t" id="ra-e"></div></div><div class="field"><label for="ra-v">Kč za hodinu bez DPH *</label><input class="inp" id="ra-v" type="number" min="0" step="50" value="${orgS().rateDef||900}"></div>`,()=>{const c=bContact(document.getElementById('ra-c').value.trim()),v=+document.getElementById('ra-v').value;if(!c||!(v>0)){document.getElementById('ra-e').textContent=!c?'Vyberte kontakt ze seznamu.':'Zadejte sazbu.';return false;}DB.settings.rates.cl[c.id]=v;toast('Sazba klienta je uložená');},'Přidat');
SBODY.vykazy=()=>{const solo=bSolo();
  return sCard('Způsob práce',swRow('org','bSolo','Pracuji sám (OSVČ)','Bez schvalování a bez oprávnění k fakturaci. Všechen čas fakturujete sami.',false).replace('data-k="bSolo"','data-k="bSolo" data-r="1"'))
  +(solo?'':sCard('Výchozí nastavení nových projektů',`<div class="grid g3">${sSel('org','bModeDef','Způsob účtování',B_MODES,'hod')}${sSel('org','bApproveDef','Schvalování času',B_APPR,'ne')}${sSel('org','bWhoDef','Kdo fakturuje',B_WHO,'vlastnik')}</div>`,'','U každého projektu jde změnit. Podprojekty přebírají nastavení hlavního projektu.'))
  +sCard('Záznamy času',`<div class="grid g3">${sSel('org','bRound','Zaokrouhlení času',[['0','Nezaokrouhlovat'],['5','Na 5 minut nahoru'],['15','Na 15 minut nahoru'],['30','Na 30 minut nahoru']],'0','Platí pro fakturaci, zapsaný čas zůstává přesný.')}${solo?'':sSel('org','bMoney','Kdo vidí částky',[['admin','Jen administrátor a kdo fakturuje'],['mgr','Také nadřízení u svého týmu'],['all','Každý u svého času']],'mgr')}</div>${swRow('org','bBillDef','Úkol bez projektu se účtuje kontaktu','U nového záznamu času je zaškrtnuté Účtovat klientovi, když má úkol kontakt.',true)}${solo?'':swRow('org','bLock','Schválený čas mění jen schvalovatel','Řešitel ho už sám neupraví ani nesmaže.',true)}<p class="small mute" style="margin-top:16px">Vyfakturovaný čas nejde změnit ani smazat a do další faktury se už nenabídne.</p>`);};
bSeed();
