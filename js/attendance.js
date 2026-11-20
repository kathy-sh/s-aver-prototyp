// Docházka: moje hodiny (fond, saldo, zbývá), tým dnes, měsíční přehled, nepřítomnosti a žádosti.
// Příchod a odchod: malý prvek v hlavičce (attHead), dostupný z každé stránky.
// Důvod nepřítomnosti (lékař, nemoc, OČR…) vidí jen pracovník, jeho nadřízený a administrátor. Kolegové vidí „Nepřítomna/Nepřítomen“, u dovolené „Dovolená“.
// Den bez záznamu se nikdy sám neoznačí jako neomluvený: ukáže se „Chybí záznam“ a pracovník ho doplní. Neomluvenou absenci zapisuje jen nadřízený po ověření.
// Prototyp počítá jen září 2026 (TODAY = 14. 9.).

const ATT_YM='2026-09',ATT_DAYS=30,HOLI={'2026-09-28':'Den české státnosti'};
const dISO=d=>ATT_YM+'-'+String(d).padStart(2,'0');
const dDow=d=>new Date(2026,8,d).getDay();
const DOW=['Ne','Po','Út','St','Čt','Pá','So'];
const isWD=d=>{const w=dDow(d);return w!==0&&w!==6&&!HOLI[dISO(d)];};
const TD=+TODAY.slice(8);
const ATT_DEF={mode:'flex',core:'9:00–14:00',fixed:'8:00–16:30',week:40,brk:30,sick:false};
const attCfg=()=>Object.assign({},ATT_DEF,DB.settings.att||{});
const dayMin=()=>Math.round(attCfg().week/5*60);
const rng=s=>String(s||'').split(/[–-]/).map(x=>x.trim());
const lateAfter=()=>{const c=attCfg();return mins(rng(c.mode==='flex'?c.core:c.fixed)[0]);};
const sgn=m=>m===0?'0 min':(m<0?'−':'+')+fmtMin(Math.abs(m));
const fem=id=>(user(id)||{}).g!=='m';
const dRange=(a,b)=>a===b?`${a}. 9.`:`${a}.–${b}. 9.`;

const ABS=[
 {k:'D',n:'Dovolená',g:'Volno',appr:1,paid:1,part:1},
 {k:'V',n:'Náhradní volno',g:'Volno',appr:1,paid:1,part:1,sub:'Z hodin navíc.'},
 {k:'U',n:'Neplacené volno',g:'Volno',appr:1,paid:0,part:1,sub:'Sníží fond hodin.'},
 {k:'L',n:'Lékař',g:'Překážky v práci',paid:1,part:1,sub:'I doprovod člena rodiny.'},
 {k:'N',n:'Nemoc',g:'Překážky v práci',paid:1,sub:'Neschopenku posílá lékař.'},
 {k:'O',n:'Ošetřování člena rodiny (OČR)',g:'Překážky v práci',paid:1},
 {k:'K',n:'Sick day',g:'Překážky v práci',paid:1,opt:'sick',sub:''},
 {k:'J',n:'Jiná překážka',g:'Překážky v práci',paid:1,part:1,sub:'Svatba, pohřeb, stěhování…'},
 {k:'H',n:'Home office',g:'Práce mimo kancelář',work:1,part:1},
 {k:'C',n:'Služební cesta',g:'Práce mimo kancelář',work:1},
 {k:'A',n:'Neomluvená absence',g:'Jen nadřízený',mgr:1,paid:0,sub:'Jen po ověření. Pracovník dostane oznámení.'},
];
const absT=k=>ABS.find(a=>a.k===k)||{n:k};
const canWhy=id=>id===ME||isMgr()||isAdmin();
const myTeam=()=>isMgr()||isAdmin()?TEAM.slice():[...new Set(['JD',...TEAM])].filter(x=>x!==ME);

// --- ukázková data (jednou, i do už uložených dat) ---
function attSeed(){if(DB._att3)return;
  const L={};
  L.AN={1:{in:'8:00',out:'16:45'},2:{in:'7:50',out:'16:20'},3:{in:'8:10',out:'17:30'},4:{in:'9:45',out:'16:15'},7:{in:'8:05',out:'17:10'},8:{in:'8:00',out:'16:30'},9:{in:'8:20',out:'16:35'},10:{in:'7:55',out:'17:40'},11:{in:'8:10',out:null},14:{in:(DB.checkIn&&DB.checkIn.inFrom)||'8:02',out:null}};
  const IN=['7:40','7:52','8:05','8:14','7:58'],ADD=[0,15,-10,30,5];
  const codes=Object.assign({PN:'PPPP..PPPPP..P'.split('')},DB.attendance||{});
  Object.entries(codes).forEach(([id,arr])=>{if(id==='AN')return;L[id]={};arr.forEach((c,i)=>{const d=i+1,h=id.charCodeAt(0)+id.charCodeAt(1);
    if(c==='P'||c==='Z'){const a=c==='Z'?'9:12':IN[(d+h)%5],o=mins(a)+510+ADD[(d*h)%5];L[id][d]={in:a,out:d===TD?null:Math.floor(o/60)+':'+String(o%60).padStart(2,'0')};}});});
  delete L.RP[TD];
  DB.attLog=L;
  DB.abs=[{id:'a1',who:'AN',k:'L',from:4,to:4,part:'7:00–9:30',st:'ok',note:''},{id:'a2',who:'MK',k:'D',from:11,to:14,st:'ok'},{id:'a3',who:'JD',k:'L',from:11,to:11,st:'ok'},{id:'a4',who:'AN',k:'D',from:21,to:25,st:'wait',note:''},{id:'a5',who:'PS',k:'H',from:16,to:16,st:'ok'}];
  (DB.absences||[]).filter(a=>a.m===9).forEach((a,i)=>DB.abs.push({id:'ao'+i,who:a.id,k:a.k==='N'?'A':'D',from:a.from,to:a.to,st:'ok'}));
  DB.attReq=[];DB.vac={};DB._att3=1;save();}
