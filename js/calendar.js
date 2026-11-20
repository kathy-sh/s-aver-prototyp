// Kalendář: měsíc, týden, den a seznam. Události jsou zdrojem i pro Dnešní rozvrh na Přehledu.
const EV_TYPES={Schůzka:'people',Hovor:'call',Událost:'calendar'};
const EV_STATES=['Naplánovaná','Proběhlá','Neuskutečněná'];
const MONTHS=['Leden','Únor','Březen','Duben','Květen','Červen','Červenec','Srpen','Září','Říjen','Listopad','Prosinec'];
const MONTHS2=['ledna','února','března','dubna','května','června','července','srpna','září','října','listopadu','prosince'];
const WD=['Po','Út','St','Čt','Pá','So','Ne'],WDL=['Pondělí','Úterý','Středa','Čtvrtek','Pátek','Sobota','Neděle'];
const pad2=n=>String(n).padStart(2,'0');
const toD=s=>{const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d);};
const toS=d=>`${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
const addD=(s,n)=>{const d=toD(s);d.setDate(d.getDate()+n);return toS(d);};
const dow=s=>(toD(s).getDay()+6)%7;
const mins=t=>{const[h,m]=t.split(':').map(Number);return h*60+m;};
const toT=m=>`${Math.floor(m/60)}:${pad2(m%60)}`;
// Stav kalendáře je pro každého přihlášeného zvlášť (koho vidím, typy, období seznamu).
const calUi=()=>ui('cal-'+ME,{date:TODAY,people:[ME],types:{Schůzka:true,Hovor:true,Událost:true,Úkoly:true},cel:true,state:'',per:'next',q:'',page:0,size:24});
const events=()=>DB.events||(DB.events=[]);
const calTeam=()=>[ME,...DB.users.filter(u=>u.boss===ME&&u.active!==false).map(u=>u.id)];
const evIn=e=>{const p=calUi().people;return e.who.some(w=>p.includes(w));};
const evsOn=date=>{const s=calUi();return events().filter(e=>e.date===date&&s.types[e.type]&&evIn(e)).sort((a,b)=>mins(a.start)-mins(b.start));};
const taskOn=date=>{const s=calUi();if(!s.types.Úkoly)return [];return DB.tasks.filter(t=>t.due===date&&!t.done&&s.people.some(p=>isOn(t,p)));};
const evPast=e=>e.status!=='Naplánovaná'||e.date<TODAY||(e.date===TODAY&&mins(e.end)<mins(NOW));
// Barva události = barva typu aktivity (stejná jako v časové ose kontaktu).
const evCls=e=>`ev ${kindCls(e.type)} ${e.status==='Neuskutečněná'?'ev-no':evPast(e)?'ev-past':''}`;
const birthdaysOn=date=>DB.contacts.filter(c=>c.active&&c.birthday===date.slice(5));
const namesOn=date=>NAME_DAYS[date.slice(5)]||[];
// Svátek ukazujeme jen u kontaktů, ne obecné jméno dne (méně šumu).
const cNamesOn=date=>{const n=namesOn(date);return n.length?DB.contacts.filter(c=>c.active&&c.first&&n.includes(c.first)):[];};
const evTitle=e=>e.title.replace(/^(Schůzka|Hovor):\s*/,'');
const multi=()=>calUi().people.length>1;

// Ukázková data: stovky událostí pro tým (Alena má volný referenční týden 14.–20. 9. jako ve Figmě).
function cdSeedEvents(){if(DB._cd5ev)return;DB._cd5ev=1;let x=7;const R=()=>{x=(x*16807)%2147483647;return x/2147483647;};const pick=a=>a[Math.floor(R()*a.length)];
  const used=new Set([...events().map(e=>e.contact),...DB.deals.map(d=>d.contact)]);const cs=DB.contacts.filter(c=>c.active&&!used.has(c.id));if(!cs.length)return;
  for(let d=toD('2026-08-03');d<=toD('2026-11-27');d.setDate(d.getDate()+1)){const ds=toS(d),w=(d.getDay()+6)%7;if(w>4||ds===TODAY)continue;
    ['AN','JD','PS','TH','MK','BS','RP'].forEach(p=>{if(p==='AN'&&ds>='2026-09-14'&&ds<='2026-09-20')return;const n=p==='AN'?(R()<.4?0:R()<.6?1:2):Math.floor(R()*3);
      [8,9,10,11,13,14,15,16].sort(()=>R()-.5).slice(0,n).forEach(h=>{const r=R(),t=r<.45?'Schůzka':r<.75?'Hovor':'Událost',c=t==='Událost'?null:pick(cs),st=h+':'+(R()<.5?'00':'30'),len=t==='Hovor'?30:t==='Schůzka'?60:90;
        events().push({id:`g${ds}${p}${h}`,title:c?`${t}: ${c.name}`:pick(['Interní porada','Školení','Příprava podkladů','Prezentace produktu','Plánování týdne']),type:t,date:ds,start:st,end:toT(mins(st)+len),who:[p],contact:c?c.id:null,place:t==='Schůzka'?pick(['Kancelář','Online','U klienta']):'',status:ds<TODAY?(R()<.1?'Neuskutečněná':R()<.06?'Naplánovaná':'Proběhlá'):'Naplánovaná'});});});}
  save();}

const VIEWS=[['mesic','Měsíc'],['tyden','Týden'],['den','Den'],['schuzky','Seznam']];
function calHead(view){const s=calUi();const d=toD(s.date);let label='';
  if(view==='mesic')label=`${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  else if(view==='tyden'){const a=toD(addD(s.date,-dow(s.date))),b=toD(addD(s.date,6-dow(s.date)));label=`${a.getDate()}. ${a.getMonth()===b.getMonth()?'':MONTHS2[a.getMonth()]+' '}– ${b.getDate()}. ${MONTHS2[b.getMonth()]} ${b.getFullYear()}`;}
  else if(view==='den')label=`${WDL[dow(s.date)]} ${d.getDate()}. ${MONTHS2[d.getMonth()]}`;
  const team=calTeam(),off=Object.values(s.types).filter(v=>!v).length+(s.cel?0:1);
  const ppl=team.length>1?`<button class="btn" data-a="calpeople">${ic('people','s16')}${s.people.length===1&&s.people[0]===ME?'Můj kalendář':s.people.length===team.length?'Celý tým':'Lidé: '+s.people.length}${icN('arrow-down')}</button>`:'';
  const flt=`<button class="btn" data-a="calfilter">${ic('filter','s16')}Zobrazit${off?` <span class="cd-n">${off}</span>`:''}</button>`;
  const seg=`<div class="seg seg-l cd-views">${VIEWS.map(([k,l])=>`<a class="${view===k?'on':''}" href="#/kalendar/${k}" data-rep>${l}</a>`).join('')}</div>`;
  const nav=view==='schuzky'?`<input class="inp cd-q" id="calq" placeholder="Hledat" aria-label="Hledat v událostech" value="${esc(s.q)}" data-input="calq">`:`<button class="btn" data-a="caltoday">Dnes</button><button class="more" data-a="calstep" data-v="-1" data-view="${view}" aria-label="Předchozí">${ic('arrow-left-2','s16')}</button><button class="more" data-a="calstep" data-v="1" data-view="${view}" aria-label="Další">${ic('arrow-right-2','s16')}</button><b class="cal-label">${label}</b>`;
  return `<div class="page-head">${ic('calendar','s32')}<h1>Kalendář</h1><div class="acts"><button class="btn pri fab" data-a="calnew">${ic('add','s16')}Přidat událost</button></div></div>
  <div class="cal-bar">${nav}<span class="spacer"></span>${ppl}${flt}${seg}</div>`;}
