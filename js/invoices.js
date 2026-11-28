// Fakturace (návrh 28. 11. 2026, jen v prototypu, čeká na schválení). Navazuje na billing.js (výkazy, sazby, stavy času).
// - Záložka K fakturaci: co ještě není vyfakturované, po odběratelích (schválený čas a pevné ceny projektů).
// - Záložka Faktury: vystavené faktury podle stavu – Koncept, Před splatností, Po splatnosti, Uhrazeno, Stornováno.
// - Nová faktura: odběratel, vlastní období od–do, projekt, jen dokončené úkoly; vše je předvybrané, jde odebrat.
//   Faktura je vždy na kontakt. Vyfakturovaný čas se zamkne a znovu se nenabídne; storno ho uvolní.
// - Zálohy, dobropisy, cizí měny a pravidelná fakturace: odloženo (rozhodnutí 28. 11.).

const IST={draft:['Koncept',''],send:['K odeslání','b-amb'],due:['Před splatností','b-blu'],late:['Po splatnosti','b-red'],paid:['Uhrazeno','b-grn'],storno:['Stornováno','']};
EST.drf=['V konceptu faktury','b-vio'];
const iSt=i=>i.state==='draft'?'draft':i.state==='storno'?'storno':i.paid?'paid':i.due<TODAY?'late':!i.sent?'send':'due';
const iVatRate=()=>pv('org','invVatPayer',true)?+pv('org','invVat',21):0;
const iTot=i=>{const base=Math.round(i.items.reduce((a,x)=>a+x.q*x.p,0)),vat=Math.round(base*(i.vat!=null?i.vat:iVatRate())/100);return {base,vat,total:base+vat};};
const iDays=(a,b)=>Math.round((new Date(b)-new Date(a))/864e5);
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x.toISOString().slice(0,10);};
const iNo=i=>i.no||'Koncept';
const inv=id=>(DB.invoices||[]).find(i=>i.id===id);
const iDueTxt=i=>{const st=iSt(i);if(st==='late'){const d=iDays(i.due,TODAY);return `${d} ${d===1?'den':d<5?'dny':'dní'} po splatnosti`;}if(st==='due'||st==='send'){const d=iDays(TODAY,i.due);return d===0?'Splatná dnes':`Splatná za ${d} ${d===1?'den':d<5?'dny':'dní'}`;}if(st==='paid')return 'Uhrazeno '+fmt(i.paid);return '';};
const iNext=()=>{const f=pv('org','invFmt','FV-{RRRR}-{NNN}')||'FV-{RRRR}-{NNN}',y=TODAY.slice(0,4),[pre,post]=f.replace(/\{RRRR\}/g,y).split('{NNN}');if(post!==undefined){const n=Math.max(0,...DB.invoices.filter(i=>i.no&&i.no.startsWith(pre)&&i.no.endsWith(post)).map(i=>+i.no.slice(pre.length,i.no.length-post.length)||0))+1;return pre+String(n).padStart(3,'0')+post;}return pre+'001';};
const iVisible=i=>isAdmin()||bSolo()||i.by===ME;
const nDni=n=>n===1?'položka':n>1&&n<5?'položky':'položek';

// Položky z odpracovaného času: po úkolech, po projektech, nebo jedna souhrnná položka
function iItemsFrom(rs,g){const m=new Map();rs.forEach(r=>{const [rate]=eRate(r.e,r.t),p=r.t.project&&project(r.t.project);const t=g==='jedna'?'Odpracovaný čas':g==='projekt'?(p?p.name:'Ostatní práce'):r.t.title;const k=t+'|'+rate,x=m.get(k)||{t,q:0,p:rate,u:'h'};x.q+=bMin(r.e)/60;m.set(k,x);});
  return [...m.values()].map(x=>({...x,q:Math.round(x.q*100)/100}));}

// ---------- Ukázková data ----------
function iSeed(){bSeed();if(DB.invoices)return;DB.invoices=[];
  const byC={};allEntries().filter(r=>r.e.inv).forEach(r=>{const c=bClient(r.t);if(!c){delete r.e.inv;return;}(byC[c.id]=byC[c.id]||[]).push(r);});
  Object.entries(byC).forEach(([cid,rs],k)=>{const no=`FV-2026-${String(31+k).padStart(3,'0')}`;rs.forEach(r=>r.e.inv=no);
    DB.invoices.push({id:'i'+no,no,contact:cid,issued:'2026-09-01',due:'2026-09-15',paid:k===1?'2026-09-09':null,state:'issued',sent:k<2?'2026-09-01':null,items:iItemsFrom(rs,'ukol'),by:'PN',per:['2026-08-01','2026-08-31']});});
  const jav=(DB.contacts.find(c=>c.name==='Javor s.r.o.')||{}).id;
  const H=(no,cid,issued,due,paid,items,by='PN')=>{if(contact(cid))DB.invoices.push({id:'i'+no,no,contact:cid,issued,due,paid,state:'issued',sent:issued,items:items.map(([t,q,p,u])=>({t,q,p,u:u||'h'})),by});};
  H('FV-2026-024','zdvur','2026-07-01','2026-07-15','2026-07-12',[['Správa a konzultace – červen 2026',18,1300]]);
  H('FV-2026-026',jav,'2026-07-20','2026-08-03','2026-08-01',[['Rekonstrukce kanceláří – projektová příprava',12,1100]]);
  H('FV-2026-027','anna','2026-08-03','2026-08-17',null,[['Příprava smluvní dokumentace',6,1100]],'JD');
  H('FV-2026-028','kamila','2026-08-20','2026-09-03',null,[['Revize smlouvy o správě',4,1100]]);
  H('FV-2026-029','kolarova','2026-09-10','2026-09-24',null,[['Audit pojistných smluv – pevná cena',1,60000,'ks']]);
  const p4=project('p4');if(p4)p4.bInv='FV-2026-029';
  const f29=DB.invoices.find(i=>i.no==='FV-2026-029');if(f29)f29.sent=null;
  if(contact('nmedia'))DB.invoices.push({id:'idraft1',no:'',contact:'nmedia',issued:'',due:'',paid:null,state:'draft',items:[{t:'Marketingová kampaň Q4 – podklady',q:4,p:1200,u:'h'}],by:'PN'});
  DB.invoices.filter(i=>iSt(i)==='late').forEach(i=>{const c=contact(i.contact);DB.notifications.unshift({id:'ni'+i.id,m:`Faktura ${i.no} je ${iDays(i.due,TODAY)} dní po splatnosti · ${c?c.name:''} · ${bKc(iTot(i).total)}`,d:'dnes 7:00',k:'Fakturace',un:true,to:'bill',go:'#/faktura/'+i.id});});
  if(ME===SOLO)soloFix(DB);
  save();}