const vac=id=>(DB.vac[id]=DB.vac[id]||{nar:25,used:id==='AN'?8:6});
const absDays=a=>{let n=0;for(let d=a.from;d<=a.to;d++)if(isWD(d))n++;return a.part?.5:n;};

// --- výpočet dne a měsíce ---
function dayInfo(id,d){const iso=dISO(d),r={d,iso,wd:isWD(d),hol:HOLI[iso],exp:0,got:0,work:0,cred:0,code:''};
  if(!r.wd){r.code=r.hol?'S':'W';return r;}
  r.exp=dayMin();if(d>TD){r.future=1;}
  const ab=(DB.abs||[]).find(a=>a.who===id&&a.st!=='no'&&d>=a.from&&d<=a.to);r.abs=ab;
  const rec=(DB.attLog[id]||{})[d];r.rec=rec;
  r.req=(DB.attReq||[]).find(q=>q.who===id&&q.d===d&&q.st==='wait');
  if(d>TD){if(ab&&ab.st==='ok'&&!ab.part)r.code=ab.k;return r;}
  if(rec&&rec.in){const end=rec.out||(d===TD?NOW:null);
    if(end){let w=mins(end)-mins(rec.in);r.brk=w>360?attCfg().brk:0;w-=r.brk;r.work=Math.max(0,w)+(rec.prev||0);}
    r.miss=!rec.out&&d<TD;r.late=mins(rec.first||rec.in)>lateAfter()&&!(ab&&ab.part&&ab.st==='ok');}
  if(ab&&ab.st==='ok'){const t=absT(ab.k),p=ab.part?rng(ab.part):null,am=p?mins(p[1])-mins(p[0]):r.exp;
    if(t.work){if(!rec)r.work=Math.max(r.work,am);}
    else if(t.paid)r.cred=Math.min(am,r.exp);
    else if(ab.k==='U')r.exp=Math.max(0,r.exp-am);}
  r.got=r.work+r.cred;
  if(ab&&ab.st==='ok'&&!ab.part)r.code=ab.k;
  else if(rec&&rec.in)r.code=r.miss?'?':r.late?'Z':'P';
  else if(d<TD||mins(NOW)>lateAfter())r.code='?';
  return r;}
function monthSum(id){let fond=0,done=0,saldo=0,rest=0,miss=0,today=0;
  for(let d=1;d<=ATT_DAYS;d++){const r=dayInfo(id,d);if(!r.wd)continue;fond+=r.exp;
    if(d<TD){done+=r.got;saldo+=r.got-r.exp;if(r.code==='?')miss++;}
    else{if(d===TD){done+=r.got;today=r.work;}rest++;}}
  return {fond,done,saldo,left:Math.max(0,fond-done),rest,miss,today};}

// --- stav přihlášeného dnes ---
const attRec=()=>((DB.attLog||{})[ME]||{})[TD];
const attMin=()=>{attSeed();return dayInfo(ME,TD).work;};
const attState=()=>{attSeed();const r=attRec();if(!r||!r.in)return 'none';if(r.out)return 'out';return (user(ME)||{}).avail==='Přestávka'?'break':'in';};
const attDot=()=>{const s=attState();return s==='in'||s==='break'?`<i class="me-dot ${s==='in'?'grn':'amb'}" aria-hidden="true"></i>`:'';};
const coreTxt=()=>{const c=attCfg();return c.mode==='flex'?`Povinně v práci ${c.core}`:`Pracovní doba ${c.fixed}`;};
const balTxt=s=>s.saldo>=0?`máte ${fmtMin(s.saldo)} navíc`:`chybí ${fmtMin(-s.saldo)}`;

ACT.attin=()=>{attSeed();const L=DB.attLog[ME]=DB.attLog[ME]||{},r=L[TD];
  if(r&&r.out){r.prev=(r.prev||0)+dayInfo(ME,TD).work;r.first=r.first||r.in;r.in=NOW;r.out=null;}else L[TD]={in:NOW,out:null};
  const u=user(ME);if(u)u.avail=u.g==='m'?'Dostupný':'Dostupná';save();closeLayer();toast('Příchod zapsán v '+NOW);render();};
