// Přehled: první obrazovka po přihlášení. Bez drobečků, hrdinský pruh + dlaždice + widgety.
const ACTIVITY=[6,9,4,7,11,0,0,8,12,5,9,6,0,0,3];
const ACTIVITY_DAYS=['31.8.','1.9.','2.9.','3.9.','4.9.','5.9.','6.9.','7.9.','8.9.','9.9.','10.9.','11.9.','12.9.','13.9.','14.9.'];
const PLAN_TARGET={AN:400000,JD:300000,TEAM:2000000};
const TEAM=['AN','PS','BS','TH','MK','RP'];
const money=n=>n.toLocaleString('cs-CZ').replace(/,/g,' ')+' Kč';
const taskContact=t=>t.contact?(contact(t.contact)||DB.contacts.find(c=>c.name===t.contact)):null;


function viewDashboard(){
  const mine=DB.tasks.filter(t=>isOn(t,ME)&&!t.done);
  const st=ui('dash',{view:isMgr()?'tym':'moje'});
  if(!isMgr())st.view='moje';
  return st.view==='tym'?dashManager():dashUser(mine);
}
function heroShell(title,lead,nextHtml,withSeg){
  const st=UI.dash;
  return `<section class="hero"><div><h1>${title}</h1>${withSeg?`<div class="tools"><div class="seg" role="tablist"><button class="${st.view==='moje'?'on':''}" data-a="dashview" data-v="moje">Moje</button><button class="${st.view==='tym'?'on':''}" data-a="dashview" data-v="tym">Tým</button></div></div>`:''}</div>${nextHtml}</section>`;
}
// Rozložení karet: pořadí, šířka (1 až 3 sloupce), skrytí. Pamatuje se pro každého uživatele a pohled zvlášť.
const DASH_ALL={moje:[['tasks',2],['schedule',1],['plan',1],['todo',1],['people',1],['activity',1],['recent',2]],tym:[['team',2],['attendance',1],['planTeam',1],['leader',1],['recent',1]]};
const DASH_DEF={moje:[['tasks',2],['schedule',1],['plan',1],['todo',1],['people',1]],tym:[['team',2],['attendance',1],['planTeam',1],['leader',1],['recent',1]]};
const DASH_NAME={tasks:'Moje úkoly',schedule:'Dnešní rozvrh',plan:'Můj plán',activity:'Moje aktivita',todo:'To-do list',recent:'Naposledy otevřené',people:'Koho dnes oslovit',team:'Můj tým',attendance:'Docházka dnes',planTeam:'Plán týmu',leader:'Plnění podle lidí'};
const DASH_MIN={team:2};
const dashKey=v=>ME+':'+v;
const dashLayout=v=>{DB.dashLayout=DB.dashLayout||{};const k=dashKey(v);if(!DB.dashLayout[k])DB.dashLayout[k]=DASH_DEF[v].map(x=>[...x]);return DB.dashLayout[k];};
const dashView=()=>UI.dash.view;
function dashTop(v){const edit=UI.dashEdit;const hidden=DASH_ALL[v].filter(d=>!dashLayout(v).some(x=>x[0]===d[0]));
  return `<div class="dash-top"><div class="row dash-date"><span>${dayName()} 14. 9. 2026${NAME_DAY.length?` · Svátek: ${esc(NAME_DAY.join(', '))}`:''}</span>${protoNow()}</div><div class="row">${edit?`${hidden.length?`<button class="btn" data-a="dashaddmenu">${ic('add','s16')}Přidat kartu</button>`:''}<button class="btn" data-a="dashreset">Obnovit výchozí</button><button class="btn pri" data-a="customize">Hotovo</button><button class="btn btn-x" data-a="dashcancel" aria-label="Zavřít beze změn" data-tip="Zavřít beze změn">${ic('close','s16')}</button>`:`<button class="btn" data-a="customize">${ic('setting-4','s16')}Přizpůsobit</button>`}</div></div>`;}
function dashGrid(v,cards){const edit=UI.dashEdit,l=dashLayout(v);
  return `<div class="dgrid ${edit?'editing':''}">${l.map(([k,w],i)=>`<div class="dcell w${w} ${edit?'edit':''}" data-k="${k}" ${edit?'draggable="true"':''}>${(typeof cards[k]==='function'?cards[k](w):cards[k])}${edit?`<div class="dctl"><button data-a="dashmove" data-k="${k}" data-v="-1" ${i===0?'disabled':''} aria-label="Posunout dopředu" data-tip="Posunout dopředu">${icN('arrow-left-2')}</button><button data-a="dashmove" data-k="${k}" data-v="1" ${i===l.length-1?'disabled':''} aria-label="Posunout dozadu" data-tip="Posunout dozadu">${icN('arrow-right-2')}</button><span class="seg-w">${[1,2,3].filter(n=>n>=(DASH_MIN[k]||1)).map(n=>`<button class="${w===n?'on':''}" data-a="dashwidth" data-k="${k}" data-v="${n}" aria-label="Šířka ${n} ze 3">${n}/3</button>`).join('')}</span><button data-a="dashhide" data-k="${k}" aria-label="Skrýt kartu" data-tip="Skrýt kartu">×</button></div>`:''}</div>`).join('')}${l.length?'':`<div class="card empty" style="grid-column:span 3">${ic('task')}<h3>Žádné karty</h3><button class="btn" data-a="dashaddmenu">Přidat kartu</button></div>`}</div>`;}