const calLegend=()=>{const s=calUi();return `<div class="cal-lg">${Object.keys(EV_TYPES).filter(k=>s.types[k]).map(k=>`<span class="${kindCls(k)}"><i class="evd"></i>${k}</span>`).join('')}${s.types.Úkoly?`<span><i class="evd evd-t"></i>Úkol</span>`:''}${s.cel?`<span><i class="evd evd-c"></i>Narozeniny a svátky</span>`:''}<span class="mute">Šedě proběhlé</span><span class="spacer"></span><a href="#/oslavy" class="small">Všechny narozeniny a svátky</a></div>`;};
const avMini=e=>multi()?`<span class="ev-av">${esc(e.who[0])}</span>`:'';
function evChip(e){return `<button class="${evCls(e)} evc" draggable="true" data-ev="${e.id}" data-a="calopen" data-id="${e.id}" data-tip="${esc(e.start+'–'+e.end+' '+e.title)}"><i class="evd"></i><span class="ev-t">${e.start}</span><span class="ev-n">${esc(evTitle(e))}</span>${avMini(e)}</button>`;}
const taskChip=t=>`<a class="ev ev-task ${bucket(t)==='late'?'ev-late':''}" href="#/ukol/${t.id}" data-tip="Úkol: ${esc(t.title)}">${icN('task-square')}<span class="ev-n">${esc(t.title)}</span></a>`;
const celChips=day=>{if(!calUi().cel)return [];return [...birthdaysOn(day).map(c=>`<a class="ev ev-bd" href="#/kontakt/${c.id}/zakladni" data-tip="Narozeniny: ${esc(c.name)}">${icN('cake')}<span class="ev-n">${esc(c.name)}</span></a>`),...cNamesOn(day).map(c=>`<a class="ev ev-bd" href="#/kontakt/${c.id}/zakladni" data-tip="Svátek: ${esc(c.name)}">${icN('gift')}<span class="ev-n">${esc(c.name)}</span></a>`)];};
const dayItems=day=>[...evsOn(day).map(evChip),...taskOn(day).map(taskChip),...celChips(day)];
function monthView(){const s=calUi(),d=toD(s.date),first=new Date(d.getFullYear(),d.getMonth(),1);const start=addD(toS(first),-dow(toS(first)));let cells='';
  for(let i=0;i<42;i++){const day=addD(start,i),dd=toD(day);if(i>=35&&dd.getMonth()!==d.getMonth())break;const out=dd.getMonth()!==d.getMonth();const items=dayItems(day),max=3;
    cells+=`<div class="mday ${out?'out':''} ${day===TODAY?'today':''} ${dow(day)>4?'we':''}" data-day="${day}" data-a="calday" data-d="${day}"><div class="mh"><button class="mn" data-a="calgoday" data-d="${day}" aria-label="Otevřít den ${dd.getDate()}. ${dd.getMonth()+1}.">${dd.getDate()}</button><span class="spacer"></span><button class="madd" data-a="calnew" data-d="${day}" aria-label="Přidat událost ${dd.getDate()}. ${dd.getMonth()+1}." data-tip="Přidat událost">${icN('add')}</button></div>${items.slice(0,items.length>max?max-1:max).join('')}${items.length>max?`<button class="ev-more" data-a="calmore" data-d="${day}">+${items.length-max+1}<span class="evm-l"> ${k_dalsi(items.length-max+1)}</span></button>`:''}</div>`;}
  return `<section class="cal-m"><div class="mhead">${WD.map((x,i)=>`<div class="${i>4?'we':''}">${x}</div>`).join('')}</div><div class="mgrid">${cells}</div></section>${calLegend()}`;}