ACT.attbrk=()=>{const u=user(ME);const on=u.avail!=='Přestávka';u.avail=on?'Přestávka':(u.g==='m'?'Dostupný':'Dostupná');save();closeLayer();toast(on?'Přestávka':'Konec přestávky');render();};
ACT.attout=()=>{const go2=()=>{const r=attRec();r.out=NOW;const u=user(ME);const was=u.avail;if(u)u.avail='Offline';save();closeLayer();toast('Odchod zapsán v '+NOW,()=>{r.out=null;u.avail=was;save();render();});render();};
  if(DB.timer){closeLayer();tmrFinish(go2,'Před odchodem zapište čas u úkolu, který právě měříte.');return;}go2();};

// Hlavička: jeden malý prvek vlevo od notifikací. Ráno „Příchod“, v práci čas dne; klik otevře přestávku a odchod.
function attHead(){attSeed();const st=attState(),r=dayInfo(ME,TD),rec=attRec();
  if(st==='none')return `<button class="hp hp-go" data-a="attin">${ic('login','s16')}Příchod</button>`;
  if(st==='out')return `<button class="hp" data-a="attpop" aria-haspopup="dialog" data-tip="Dnes ${rec.first||rec.in}–${rec.out}"><i class="wp-dot"></i>Mimo práci</button>`;
  return `<button class="hp" data-a="attpop" aria-haspopup="dialog" data-tip="${st==='break'?'Přestávka':'V práci od '+(rec.first||rec.in)}"><i class="wp-dot ${st==='break'?'amb':'grn'}"></i>${st==='break'?'Přestávka':'<span class="hp-l">V práci</span>'+fmtMin(r.work)}</button>`;}
ACT.attpop=el=>{const st=attState(),r=dayInfo(ME,TD),rec=attRec(),s=monthSum(ME);
  const h=st==='out'?`Dnes ${rec.first||rec.in}–${rec.out}`:`${st==='break'?'Přestávka':'V práci'} od ${rec.first||rec.in}`;
  const b=st==='out'?`<button class="btn pri" data-a="attin">Znovu příchod</button>`:`<button class="btn" data-a="attbrk">${st==='break'?'Konec přestávky':'Přestávka'}</button><button class="btn pri" data-a="attout">Odchod</button>`;
  popover(el,`<div class="hpp"><div class="row"><span class="med spacer">${h}</span><b>${fmtMin(r.work)}</b></div><div class="small mute">Saldo září ${sgn(s.saldo)}</div><div class="hpp-b">${b}</div></div><hr><a class="it" href="#/dochazka">${ic('calendar-tick','s16')}Moje docházka</a>`,248);};

// --- stránka Docházka ---
const ATABS=()=>[['moje','Moje docházka'],['tym','Tým dnes'],...(isMgr()||isAdmin()?[['mesic','Měsíční přehled']]:[])];
function viewAttendance(tab){attSeed();if(tab==='prehled')tab='moje';if(!ATABS().some(t=>t[0]===tab))tab='moje';
  const mgr=isMgr()||isAdmin();
  const head=`<div class="crumbs">Docházka</div><div class="page-head">${ic('calendar-tick','s32')}<h1>Docházka</h1><div class="acts">${mgr?`<button class="btn" data-a="attexp">${ic('export','s16')}Export</button>`:''}<button class="btn pri" data-a="absence">${ic('add','s16')}${mgr?'Zapsat nepřítomnost':'Nepřítomnost'}</button></div></div><nav class="tabs">${ATABS().map(([k,l])=>`<a class="tab ${tab===k?'on':''}" href="#/dochazka${k==='moje'?'':'/'+k}">${l}${k==='tym'&&mgr&&pendCount()?` <span class="cnt">${pendCount()}</span>`:''}</a>`).join('')}</nav>`;
  const body=tab==='tym'?attTeam():tab==='mesic'?attMonthView():attMine();
  return {nav:'dochazka',html:head+body};}
ACT.attexp=()=>toast('Docházka je exportovaná');

