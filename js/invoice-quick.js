// Vyfakturovat rovnou (návrh 28. 11. 2026, jen v prototypu): z Výkazů času (výběr nebo jeden záznam),
// z projektu (detail, menu v seznamu), z úkolu (detail, menu) a ze záložky K fakturaci.
// Okno ukáže, co na fakturu půjde a co ne a proč (neúčtuje se, čeká na schválení, chybí odběratel, už vyfakturováno).
// - Čas ke schválení: kdo smí schvalovat, ho zahrne zaškrtnutím (tím ho schválí).
// - Úkoly bez kontaktu: vybere se odběratel, úkol se s ním propojí.
// - Více odběratelů: vznikne víc faktur najednou.

// Odkud brát záznamy
function iSrc(kind,id){const all=allEntries();
  if(kind==='task')return {keys:all.filter(r=>r.t.id===id).map(rk),fix:[],title:(task(id)||{}).title};
  if(kind==='proj'){const p=project(id),r=bCfg(p),ids=projTree(id);return {keys:all.filter(x=>ids.includes(x.t.project)).map(rk),fix:r&&!p.parent&&r.bMode==='pevna'&&!r.bInv?[r.id]:[],title:p.name};}
  if(kind==='client'){const c=contact(id);return {keys:all.filter(r=>r.st==='ready'&&(bClient(r.t)||{}).id===id).map(rk),fix:DB.projects.filter(p=>!p.parent&&p.bMode==='pevna'&&!p.bInv&&p.contact===id).map(p=>p.id),title:c&&c.name};}
  return {keys:[],fix:[],title:''};}
const iBillable=st=>['ready','wait','nocl'].includes(st);
// Tlačítko a položka menu „Vyfakturovat“ (jen kdo smí fakturovat a když je co)
function iCan(kind,id){if(!canBillAny())return false;const s=iSrc(kind,id);return s.fix.length>0||s.keys.map(rFind).some(r=>r&&iBillable(r.st)&&canBillEntry(r));}
const iBillBtn=(kind,id)=>iCan(kind,id)?`<button class="btn" data-a="iqk" data-k="${kind}" data-id="${id}">${ic('wallet-money','s16')}Vyfakturovat</button>`:'';
const iBillMenu=(kind,id)=>iCan(kind,id)?[{t:'Vyfakturovat',ic:'wallet-money',fn:()=>iQuick(iSrc(kind,id))}]:[];
ACT.iqk=el=>iQuick(iSrc(el.dataset.k,el.dataset.id));
ACT.pinv=el=>iQuick(iSrc('proj',el.dataset.id));

// Vytvoření faktury (koncept nebo vystavená)
function iCreate({c,rows,fixes,group,dueDays,draft}){const id='i'+Date.now()+Math.random().toString(36).slice(2,5),no=draft?'':iNext();
  const items=[...iItemsFrom(rows,group),...fixes.map(p=>({t:p.name+' – pevná cena',q:1,p:+p.bPrice||0,u:'ks'}))];
  const ds=rows.map(r=>r.e.date).sort();
  const i={id,no,contact:c,issued:draft?'':TODAY,due:draft?'':addDays(TODAY,+dueDays||14),paid:null,state:draft?'draft':'issued',items,by:ME,per:[ds[0]||'',ds[ds.length-1]||''],dueDays};
  DB.invoices.push(i);rows.forEach(r=>{if(draft)r.e.dr=id;else r.e.inv=no;});fixes.forEach(p=>p.bInv=draft?id:no);return i;}