function lanes(ev){const out=[];let group=[],ends=[],gEnd=-1;const flush=()=>{group.forEach(x=>x.n=ends.length);out.push(...group);group=[];ends=[];};ev.forEach(e=>{if(mins(e.start)>=gEnd&&group.length){flush();gEnd=-1;}let l=ends.findIndex(x=>x<=mins(e.start));if(l<0){l=ends.length;ends.push(0);}ends[l]=mins(e.end);gEnd=Math.max(gEnd,mins(e.end));group.push({e,l});});flush();return out;}
const H0=7,H1=20,HH=48;
function timeGrid(days,noTop){const hours=[];for(let h=H0;h<H1;h++)hours.push(h);
  const cols=days.map(day=>({day,list:lanes(evsOn(day)),top:[...celChips(day),...taskOn(day).map(taskChip)]}));const maxTop=days.length>1?2:6;
  const hasTop=!noTop&&cols.some(c=>c.top.length);const gc=`grid-template-columns:56px repeat(${days.length},minmax(0,1fr))`;
  const nowTop=(mins(NOW)-H0*60)/60*HH;
  return `<section class="card cal-w"><div class="whead" style="${gc}"><div></div>${days.map(day=>{const dd=toD(day);return `<button class="wday ${day===TODAY?'today':''} ${dow(day)>4?'we':''}" data-a="calgoday" data-d="${day}"><span>${WD[dow(day)]}</span><b>${dd.getDate()}</b></button>`;}).join('')}</div>
  ${hasTop?`<div class="whead wtop" style="${gc}"><div class="wtop-l">Celý den</div>${cols.map(c=>`<div class="wtopc ${dow(c.day)>4?'we':''}">${c.top.slice(0,c.top.length>maxTop?maxTop-1:maxTop).join('')}${c.top.length>maxTop?`<button class="ev-more" data-a="calmore" data-d="${c.day}">+${c.top.length-maxTop+1}<span class="evm-l"> ${k_dalsi(c.top.length-maxTop+1)}</span></button>`:''}</div>`).join('')}</div>`:''}
  <div class="wbody" style="${gc}"><div class="whours">${hours.map(h=>`<div style="height:${HH}px">${h}:00</div>`).join('')}</div>${cols.map(c=>`<div class="wcol ${c.day===TODAY?'today':''} ${dow(c.day)>4?'we':''}" data-col="${c.day}">${hours.map(h=>`<button class="wslot" style="height:${HH}px" data-a="calnew" data-d="${c.day}" data-h="${h}" data-slot="${c.day}|${h}" aria-label="Přidat ${h}:00"></button>`).join('')}${c.list.map(({e,l,n})=>{const top=(mins(e.start)-H0*60)/60*HH,h=Math.max((mins(e.end)-mins(e.start))/60*HH,24);return `<button class="${evCls(e)} ev-b ${h<44?'ev-s':''}" draggable="true" data-ev="${e.id}" data-a="calopen" data-id="${e.id}" data-tip="${esc(e.start+'–'+e.end+' '+e.title)}" style="top:${top}px;height:${h-2}px;left:calc(${l/n*100}% + 2px);width:calc(${100/n}% - 4px)"><span class="ev-n">${esc(evTitle(e))}${multi()?` · ${esc(e.who[0])}`:''}</span><span class="ev-t">${e.start}–${e.end}</span></button>`;}).join('')}${c.day===TODAY&&mins(NOW)>=H0*60&&mins(NOW)<H1*60?`<div class="wnow" style="top:${nowTop}px"></div>`:''}</div>`).join('')}</div></section>`;}