const dashSave=()=>{save();render();};
const dashActs=()=>{
let dashSnap=null;
ACT.customize=()=>{dashSnap=UI.dashEdit?null:JSON.stringify(DB.dashLayout||{});UI.dashEdit=!UI.dashEdit;render();};
ACT.dashcancel=()=>{if(dashSnap!==null){DB.dashLayout=JSON.parse(dashSnap);save();}dashSnap=null;UI.dashEdit=false;render();};
ACT.dashmove=el=>{const l=dashLayout(dashView()),i=l.findIndex(x=>x[0]===el.dataset.k),j=i+(+el.dataset.v);if(j<0||j>=l.length)return;[l[i],l[j]]=[l[j],l[i]];dashSave();};
ACT.dashwidth=el=>{const c=dashLayout(dashView()).find(x=>x[0]===el.dataset.k);c[1]=+el.dataset.v;dashSave();};
ACT.dashhide=el=>{const v=dashView();DB.dashLayout[dashKey(v)]=dashLayout(v).filter(x=>x[0]!==el.dataset.k);dashSave();};
ACT.dashaddmenu=el=>{const v=dashView();const hid=DASH_ALL[v].filter(d=>!dashLayout(v).some(x=>x[0]===d[0]));openMenu(el,hid.map(d=>({t:DASH_NAME[d[0]],ic:'add',fn:()=>{dashLayout(v).push([...d]);dashSave();}})),240);};
ACT.dashreset=()=>{const v=dashView();DB.dashLayout[dashKey(v)]=DASH_DEF[v].map(x=>[...x]);dashSave();};
};
let dragK=null,dragUntil=0;
const dashCommit=()=>{const g=document.querySelector('.dgrid');if(!g)return;const v=dashView(),l=dashLayout(v);const order=[...g.querySelectorAll('.dcell')].map(c=>c.dataset.k);DB.dashLayout[dashKey(v)]=order.map(k=>l.find(x=>x[0]===k)).filter(Boolean);save();};
document.addEventListener('dragstart',e=>{const c=e.target.closest&&e.target.closest('.dcell.edit');if(!c)return;dragK=c.dataset.k;if(e.dataTransfer){e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',dragK);}requestAnimationFrame(()=>{c.classList.add('dragging');});});
document.addEventListener('dragover',e=>{if(!dragK)return;const g=e.target.closest('.dgrid');if(!g)return;e.preventDefault();if(e.dataTransfer)e.dataTransfer.dropEffect='move';if(Date.now()<dragUntil)return;const c=e.target.closest('.dcell.edit');if(!c||c.dataset.k===dragK)return;const me=g.querySelector('.dcell[data-k="'+dragK+'"]');const r=c.getBoundingClientRect();const before=e.clientX<r.left+r.width/2;const ref=before?c:c.nextElementSibling;if(ref===me||me.nextElementSibling===ref)return;const cells=[...g.querySelectorAll('.dcell')];const old=new Map(cells.map(x=>[x,x.getBoundingClientRect()]));g.insertBefore(me,ref);cells.forEach(x=>{const o=old.get(x),n=x.getBoundingClientRect();const dx=o.left-n.left,dy=o.top-n.top;if((dx||dy)&&x.animate)x.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:'none'}],{duration:180,easing:'ease-out'});});dragUntil=Date.now()+200;});
document.addEventListener('drop',e=>{if(dragK&&e.target.closest('.dgrid'))e.preventDefault();});
document.addEventListener('dragend',()=>{if(!dragK)return;dragK=null;dashCommit();render();});
function kpi(n,label,icon,color,bg,href,alert){const act=href.startsWith('@')?`href="#/ukoly" data-a="kpitasks" data-v="${href.slice(1)}"`:`href="${href}"`;return `<a class="kpi" ${act}><span class="ring" style="background:var(--${bg});color:var(--${color})">${ic(icon,'s24')}</span><div><b style="color:var(--${n===0?'n900':color})">${n}</b><span ${alert&&n>0?'class="red"':''}>${label}</span></div></a>`;}