// K odeslání = vystavená, neuhrazená a ještě neodeslaná odběrateli
const iUnsent=i=>i.state==='issued'&&!i.paid&&!i.sent;
const iMatch=(i,k)=>iSt(i)===k;
// ---------- Fakturace: záložky ----------
const ITABS=[['faktury','Faktury'],['k-fakturaci','K fakturaci']];
function viewInvoices(tab){iSeed();if(!ITABS.some(t=>t[0]===tab))tab='faktury';
  if(!canBillAny())return {nav:'fakturace',html:`<div class="page-head">${ic('wallet-money','s32')}<h1>Fakturace</h1></div><div class="card empty">${ic('lock')}<h3>Fakturace vám není povolená</h3><p class="mute">Faktury vystavuje vlastník projektu nebo administrátor. Svůj odpracovaný čas najdete ve Výkazech času.</p><a class="btn" href="#/vykazy">Výkazy času</a></div>`};
  const todo=iTodo();
  const head=`<div class="crumbs">Fakturace</div><div class="page-head">${ic('wallet-money','s32')}<h1>Fakturace</h1><div class="acts">${isAdmin()?`<a class="btn" href="#/nastaveni/faktury">${ic('setting-2','s16')}Nastavení</a>`:''}<button class="btn pri fab" data-a="inew">${ic('add','s16')}Nová faktura</button></div></div><nav class="tabs">${ITABS.map(([k,l])=>`<a class="tab ${tab===k?'on':''}" href="#/fakturace/${k}" data-rep>${l}${k==='k-fakturaci'&&todo.length?` (${todo.length})`:''}</a>`).join('')}</nav>`;
  UI._foot_ilist='';const body=tab==='k-fakturaci'?iTodoView(todo):iListView();return {nav:'fakturace',html:head+body,foot:UI._foot_ilist};}

// Co čeká na vyfakturování: schválený čas a pevné ceny, po odběratelích
function iTodo(){const g={};const add=(cid)=>g[cid]=g[cid]||{c:contact(cid),rows:[],wait:0,fix:[]};
  allEntries().forEach(r=>{if(!canBillEntry(r))return;const c=bClient(r.t);if(!c)return;if(r.st==='ready')add(c.id).rows.push(r);if(r.st==='wait')add(c.id).wait+=r.e.min;});
  DB.projects.filter(p=>!p.parent&&p.bMode==='pevna'&&!p.bInv&&p.contact&&canBillProj(p)).forEach(p=>add(p.contact).fix.push(p));
  return Object.values(g).filter(x=>x.c&&(x.rows.length||x.fix.length)).map(x=>({...x,min:x.rows.reduce((a,r)=>a+r.e.min,0),amt:x.rows.reduce((a,r)=>a+eAmt(r.e,r.t,r.st),0)+x.fix.reduce((a,p)=>a+(+p.bPrice||0),0),old:x.rows.reduce((a,r)=>r.e.date<a?r.e.date:a,'9999')})).sort((a,b)=>b.amt-a.amt);}
function iTodoView(todo){const wait=todo.reduce((a,x)=>a+x.wait,0),sum=todo.reduce((a,x)=>a+x.amt,0),nocl=allEntries().filter(r=>r.st==='nocl'&&canBillEntry(r)).reduce((a,r)=>a+r.e.min,0);
  return `<p class="mute" style="margin-bottom:16px">Schválený odpracovaný čas a pevné ceny projektů, které ještě nejsou na žádné faktuře. Celkem <b class="med" style="color:var(--n900)">${bKc(sum)}</b> bez DPH.</p>
  ${wait?`<div class="banner" style="margin-bottom:16px">${ic('info-circle','s16')}<span class="spacer">${bH(wait)} čeká na schválení. Nabídne se k fakturaci, až ho schvalovatel potvrdí.</span><button class="btn" data-a="iwait" data-v="wait">Zobrazit</button></div>`:''}
  ${nocl?`<div class="banner" style="margin-bottom:16px">${ic('info-circle','s16')}<span class="spacer">${bH(nocl)} je u úkolů bez projektu i kontaktu, takže nemá odběratele. Doplňte kontakt, nebo ho vyfakturujte z Výkazů času.</span><button class="btn" data-a="iwait" data-v="nocl">Zobrazit</button></div>`:''}
  <div class="tbl-card"><table class="tbl iv-tbl iv-todo"><thead><tr><th>Odběratel</th><th>Co</th><th class="num">Čas</th><th class="num">Částka bez DPH</th><th>Nejstarší záznam</th><th></th></tr></thead><tbody>${todo.length?todo.map(x=>`<tr style="cursor:default"><td class="vk-w"><a href="#/kontakt/${x.c.id}/zakladni" class="med">${esc(x.c.name)}</a></td><td class="vk-w small">${[...new Set(x.rows.map(r=>{const p=r.t.project&&project(r.t.project);return p?bCfg(p).name:'Úkoly bez projektu';}))].map(esc).join(', ')}${x.fix.length?`${x.rows.length?'<br>':''}Pevná cena: ${x.fix.map(p=>esc(p.name)+(p.phase!=='Dokončeno'?` <span class="mute">(${esc(p.phase.toLowerCase())})</span>`:'')).join(', ')}`:''}${x.wait?`<div class="small amb">+ ${bH(x.wait)} ke schválení</div>`:''}</td><td class="num nw">${x.min?bH(x.min):'—'}</td><td class="num nw med">${bKc(x.amt)}</td><td class="nw">${x.old<'9999'?fmt(x.old):'—'}</td><td class="nw" style="text-align:right"><button class="btn pri" data-a="iqk" data-k="client" data-id="${x.c.id}">Vyfakturovat</button></td></tr>`).join(''):emptyRow(6,'Vše je vyfakturované.')}</tbody></table></div>`;}