// Den: časová mřížka a vedle stručný program dne.
function dayAgenda(day){const ev=evsOn(day),top=[...celChips(day),...taskOn(day).map(taskChip)];
  return `<section class="card cd-agenda"><h3 class="sec-t">Program</h3>${ev.length?ev.map(e=>{const c=e.contact&&contact(e.contact);return `<button class="cd-ag ${evPast(e)?'past':''} ${kindCls(e.type)}" data-a="calopen" data-id="${e.id}"><span class="cd-ag-t">${e.start}</span><i class="evd"></i><span class="spacer"><span class="med">${esc(evTitle(e))}</span>${c||e.place?`<span class="small mute">${esc([e.type,e.place].filter(Boolean).join(' · '))}</span>`:`<span class="small mute">${e.type}</span>`}</span>${e.status==='Neuskutečněná'?'<span class="badge b-red">Neuskutečněná</span>':''}</button>`;}).join(''):'<p class="mute">Žádné události</p>'}${top.length?`<h3 class="sec-t" style="margin-top:24px">Celý den</h3><div class="stack" style="gap:4px">${top.join('')}</div>`:''}</section>`;}
const isOver=e=>e.date<TODAY||(e.date===TODAY&&mins(e.end)<mins(NOW));
const PER=[['next','Nadcházející','',e=>!isOver(e)&&e.status==='Naplánovaná'],['todo','Bez výsledku','amb',e=>isOver(e)&&e.status==='Naplánovaná'],['done','Proběhlé','grn',e=>e.status==='Proběhlá'],['no','Neuskutečněné','red',e=>e.status==='Neuskutečněná']];
function listView(){const s=calUi(),q=normStr(s.q);if(!PER.some(p=>p[0]===s.per))s.per='next';
  const base=events().filter(e=>s.types[e.type]&&evIn(e)&&(!q||normStr(e.title+' '+(e.place||'')).includes(q)));const P=PER.find(p=>p[0]===s.per);
  const key=e=>e.date+pad2(mins(e.start)/60|0)+pad2(mins(e.start)%60);const list=base.filter(P[3]).sort((a,b)=>(s.per==='next'?1:-1)*key(a).localeCompare(key(b)));
  const pages=Math.max(1,Math.ceil(list.length/s.size));if(s.page>=pages)s.page=pages-1;const pl=list.slice(s.page*s.size,(s.page+1)*s.size);
  const name=e=>{const c=e.contact&&contact(e.contact),t=evTitle(e);return c&&t===c.name?e.type:t;};
  const html=`<div class="grid g4" style="margin-bottom:16px">${PER.map(([k,l,col,f])=>{const n=base.filter(f).length;return `<button class="tile-t ${s.per===k?'on':''}" data-a="calper" data-v="${k}" aria-pressed="${s.per===k}"><b class="${n?col:''}">${n}</b><span>${l}</span></button>`;}).join('')}</div><div class="tbl-card">${pl.length?`<table class="tbl"><thead><tr><th>Termín</th><th>Událost</th><th>Kontakt</th><th>Kde</th>${multi()?'<th>Kdo</th>':''}<th>Stav</th></tr></thead><tbody>${pl.map(e=>{const c=e.contact&&contact(e.contact);return `<tr data-a="calopen" data-id="${e.id}"><td class="med ${e.date===TODAY?'tea':''}">${fmt(e.date)}, ${e.start}</td><td><span class="row cd-tt ${kindCls(e.type)}"><i class="evd"></i>${esc(name(e))}</span></td><td>${c?`<a href="#/kontakt/${c.id}/zakladni">${esc(c.name)}</a>`:'<span class="mute">—</span>'}</td><td>${esc(e.place||'—')}</td>${multi()?`<td>${who(e.who[0],false)}</td>`:''}<td><button class="st-btn" data-a="calstatus" data-id="${e.id}" aria-label="Změnit stav"><span class="badge ${({Naplánovaná:isOver(e)?'b-amb':'b-tea',Proběhlá:'b-grn',Neuskutečněná:'b-red'})[e.status]}">${isOver(e)&&e.status==='Naplánovaná'?'Bez výsledku':e.status}</span>${icN('arrow-down')}</button></td></tr>`;}).join('')}</tbody></table>`:`<div class="empty">${ic('calendar')}<h3>Nic tu není</h3></div>`}</div>`;
  return {html,foot:footer('cal-'+ME,pl.length,list.length,pages)};}