const aStat=(v,l,sub='',cl='',extra='')=>`<div class="stat"><span>${l}</span><b class="${cl}">${v}</b>${extra}${sub?`<div class="small mute" style="margin-top:4px">${sub}</div>`:''}</div>`;
function attMine(){const s=monthSum(ME),v=vac(ME),c=attCfg();
  const vWait=DB.abs.filter(a=>a.who===ME&&a.k==='D'&&a.st==='wait').reduce((n,a)=>n+absDays(a),0);
  const vUsed=v.used+DB.abs.filter(a=>a.who===ME&&a.k==='D'&&a.st==='ok').reduce((n,a)=>n+absDays(a),0),vLeft=v.nar-vUsed;
  const pct=Math.min(100,Math.round(s.done/s.fond*100));
  const tiles=`<div class="grid g4" style="margin-bottom:16px">
    ${aStat(fmtMin(s.done),'Odpracováno v září',`z ${fmtMin(s.fond)}`,'',`<div class="prog" style="margin-top:8px"><i style="width:${pct}%"></i></div>`)}
    ${aStat(sgn(s.saldo),'Saldo','bez dneška',s.saldo>=0?'grn':'amb')}
    ${aStat(fmtMin(s.left),'Zbývá odpracovat',`${s.rest} dní · ${fmtMin(Math.round(s.left/Math.max(1,s.rest)))} denně`)}
    ${aStat(vLeft+' dní','Dovolená',`z ${v.nar}${vWait?` · ${String(vWait).replace('.',',')} čeká`:''}`)}</div>`;
  const warn=s.miss?`<div class="att-warn">${ic('danger','s16')}<span class="spacer">${s.miss===1?'Jeden den nemá záznam':`${s.miss} dny nemají záznam`}</span></div>`:'';
  const rows=[];for(let d=TD;d>=1;d--){const r=dayInfo(ME,d);if(!r.wd)continue;rows.push(dayRow(r));}
  const myAbs=DB.abs.filter(a=>a.who===ME&&(a.st==='wait'||a.to>=TD)).sort((a,b)=>a.from-b.from);
  const myReq=DB.attReq.filter(q=>q.who===ME&&q.st!=='ok');
  const side=`<section class="card"><h2 style="margin-bottom:16px">Žádosti a volno</h2>${myAbs.length||myReq.length?[...myAbs.map(a=>`<div class="person"><span class="${a.k==='D'?'vio':'tea'}">${ic(a.k==='D'?'sun-2':'calendar-tick','s16')}</span><div class="i spacer"><div class="med">${absT(a.k).n} ${dRange(a.from,a.to)}${a.part?' '+a.part:''}</div><div class="small ${a.st==='wait'?'amb':a.st==='no'?'red':'mute'}">${a.st==='wait'?'Čeká na schválení':a.st==='no'?'Zamítnuto':'Schváleno'}</div></div>${a.st==='wait'?`<button class="more" data-a="abscancel" data-id="${a.id}" data-tip="Zrušit žádost" aria-label="Zrušit žádost">${ic('close-circle','s16')}</button>`:''}</div>`),...myReq.map(q=>`<div class="person"><span class="amb">${ic('edit-2','s16')}</span><div class="i"><div class="med">Oprava ${DOW[dDow(q.d)]} ${q.d}. 9.: ${q.in}–${q.out}</div><div class="small ${q.st==='no'?'red':'amb'}">${q.st==='no'?'Zamítnuto':'Čeká na schválení'}</div></div></div>`)].join(''):'<p class="mute small">Žádné žádosti ani naplánované volno.</p>'}</section>
  <section class="card"><h2 style="margin-bottom:16px">Pracovní doba</h2><div class="stack" style="gap:16px">${F('Režim',c.mode==='flex'?'Pružná pracovní doba':'Pevná pracovní doba')}${F(c.mode==='flex'?'Povinně v práci':'Začátek a konec',c.mode==='flex'?c.core:c.fixed)}${F('Úvazek',`${c.week} h týdně`)}${F('Přestávka',`${c.brk} min po 6 h práce`)}</div></section>`;
  return tiles+warn+`<div class="grid" style="grid-template-columns:2fr 1fr;align-items:start"><section class="tbl-card" style="margin:0"><table class="tbl att-days"><thead><tr><th>Den</th><th>Příchod – odchod</th><th>Odpracováno</th><th>Saldo dne</th><th>Poznámka</th><th></th></tr></thead><tbody>${rows.join('')}</tbody></table></section><div>${side}</div></div>`;}
function dayRow(r){const rec=r.rec||{},ab=r.abs,t=ab&&absT(ab.k),today=r.d===TD;
  let note='';
  if(r.req)note=`<span class="amb">Oprava ${r.req.in}–${r.req.out} čeká na schválení</span>`;
  else if(r.code==='?')note=`<span class="amb">${rec.in?'Chybí odchod':today?'Příchod zatím není zapsaný':'Chybí záznam'}</span>`;
  else if(ab&&ab.st==='ok')note=`<span class="badge ${ab.k==='A'?'b-red':t.work?'b-blu':'b-vio'}">${t.n}</span>${ab.part||r.cred?`<span class="small mute" style="margin-left:8px">${ab.part?ab.part+(r.cred?' · ':''):''}${r.cred?'započteno '+fmtMin(r.cred):''}</span>`:''}`;
  else if(ab&&ab.st==='wait')note=`<span class="small amb">${t.n}: čeká na schválení</span>`;
  else if(r.late)note=`<span class="amb">Příchod po ${rng(attCfg().mode==='flex'?attCfg().core:attCfg().fixed)[0]}</span>`;
  if(today&&!note&&rec.in&&!rec.out)note='<span class="small mute">Probíhá</span>';
  const dd=r.got-r.exp,sal=today?'<span class="mute">—</span>':`<span class="${dd<0?'amb':dd>0?'grn':'mute'}">${sgn(dd)}</span>`;
  const act=today||r.req?'':r.code==='?'?`<button class="btn" data-a="attfix" data-d="${r.d}">Doplnit</button>`:`<button class="more" data-a="attfix" data-d="${r.d}" data-tip="Opravit záznam" aria-label="Opravit záznam ${r.d}. 9.">${ic('edit-2','s16')}</button>`;
  const io=rec.in?`${rec.first||rec.in}–${rec.out||(today?'':'?')}`:'—';
  return `<tr class="${today?'att-today':''}" style="cursor:default"><td class="med" style="white-space:nowrap">${DOW[dDow(r.d)]} ${r.d}. 9.${today?' <span class="small mute">dnes</span>':''}</td><td style="white-space:nowrap">${io}</td><td style="white-space:nowrap">${r.got?fmtMin(r.got):'—'}</td><td style="white-space:nowrap">${sal}</td><td>${note}</td><td style="text-align:right;width:96px">${act}</td></tr>`;}