// Teď je na řadě: systém vybírá podle pravidel (deník 6. 11. 2026).
// 1) událost s pevným časem, která probíhá nebo začne do 30 min, 2) úkoly po termínu (nejdéle, priorita, hodnota obchodu),
// 3) dnešní úkoly s časem, pak bez času, 4) úkol, který se nevejde do volného okna před další událostí, jde až za ni.
const TASK_MIN={Hovor:15,'E-mail':15,Administrativa:15,'Materiál':15,Dokument:45,Kontrola:30,Realizace:30};
const estMin=t=>+t.est||TASK_MIN[t.cat]||30;
const fmtMin=n=>n<60?n+' min':Math.floor(n/60)+' h'+(n%60?' '+n%60+' min':'');
const dealOf=cid=>cid?DB.deals.filter(x=>x.contact===cid&&x.state==='open').sort((a,b)=>b.value-a.value)[0]:null;
const daysLate=t=>Math.round((new Date(TODAY)-new Date(t.due))/864e5);
const PRIO={'Vysoká':0,'Střední':1,'Nízká':2};
function nextQueue(mine){
  const now=mins(NOW),snz=UI.nextSnooze||[];
  const evs=DB.events.filter(e=>e.date===TODAY&&e.who.includes(ME)&&e.status==='Naplánovaná'&&mins(e.end)>now).sort((a,b)=>mins(a.start)-mins(b.start));
  const nextEv=evs.find(e=>mins(e.start)>now),gap=nextEv?mins(nextEv.start)-now:Infinity;
  const ev=e=>({k:'ev',e,id:e.id,on:mins(e.start)<=now,in:mins(e.start)-now});
  const val=t=>{const c=taskContact(t),x=c&&dealOf(c.id);return x?x.value:0;};
  const pr=t=>PRIO[t.prio]??1;
  const late=mine.filter(t=>bucket(t)==='late').sort((a,b)=>daysLate(b)-daysLate(a)||pr(a)-pr(b)||val(b)-val(a)||(taskContact(b)?1:0)-(taskContact(a)?1:0));
  const today=mine.filter(t=>bucket(t)==='today').sort((a,b)=>(a.time?mins(a.time):1e4)-(b.time?mins(b.time):1e4)||pr(a)-pr(b)||val(b)-val(a));
  const tasks=[...late,...today].map((t,i)=>({k:'task',t,id:t.id,late:bucket(t)==='late',first:i===0,fits:estMin(t)<=gap}));
  let q=[...evs.filter(e=>mins(e.start)-now<=30).map(ev),...tasks.filter(x=>x.fits),...evs.filter(e=>mins(e.start)-now>30).map(ev),...tasks.filter(x=>!x.fits)];
  // Odložený úkol se nabídne hned jako další, ne až na konci.
  const rest=q.filter(x=>!snz.includes(x.id)),sn=[...snz].reverse().map(id=>q.find(x=>x.id===id)).filter(Boolean);
  q=rest.length?[rest[0],...sn,...rest.slice(1)]:sn;
  return {q,nextEv,gap,snoozed:sn.length>0};
}
const qTitle=x=>x.k==='ev'?x.e.title:x.t.title;
const qWhen=x=>x.k==='ev'?(x.on?'probíhá':x.e.start):x.late?'po termínu':x.t.time||'dnes';
function nextThen(x){if(!x)return '';const inner=`<span>Pak</span><b>${esc(qTitle(x))}</b><em class="${x.k==='task'&&x.late?'red':''}">${qWhen(x)}</em>`;
  return x.k==='ev'?`<button class="next-then" data-a="calopen" data-id="${x.e.id}">${inner}</button>`:`<a class="next-then" href="#/ukol/${x.t.id}">${inner}</a>`;}