function viewCalendar(view){cdSeedEvents();if(!VIEWS.some(v=>v[0]===view))view='mesic';const s=calUi();s.people=s.people.filter(p=>calTeam().includes(p));if(!s.people.length)s.people=[ME];let body='',foot='';
  if(view==='mesic')body=monthView();
  if(view==='tyden'){const a=addD(s.date,-dow(s.date));body=timeGrid(Array.from({length:7},(_,i)=>addD(a,i)))+calLegend();}
  if(view==='den')body=`<div class="cd-day">${timeGrid([s.date],true)}${dayAgenda(s.date)}</div>`;
  if(view==='schuzky'){const l=listView();body=l.html;foot=l.foot;}
  return {nav:'kalendar',html:calHead(view)+body,foot,after:()=>{if(UI._fcal){const i=document.getElementById('calq');if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length);}UI._fcal=false;}}};}

function evForm(e){const isNew=!e.id;const s=calUi();const d=e.date||s.date;const tm=v=>`${pad2(mins(v)/60|0)}:${pad2(mins(v)%60)}`;
  modal(`<h2>${isNew?'Přidat událost':'Upravit událost'}</h2><div class="stack" style="margin-top:16px"><div class="field"><label for="et">Název *</label><input class="inp" id="et" value="${esc(e.title||'')}"><div class="err-t" id="ete"></div></div><div class="grid g2"><div class="field"><label for="ey">Typ</label><select class="inp" id="ey">${Object.keys(EV_TYPES).map(x=>`<option ${x===(e.type||'Schůzka')?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label for="ed">Datum</label><input type="date" class="inp" id="ed" value="${d}"></div><div class="field"><label for="es">Od</label><input type="time" class="inp" id="es" value="${tm(e.start||'9:00')}"></div><div class="field"><label for="ee">Do</label><input type="time" class="inp" id="ee" value="${tm(e.end||'10:00')}"></div><div class="field"><label for="ew">Pro koho</label><select class="inp" id="ew">${userOpts((e.who&&e.who[0])||ME)}</select></div><div class="field"><label for="ec">Kontakt</label><select class="inp" id="ec" data-combo><option value="">Bez kontaktu</option>${DB.contacts.filter(c=>c.active).sort((a,b)=>csSort(a.name,b.name)).map(c=>`<option value="${c.id}" ${c.id===e.contact?'selected':''}>${esc(c.name)}</option>`).join('')}</select></div></div><div class="field"><label for="ep">Kde</label><input class="inp" id="ep" value="${esc(e.place||'')}"></div></div><div class="ft"><button class="btn" data-close>Zrušit</button><button class="btn pri" id="eg">${isNew?'Přidat':'Uložit'}</button></div>`);
  document.getElementById('eg').onclick=()=>{const t=document.getElementById('et'),st=document.getElementById('es').value,en=document.getElementById('ee').value;if(!t.value.trim()){t.classList.add('err');document.getElementById('ete').textContent='Vyplňte název.';t.focus();return;}if(!st||!en||mins(en)<=mins(st)){document.getElementById('ee').classList.add('err');toast('Konec musí být po začátku','','err');return;}
    const v={title:t.value.trim(),type:document.getElementById('ey').value,date:document.getElementById('ed').value,start:toT(mins(st)),end:toT(mins(en)),contact:document.getElementById('ec').value||null,place:document.getElementById('ep').value.trim()};const w=document.getElementById('ew').value;
    if(isNew){events().push({id:'e'+Date.now(),status:'Naplánovaná',who:[w],...v});toast('Událost je přidaná');}else{Object.assign(e,v);e.who=[w,...e.who.filter(x=>x!==w&&x!==e.who[0])];toast('Změny jsou uložené');}
    const S=calUi();S.date=v.date;if(!S.people.includes(w)&&calTeam().includes(w))S.people.push(w);if(!S.types[v.type])S.types[v.type]=true;save();closeLayer();render();};}
function evSetStatus(e,st){e.status=st;if(st==='Proběhlá'&&e.contact){const c=contact(e.contact);if(c){ensure(c);c.timeline.unshift({g:'14. září 2026',k:e.type,ic:EV_TYPES[e.type],b:'Proběhlo',d:fmt(e.date)+', '+e.start,t:e.title,x:e.place||'',who:ME});c.act=e.date;c.actType=e.type==='Hovor'?'call':'meet';}}save();}
// Popover vedle prvku (vpravo, když se nevejde, tak vlevo).
function calPop(el,html,w=320){const r=el.getBoundingClientRect();popover({getBoundingClientRect:()=>r},html,w);const p=layer().querySelector('.pop');if(!p)return;const ph=p.offsetHeight;let left=r.right+8;if(left+w>innerWidth-8)left=r.left-w-8;if(left<8)left=Math.max(8,Math.min(r.left,innerWidth-w-8));let top=r.top+scrollY;if(top+ph>scrollY+innerHeight-8)top=Math.max(scrollY+8,scrollY+innerHeight-ph-8);p.style.left=left+'px';p.style.top=top+'px';}
ACT.calopen=el=>{const e=events().find(x=>x.id===el.dataset.id);if(!e)return;const c=e.contact&&contact(e.contact),d=toD(e.date);const mine=e.who.includes(ME)||isMgr()||isAdmin();
  calPop(el,`<div class="evp ${kindCls(e.type)}"><div class="evp-h"><i class="evd"></i><span class="small mute">${e.type}</span><span class="spacer"></span>${mine?`<button class="more" data-a="caledit" data-id="${e.id}" aria-label="Upravit" data-tip="Upravit">${ic('edit-2','s16')}</button><button class="more" data-a="caldel" data-id="${e.id}" aria-label="Deaktivovat" data-tip="Deaktivovat">${ic('trash','s16')}</button>`:''}</div>
  <h3 class="evp-t">${esc(e.title)}</h3>
  <div class="evp-r">${ic('clock','s16')}<span>${WD[dow(e.date)]} ${d.getDate()}. ${d.getMonth()+1}. · ${e.start}–${e.end}</span></div>
  ${e.place?`<div class="evp-r">${ic('location','s16')}<span>${esc(e.place)}</span></div>`:''}
  ${c?`<div class="evp-r">${ic('user','s16')}<span><a href="#/kontakt/${c.id}/zakladni">${esc(c.name)}</a>${c.phone?` · <a data-a="call" data-v="${esc(c.phone)}" data-n="${esc(c.name)}">${esc(c.phone)}</a>`:''}</span></div>`:''}
  <div class="evp-r">${ic('people','s16')}<span class="row" style="flex-wrap:wrap;gap:8px">${e.who.map(w=>who(w,false)).join('')}</span></div>
  ${mine?`<div class="seg-w evp-st">${EV_STATES.map(st=>`<button class="${e.status===st?'on':''}" data-a="calsetst" data-id="${e.id}" data-v="${st}">${st}</button>`).join('')}</div>`:`<div class="evp-r"><span class="badge">${e.status}</span></div>`}</div>`,320);};
ACT.calsetst=el=>{const e=events().find(x=>x.id===el.dataset.id);if(!e||e.status===el.dataset.v)return;const old=e.status;evSetStatus(e,el.dataset.v);toast('Stav: '+e.status,()=>{e.status=old;save();});render();};
ACT.caldel=el=>{const e=events().find(x=>x.id===el.dataset.id);const i=events().indexOf(e);events().splice(i,1);save();closeLayer();toast('Událost je deaktivovaná',()=>{events().splice(i,0,e);save();});render();};
ACT.caledit=el=>evForm(events().find(x=>x.id===el.dataset.id));
ACT.calnew=el=>{const d=el.dataset.d,h=el.dataset.h;const e={date:d||undefined};if(h){e.start=h+':00';e.end=(+h+1)+':00';}evForm(e);};
ACT.calstep=el=>{const s=calUi(),v=el.dataset.view,n=+el.dataset.v;if(v==='mesic'){const d=toD(s.date);d.setDate(1);d.setMonth(d.getMonth()+n);s.date=toS(d);}else s.date=addD(s.date,v==='tyden'?7*n:n);render();};
ACT.caltoday=()=>{calUi().date=TODAY;render();};
ACT.calstate=el=>{const s=calUi();s.state=s.state===el.dataset.v?'':el.dataset.v;s.page=0;render();};
ACT.calper=el=>{const s=calUi();s.per=el.dataset.v;s.page=0;render();};
ACT.calq=el=>{const s=calUi();s.q=el.value;s.page=0;UI._fcal=true;clearTimeout(UI._calt);UI._calt=setTimeout(render,180);};
ACT.calday=(el,ev)=>{if(ev.target.closest('.ev,.madd,.ev-more,.mn'))return;calUi().date=el.dataset.d;go('#/kalendar/den');};
ACT.calgoday=el=>{calUi().date=el.dataset.d;go('#/kalendar/den');};
ACT.calmore=el=>{const day=el.dataset.d,d=toD(day);calPop(el,`<div class="evp"><div class="evp-h"><b>${WDL[dow(day)]} ${d.getDate()}. ${MONTHS2[d.getMonth()]}</b><span class="spacer"></span><a class="small" data-a="calgoday" data-d="${day}">Otevřít den</a></div><div class="cd-ml">${dayItems(day).join('')}</div></div>`,288);};
ACT.calstatus=el=>{const e=events().find(x=>x.id===el.dataset.id);openMenu(el,EV_STATES.map(st=>({t:st,ic:e.status===st?'tick-circle':null,fn:()=>{evSetStatus(e,st);toast('Stav: '+st);render();}})),200);};
// Filtr: typy událostí, narozeniny a svátky. Popover zůstane otevřený.
ACT.calfilter=el=>{const s=calUi();popover(el,`<div class="cd-f"><div class="over">Typy</div>${Object.keys(s.types).map(k=>`<label class="row cd-fi ${k==='Úkoly'?'':kindCls(k)}"><input type="checkbox" class="cb cb-s" data-a="caltype" data-on="change" data-k="${k}" ${s.types[k]?'checked':''}><i class="evd ${k==='Úkoly'?'evd-t':''}"></i>${k}</label>`).join('')}<hr><label class="row cd-fi"><input type="checkbox" class="cb cb-s" data-a="caltype" data-on="change" data-k="cel" ${s.cel?'checked':''}><i class="evd evd-c"></i>Narozeniny a svátky</label></div>`,240);};
ACT.caltype=el=>{const s=calUi();if(el.dataset.k==='cel')s.cel=el.checked;else s.types[el.dataset.k]=el.checked;s.page=0;render();const b=document.querySelector('[data-a=calfilter]');if(b)ACT.calfilter(b);};
ACT.calpeople=el=>{const s=calUi(),t=calTeam();popover(el,`<div class="cd-f"><div class="over">Čí kalendář</div>${t.map(id=>`<label class="row cd-fi"><input type="checkbox" class="cb cb-s" data-a="calperson" data-on="change" data-k="${id}" ${s.people.includes(id)?'checked':''}>${who(id,false)}${id===ME?' <span class="small mute">(já)</span>':''}</label>`).join('')}<hr><div class="row" style="gap:16px;padding:4px 8px"><a class="small" data-a="calppl" data-v="me">Jen můj</a><a class="small" data-a="calppl" data-v="all">Celý tým</a></div></div>`,256);};
const calPplRe=()=>{render();const b=document.querySelector('[data-a=calpeople]');if(b)ACT.calpeople(b);};
ACT.calperson=el=>{const s=calUi(),k=el.dataset.k;s.people=el.checked?[...new Set([...s.people,k])]:s.people.filter(x=>x!==k);if(!s.people.length)s.people=[ME];s.page=0;calPplRe();};
ACT.calppl=el=>{const s=calUi();s.people=el.dataset.v==='all'?calTeam():[ME];s.page=0;calPplRe();};
// Přetažení události na jiný den nebo hodinu
let dragEv=null;
document.addEventListener('dragstart',e=>{const x=e.target.closest&&e.target.closest('[data-ev]');if(!x)return;dragEv=x.dataset.ev;if(e.dataTransfer){e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',dragEv);}});
document.addEventListener('dragover',e=>{if(!dragEv)return;const t=e.target.closest('.mday,.wslot');document.querySelectorAll('.drop-on').forEach(x=>x.classList.remove('drop-on'));if(t){e.preventDefault();t.classList.add('drop-on');}});
document.addEventListener('drop',e=>{if(!dragEv)return;const t=e.target.closest('.mday,.wslot');if(!t)return;e.preventDefault();const ev=events().find(x=>x.id===dragEv);dragEv=null;if(!ev)return;const old={date:ev.date,start:ev.start,end:ev.end};const dur=mins(ev.end)-mins(ev.start);if(t.dataset.day)ev.date=t.dataset.day;else{const[d,h]=t.dataset.slot.split('|');ev.date=d;ev.start=h+':00';ev.end=toT(+h*60+dur);}save();toast(`Přesunuto: ${fmt(ev.date)}, ${ev.start}`,()=>{Object.assign(ev,old);save();});render();});
document.addEventListener('dragend',()=>{dragEv=null;document.querySelectorAll('.drop-on').forEach(x=>x.classList.remove('drop-on'));});

// „+3 další“, „+5 dalších“
const k_dalsi=n=>n>=5?'dalších':'další';
// Výběr kontaktu ze stovek záznamů: select[data-combo] dostane pole s našeptáváním (datalist). Hodnotu dál nese skrytý select.
function k_combo(sel){if(sel.dataset.cmb)return;sel.dataset.cmb=1;const opts=[...sel.options],did='k_dl'+Math.random().toString(36).slice(2,8);
  const dl=document.createElement('datalist');dl.id=did;dl.innerHTML=opts.filter(o=>o.value).map(o=>'<option value="'+esc(o.text)+'"></option>').join('');
  const inp=document.createElement('input');inp.className='inp k-combo';inp.setAttribute('list',did);inp.autocomplete='off';
  inp.placeholder=opts[0]&&!opts[0].value?opts[0].text+' – začněte psát':'Začněte psát';inp.value=sel.value&&sel.selectedOptions[0]?sel.selectedOptions[0].text:'';
  const lab=sel.id&&document.querySelector('label[for="'+sel.id+'"]')||sel.closest('.field')&&sel.closest('.field').querySelector('label');inp.setAttribute('aria-label',lab?lab.textContent.replace('*','').trim():'Kontakt');
  if(lab)lab.addEventListener('click',()=>inp.focus());
  sel.hidden=true;sel.after(inp,dl);
  const find=()=>opts.find(o=>o.value&&o.text===inp.value.trim());
  const sync=()=>{const o=find();const v=o?o.value:'';if(sel.value!==v){sel.value=v;sel.dispatchEvent(new Event('change',{bubbles:true}));}};
  inp.addEventListener('input',()=>{if(find()||!inp.value.trim())sync();});
  inp.addEventListener('change',()=>{if(!find())inp.value='';sync();});}
new MutationObserver(()=>document.querySelectorAll('select[data-combo]:not([data-cmb])').forEach(k_combo)).observe(document.body,{childList:true,subtree:true});