function iQuick(src){UI.iq={keys:src.keys,fix:src.fix,title:src.title,incWait:true,cl:'',group:'ukol',dueDays:String(pv('org','invDue',14))};iqRender();}
function iqCalc(){const s=UI.iq,R=s.keys.map(rFind).filter(Boolean).map(r=>({...r,k:rk(r)}));
  const out={inv:[],fx:[],ne:[],noRight:[],waitNo:[],wait:[],nocl:[],ready:[]};
  R.forEach(r=>{if(r.st==='inv'||r.st==='drf')out.inv.push(r);else if(!canBillEntry(r))out.noRight.push(r);else if(r.st==='ne')out.ne.push(r);else if(r.st==='fix')out.fx.push(r);else if(r.st==='wait')(canApprove(r.e,r.t)?out.wait:out.waitNo).push(r);else if(r.st==='nocl')out.nocl.push(r);else out.ready.push(r);});
  const use=[...out.ready,...(s.incWait?out.wait:[]),...(s.cl?out.nocl:[])],g={};
  use.forEach(r=>{const cid=r.st==='nocl'?s.cl:(bClient(r.t)||{}).id;(g[cid]=g[cid]||{c:cid,rows:[],fixes:[]}).rows.push(r);});
  [...new Set([...s.fix,...out.fx.map(r=>bCfg(project(r.t.project)).id)])].map(project).filter(p=>p&&!p.bInv&&p.contact).forEach(p=>{(g[p.contact]=g[p.contact]||{c:p.contact,rows:[],fixes:[]}).fixes.push(p);});
  return {out,groups:Object.values(g).filter(x=>contact(x.c))};}