ACT.iwait=el=>{const s=ui('vyk',{});s.st=el.dataset.v||'wait';s.per='all';s.page=0;go('#/vykazy');};

// Seznam faktur
function iListView(){const s=ui('ilist',{st:'',q:'',per:'all',od:'2026-09-01',do:TODAY,page:0,size:24});if(s.page==null)s.page=0;if(!s.size)s.size=24;
  const per=s.per==='own'?[s.od,s.do]:(bPeriods.find(x=>x[0]===s.per)||bPeriods[3]).slice(2);
  const base=DB.invoices.filter(iVisible).filter(i=>i.state==='draft'||(i.issued>=per[0]&&i.issued<=per[1]));
  const q=normStr(s.q||'');let list=base.filter(i=>!q||normStr(iNo(i)+' '+((contact(i.contact)||{}).name||'')).includes(q));
  const T=[['draft','Koncepty'],['send','K odeslání'],['due','Před splatností'],['late','Po splatnosti'],['paid','Uhrazeno']];
  const tiles=T.map(([k,l])=>{const it=list.filter(i=>iSt(i)===k),sum=it.reduce((a,i)=>a+iTot(i).total,0);return `<button class="stat ${s.st===k?'on':''}" data-a="isttile" data-v="${k}" aria-pressed="${s.st===k}"><b class="${k==='late'&&it.length?'red':''}" style="font-size:16px;line-height:24px">${it.length}</b><span>${l}</span><div class="small mute" style="margin-top:4px">${bKc(sum)}</div></button>`;}).join('');
  const ORD={draft:0,send:1,late:2,due:3,paid:4,storno:5};
  list.sort((a,b)=>ORD[iSt(a)]-ORD[iSt(b)]||(b.issued||'').localeCompare(a.issued||'')||(b.no||'').localeCompare(a.no||''));
  const act=i=>{const st=iSt(i),b=(v,l,pri)=>`<button class="btn ${pri?'pri':''} iv-act" data-a="iact" data-v="${v}" data-id="${i.id}">${l}</button>`;return st==='draft'?b('open','Dokončit'):st==='send'?b('send','Odeslat',1):st==='late'?b('remind','Upomínka'):st==='due'?b('paid','Uhrazeno'):'';};
  const row=i=>{const st=iSt(i),[l,c]=IST[st],cn=contact(i.contact);return `<tr data-go="#/faktura/${i.id}"><td class="med nw">${esc(iNo(i))}</td><td class="vk-w">${cn?esc(cn.name):'—'}</td><td class="num nw med">${bKc(iTot(i).total)}</td><td class="nw">${i.due?fmt(i.due):'—'}${st==='late'||st==='due'||st==='send'?`<div class="small ${st==='late'?'red':'mute'}">${iDueTxt(i)}</div>`:''}</td><td class="nw"><span class="badge ${c}">${l}</span>${st==='late'&&!i.sent?'<div class="small mute">Neodesláno</div>':''}</td><td class="nw iv-actc">${act(i)}</td><td class="nw"><button class="more" data-a="iprev" data-id="${i.id}" aria-label="Náhled faktury" data-tip="Náhled">${ic('eye','s16')}</button><button class="more" data-a="imenu" data-id="${i.id}" aria-label="Další akce">${ic('more','s16')}</button></td></tr>`;};
  const table=(rows,empty)=>`<div class="tbl-card"><table class="tbl iv-tbl iv-list"><thead><tr><th>Číslo</th><th>Odběratel</th><th class="num">Celkem s DPH</th><th>Splatnost</th><th>Stav</th><th></th><th style="width:96px"></th></tr></thead><tbody>${rows.length?rows.map(row).join(''):emptyRow(7,empty)}</tbody></table></div>`;
  const sel=(a,l,opts)=>`<label class="vk-f"><span class="small mute">${l}</span><select class="inp" data-a="${a}" data-on="change">${opts}</select></label>`;
  let body;
  if(s.st){const f=list.filter(i=>iSt(i)===s.st),pg=f.slice(s.page*s.size,(s.page+1)*s.size);body=table(pg,'Žádná faktura v tomto stavu.');UI._foot_ilist=f.length>s.size?footer('ilist',pg.length,f.length,Math.ceil(f.length/s.size)):'';}
  else{const todo=list.filter(i=>['draft','send','late'].includes(iSt(i))),rest=list.filter(i=>!todo.includes(i)),pg=rest.slice(s.page*s.size,(s.page+1)*s.size);
    body=`<h3 class="sec-t iv-sec">Čeká na vás <span class="mute">· ${todo.length}</span></h3><p class="small mute" style="margin:-8px 0 16px">Koncepty k dokončení, vystavené faktury k odeslání a faktury po splatnosti.</p>${table(todo,'Nic nečeká, vše je odeslané a v termínu.')}
    <h3 class="sec-t iv-sec" style="margin-top:32px">Ostatní faktury <span class="mute">· ${rest.length}</span></h3>${table(pg,'Žádné další faktury.')}`;UI._foot_ilist=rest.length>s.size?footer('ilist',pg.length,rest.length,Math.ceil(rest.length/s.size)):'';}
  return `<div class="grid g5 vk-tiles" style="margin-bottom:16px">${tiles}</div>
  <div class="vk-bar"><label class="vk-f"><span class="small mute">Hledat</span><input class="inp" id="k_iq" data-input="k_iq" value="${esc(s.q)}" placeholder="Číslo faktury nebo odběratel" autocomplete="off"></label>${sel('iper','Vystaveno',[...bPeriods,['own','Vlastní (od – do)']].map(([v,l])=>`<option value="${v}" ${s.per===v?'selected':''}>${v==='all'?'Kdykoli':l}</option>`).join(''))}${s.per==='own'?`<label class="vk-f vk-dt"><span class="small mute">Od</span><input class="inp" type="date" data-a="iod" data-on="change" value="${s.od}"></label><label class="vk-f vk-dt"><span class="small mute">Do</span><input class="inp" type="date" data-a="ido" data-on="change" value="${s.do}"></label>`:''}${sel('ist','Stav',[['','Všechny stavy'],...Object.entries(IST).map(([k,[l]])=>[k,l])].map(([v,l])=>`<option value="${v}" ${s.st===v?'selected':''}>${l}</option>`).join(''))}</div>
  ${body}`;}