// Oprava nebo doplnění záznamu. Uživateli ji schvaluje nadřízený, nadřízený a administrátor si ji opraví sami.
ACT.attfix=el=>{const d=+el.dataset.d,r=(DB.attLog[ME]||{})[d]||{},self=isMgr()||isAdmin();
  modal(`<h2>${r.in?'Opravit':'Doplnit'} záznam: ${DOW[dDow(d)]} ${d}. 9.</h2>${self?'':'<p class="small mute" style="margin-top:8px">Opravu schvaluje nadřízený.</p>'}<div class="stack" style="margin-top:16px"><div class="grid g2"><div class="field"><label for="fx-i">Příchod</label><input class="inp" id="fx-i" type="time" value="${(r.first||r.in||'8:00').padStart(5,'0')}"></div><div class="field"><label for="fx-o">Odchod</label><input class="inp" id="fx-o" type="time" value="${(r.out||'16:30').padStart(5,'0')}"></div></div><div class="field"><label for="fx-n">Důvod opravy</label><input class="inp" id="fx-n"></div><div class="err-t" id="fx-e"></div></div><div class="ft"><button class="btn" data-close>Zrušit</button><button class="btn pri" id="fx-ok">${self?'Uložit':'Odeslat ke schválení'}</button></div>`);
  document.getElementById('fx-ok').onclick=()=>{const i=document.getElementById('fx-i').value.replace(/^0/,''),o=document.getElementById('fx-o').value.replace(/^0/,''),n=document.getElementById('fx-n').value.trim(),e=document.getElementById('fx-e');
    if(!i||!o||mins(o)<=mins(i)){e.textContent='Odchod musí být po příchodu.';return;}
    if(!self&&!n){e.textContent='Napište nadřízené, proč záznam opravujete.';document.getElementById('fx-n').classList.add('err');return;}
    if(self){(DB.attLog[ME]=DB.attLog[ME]||{})[d]={in:i,out:o};save();closeLayer();toast('Záznam je opravený');render();return;}
    DB.attReq=DB.attReq.filter(q=>!(q.who===ME&&q.d===d));DB.attReq.push({id:'q'+Date.now(),who:ME,d,in:i,out:o,note:n,st:'wait'});
    DB.notifications.unshift({id:'n'+Date.now(),m:`${user(ME).name} žádá o opravu docházky ${d}. 9. (${i}–${o})`,d:'dnes '+NOW,k:'Docházka',un:true,to:'manager',go:'#/dochazka/tym'});
    save();closeLayer();toast('Oprava je odeslaná ke schválení');render();};};

// --- Tým dnes ---
function todaySt(id){const r=dayInfo(id,TD),u=user(id)||{},ab=r.abs,why=canWhy(id);
  const until=ab&&ab.to>TD?` do ${ab.to}. 9.`:'';
  if(ab&&ab.st==='ok'&&!ab.part){const t=absT(ab.k);
    if(t.work)return {k:'in',l:t.n,c:'tea',ic:'calendar-tick'};
    if(ab.k==='D')return {k:'off',l:'Dovolená'+until,c:'vio',ic:'sun-2'};
    if(ab.k==='A'&&why)return {k:'off',l:'Neomluvená absence',c:'red',ic:'danger'};
    return {k:'off',l:why?t.n+until:(fem(id)?'Nepřítomna':'Nepřítomen')+until,c:'vio',ic:'sun-2'};}
  const rec=r.rec;
  if(rec&&rec.in){if(rec.out)return {k:'outd',l:`${fem(id)?'Odešla':'Odešel'} v ${rec.out}`,c:'mute',ic:'logout'};
    if(u.avail==='Přestávka')return {k:'in',l:'Přestávka',c:'amb',ic:'coffee',late:r.late,t:rec.first||rec.in};
    return {k:'in',l:'V práci od '+(rec.first||rec.in),c:'grn',ic:'tick-circle',late:r.late,t:rec.first||rec.in};}
  return r.code==='?'?{k:'none',l:'Bez příchodu',c:'amb',ic:'clock'}:{k:'none0',l:'Zatím nepřišla',c:'mute',ic:'clock'};}