const snoozeBtn=id=>`<button class="btn" data-a="nextsnooze" data-id="${id}">Odložit</button>`;
function nextUp(mine){
  const {q,nextEv,gap,snoozed}=nextQueue(mine),x=q[0];
  if(!x)return nextDone();
  if(x.k==='ev'){const e=x.e,c=e.contact&&contact(e.contact),dl=c&&dealOf(c.id);
    const meta=x.on?`Probíhá do ${e.end}`:`Za ${fmtMin(x.in)} · ${e.start}–${e.end}`;
    return `<div class="next next-c fade-in" data-go="${c?`#/kontakt/${c.id}/zakladni`:'#/kalendar'}" role="link" tabindex="0" aria-label="Otevřít: ${esc(e.title)}"><span class="next-go">${icN('arrow-right-2')}</span><div class="next-l">Teď je na řadě</div><h3>${esc(e.title)}</h3><p class="next-m"><span class="${x.on||x.in<=30?'teal-t':''}">${meta}</span>${e.place?' · '+esc(e.place):''}</p><div class="acts">${c?`<a class="btn pri" href="#/kontakt/${c.id}/zakladni">${ic('user','s16')}Připravit se</a>`:''}${e.place==='Online'?`<button class="btn" data-a="joinmeet">${ic('video','s16')}Připojit se</button>`:''}<button class="btn" data-a="calopen" data-id="${e.id}">Detail</button></div>${nextThen(q[1])}</div>`;}
  const t=x.t,c=taskContact(t),dl=c&&dealOf(c.id),days=x.late?daysLate(t):0,est=estMin(t);
  const thenX=snoozed?q[1]:nextEv&&gap<=est+30&&q[0]!==q.find(y=>y.id===nextEv.id)?q.find(y=>y.id===nextEv.id):q[1];
  const ctx=c?c.name:t.project?project(t.project).name:'';
  return `<div class="next next-c fade-in" data-go="#/ukol/${t.id}" role="link" tabindex="0" aria-label="Otevřít úkol: ${esc(t.title)}"><span class="next-go">${icN('arrow-right-2')}</span><div class="next-l">Teď je na řadě</div><h3>${esc(t.title)}</h3><p class="next-m">${esc(ctx)}${ctx?' · ':''}<span class="${x.late?'red':''}">${x.late?(days===1?'1 den po termínu':days<5?days+' dny po termínu':days+' dní po termínu'):'Dnes'+(t.time?' '+t.time:'')}</span></p><p class="next-why">Zabere asi ${fmtMin(est)}</p><div class="acts">${c&&c.phone?`<button class="btn pri" data-a="call" data-v="${esc(c.phone)}" data-n="${esc(c.name)}">${ic('call','s16')}Zavolat</button>`:''}${c&&c.phone?'':`<a class="btn pri" href="#/ukol/${t.id}">Otevřít úkol</a>`}${q.length>1?snoozeBtn(t.id):''}</div>${nextThen(thenX)}</div>`;
}
function nextDone(){
  const tom=DB.tasks.filter(t=>isOn(t,ME)&&!t.done&&t.due&&t.due>TODAY).sort((a,b)=>a.due<b.due?-1:a.due>b.due?1:0)[0];
  const quiet=DB.contacts.filter(c=>c.active&&c.owner===ME&&c.act&&c.phone).sort((a,b)=>a.act<b.act?-1:1)[0];
  const qd=quiet?Math.round((new Date(TODAY)-new Date(quiet.act))/864e5):0;
  const when=tom?(()=>{const n=Math.round((new Date(tom.due)-new Date(TODAY))/864e5),[,m,dd]=tom.due.split('-');return n===1?'Zítra':+dd+'. '+(+m)+'.';})():'';
  return `<div class="next fade-in"><div class="next-l">Teď je na řadě</div><h3>Na dnes máte hotovo</h3>${tom?`<p class="next-m">${when} jako první: <a href="#/ukol/${tom.id}">${esc(tom.title)}</a></p>`:''}${quiet&&qd>=7?`<p class="next-why">Mezitím můžete oslovit: ${esc(quiet.name)}, ${qd} dní bez kontaktu</p>`:''}<div class="acts">${quiet&&qd>=7?`<button class="btn pri" data-a="call" data-v="${esc(quiet.phone)}" data-n="${esc(quiet.name)}">${ic('call','s16')}Zavolat</button>`:''}<a class="btn ${quiet&&qd>=7?'':'pri'}" href="#/ukoly">Všechny úkoly</a></div></div>`;
}
ACT.nextsnooze=el=>{const id=el.dataset.id;UI.nextSnooze=[...(UI.nextSnooze||[]).filter(i=>i!==id),id];render();toast('Odloženo, nabídnu ho jako další',()=>{UI.nextSnooze=UI.nextSnooze.filter(i=>i!==id);render();});};
ACT.joinmeet=()=>toast('Prototyp: tady se otevře online schůzka');
// Prototyp: přepínač času. Mění čas v celém prototypu, pamatuje se v prohlížeči.
try{const t=localStorage.getItem('saver-proto-now');if(t)window.NOW=t;}catch(e){}
const greet=()=>{const m=mins(NOW);return m<600?'Dobré ráno':m<720?'Dobré dopoledne':m<1080?'Dobré odpoledne':'Dobrý večer';};
const nowPad=()=>NOW.padStart(5,'0');
ACT.protonow=el=>{if(!el.value)return;window.NOW=el.value.replace(/^0(\d)/,'$1');try{localStorage.setItem('saver-proto-now',NOW);}catch(e){}UI.nextSnooze=[];render();};
ACT.protonowreset=()=>{window.NOW='10:24';try{localStorage.removeItem('saver-proto-now');}catch(e){}UI.nextSnooze=[];render();};
const protoNow=()=>`<span class="proto-now" data-tip="Jen v prototypu: posuňte čas a sledujte kartu Teď je na řadě a rozvrh"><label for="pnow">Čas prototypu</label><input id="pnow" type="time" value="${nowPad()}" data-a="protonow" data-on="change">${NOW!=='10:24'?`<button data-a="protonowreset" aria-label="Vrátit 10:24" data-tip="Vrátit 10:24">${ic('refresh','s16')}</button>`:''}</span>`;
function taskMini(t){const c=taskContact(t),bk=bucket(t),ctx=c?c.name:t.project?project(t.project).name:'';const short=t.due?(()=>{const[,m,dd]=t.due.split('-');return +dd+'. '+(+m)+'.';})():'';
  return `<div class="tm-r" data-go="#/ukol/${t.id}"><div class="body"><a class="t" href="#/ukol/${t.id}">${esc(t.title)}</a>${ctx?`<div class="small mute">${esc(ctx)}</div>`:''}</div><span class="small ${bk==='late'?'red':'mute'} nowrap">${bk==='late'?short:t.time||'Dnes'}</span></div>`;}
function schedule(){
  const items=DB.events.filter(e=>e.date===TODAY&&e.who.includes(ME)).sort((x,y)=>mins(x.start)-mins(y.start));let nowDone=false,nextDone=false,out='';
  items.forEach(e=>{const past=evPast(e);if(!past&&!nowDone){out+=`<div class="now">Teď ${NOW}</div>`;nowDone=true;}const nx=!past&&!nextDone;if(nx)nextDone=true;
    out+=`<div class="sl sl-b ${kindCls(e.type)} ${past?'past':''} ${nx?'next-e':''}" data-a="calopen" data-id="${e.id}"><div class="${nx?'sb':'med'}"><span class="tm">${e.start}</span>${esc(e.title)}</div><div class="small mute" style="padding-left:48px">${esc(past&&e.status==='Proběhlá'?'Hotovo':e.place||'')}</div></div>`;});
  if(!nowDone&&items.length)out+=`<div class="now">Teď ${NOW}</div>`;
  const open=DB.tasks.filter(t=>isOn(t,ME)&&!t.done&&bucket(t)==='today').length;if(open)out+=`<a class="sl sl-b" href="#/ukoly" style="display:block;color:inherit"><div class="med"><span class="tm"></span>Úkoly k dokončení: ${open}</div></a>`;
  return `<section class="card"><div class="card-head"><h2>Dnešní rozvrh</h2><div class="r"><a class="small" href="#/kalendar">Kalendář</a></div></div>${out?`<div class="sched">${out}</div>`:'<p class="mute">Dnes nic</p>'}</section>`;
}
function gauge(got,neg,plan){const r=44,c=2*Math.PI*r,a=Math.min(got/plan,1),b=Math.min(neg/plan,1-a),gap=2/c;
  const dash=(f,offset,col)=>`<circle cx="56" cy="56" r="${r}" fill="none" stroke="${col}" stroke-width="12" stroke-linecap="butt" stroke-dasharray="${Math.max(f-gap,0)*c} ${c}" stroke-dashoffset="${-offset*c}" transform="rotate(-90 56 56)"/>`;
  return `<svg width="112" height="112" viewBox="0 0 112 112" role="img" aria-label="Získáno ${Math.round(a*100)} % plánu, rozjednáno dalších ${Math.round(b*100)} %"><circle cx="56" cy="56" r="${r}" fill="none" stroke="var(--g3,var(--n100))" stroke-width="12"/>${dash(a,0,'var(--g1,var(--dark))')}${dash(b,a,'var(--g2,var(--teal))')}<text x="56" y="56" text-anchor="middle" font-family="Poppins" font-weight="600" font-size="24" fill="currentColor">${Math.round(a*100)} %</text><text x="56" y="72" text-anchor="middle" font-family="Poppins" font-size="12" fill="currentColor">plánu</text></svg>`;}
function planCard(title,p){const hide=DB.plan.hide;const v=n=>hide?'••• ••• Kč':money(n);
  return `<section class="card"><div class="card-head"><h2>${title}</h2><div class="r"><span class="small mute">Září 2026</span><button data-a="planhide" aria-label="${hide?'Zobrazit částky':'Skrýt částky'}" data-tip="${hide?'Zobrazit částky':'Skrýt částky, třeba při sdílení obrazovky'}">${ic(hide?'eye-slash':'eye')}</button></div></div><div class="gauge-w">${gauge(p.got,p.neg,p.plan)}<div class="stack" style="flex:1"><div class="lg-row"><i style="background:var(--g1,var(--dark))"></i><div>Získáno<b>${v(p.got)}</b></div></div><div class="lg-row"><i style="background:var(--g2,var(--teal))"></i><div>Rozjednáno<b>${v(p.neg)}</b></div></div><div class="lg-row"><i style="background:var(--g3,var(--n200))"></i><div>Plán<b>${v(p.plan)}</b></div></div></div></div></section>`;}
function activityCard(){const max=Math.max(...ACTIVITY);const total=ACTIVITY.reduce((a,b)=>a+b,0);
  return `<section class="card"><div class="card-head"><div><h2>Moje aktivita</h2><div class="sub-t">Za 14 dní</div></div><div class="r"><b style="font:600 24px/32px Poppins">${total}</b></div></div><div class="bars">${ACTIVITY.map((v,i)=>`<button class="${i===ACTIVITY.length-1?'tod':''}" data-tip="${ACTIVITY_DAYS[i]}: ${v?v+' aktivit':'bez aktivity'}" aria-label="${ACTIVITY_DAYS[i]}: ${v}"><i style="height:${v?Math.max(v/max*100,4):0}%"></i></button>`).join('')}</div><div class="bars-x"><span style="text-align:left">31. 8.</span><span style="text-align:right">dnes</span></div></section>`;}
function peopleCard(){const k=DB.contacts.find(c=>c.name==='Martin Kříž'),a=contact('anna'),f=DB.contacts.find(c=>c.name==='Lucie Černá');
  const row=(c,why,icon,cl)=>`<div class="person"><span class="kpi" style="padding:0;box-shadow:none;background:none"><span class="ring" style="width:32px;height:32px;background:var(--${cl}-bg);color:var(--${cl==="teal"?"teal-a":cl})">${ic(icon,'s16')}</span></span><div class="i"><a class="med" style="color:var(--n900)" href="#/kontakt/${c.id}/zakladni">${esc(c.name)}</a><div class="small mute">${why}</div></div><button class="btn" data-a="call" data-v="${esc(c.phone)}" data-n="${esc(c.name)}" aria-label="Zavolat ${esc(c.name)}">${ic('call','s16')}</button></div>`;
  return `<section class="card"><div class="card-head"><h2>Koho dnes oslovit</h2></div>${row(k,'Dnes má narozeniny','cake','cel')}${DB.contacts.filter(x=>x.active&&NAME_DAY.includes(x.first)).slice(0,2).map(x=>row(x,'Dnes má svátek','gift','cel')).join('')}${row(a,'Domluvený hovor 18. 9.','call','blue')}${row(f,'17 dní bez kontaktu','clock','teal')}</section>`;}
function recentCard(items){
  return `<section class="card"><div class="card-head"><h2>Naposledy otevřené</h2></div>${items.map(r=>`<div class="row" style="padding:4px 0"><span class="small mute" style="width:64px;flex:none">${esc(r.kind)}</span><a class="spacer" href="${r.href}" style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(r.label)}</a><span class="small mute nowrap">${esc(r.d)}</span></div>`).join('')}</section>`;}