ACT.isttile=el=>{const s=UI.ilist;s.st=s.st===el.dataset.v?'':el.dataset.v;s.page=0;render();};
ACT.ist=el=>{UI.ilist.st=el.value;UI.ilist.page=0;render();};ACT.iper=el=>{UI.ilist.per=el.value;UI.ilist.page=0;render();};
ACT.iod=el=>{UI.ilist.od=el.value;render();};ACT.ido=el=>{UI.ilist.do=el.value;render();};
ACT.k_iq=el=>{UI.ilist.q=el.value;UI.ilist.page=0;clearTimeout(UI._iqt);UI._iqt=setTimeout(()=>{render();const i=document.getElementById('k_iq');if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length);}},200);};
ACT.imenu=el=>{const i=inv(el.dataset.id),st=iSt(i),it=[{t:'Náhled',ic:'eye',fn:()=>iPreview(i)},{t:'Otevřít',ic:'arrow-right-2',fn:()=>go('#/faktura/'+i.id)}];
  if(st==='draft')it.push({t:'Vystavit fakturu',ic:'tick-circle',fn:()=>iIssue(i)},'-',{t:'Smazat koncept',ic:'trash',dng:1,fn:()=>iDelDraft(i)});
  if(['due','late','send'].includes(st))it.push({t:'Označit jako uhrazenou',ic:'tick-circle',fn:()=>iPaid(i)},{t:'Odeslat e-mailem',ic:'sms',fn:()=>iSend(i)});
  if(st==='late')it.push({t:'Poslat upomínku',ic:'notification',fn:()=>iRemind(i)});
  if(st!=='draft')it.push({t:'Stáhnout PDF',ic:'document-download',fn:()=>toast(`PDF faktury ${i.no} se stahuje`)});
  if(['due','late','send'].includes(st))it.push('-',{t:'Stornovat',ic:'close-circle',dng:1,fn:()=>iStorno(i)});
  if(st==='paid')it.push({t:'Zrušit úhradu',ic:'refresh',fn:()=>{const was=i.paid;i.paid=null;save();toast('Úhrada je zrušená',()=>{i.paid=was;save();render();});render();}});
  openMenu(el,it);};

// ---------- Akce s fakturou ----------
function iPaid(i){modal(`<h2>Označit jako uhrazenou</h2><p class="mute" style="margin-top:8px">${esc(i.no)} · ${bKc(iTot(i).total)}</p><div class="field" style="margin-top:16px"><label for="ip-d">Datum úhrady</label><input class="inp" type="date" id="ip-d" value="${TODAY}"></div><div class="ft"><button class="btn" data-close>Zrušit</button><button class="btn pri" id="ip-ok">Uložit</button></div>`);
  document.getElementById('ip-ok').onclick=()=>{i.paid=document.getElementById('ip-d').value||TODAY;save();closeLayer();toast(`Faktura ${i.no} je uhrazená`);render();};}
function iSend(i){iSendDlg(i);}
function iRemind(i){i.remind=TODAY;save();toast(`Upomínka k ${i.no} je odeslaná`);render();}
function iFree(i){allEntries().forEach(r=>{if(r.e.inv&&r.e.inv===i.no)delete r.e.inv;if(r.e.dr===i.id)delete r.e.dr;});DB.projects.forEach(p=>{if(p.bInv&&(p.bInv===i.no||p.bInv===i.id))delete p.bInv;});}
function iStorno(i){modal(`<h2>Stornovat fakturu ${esc(i.no)}?</h2><p class="mute" style="margin-top:8px">Faktura zůstane v seznamu jako stornovaná. Odpracovaný čas a pevné ceny z ní se znovu nabídnou k fakturaci.</p><div class="ft"><button class="btn" data-close>Zrušit</button><button class="btn danger" id="is-ok">Stornovat</button></div>`);
  document.getElementById('is-ok').onclick=()=>{iFree(i);i.state='storno';save();closeLayer();toast(`Faktura ${i.no} je stornovaná`);render();};}
function iDelDraft(i){iFree(i);DB.invoices.splice(DB.invoices.indexOf(i),1);save();toast('Koncept je smazaný');navRep('#/fakturace/faktury');}
function iIssue(i){const no=iNext(),c=contact(i.contact);i.no=no;i.state='issued';i.issued=TODAY;i.due=addDays(TODAY,+(i.dueDays||pv('org','invDue',14)));i.by=i.by||ME;
  allEntries().forEach(r=>{if(r.e.dr===i.id){r.e.inv=no;delete r.e.dr;}});DB.projects.forEach(p=>{if(p.bInv===i.id)p.bInv=no;});
  save();go('#/faktura/'+i.id);setTimeout(()=>iSendDlg(i,true),60);}