const ATT_F={in:s=>s.k==='in',late:s=>!!s.late,off:s=>s.k==='off',none:s=>s.k==='none'};
ACT.atttile=el=>{const s=ui('attf',{f:''});s.f=s.f===el.dataset.v?'':el.dataset.v;render();};
const pendCount=()=>(isMgr()||isAdmin())?DB.abs.filter(a=>a.st==='wait'&&TEAM.includes(a.who)).length+DB.attReq.filter(q=>q.st==='wait').length:0;
function attTeam(){const mgr=isMgr()||isAdmin(),team=myTeam(),af=ui('attf',{f:''}).f,S=Object.fromEntries(team.map(id=>[id,todaySt(id)]));
  const tiles=`<div class="grid g4" style="margin-bottom:16px">${[['in','Přítomno','grn'],['late','Pozdní příchod','amb'],['off','Nepřítomno','vio'],['none','Bez příchodu','amb']].map(([k,l,c])=>{const n=team.filter(id=>ATT_F[k](S[id])).length;return `<button class="stat ${af===k?'on':''}" data-a="atttile" data-v="${k}" aria-pressed="${af===k}"><b class="${n?c:''}">${n}</b><span>${l}</span></button>`;}).join('')}</div>`;
  const list=team.filter(id=>!af||ATT_F[af](S[id])).map(id=>{const s=S[id];return `<div class="person"><a class="who" style="color:inherit" href="#/uzivatel/${id}/prehled">${av(id,'a32')}<span class="med">${esc(user(id).name)}</span></a><span class="spacer"></span>${s.late?`<span class="small amb" style="margin-right:16px">Příchod ${s.t}</span>`:''}<span class="row ${s.c}" style="gap:8px">${ic(s.ic,'s16')}<span class="small">${s.l}</span></span>${mgr&&s.k==='none'?`<a class="small" style="margin-left:16px" data-a="attremind" data-id="${id}">Připomenout</a>`:''}</div>`;}).join('')||'<p class="mute small">Nikdo.</p>';
  const note='';
  const pend=mgr?approvals():'';
  return tiles+`<div class="grid" style="grid-template-columns:${mgr?'2fr 1fr':'1fr'};align-items:start"><section class="card" style="margin:0"><h2 style="margin-bottom:16px">${af?{in:'Přítomní',late:'Pozdní příchod',off:'Nepřítomní',none:'Bez příchodu'}[af]:'Tým dnes'}</h2>${list}${note}</section><div>${pend}</div></div>`;}
function approvals(){const A=DB.abs.filter(a=>a.st==='wait'&&TEAM.includes(a.who)),Q=DB.attReq.filter(q=>q.st==='wait');
  const it=[...A.map(a=>`<div class="appr"><div class="row">${av(a.who,'a32')}<div class="spacer"><div class="med">${esc(user(a.who).name)}</div><div class="small">${absT(a.k).n} ${dRange(a.from,a.to)}${a.part?' '+a.part:''} · ${String(absDays(a)).replace('.',',')} ${absDays(a)===1?'den':'dní'}</div></div></div><div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn" data-a="absno" data-id="${a.id}">Zamítnout</button><button class="btn pri" data-a="absok" data-id="${a.id}">Schválit</button></div></div>`),
    ...Q.map(q=>`<div class="appr"><div class="row">${av(q.who,'a32')}<div class="spacer"><div class="med">${esc(user(q.who).name)}</div><div class="small">Oprava ${q.d}. 9.: ${q.in}–${q.out}</div>${q.note?`<div class="small mute">${esc(q.note)}</div>`:''}</div></div><div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn" data-a="reqno" data-id="${q.id}">Zamítnout</button><button class="btn pri" data-a="reqok" data-id="${q.id}">Schválit</button></div></div>`)];
  return `<section class="card"><h2 style="margin-bottom:16px">Ke schválení${it.length?` <span class="cnt">${it.length}</span>`:''}</h2>${it.join('')||'<p class="mute small">Nic nečeká na schválení.</p>'}</section>`;}