const recentItems=()=>{const base=isMgr()?[{kind:'Projekt',label:'Prodej bytu Vinohrady',href:'#/projekt/p2/prehled',d:'dnes 8:50'},{kind:'Úkol',label:'Zajistit prohlídku bytu se zájemcem',href:'#/ukol/t11',d:'dnes 8:45'},{kind:'Uživatel',label:'Alena Novotná',href:'#/uzivatel/AN/prehled',d:'pá 11. 9.'},{kind:'Kontakt',label:'Petr Svoboda',href:'#/kontakty/osoby',d:'pá 11. 9.'}]:[{kind:'Kontakt',label:'Anna Nová',href:'#/kontakt/anna/zakladni',d:'dnes 8:40'},{kind:'Projekt',label:'Rekonstrukce kanceláří',href:'#/projekt/p1/prehled',d:'dnes 8:32'},{kind:'Dokument',label:'Smlouva 2026-014',href:'#/kontakt/anna/dokumenty',d:'pá 11. 9.'},{kind:'Úkol',label:'Objednat podlahové krytiny',href:'#/ukol/t1',d:'pá 11. 9.'}];
  const seen=new Set();return [...DB.recent,...base].filter(r=>!seen.has(r.href)&&seen.add(r.href)).slice(0,4);};

function dashUser(mine){
  const late=mine.filter(t=>bucket(t)==='late'),today=mine.filter(t=>bucket(t)==='today');
  const u=me();const first=u.name.split(' ')[0];const voc={Alena:'Aleno',Jana:'Jano',Petra:'Petro'}[first]||first;
  const meetings=DB.events.filter(e=>e.date===TODAY&&e.type==='Schůzka'&&e.who.includes(ME)&&!evPast(e)).length;
  const parts=[];if(late.length)parts.push(`<b>${late.length} ${late.length===1?'úkol':'úkoly'} po termínu</b>`);if(today.length)parts.push(`<b>${today.length} na dnes</b>`);
  const lead=(parts.length?`Máte ${parts.join(' a ')}. `:'Na dnes nemáte žádný úkol. ');
  const kp=`<div class="kpis">${kpi(late.length,'Úkoly po termínu','danger','red','red-bg','@late',1)}${kpi(today.length,'Úkoly na dnes','task-square','amber','amber-bg','@today')}${kpi(meetings,'Schůzky dnes','people','violet','violet-bg','#/kalendar/schuzky')}${kpi(celCount(),'Narozeniny a svátky','cake','cel','cel-bg','#/oslavy')}</div>`;
  const cards={tasks:`<section class="card"><div class="card-head"><h2>Moje úkoly</h2><div class="r"><button class="btn" data-a="newtask">${ic('add','s16')}Nový úkol</button></div></div>${late.length?`<div class="g-h red" style="margin:0"><i></i>Po termínu <em>· ${late.length}</em></div>${late.map(taskMini).join('')}`:''}${today.length?`<div class="g-h amb" style="margin:8px 0 0"><i></i>Dnes <em>· ${today.length}</em></div>${today.map(taskMini).join('')}`:''}${!late.length&&!today.length?`<div class="empty" style="padding:24px">${ic('tick-circle')}<h3>Na dnes máte hotovo</h3></div>`:''}<div style="margin-top:8px"><a href="#/ukoly">Zobrazit všechny úkoly</a></div></section>`,schedule:schedule(),plan:planCard('Můj plán',planFor([ME],planTarget(ME))),activity:activityCard(),todo:todoCard(),people:peopleCard(),recent:w=>w>=2?recentStrip(recentItems()):recentCard(recentItems())};
  return `<div class="dash">${dashTop('moje')}${heroShell(`${greet()}, ${voc}`,lead,nextUp(mine),isMgr())}${kp}${dashGrid('moje',cards)}</div>`;
}
const todos=()=>{DB.todos=DB.todos||{};if(!DB.todos[ME])DB.todos[ME]=[{id:'d1',t:'Poslat Anně shrnutí hovoru'},{id:'d2',t:'Zavolat účetní kvůli fakturám'},{id:'d3',t:'Objednat vizitky'},{id:'d4',t:'Zarezervovat zasedačku',done:true}];return DB.todos[ME];};
function todoCard(){const l=todos(),n=l.filter(x=>x.done).length;return `<section class="card"><div class="card-head"><h2>To-do list</h2><div class="r"><span class="small mute">${n} z ${l.length}</span></div></div>${l.map(x=>`<div class="todo ${x.done?'done':''}"><input type="checkbox" class="cb" data-a="todotoggle" data-id="${x.id}" aria-label="${esc(x.t)}" ${x.done?'checked':''}><span class="spacer">${esc(x.t)}</span><button class="td-del" data-a="tododel" data-id="${x.id}" aria-label="Odebrat">×</button></div>`).join('')}<input class="inp" id="todoin" style="margin-top:8px" placeholder="Přidat položku" aria-label="Přidat položku"></section>`;}
ACT.todotoggle=el=>{const x=todos().find(i=>i.id===el.dataset.id);x.done=el.checked;save();render();};
ACT.tododel=el=>{DB.todos[ME]=todos().filter(i=>i.id!==el.dataset.id);save();render();};
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='todoin'&&e.target.value.trim()){todos().unshift({id:'d'+Date.now(),t:e.target.value.trim()});save();render();const i=document.getElementById('todoin');if(i)i.focus();}});
function recentStrip(items){return `<section class="card"><div class="card-head"><h2>Naposledy otevřené</h2></div><div class="recent-s">${items.map(r=>`<a class="recent-i" href="${r.href}"><span class="small mute">${esc(r.kind)} · ${esc(r.d)}</span><span class="med">${esc(r.label)}</span></a>`).join('')}</div></section>`;}