function iqRender(){const s=UI.iq,{out,groups}=iqCalc(),sum=a=>bH(a.reduce((x,r)=>x+r.e.min,0)),n=groups.length;
  const note=(a,t)=>a.length?`<li>${ic('info-circle','s16')}<span><b class="med">${sum(a)}</b> ${t}</span></li>`:'';
  const inv=g=>{const items=[...iItemsFrom(g.rows,s.group),...g.fixes.map(p=>({q:1,p:+p.bPrice||0}))],T=iTot({items}),c=contact(g.c);return `<div class="iq-inv"><div class="spacer"><div class="med">${esc(c.name)}</div><div class="small mute">${g.rows.length?`${g.rows.length} ${g.rows.length===1?'záznam':g.rows.length<5?'záznamy':'záznamů'} · ${sum(g.rows)}`:''}${g.rows.length&&g.fixes.length?' · ':''}${g.fixes.length?'pevná cena '+g.fixes.map(p=>esc(p.name)).join(', '):''}</div></div><b class="nw">${bKc(T.total)}</b><button class="more iq-pv" data-pv="${g.c}" aria-label="Náhled faktury" data-tip="Náhled">${ic('eye','s16')}</button></div>`;};
  modal(`<h2>Vyfakturovat</h2>${s.title?`<p class="small mute" style="margin-top:8px">${esc(s.title)}</p>`:''}<div class="stack" style="margin-top:16px">
    ${out.nocl.length?`<div class="field"><label for="iq-cl">Odběratel pro ${sum(out.nocl)} bez kontaktu</label><input class="inp" id="iq-cl" list="dl-cl" value="${s.cl?esc(contact(s.cl).name):''}" placeholder="Vyberte kontakt" autocomplete="off">${clientList()}<div class="small mute set-hint">Úkol se s kontaktem propojí. Když ho nevyberete, tento čas na fakturu nepůjde.</div></div>`:''}
    ${out.wait.length?`<label class="row" style="align-items:flex-start"><input type="checkbox" class="cb" id="iq-w" ${s.incWait?'checked':''}><span>Zahrnout i čas ke schválení (${sum(out.wait)})<span class="small mute" style="display:block">Vyfakturováním ho zároveň schválíte.</span></span></label>`:''}
    ${n?`<div><div class="small mute" style="margin-bottom:8px">${n===1?'Vznikne faktura':`Vzniknou ${n} ${(n<5?'faktury':'faktur')}, každá pro jednoho odběratele`}</div>${groups.map(inv).join('')}</div>`:`<div class="card empty" style="margin:0;padding:24px">${ic('info-circle')}<h3>Není co fakturovat</h3><p class="mute small">Podívejte se níž, proč.</p></div>`}
    ${[out.ne,out.fx,out.waitNo,out.inv,out.noRight].some(a=>a.length)||(out.nocl.length&&!s.cl)?`<ul class="iq-notes">${note(out.ne,'se neúčtuje (označené Neúčtovat nebo projekt bez účtování), na fakturu nepůjde.')}${note(out.fx,'je v projektu s pevnou cenou. Na fakturu jde cena projektu (pokud ještě není vyfakturovaná), ne hodiny.')}${note(out.waitNo,'čeká na schválení někým jiným.')}${!s.cl?note(out.nocl,'nemá odběratele.'):''}${note(out.inv,'už je na jiné faktuře.')}${note(out.noRight,'patří k projektům, které fakturuje někdo jiný.')}</ul>`:''}
    ${n?`<div class="grid g2"><div class="field"><label for="iq-g">Čas na faktuře</label><select class="inp" id="iq-g">${[['ukol','Po úkolech'],['projekt','Po projektech'],['jedna','Jedna položka']].map(([v,l])=>`<option value="${v}" ${s.group===v?'selected':''}>${l}</option>`).join('')}</select></div><div class="field"><label for="iq-d">Splatnost</label><select class="inp" id="iq-d">${['7','14','30'].map(v=>`<option value="${v}" ${s.dueDays===v?'selected':''}>${v} dní</option>`).join('')}</select></div></div>`:''}
  </div><div class="ft"><button class="btn" data-close>Zrušit</button>${n===1?`<button class="btn" id="iq-more">Upravit podrobně</button>`:''}<span class="spacer"></span>${n?`<button class="btn" id="iq-dr">${n>1?'Uložit koncepty':'Uložit koncept'}</button><button class="btn pri" id="iq-ok">${n>1?`Vystavit ${n} ${(n<5?'faktury':'faktur')}`:'Vystavit fakturu'}</button>`:''}</div>`,'iq-modal');
  const $=id=>document.getElementById(id);
  document.querySelectorAll('[data-pv]').forEach(b=>b.onclick=()=>{const g=groups.find(x=>x.c===b.dataset.pv);iPreview(iTmp(g.c,[...iItemsFrom(g.rows,s.group),...g.fixes.map(p=>({t:p.name+' – pevná cena',q:1,p:+p.bPrice||0,u:'ks'}))],s.dueDays),{back:iqRender});});
  if($('iq-cl'))$('iq-cl').onchange=e=>{const c=bContact(e.target.value.trim());s.cl=c?c.id:'';iqRender();};
  if($('iq-w'))$('iq-w').onchange=e=>{s.incWait=e.target.checked;iqRender();};
  if($('iq-g'))$('iq-g').onchange=e=>{s.group=e.target.value;iqRender();};
  if($('iq-d'))$('iq-d').onchange=e=>{s.dueDays=e.target.value;};
  const prep=()=>{groups.forEach(g=>g.rows.forEach(r=>{if(r.st==='wait')r.e.ok=true;if(r.st==='nocl'&&s.cl)r.t.contact=s.cl;}));};
  if($('iq-more'))$('iq-more').onclick=()=>{prep();const g=groups[0],ds=g.rows.map(r=>r.e.date).sort();UI.inew={c:g.c,od:ds[0]||'2026-01-01',do:ds[ds.length-1]||TODAY,proj:'',done:false,keys:g.rows.map(r=>r.k),fix:g.fixes.map(p=>p.id),extra:[],group:s.group,issued:TODAY,dueDays:s.dueDays};save();closeLayer();go('#/fakturace/nova');};
  const run=draft=>{prep();const made=groups.map(g=>iCreate({c:g.c,rows:g.rows,fixes:g.fixes,group:s.group,dueDays:s.dueDays,draft}));save();closeLayer();UI.iq=null;
    if(made.length===1){navRep('#/faktura/'+made[0].id);if(draft)toast('Koncept faktury je uložený');else setTimeout(()=>iSendDlg(made[0],true),60);return;}
    const L=ui('ilist',{});L.st=draft?'draft':'send';L.page=0;toast(draft?`Uloženo ${made.length} konceptů`:`Vystaveno: ${made.length}. Faktury čekají v K odeslání.`);go('#/fakturace/faktury');};
  if($('iq-dr'))$('iq-dr').onclick=()=>run(true);
  if($('iq-ok'))$('iq-ok').onclick=()=>run(false);}