const notifyU=(who,m)=>DB.notifications.unshift({id:'n'+Date.now()+who,m,d:'dnes '+NOW,k:'Docházka',un:true,to:who==='JD'?'manager':'user',go:'#/dochazka'});
ACT.absok=el=>{const a=DB.abs.find(x=>x.id===el.dataset.id);a.st='ok';notifyU(a.who,`${absT(a.k).n} ${dRange(a.from,a.to)} je schválená`);save();toast('Schváleno',()=>{a.st='wait';save();});render();};
ACT.absno=el=>{const a=DB.abs.find(x=>x.id===el.dataset.id);a.st='no';notifyU(a.who,`${absT(a.k).n} ${dRange(a.from,a.to)} není schválená`);save();toast('Zamítnuto',()=>{a.st='wait';save();});render();};
ACT.reqok=el=>{const q=DB.attReq.find(x=>x.id===el.dataset.id);q.st='ok';(DB.attLog[q.who]=DB.attLog[q.who]||{})[q.d]={in:q.in,out:q.out};notifyU(q.who,`Oprava docházky ${q.d}. 9. je schválená`);save();toast('Oprava je schválená');render();};
ACT.reqno=el=>{const q=DB.attReq.find(x=>x.id===el.dataset.id);q.st='no';notifyU(q.who,`Oprava docházky ${q.d}. 9. není schválená`);save();toast('Zamítnuto');render();};
ACT.abscancel=el=>{const i=DB.abs.findIndex(x=>x.id===el.dataset.id),a=DB.abs[i];DB.abs.splice(i,1);save();toast('Žádost je zrušená',()=>{DB.abs.splice(i,0,a);save();});render();};
ACT.attremind=el=>{notifyU(el.dataset.id,'Dnes zatím nemáte zapsaný příchod. Zapište ho, nebo zapište nepřítomnost.');save();toast('Připomenutí je odeslané: '+user(el.dataset.id).name);};

// --- Měsíční přehled (nadřízený, administrátor) ---
const CODE_L={P:'Přítomen',Z:'Pozdní příchod','?':'Chybí záznam',S:'Státní svátek'};
const codeName=k=>CODE_L[k]||absT(k).n;
function attMonthView(){const team=TEAM,first=dDow(1);
  const heads=Array.from({length:ATT_DAYS},(_,i)=>i+1).map(d=>`<th class="${isWD(d)?'':'we'} ${d===TD?'today':''}">${d}</th>`).join('');
  const cell=(id,d)=>{const r=dayInfo(id,d);if(r.code==='W'||r.code==='S')return `<div class="d W" ${r.hol?`data-tip="${r.d}. 9.: ${r.hol}"`:''}></div>`;if(!r.code)return '<div class="d"></div>';
    const ex=r.abs&&r.abs.part&&r.abs.st==='ok'?`, ${absT(r.abs.k).n} ${r.abs.part}`:'';
    return `<div class="d c-${r.code==='?'?'Q':r.code}" data-tip="${esc(user(id).name)}, ${d}. 9.: ${codeName(r.code)}${ex}${r.got?' · '+fmtMin(r.got):''}">${r.code}</div>`;};
  const used=new Set();team.forEach(id=>{for(let d=1;d<=ATT_DAYS;d++)used.add(dayInfo(id,d).code);});
  const LG=[['P','green','Přítomen'],['Z','amber','Pozdní příchod'],['?','amber','Chybí záznam'],...ABS.filter(a=>used.has(a.k)).map(a=>[a.k,a.k==='A'?'red':a.work?'teal-a':'violet',a.n])];
  return `<div class="row" style="margin-bottom:16px"><b class="sb">Září 2026</b><span class="spacer"></span><div class="lg">${LG.map(([k,c,l])=>`<span><i style="background:var(--${c})${k==='?'?';box-shadow:inset 0 0 0 2px var(--amber);background:#fff':''}"></i>${l} (${k})</span>`).join('')}<span><i style="background:#e0e6e7"></i>Víkend, svátek</span></div></div><section class="card"><table class="matrix"><thead><tr><th></th>${heads}<th>Hodiny</th><th>Saldo</th></tr></thead><tbody>${team.map(id=>{const s=monthSum(id);return `<tr><td class="nm"><a class="who" style="color:inherit" href="#/uzivatel/${id}/prehled">${av(id)}${esc(user(id).name)}</a></td>${Array.from({length:ATT_DAYS},(_,i)=>`<td>${cell(id,i+1)}</td>`).join('')}<td class="small">${Math.round(s.done/60)} h</td><td class="small ${s.saldo<0?'amb':'grn'}">${sgn(s.saldo).replace(/ (\d+) min$/,'')}</td></tr>`;}).join('')}</tbody></table></section>`;}