function dashManager(){
  const open=DB.tasks.filter(t=>!t.done&&TEAM.some(id=>isOn(t,id)));
  const late=open.filter(t=>bucket(t)==='late'),today=open.filter(t=>bucket(t)==='today');
  const worst=TEAM.map(id=>[id,late.filter(t=>isOn(t,id)).length]).sort((a,b)=>b[1]-a[1])[0];
  const off=TEAM.filter(id=>['Dovolená','Offline'].includes(user(id).avail));
  const inWork=TEAM.length-off.length;
  const lead=`V týmu ${late.length===1?'je':late.length<5?'jsou':'je'} <b>${late.length} ${late.length===1?'úkol':late.length<5?'úkoly':'úkolů'} po termínu</b> a <b>${off.length} lidé mimo práci</b>. Radek Procházka dnes zatím nemá zápis docházky.`;
  const nx=worst&&worst[1]?`<div class="next next-c fade-in" data-a="teamtasks" data-id="${worst[0]}" role="link" tabindex="0"><span class="next-go">${icN('arrow-right-2')}</span><div class="next-l">Teď je na řadě</div><h3>${esc(user(worst[0]).name)} má ${worst[1]} ${worst[1]===1?'úkol':'úkoly'} po termínu</h3><p class="next-m">${esc(late.filter(t=>isOn(t,worst[0]))[0].title)}</p><div class="acts"><button class="btn pri" data-a="teamtasks" data-id="${worst[0]}">Zobrazit úkoly</button></div></div>`:`<div class="next fade-in"><div class="next-l">Teď je na řadě</div><h3>Tým nemá nic po termínu</h3><div class="acts"><a class="btn pri" href="#/dochazka">Otevřít docházku</a></div></div>`;
  const rows=TEAM.map(id=>{const u=user(id),t=open.filter(x=>isOn(x,id)),l=t.filter(x=>bucket(x)==='late').length,d=t.filter(x=>bucket(x)==='today').length,rest=t.length-l-d;
    const w=n=>n?`flex:${n}`:'display:none';
    return `<tr data-go="#/uzivatel/${id}/prehled"><td><span class="who">${av(id,'a32')}<span class="med">${esc(u.name)}</span></span></td><td>${availBadge(u.avail)}</td><td><div class="load" data-tip="Po termínu ${l}, dnes ${d}, ostatní ${rest}"><i style="${w(l)};background:var(--red)"></i><i style="${w(d)};background:var(--amber)"></i><i style="${w(rest)};background:var(--teal)"></i></div></td><td class="num ${l?'red sb':''}">${l}</td><td class="num">${d}</td><td class="num">${t.length}</td></tr>`;}).join('');
  const kp=`<div class="kpis">${kpi(late.length,'Úkoly týmu po termínu','danger','red','red-bg','@late',1)}${kpi(today.length,'Úkoly týmu na dnes','task-square','amber','amber-bg','@today')}${kpi(inWork,'V práci','tick-circle','green','green-bg','#/dochazka')}${kpi(off.length,'Mimo práci','sun-2','violet','violet-bg','#/dochazka')}</div>`;
  const att=typeof attTeamCard==='function'?attTeamCard():`<section class="card"><div class="card-head"><h2>Docházka dnes</h2><div class="r"><a class="small" href="#/dochazka">Docházka</a></div></div><div class="person"><span class="ring-s amb">${ic('clock','s16')}</span><div class="i"><div class="med">8:02 Pozdní příchod</div><div class="small mute">Barbora Sedláčková</div></div></div><div class="person"><span class="amb">${ic('danger','s16')}</span><div class="i"><div class="med">Bez příchodu</div><div class="small mute">Radek Procházka, zatím bez zápisu</div></div></div><div class="person"><span class="vio">${ic('sun-2','s16')}</span><div class="i"><div class="med">Dovolená</div><div class="small mute">Michal König, do 14. 9.</div></div></div><div class="person"><span class="amb">${ic('coffee','s16')}</span><div class="i"><div class="med">Přestávka</div><div class="small mute">Petra Svobodová</div></div></div><div class="person"><span class="tea">${ic('calendar-tick','s16')}</span><div class="i"><div class="med">Zítra zpět</div><div class="small mute">Michal König</div></div></div></section>`;
  const TEAM_GOT=TEAM.map(id=>[id,planFor([id],0).got]).sort((a,b)=>b[1]-a[1]);const maxG=Math.max(1,...TEAM_GOT.map(x=>x[1]));
  const leader=`<section class="card"><div class="card-head"><div><h2>Plnění podle lidí</h2><div class="sub-t">Získáno v září</div></div></div>${TEAM_GOT.map(([id,v])=>`<div class="hbar"><span>${esc(shortName(id))}</span><div class="tr" data-tip="${esc(user(id).name)}: ${DB.plan.hide?'skryto':money(v)}"><i style="width:${v/maxG*100}%"></i></div><span class="num" style="text-align:right">${DB.plan.hide?'•••':money(v)}</span></div>`).join('')}</section>`;
  const teamCard=`<section class="card"><div class="card-head"><h2>Můj tým</h2><div class="r"><a class="small" href="#/uzivatele">Všichni uživatelé</a></div></div><table class="team-t"><thead><tr><th>Jméno</th><th>Dostupnost</th><th>Vytížení</th><th class="num">Po termínu</th><th class="num">Dnes</th><th class="num">Otevřené</th></tr></thead><tbody>${rows}</tbody></table></section>`;
  const cards={team:teamCard,attendance:att,planTeam:planCard('Plán týmu',planFor(TEAM,PLAN_TARGET.TEAM)),leader,recent:w=>w>=2?recentStrip(recentItems()):recentCard(recentItems())};
  return `<div class="dash">${dashTop('tym')}${heroShell(greet()+', Jano',lead,nx,true)}${kp}${dashGrid('tym',cards)}</div>`;
}