ACT.iact=el=>{const i=inv(el.dataset.id),v=el.dataset.v;({paid:iPaid,send:iSend,remind:iRemind,storno:iStorno,issue:iIssue,del:iDelDraft,open:x=>go('#/faktura/'+x.id)}[v])(i);};
ACT.imore=el=>ACT.imenu(el);

// ---------- Detail faktury ----------
function viewInvoice(id){iSeed();const i=inv(id);if(!i)return viewMissing('x');const st=iSt(i),[l,bc]=IST[st],c=contact(i.contact),T=iTot(i),o=orgS(),vr=i.vat!=null?i.vat:iVatRate();
  const acts=st==='draft'?`<button class="btn" data-a="iact" data-v="del" data-id="${i.id}">${ic('trash','s16')}Smazat koncept</button><button class="btn pri" data-a="iact" data-v="issue" data-id="${i.id}">Vystavit fakturu</button>`
    :`<button class="btn" data-a="ipdf" data-id="${i.id}">${ic('document-download','s16')}PDF</button>${(['due','late','send'].includes(st))&&!i.sent?`<button class="btn pri" data-a="iact" data-v="send" data-id="${i.id}">${ic('sms','s16')}Odeslat odběrateli</button>`:['due','late','send'].includes(st)?`${st==='late'?`<button class="btn" data-a="iact" data-v="remind" data-id="${i.id}">${ic('notification','s16')}Poslat upomínku</button>`:''}<button class="btn pri" data-a="iact" data-v="paid" data-id="${i.id}">${ic('tick-circle','s16')}Označit jako uhrazenou</button>`:''}<button class="more" data-a="imore" data-id="${i.id}" aria-label="Další akce">${ic('more')}</button>`;
  const stat=(v,lab,cl='',sub='')=>`<div class="stat"><b class="${cl}" style="font-size:16px;line-height:24px">${v}</b><span>${lab}</span>${sub?`<div class="small ${cl==='red'?'red':'mute'}" style="margin-top:4px">${sub}</div>`:''}</div>`;
  const ents=allEntries().filter(r=>(i.no&&r.e.inv===i.no)||r.e.dr===i.id);
  const addr=c&&(c.addresses||[]).find(a=>a.def)||c&&(c.addresses||[])[0];
  const party=(t,name,lines)=>`<div><div class="small mute">${t}</div><div class="med" style="margin-top:4px">${name}</div>${lines.filter(Boolean).map(x=>`<div class="small">${x}</div>`).join('')}</div>`;
  const hist=[i.issued&&[fmt(i.issued),`Vystavila ${esc((user(i.by)||{}).name||'')}`],...(i.log||[]).map(([d,t])=>[fmt(d),esc(t)]),i.sent&&!(i.log||[]).length&&[fmt(i.sent),'Odesláno e-mailem odběrateli'],i.remind&&[fmt(i.remind),'Odeslána upomínka'],i.paid&&[fmt(i.paid),'Uhrazeno'],i.state==='storno'&&['','Stornováno']].filter(Boolean);
  return {nav:'fakturace',html:`<div class="crumbs"><a href="#/fakturace/faktury">Fakturace</a><span>/</span>${esc(iNo(i))}</div><div class="ent-head"><div><h1 style="margin-bottom:0">${i.no?'Faktura '+esc(i.no):'Koncept faktury'}</h1><div class="row"><span class="badge ${bc}">${l}</span>${c?`<a class="small" href="#/kontakt/${c.id}/zakladni">${esc(c.name)}</a>`:''}</div></div><span class="spacer"></span>${acts}</div>
  <div class="grid g4" style="margin-bottom:16px">${stat(bKc(T.total),'Celkem s DPH','',`bez DPH ${bKc(T.base)}`)}${stat(i.due?fmt(i.due):'—','Splatnost',st==='late'?'red':'',iDueTxt(i))}${stat(i.issued?fmt(i.issued):'—','Vystaveno','',i.sent?'Odesláno e-mailem':'Zatím neodesláno')}${stat(st==='paid'?bKc(T.total):bKc(0),'Uhrazeno',st==='paid'?'grn':'',st==='paid'?'':`zbývá ${bKc(st==='storno'?0:T.total)}`)}</div>
  ${st==='draft'?`<div class="banner" style="margin-bottom:16px">${ic('info-circle','s16')}<span>Koncept zatím nemá číslo. Odpracovaný čas na něm je zarezervovaný a jinam se nenabídne.</span></div>`:''}
  ${(['due','late','send'].includes(st))&&!i.sent?`<div class="banner" style="margin-bottom:16px">${ic('info-circle','s16')}<span class="spacer">Faktura je vystavená, ale ještě jste ji neposlali odběrateli.</span><button class="btn" data-a="iact" data-v="send" data-id="${i.id}">Odeslat</button></div>`:''}
  <div class="ivp-wrap" data-a="iprev" data-id="${i.id}" title="Zobrazit celou fakturu">${iTemplate(i)}<span class="ivp-open">${ic('eye','s16')}Zobrazit celou</span></div>
  ${ents.length?`<section class="card"><div class="card-head"><h3 class="sec-t" style="margin:0">Odpracovaný čas na faktuře</h3><div class="r small mute">${ents.length} ${ents.length===1?'záznam':ents.length<5?'záznamy':'záznamů'} · ${bH(ents.reduce((a,r)=>a+r.e.min,0))}</div></div>${ents.slice(0,6).map(r=>`<div class="tlog">${av(r.e.who,'a32')}<span class="tlog-d mute small">${fmt(r.e.date)}</span><span class="med" style="width:88px;flex:none">${bH(r.e.min)}</span><span class="spacer small"><a href="#/ukol/${r.t.id}">${esc(r.t.title)}</a></span></div>`).join('')}${ents.length>6?`<p class="small mute" style="margin-top:8px">a dalších ${ents.length-6}</p>`:''}</section>`:''}
  ${iFlowCard(i)}`};}

