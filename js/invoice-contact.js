// Faktury u kontaktu (návrh 28. 11. 2026, jen v prototypu): samostatná záložka Fakturace hned za Obchodem
// (rozhodnutí uživatelky 28. 11.: záložky logicky za sebou jsou lepší než dlouhá stránka). Vidí jen ten, kdo smí fakturovat.
function iContactCard(c){if(typeof canBillAny!=='function'||!canBillAny())return '';iSeed();
  const list=DB.invoices.filter(i=>i.contact===c.id&&iVisible(i)).sort((a,b)=>(b.issued||'9').localeCompare(a.issued||'9'));
  const todo=allEntries().filter(r=>r.st==='ready'&&canBillEntry(r)&&(bClient(r.t)||{}).id===c.id);
  const fix=DB.projects.filter(p=>!p.parent&&p.bMode==='pevna'&&!p.bInv&&p.contact===c.id&&canBillProj(p));
  const toBill=todo.reduce((a,r)=>a+eAmt(r.e,r.t,r.st),0)+fix.reduce((a,p)=>a+(+p.bPrice||0),0);
  const sum=f=>list.filter(f).reduce((a,i)=>a+iTot(i).total,0),cnt=f=>list.filter(f).length;
  const open=i=>['send','due','late'].includes(iSt(i));
  const tile=(v,l,sub,cl='')=>`<div class="stat"><b class="${cl}" style="font-size:16px;line-height:24px">${v}</b><span>${l}</span>${sub?`<div class="small mute" style="margin-top:4px">${sub}</div>`:''}</div>`;
  const rows=list.slice(0,8).map(i=>{const st=iSt(i),[l,bc]=IST[st];return `<tr data-go="#/faktura/${i.id}"><td class="med nw">${esc(iNo(i))}</td><td class="nw">${i.issued?fmt(i.issued):'—'}</td><td class="nw">${i.due?fmt(i.due):'—'}${st==='late'?`<div class="small red">${iDueTxt(i)}</div>`:''}</td><td class="num nw med">${bKc(iTot(i).total)}</td><td><span class="badge ${bc}">${l}</span></td><td style="width:48px"><button class="more" data-a="iprev" data-id="${i.id}" aria-label="Náhled faktury" data-tip="Náhled">${ic('eye','s16')}</button></td></tr>`;}).join('');
  return `<section class="iv-contact"><div class="card-head" style="margin:0 0 16px;justify-content:flex-end"><div class="r">${toBill?`<button class="btn pri" data-a="iqk" data-k="client" data-id="${c.id}">${ic('wallet-money','s16')}Vyfakturovat ${bKc(toBill)}</button>`:''}</div></div>
  <div class="grid g4" style="margin-bottom:16px">${tile(bKc(toBill),'K fakturaci',todo.length?bH(todo.reduce((a,r)=>a+r.e.min,0))+' práce':fix.length?'pevná cena':'nic nečeká')}${tile(bKc(sum(open)),'Neuhrazeno',cnt(open)+' '+(cnt(open)===1?'faktura':cnt(open)>1&&cnt(open)<5?'faktury':'faktur'))}${tile(bKc(sum(i=>iSt(i)==='late')),'Po splatnosti',cnt(i=>iSt(i)==='late')?cnt(i=>iSt(i)==='late')+' po splatnosti':'',cnt(i=>iSt(i)==='late')?'red':'')}${tile(bKc(sum(i=>iSt(i)==='paid')),'Uhrazeno celkem','')}</div>
  ${list.length?`<div class="tbl-card"><table class="tbl iv-tbl"><thead><tr><th>Číslo</th><th>Vystaveno</th><th>Splatnost</th><th class="num">Celkem s DPH</th><th>Stav</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>${list.length>8?`<a class="small" href="#/fakturace/faktury" data-a="icfilter" data-q="${esc(c.name)}">Všechny faktury (${list.length})</a>`:''}`:`<div class="card empty">${ic('wallet-money')}<h3>Zatím žádná faktura</h3>${toBill?'<p class="mute small">Práce k fakturaci je připravená, stačí kliknout na Vyfakturovat.</p>':''}</div>`}</section>`;}
ACT.icfilter=el=>{const s=ui('ilist',{});s.q=el.dataset.q;s.st='';s.page=0;};