// --- Zapsat nepřítomnost / požádat o volno ---
ACT.absence=()=>{const mgr=isMgr()||isAdmin(),cfg=attCfg();
  const types=ABS.filter(a=>!(a.opt&&!cfg[a.opt])&&(!a.mgr||mgr));
  const groups=[...new Set(types.map(a=>a.g))].map(g=>`<optgroup label="${g}">${types.filter(a=>a.g===g).map(a=>`<option value="${a.k}">${a.n}${a.appr&&!mgr?' (schvaluje nadřízený)':''}</option>`).join('')}</optgroup>`).join('');
  modal(`<h2>${mgr?'Zapsat nepřítomnost':'Nepřítomnost'}</h2><div class="stack" style="margin-top:16px">${mgr?`<div class="field"><label for="aw">Kdo</label><select class="inp" id="aw">${[ME,...TEAM.filter(x=>x!==ME)].map(i=>`<option value="${i}">${esc(user(i).name)}${i===ME?' (já)':''}</option>`).join('')}</select></div>`:''}
  <div class="field"><label for="ak">Typ</label><select class="inp" id="ak">${groups}</select><div class="small mute" id="ak-h" style="margin-top:4px"></div></div>
  <div class="grid g2"><div class="field"><label for="af">Od</label><input type="date" class="inp" id="af" min="2026-09-01" max="2026-09-30" value="2026-09-21"></div><div class="field"><label for="at">Do</label><input type="date" class="inp" id="at" min="2026-09-01" max="2026-09-30" value="2026-09-25"></div></div>
  <label class="row" id="ap-w" style="gap:8px"><input type="checkbox" id="ap"> Jen část dne</label>
  <div class="grid g2" id="ap-t" hidden><div class="field"><label for="ap1">Od (čas)</label><input type="time" class="inp" id="ap1" value="07:00"></div><div class="field"><label for="ap2">Do (čas)</label><input type="time" class="inp" id="ap2" value="09:30"></div></div>
  <div class="field"><label for="an">Poznámka (nepovinné)</label><input class="inp" id="an"></div>
  <div class="err-t" id="a-e"></div></div><div class="ft"><button class="btn" data-close>Zrušit</button><button class="btn pri" id="ag">Odeslat</button></div>`);
  const $=i=>document.getElementById(i);
  const sync=()=>{const t=absT($('ak').value),who=mgr?$('aw').value:ME,need=t.appr&&!mgr;$('ak-h').textContent=(t.sub||'')+(need?' Schvaluje nadřízený.':'');$('ap-w').hidden=!t.part;if(!t.part){$('ap').checked=false;}$('ap-t').hidden=!$('ap').checked;$('at').disabled=$('ap').checked;if($('ap').checked)$('at').value=$('af').value;$('ag').textContent=need?'Odeslat ke schválení':'Zapsat';};
  ['ak','ap','af'].concat(mgr?['aw']:[]).forEach(i=>$(i).onchange=sync);sync();
  $('ag').onclick=()=>{const k=$('ak').value,t=absT(k),f=$('af').value,to=$('ap').checked?f:$('at').value,who=mgr?$('aw').value:ME;
    if(!f||!to||to<f){$('at').classList.add('err');$('a-e').textContent='Datum Do nesmí být před Od.';return;}
    {const F=+f.slice(8),T=+to.slice(8),w=mgr?$('aw').value:ME,cl=DB.abs.find(x=>x.who===w&&x.st!=='no'&&x.from<=T&&x.to>=F&&!x.part&&!$('ap').checked);if(cl){$('a-e').textContent=`V tomto termínu už je zapsáno: ${absT(cl.k).n} ${dRange(cl.from,cl.to)}`;return;}}if(f.slice(0,7)!==ATT_YM||to.slice(0,7)!==ATT_YM){$('a-e').textContent='Prototyp počítá jen září 2026.';return;}
    const part=$('ap').checked?$('ap1').value.replace(/^0/,'')+'–'+$('ap2').value.replace(/^0/,''):null;
    if(part&&mins(rng(part)[1])<=mins(rng(part)[0])){$('a-e').textContent='Konec musí být po začátku.';return;}
    const need=t.appr&&!mgr,a={id:'a'+Date.now(),who,k,from:+f.slice(8),to:+to.slice(8),part,st:need?'wait':'ok',note:$('an').value.trim()};
    DB.abs.push(a);
    if(need)DB.notifications.unshift({id:'n'+Date.now(),m:`${user(ME).name} žádá: ${t.n} ${dRange(a.from,a.to)}`,d:'dnes '+NOW,k:'Docházka',un:true,to:'manager',go:'#/dochazka/tym'});
    else if(who!==ME)notifyU(who,`${user(ME).name} vám zapsala do docházky: ${t.n} ${dRange(a.from,a.to)}`);
    save();closeLayer();toast(need?'Žádost je odeslaná nadřízené':'Nepřítomnost je zapsaná',()=>{DB.abs=DB.abs.filter(x=>x!==a);save();});render();};};

// --- Přehled nadřízené: karta Docházka dnes ---
function attTeamCard(){attSeed();const rows=TEAM.map(id=>[id,todaySt(id)]).filter(([,s])=>s.late||s.k!=='in'||s.l==='Přestávka');const p=pendCount();
  return `<section class="card"><div class="card-head"><h2>Docházka dnes</h2><div class="r"><a class="small" href="#/dochazka/tym">Docházka</a></div></div>${p?`<a class="person" href="#/dochazka/tym" style="color:inherit"><span class="amb">${ic('task-square','s16')}</span><div class="i"><div class="med">Ke schválení: ${p}</div><div class="small mute">Žádosti o volno a opravy</div></div></a>`:''}${rows.map(([id,s])=>`<div class="person"><span class="${s.late?'amb':s.c}">${ic(s.late?'clock':s.ic,'s16')}</span><div class="i"><div class="med">${s.late?s.t+' Pozdní příchod':s.l}</div><div class="small mute">${esc(user(id).name)}</div></div></div>`).join('')}</section>`;}