// ---------- Nová faktura ----------
ACT.inew=el=>{const c=el.dataset.c||'';UI.inew={c,od:'2026-01-01',do:TODAY,proj:'',done:false,keys:null,fix:null,extra:[],group:'ukol',issued:TODAY,dueDays:String(pv('org','invDue',14))};go('#/fakturace/nova');};
ACT.pinv=el=>{const p=project(el.dataset.id),r=bCfg(p);UI.inew={c:r.contact,od:'2026-01-01',do:TODAY,proj:p.id,done:false,keys:null,fix:null,extra:[],group:'ukol',issued:TODAY,dueDays:String(pv('org','invDue',14))};go('#/fakturace/nova');};
function iNewRows(s){const P=s.proj?projTree(s.proj):null;return allEntries().filter(r=>r.st==='ready'&&canBillEntry(r)&&(bClient(r.t)||{}).id===s.c&&r.e.date>=(s.od||'0000')&&r.e.date<=(s.do||'9999')&&(!P||P.includes(r.t.project))&&(!s.done||r.t.done)).sort((a,b)=>a.e.date.localeCompare(b.e.date));}
const iNewFix=s=>DB.projects.filter(p=>!p.parent&&p.bMode==='pevna'&&!p.bInv&&p.contact===s.c&&canBillProj(p)&&(!s.proj||p.id===s.proj));
function viewInvNew(){iSeed();if(!canBillAny())return viewInvoices('faktury');
  const s=UI.inew||(UI.inew={c:'',od:'2026-01-01',do:TODAY,proj:'',done:false,keys:null,fix:null,extra:[],group:'ukol',issued:TODAY,dueDays:String(pv('org','invDue',14))});
  const c=contact(s.c),rows=c?iNewRows(s):[],fixes=c?iNewFix(s):[];
  const keys=s.keys||rows.map(rk),pick=rows.filter(r=>keys.includes(rk(r))),fixPick=fixes.filter(p=>!s.fix||s.fix.includes(p.id));
  const wait=c?allEntries().filter(r=>r.st==='wait'&&(bClient(r.t)||{}).id===s.c&&r.e.date>=s.od&&r.e.date<=s.do).reduce((a,r)=>a+r.e.min,0):0;
  const items=[...iItemsFrom(pick,s.group),...fixPick.map(p=>({t:p.name+' – pevná cena',q:1,p:+p.bPrice||0,u:'ks'})),...s.extra];
  const T=iTot({items}),vr=iVatRate(),todo=iTodo();
  const projs=c?DB.projects.filter(p=>!p.parent&&p.contact===c.id):[];
  const allOn=rows.length&&pick.length===rows.length;
  const pickC=`<section class="card"><h3 class="sec-t">Komu a za jaké období</h3><div class="vk-bar" style="margin-bottom:0"><label class="vk-f" style="flex:1 1 280px"><span class="small mute">Odběratel *</span><input class="inp" list="dl-cl" data-a="inc" data-on="change" value="${c?esc(c.name):''}" placeholder="Začněte psát název kontaktu" autocomplete="off">${clientList()}</label><label class="vk-f vk-dt"><span class="small mute">Od</span><input class="inp" type="date" data-a="infld" data-on="change" data-k="od" value="${s.od}"></label><label class="vk-f vk-dt"><span class="small mute">Do</span><input class="inp" type="date" data-a="infld" data-on="change" data-k="do" value="${s.do}"></label>${projs.length?`<label class="vk-f"><span class="small mute">Projekt</span><select class="inp" data-a="infld" data-on="change" data-k="proj"><option value="">Všechny projekty a úkoly</option>${projs.map(p=>`<option value="${p.id}" ${s.proj===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label>`:''}</div>
    <label class="row" style="margin-top:16px"><input type="checkbox" class="cb" data-a="infld" data-on="change" data-k="done" ${s.done?'checked':''}><span>Jen dokončené úkoly</span></label>
    ${!c&&todo.length?`<div style="margin-top:16px"><div class="small mute" style="margin-bottom:8px">Čeká na vyfakturování</div><div class="set-chips">${todo.slice(0,6).map(x=>`<button class="set-chip" data-a="incq" data-c="${x.c.id}">${esc(x.c.name)} <span class="mute">${bKc(x.amt)}</span></button>`).join('')}</div></div>`:''}</section>`;
  const timeC=c?`<section class="card"><div class="card-head"><h3 class="sec-t" style="margin:0">Odpracovaný čas</h3><div class="r small mute">${pick.length} z ${rows.length} · ${bH(pick.reduce((a,r)=>a+r.e.min,0))}</div></div>
    ${wait?`<div class="banner" style="margin-bottom:16px">${ic('info-circle','s16')}<span>${bH(wait)} v tomto období čeká na schválení, proto tu není.</span></div>`:''}
    ${rows.length?`<div class="tbl-card"><table class="tbl vk-tbl iv-pick"><thead><tr><th style="width:40px"><input type="checkbox" class="cb" data-a="inall" data-on="change" ${allOn?'checked':''} aria-label="Vybrat vše"></th><th>Datum</th><th>Kdo</th><th>Úkol</th><th class="num">Čas</th><th class="num">Částka</th></tr></thead><tbody>${rows.map(r=>{const k=rk(r),[rate]=eRate(r.e,r.t),p=r.t.project&&project(r.t.project);return `<tr style="cursor:default" class="${keys.includes(k)?'':'iv-off'}"><td class="vk-cb"><input type="checkbox" class="cb" data-a="inone" data-on="change" data-v="${k}" ${keys.includes(k)?'checked':''} aria-label="Zahrnout"></td><td class="nw vk-d">${fmt(r.e.date)}</td><td class="vk-k">${who(r.e.who,false)}</td><td class="vk-t vk-w"><a href="#/ukol/${r.t.id}" class="med">${esc(r.t.title)}</a>${r.t.done?' <span class="badge b-grn">Hotovo</span>':''}<div class="small mute">${p?esc(p.name):'Bez projektu'}${r.e.note?' · '+esc(r.e.note):''}</div></td><td class="num nw med vk-h">${bH(r.e.min)}</td><td class="num nw vk-a">${bKc(r.e.min/60*rate)}<div class="small mute">${bKc(rate)}/h</div></td></tr>`;}).join('')}</tbody></table></div>`:`<p class="mute">V tomto období není žádný schválený čas k fakturaci.</p>`}</section>`:'';
  const fixC=fixes.length?`<section class="card"><h3 class="sec-t">Pevné ceny projektů</h3>${fixes.map(p=>`<label class="row set-row"><input type="checkbox" class="cb" data-a="infix" data-on="change" data-v="${p.id}" ${fixPick.includes(p)?'checked':''}><span class="spacer">${esc(p.name)}<span class="small mute" style="display:block">${esc(p.phase)}${p.phase!=='Dokončeno'?' · projekt ještě není dokončený':''}</span></span><b>${bKc(+p.bPrice||0)}</b></label>`).join('')}</section>`:'';
  const extraC=c?`<section class="card"><div class="card-head"><h3 class="sec-t" style="margin:0">Další položky</h3><div class="r"><button class="btn" data-a="inadd">${ic('add','s16')}Přidat položku</button></div></div>${s.extra.length?s.extra.map((x,j)=>`<div class="row set-row"><span class="spacer">${esc(x.t)}<span class="small mute" style="display:block">${String(x.q).replace('.',',')} ${x.u} × ${bKc(x.p)}</span></span><b>${bKc(x.q*x.p)}</b><button class="more" data-a="inrm" data-i="${j}" aria-label="Odebrat">${ic('trash','s16')}</button></div>`).join(''):'<p class="mute small">Např. cestovné, materiál nebo jednorázová služba.</p>'}</section>`:'';
  const sumC=`<section class="card iv-side"><h3 class="sec-t">Faktura</h3>${c?`<div class="field"><label for="in-g">Odpracovaný čas na faktuře</label><select class="inp" id="in-g" data-a="infld" data-on="change" data-k="group">${[['ukol','Po úkolech'],['projekt','Po projektech'],['jedna','Jedna souhrnná položka']].map(([v,l])=>`<option value="${v}" ${s.group===v?'selected':''}>${l}</option>`).join('')}</select></div>
    <div class="grid g2" style="margin-top:16px"><div class="field"><label for="in-i">Vystaveno</label><input class="inp" type="date" id="in-i" data-a="infld" data-on="change" data-k="issued" value="${s.issued}"></div><div class="field"><label for="in-d">Splatnost</label><select class="inp" id="in-d" data-a="infld" data-on="change" data-k="dueDays">${['7','14','30'].map(v=>`<option value="${v}" ${s.dueDays===v?'selected':''}>${v} dní</option>`).join('')}</select></div></div>
    <div class="iv-prev">${items.length?items.map(x=>`<div class="row small"><span class="spacer">${esc(x.t)} <span class="mute">${String(x.q).replace('.',',')} ${x.u}</span></span><span class="nw">${bKc(x.q*x.p)}</span></div>`).join(''):'<p class="mute small">Zatím žádná položka.</p>'}</div>
    <div class="iv-sum"><div class="row"><span class="spacer mute">Základ</span><span>${bKc(T.base)}</span></div><div class="row"><span class="spacer mute">${vr?`DPH ${vr} %`:'Bez DPH'}</span><span>${bKc(T.vat)}</span></div><div class="row iv-total"><span class="spacer">Celkem</span><b>${bKc(T.total)}</b></div></div>
    <button class="btn" data-a="inprev" style="width:100%;justify-content:center;margin-top:16px" ${items.length?'':'disabled'}>${ic('eye','s16')}Náhled faktury</button><div class="err-t" id="in-e"></div><div class="iv-btns"><button class="btn" data-a="insave" data-v="draft" ${items.length?'':'disabled'}>Uložit koncept</button><button class="btn pri" data-a="insave" data-v="issue" ${items.length?'':'disabled'}>Vystavit fakturu</button></div>`:'<p class="mute">Nejdřív vyberte odběratele.</p>'}</section>`;
  return {nav:'fakturace',html:`<div class="crumbs"><a href="#/fakturace/faktury">Fakturace</a><span>/</span>Nová faktura</div><div class="page-head"><h1>Nová faktura</h1></div><div class="iv-new"><div class="iv-main">${pickC}${timeC}${fixC}${extraC}</div>${sumC}</div>`};}
const inReset=s=>{s.keys=null;s.fix=null;};
ACT.inc=el=>{const c=bContact(el.value.trim()),s=UI.inew;s.c=c?c.id:'';s.proj='';inReset(s);render();};
ACT.incq=el=>{const s=UI.inew;s.c=el.dataset.c;s.proj='';inReset(s);render();};
ACT.infld=el=>{const s=UI.inew,k=el.dataset.k;s[k]=el.type==='checkbox'?el.checked:el.value;if(['od','do','proj','done'].includes(k))inReset(s);render();};
ACT.inall=el=>{const s=UI.inew;s.keys=el.checked?null:[];render();};
ACT.inone=el=>{const s=UI.inew,all=iNewRows(s).map(rk),cur=s.keys||all;s.keys=el.checked?[...cur,el.dataset.v]:cur.filter(x=>x!==el.dataset.v);render();};
ACT.infix=el=>{const s=UI.inew,all=iNewFix(s).map(p=>p.id),cur=s.fix||all;s.fix=el.checked?[...cur,el.dataset.v]:cur.filter(x=>x!==el.dataset.v);render();};
ACT.inrm=el=>{UI.inew.extra.splice(+el.dataset.i,1);render();};
ACT.inadd=()=>sModal('Přidat položku',`<div class="field"><label for="ia-t">Název *</label><input class="inp" id="ia-t" placeholder="Např. Cestovné Brno – Praha"><div class="err-t" id="ia-e"></div></div><div class="grid g3"><div class="field"><label for="ia-q">Množství</label><input class="inp" id="ia-q" type="number" min="0" step="0.5" value="1"></div><div class="field"><label for="ia-u">Jednotka</label><select class="inp" id="ia-u"><option>ks</option><option>h</option><option>km</option></select></div><div class="field"><label for="ia-p">Cena za jednotku (Kč)</label><input class="inp" id="ia-p" type="number" min="0" step="10"></div></div>`,()=>{const t=document.getElementById('ia-t').value.trim(),q=+document.getElementById('ia-q').value,p=+document.getElementById('ia-p').value;if(!t||!(q>0)||!(p>0)){document.getElementById('ia-e').textContent='Vyplňte název, množství a cenu.';return false;}UI.inew.extra.push({t,q,p,u:document.getElementById('ia-u').value});},'Přidat');
ACT.insave=el=>{const s=UI.inew,c=contact(s.c);if(!c)return;const rows=iNewRows(s),keys=s.keys||rows.map(rk),pick=rows.filter(r=>keys.includes(rk(r))),fixes=iNewFix(s).filter(p=>!s.fix||s.fix.includes(p.id));
  const items=[...iItemsFrom(pick,s.group),...fixes.map(p=>({t:p.name+' – pevná cena',q:1,p:+p.bPrice||0,u:'ks'})),...s.extra];if(!items.length)return;
  const draft=el.dataset.v==='draft',id='i'+Date.now(),no=draft?'':iNext();
  const i={id,no,contact:c.id,issued:draft?'':s.issued||TODAY,due:draft?'':addDays(s.issued||TODAY,+s.dueDays||14),paid:null,state:draft?'draft':'issued',items,by:ME,per:[s.od,s.do],dueDays:s.dueDays};
  DB.invoices.push(i);pick.forEach(r=>{if(draft)r.e.dr=id;else r.e.inv=no;});fixes.forEach(p=>p.bInv=draft?id:no);
  UI.inew=null;save();if(draft)toast('Koncept faktury je uložený');navRep('#/faktura/'+id);if(!draft)setTimeout(()=>iSendDlg(i,true),60);};

// Stav záznamu času „V konceptu faktury“
const _eSt=eSt;eSt=function(e,t){if(e.dr&&!e.inv){const d=inv(e.dr);if(d&&d.state==='draft')return 'drf';}return _eSt(e,t);};

// ---------- Nastavení > Vydané faktury ----------
(()=>{const org=SSEC.find(g=>g.admin);const i=org.items.findIndex(x=>x[0]==='vykazy')+1;
  org.items.splice(i,0,['faktury','Vydané faktury','wallet-money','faktura číselná řada splatnost dph účet upomínka dodavatel']);
  SDESC.faktury='Jak vypadají a chovají se faktury, které vystavujete klientům. Údaje dodavatele se berou z Profilu organizace.';})();
SBODY.faktury=()=>sCard('Číslování a splatnost',`<div class="grid g3">${sInp('org','invFmt','Číselná řada','FV-{RRRR}-{NNN}','text','{RRRR} rok, {NNN} pořadí v roce.')}${sSel('org','invDue','Výchozí splatnost',[['7','7 dní'],['14','14 dní'],['30','30 dní']],'14')}${sInp('org','invBank','Bankovní účet','2900123456/2010')}</div>`)
  +sCard('DPH',`${swRow('org','invVatPayer','Jsme plátci DPH','',true).replace('data-k="invVatPayer"','data-k="invVatPayer" data-r="1"')}${pv('org','invVatPayer',true)?`<div class="grid g3" style="margin-top:16px">${sSel('org','invVat','Sazba DPH',[['21','21 %'],['12','12 %'],['0','0 %']],'21')}</div>`:''}`)
  +sCard('Upomínky',`${swRow('org','invRemind','Poslat upomínku automaticky','Odběrateli přijde e-mail, když faktura není uhrazená.',false).replace('data-k="invRemind"','data-k="invRemind" data-r="1"')}${pv('org','invRemind',false)?`<div class="grid g3" style="margin-top:16px">${sSel('org','invRemindDays','Kdy',[['3','3 dny po splatnosti'],['7','7 dní po splatnosti'],['14','14 dní po splatnosti']],'7')}</div>`:''}${swRow('org','invNotifyLate','Upozornit mě na fakturu po splatnosti','Přijde notifikace tomu, kdo fakturu vystavil.',true)}`)
  +sCard('Údaje dodavatele',`<p class="mute">Název, adresa, IČO a DIČ se na fakturu berou z <a href="#/nastaveni/organizace">Profilu organizace</a>.</p>`);
iSeed();
// Náhled ze stránky Nová faktura (před vystavením)
ACT.inprev=()=>{const s=UI.inew,rows=iNewRows(s),keys=s.keys||rows.map(rk),pick=rows.filter(r=>keys.includes(rk(r))),fixes=iNewFix(s).filter(p=>!s.fix||s.fix.includes(p.id));
  iPreview(Object.assign(iTmp(s.c,[...iItemsFrom(pick,s.group),...fixes.map(p=>({t:p.name+' – pevná cena',q:1,p:+p.bPrice||0,u:'ks'})),...s.extra],s.dueDays),{issued:s.issued||TODAY,due:addDays(s.issued||TODAY,+s.dueDays||14)}),{back:closeLayer});};