dashActs();
ACT.kpitasks=el=>{const s=ui('tasks',{});s.view=UI.dash&&UI.dash.view==='tym'?'tym':'moje';s.project='';s.who='';ui('tb',{only:'',showDone:false}).only=el.dataset.v;go('#/ukoly');};
ACT.dashview=el=>{UI.dash.view=el.dataset.v;render();};
ACT.planhide=()=>{DB.plan.hide=!DB.plan.hide;save();render();};
// Klik na číslo opravdu vytočí (tel:) a zároveň nabídne zapsat, jak hovor dopadl. Výchozí je Dovoláno.
ACT.call=el=>{const n=el.dataset.n,v=el.dataset.v;try{const a=document.createElement('a');a.href='tel:'+String(v).replace(/\s/g,'');a.click();}catch(e){}
  modal(`<h2>Jak hovor dopadl?</h2><p class="mute">${esc(n)} · ${esc(v)}</p><p class="small mute" style="margin-top:8px">Hovor se vytáčí v telefonu nebo v aplikaci pro volání. Až skončí, zapište výsledek.</p><div class="stack" style="margin-top:16px"><div class="field"><label for="cr">Výsledek</label><select class="inp" id="cr">${CALL_RES.map(x=>`<option>${x}</option>`).join('')}</select></div><div class="field"><label for="cn">Poznámka k hovoru</label><textarea class="inp" id="cn" placeholder="Co jste domluvili?"></textarea></div></div><div class="ft"><button class="btn" data-close>Nezapisovat</button><button class="btn pri" data-a="callsave" data-n="${esc(n)}">Zapsat do časové osy</button></div>`);};
ACT.callsave=el=>{const c=DB.contacts.find(x=>x.name===el.dataset.n);if(c){const t=document.getElementById('cn').value||'Hovor bez poznámky';(c.timeline=c.timeline||[]).unshift({g:'14. září 2026',k:'Hovor',ic:'call',b:'Proběhlo',d:'14. 9. 2026, '+NOW,t:'Odchozí hovor: '+document.getElementById('cr').value,x:t,who:ME});c.act=TODAY;c.actType='call';c.called=TODAY;c.callRes=document.getElementById('cr').value;save();}closeLayer();toast('Hovor je zapsaný v časové ose');render();};
ACT.teamtasks=el=>{ui('tasks',{}).view='tym';UI.tasks.who=el.dataset.id;go('#/ukoly');};
