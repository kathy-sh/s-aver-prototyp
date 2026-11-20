// Export & Import: tři záložky (Export, Import, Historie). Pravidla (limit upozornění vedení, formáty,
// kdo smí importovat, duplicity) nastavuje administrátor v Nastavení > Export a import.
// Návrh 16. 11. 2026 k posouzení, ve Figmě zatím není.

const XTABS=[['export','Export'],['import','Import'],['historie','Historie']];
const XLIM=()=>+(orgS().expLimit||100);
const xNum=n=>Number(n).toLocaleString('cs-CZ');
const xCnt={osoby:()=>864,organizace:()=>DB.contacts.filter(c=>c.type==='organizace').length+212,ukoly:()=>DB.tasks.length,obchody:()=>DB.deals?DB.deals.length:0,udalosti:()=>DB.events?DB.events.length:0,dochazka:()=>myReports().length+1,uzivatele:()=>DB.users.length};
// Co lze exportovat: klíč, název, ikona, popis, formáty, kdo to vidí
const XWHAT=()=>[
  ['osoby','Osoby','user','Kontakty fyzických osob',['xlsx','csv','vcf']],
  ['organizace','Organizace','buildings','Firmy a instituce',['xlsx','csv']],
  ['ukoly','Úkoly','task-square','Včetně projektů, termínů a řešitelů',['xlsx','csv']],
  ['obchody','Obchody','briefcase','Otevřené i uzavřené, s fázemi a částkami',['xlsx','csv']],
  ['udalosti','Události kalendáře','calendar','Schůzky, hovory a prohlídky',['ics','xlsx']],
  ...(isMgr()||isAdmin()?[['dochazka','Docházka','calendar-tick','Měsíční přehled týmu',['xlsx','csv']]]:[]),
  ...(isAdmin()?[['uzivatele','Uživatelé','people','Účty, role, týmy a pobočky',['xlsx','csv']]]:[])];
const XFMT={xlsx:'Excel (XLSX)',csv:'CSV',vcf:'vCard (do telefonu)',ics:'iCalendar (ICS)'};
const fmtOk=f=>({xlsx:'expXlsx',csv:'expCsv',vcf:'expVcf'}[f]?pv('org',{xlsx:'expXlsx',csv:'expCsv',vcf:'expVcf'}[f],true):true);
const myReports=()=>DB.users.filter(u=>u.boss===ME&&u.state!=='Neaktivní');
const isContact=k=>k==='osoby'||k==='organizace';
// Rozsah: kolik záznamů export obsáhne
function xScopeN(k,sc){const all=xCnt[k]();if(sc==='all')return all;if(sc==='team')return Math.round(all*0.42);return k==='osoby'?148:k==='organizace'?37:Math.max(1,Math.round(all*0.18));}

// Historie: ukázková data pro stránkování a pohled podle role
function xSeed(){if(DB.xfer)return;const W=['AN','TH','BS','JD','PS','MK','RP','PN','KB','LM'];const what=[['exp','osoby','xlsx'],['exp','ukoly','csv'],['imp','osoby','xlsx'],['exp','obchody','xlsx'],['exp','osoby','vcf'],['exp','udalosti','ics'],['imp','organizace','csv'],['exp','dochazka','xlsx'],['exp','organizace','csv']];
  DB.xfer=Array.from({length:38},(_,i)=>{const w=what[(i*7+2)%what.length],d=14-Math.floor(i/3),who=W[(i*5+1)%W.length],N={osoby:[148,36,230,12,864],organizace:[37,12],ukoly:[24,9,61],obchody:[18,42],udalosti:[56,12],dochazka:[7,6]},n=w[0]==='imp'?(w[1]==='osoby'?[212,48,95][i%3]:17):N[w[1]][i%N[w[1]].length];
    const st=w[0]==='imp'?(i===9?'undo':'done'):(d>=8?'ready':'expired');
    return {id:'x'+i,k:w[0],what:w[1],fmt:w[2],n,who,d:Math.max(1,d),t:`${String(16-(i%8)).padStart(2,'0')}:${String((i*17)%60).padStart(2,'0')}`,st,sens:w[0]==='exp'&&w[1]==='osoby'&&i%5===0,skip:w[0]==='imp'?i%3:0};});
  save();}
const xWhatName=k=>(XWHAT().find(x=>x[0]===k)||[k,{osoby:'Osoby',organizace:'Organizace',ukoly:'Úkoly',obchody:'Obchody',udalosti:'Události kalendáře',dochazka:'Docházka',uzivatele:'Uživatelé'}[k]||k])[1];
// Kdo co v historii vidí: uživatel své, nadřízený i svůj tým, administrátor všechno
const xVisible=x=>isAdmin()||x.who===ME||(isMgr()&&DB.users.some(u=>u.id===x.who&&u.boss===ME));
const impAllowed=()=>{const w=pv('org','impWho','mgr');return isAdmin()||(w==='mgr'&&isMgr())||w==='all';};

function viewExport(tab){xSeed();if(!XTABS.some(t=>t[0]===tab))tab='export';
  const head=`<div class="crumbs">Export & Import</div><div class="page-head">${ic('arrow-swap-horizontal','s32')}<h1>Export & Import</h1>${isAdmin()?`<div class="acts"><a class="btn" href="#/nastaveni/export">${ic('setting-2','s16')}Pravidla</a></div>`:''}</div><nav class="tabs">${XTABS.map(([k,l])=>`<a class="tab ${tab===k?'on':''}" href="#/export${k==='export'?'':'/'+k}" data-rep>${l}</a>`).join('')}</nav>`;
  const body=tab==='import'?xImport():tab==='historie'?xHistory():xExport();
  return {nav:'export',html:head+body};}

// ---------- Export ----------
function xExport(){const s=ui('xexp',{what:'osoby',sc:'mine',fmt:'xlsx',cols:'list',sens:false});const W=XWHAT();if(!W.some(w=>w[0]===s.what))s.what='osoby';
  const w=W.find(x=>x[0]===s.what),fmts=w[4].filter(fmtOk);if(!fmts.includes(s.fmt))s.fmt=fmts[0];
  const scopes=[['mine','Moje záznamy'],...(isMgr()||isAdmin()?[['team','Můj tým']]:[]),...(isAdmin()?[['all','Celá organizace']]:[])];if(!scopes.some(x=>x[0]===s.sc))s.sc='mine';
  if(s.what==='dochazka'&&s.sc==='mine')s.sc='team';
  const n=xScopeN(s.what,s.sc),big=isContact(s.what)&&n>XLIM();
  const list=W.map(([k,l,icn,d])=>`<label class="x-what ${s.what===k?'on':''}"><input type="radio" name="xw" value="${k}" data-a="xset" data-on="change" data-k="what" ${s.what===k?'checked':''}><span class="x-ic">${ic(icn,'s20')}</span><span class="spacer"><span class="med">${l}</span><span class="small mute" style="display:block">${d}</span></span></label>`).join('');
  const sel=(k,l,opts)=>`<div class="field"><label for="x-${k}">${l}</label><select class="inp" id="x-${k}" data-a="xset" data-on="change" data-k="${k}">${opts.map(([v,t])=>`<option value="${v}" ${String(s[k])===v?'selected':''}>${t}</option>`).join('')}</select></div>`;
  const sensBox=isContact(s.what)?`<label class="row" style="margin-top:16px"><input type="checkbox" class="cb" data-a="xset" data-on="change" data-k="sens" ${s.sens?'checked':''}><span>Zahrnout citlivé údaje (RČ, doklady, bankovní spojení)${isMgr()||isAdmin()?'':'<span class="small mute" style="display:block">Jen u kontaktů, kde jste hlavní správce.</span>'}</span></label>`:'';
  return `<div class="x-grid"><section class="card"><div class="card-head"><h2>Co exportovat</h2></div><div class="x-list">${list}</div></section>
  <section class="card"><div class="card-head"><h2>${esc(w[1])}</h2></div><div class="grid g3">${sel('sc','Rozsah',scopes.filter(x=>s.what!=='dochazka'||x[0]!=='mine'))}${sel('fmt','Formát',fmts.map(f=>[f,XFMT[f]]))}${s.fmt==='vcf'||s.fmt==='ics'?'':sel('cols','Sloupce',[['list','Jako v mém seznamu'],['all','Všechny sloupce']])}</div>${sensBox}
  ${big?`<div class="banner" style="margin-top:16px">${ic('info-circle','s16')}<span>Export nad ${xNum(XLIM())} kontaktů uvidí vedení.</span></div>`:''}
  <div class="x-foot"><span class="mute">${xNum(n)} ${n===1?'záznam':n<5&&n>1?'záznamy':'záznamů'}</span><button class="btn pri" data-a="xgo">${ic('export','s16')}Exportovat</button></div></section></div>`;}
ACT.xset=el=>{const s=UI.xexp,k=el.dataset.k;s[k]=el.type==='checkbox'?el.checked:el.value;render();};
ACT.xgo=()=>{const s=UI.xexp,n=xScopeN(s.what,s.sc);
  DB.xfer.unshift({id:'x'+Date.now(),k:'exp',what:s.what,fmt:s.fmt,n,who:ME,d:14,t:NOW,st:'ready',sens:isContact(s.what)&&s.sens,fresh:true});
  if(isContact(s.what)&&n>XLIM())DB.notifications.unshift({id:'n'+Date.now(),m:`${me().name} exportoval${me().g==='f'?'a':''} ${n} kontaktů`,d:'dnes '+NOW,k:'Export většího množství',un:true,to:'manager',go:'#/export/historie'});
  save();toast(`Export je připravený ke stažení`);location.hash='#/export/historie';};

// ---------- Import ----------
const XSTEPS=['Soubor','Sloupce','Kontrola','Hotovo'];
const XMAP=[['Jméno','Jana','first'],['Příjmení','Malá','last'],['E-mail','jana.mala@email.cz','email'],['Mobil','+420 604 112 908','phone'],['Firma','Stavby Morava s.r.o.','org'],['Město','Olomouc','city'],['Poznámka','Zájem o 3+kk','note'],['Zdroj','Veletrh','']];
const XFIELDS=[['','Nepřenášet'],['first','Křestní jméno'],['last','Příjmení'],['email','E-mail'],['phone','Telefon'],['org','Organizace (propojit)'],['city','Město'],['note','Poznámka'],['tags','Osobní štítek'],['rel','Vztah']];
const XROWS={nove:[['Jana Malá','jana.mala@email.cz','Olomouc'],['Petr Kos','p.kos@seznam.cz','Brno'],['Iveta Hrubá','—','Zlín'],['Marek Dub','marek.dub@firma.cz','Praha']],dup:[['Anna Nová','anna@example.cz','Shoda podle e-mailu'],['Hana Blažková','h.blazkova@example.cz','Shoda podle e-mailu'],['Petr Beneš','+420 725 681 989','Shoda podle telefonu']],err:[['Řádek 17','tomas.novak@','Neplatný e-mail'],['Řádek 42','—','Chybí příjmení i e-mail'],['Řádek 88','+420 12','Neplatný telefon'],['Řádek 143','—','Chybí příjmení i e-mail'],['Řádek 201','lucie@@mail.cz','Neplatný e-mail']]};
function xImport(){if(!impAllowed()){const boss=user(me().boss)||user('PN');return `<section class="card empty">${ic('lock','s32')}<h3>Import dělá administrátor nebo nadřízený</h3><p class="mute" style="margin:8px 0 16px">Pošlete soubor ${boss?esc(boss.name):'nadřízené'}, kontakty naimportuje za vás.</p><button class="btn" data-a="xask">Požádat o import</button></section>`;}
  const s=ui('ximp',{step:0,type:'osoby',file:null,map:{},dup:pv('org','impDup','merge'),owner:ME,tag:'Veletrh 2026',cons:'none',f:'nove'});
  const steps=`<ol class="x-steps">${XSTEPS.map((l,i)=>`<li class="${i<s.step?'done':i===s.step?'on':''}"><span class="x-n">${i<s.step?ic('tick-circle','s16'):i+1}</span>${l}</li>`).join('')}</ol>`;
  return steps+[xStep1,xStep2,xStep3,xStep4][s.step](s);}
ACT.xask=()=>{const b=user(me().boss)||user('PN');toast(`Žádost o import odeslána: ${b.name}`);};
function xStep1(s){const T=[['osoby','Osoby'],['organizace','Organizace'],['obchody','Obchody']];
  return `<section class="card"><div class="card-head"><h2>Co importujete</h2><div class="r"><a href="#" class="small x-link" data-a="xtpl">${ic('document-download','s16')}Stáhnout šablonu</a></div></div>
  <div class="seg seg-l" role="radiogroup" style="margin-bottom:16px">${T.map(([k,l])=>`<button class="${s.type===k?'on':''}" role="radio" aria-checked="${s.type===k}" data-a="ximpset" data-k="type" data-v="${k}">${l}</button>`).join('')}</div>
  ${s.file?`<div class="x-file">${ic('document','s24')}<span class="spacer"><span class="med">${esc(s.file)}</span><span class="small mute" style="display:block">235 řádků · 8 sloupců</span></span><button class="more" data-a="ximpset" data-k="file" data-v="" aria-label="Odebrat soubor" data-tip="Odebrat soubor">${ic('trash','s16')}</button></div>`
  :`<button class="x-drop" data-a="ximpset" data-k="file" data-v="kontakty-veletrh-2026.xlsx">${ic('document-upload','s32')}<span class="med">Přetáhněte soubor sem nebo vyberte z počítače</span><span class="small mute">Excel nebo CSV, nejvýš 5 000 řádků</span></button>`}
  <div class="x-foot"><span></span><button class="btn pri" data-a="ximpstep" data-v="1" ${s.file?'':'disabled'}>Pokračovat</button></div></section>`;}
function xStep2(s){const m=k=>s.map[k]!==undefined?s.map[k]:XMAP.find(x=>x[0]===k)[2];const n=XMAP.filter(x=>m(x[0])).length;const ok=XMAP.some(x=>m(x[0])==='last')||XMAP.some(x=>m(x[0])==='email');
  return `<section class="card"><div class="card-head"><h2>Přiřaďte sloupce</h2><div class="r"><span class="small mute">${n} z ${XMAP.length} sloupců se přenese</span></div></div>
  <div class="tbl-card"><table class="tbl x-map"><thead><tr><th>Sloupec v souboru</th><th>Ukázka</th><th>Pole v S-aver</th></tr></thead><tbody>${XMAP.map(([col,ex])=>`<tr style="cursor:default"><td class="med">${esc(col)}</td><td class="mute">${esc(ex)}</td><td><select class="inp ${m(col)?'':'x-skip'}" data-a="ximpmap" data-on="change" data-c="${esc(col)}" aria-label="Pole pro sloupec ${esc(col)}">${XFIELDS.map(([v,l])=>`<option value="${v}" ${m(col)===v?'selected':''}>${l}</option>`).join('')}</select></td></tr>`).join('')}</tbody></table></div>
  ${ok?'':`<div class="banner err" style="margin-top:16px">${ic('danger','s16')}<span>Přiřaďte aspoň Příjmení nebo E-mail.</span></div>`}
  <div class="x-foot"><button class="btn" data-a="ximpstep" data-v="0">Zpět</button><button class="btn pri" data-a="ximpstep" data-v="2" ${ok?'':'disabled'}>Pokračovat</button></div></section>`;}
function xStep3(s){const N={nove:212,dup:18,err:5};const dupL={skip:'Přeskočit',merge:'Doplnit chybějící údaje',new:'Vytvořit nový'};
  const tile=(k,l,cl)=>`<button class="stat stat-a x-tile ${s.f===k?'on':''}" data-a="ximpset" data-k="f" data-v="${k}" aria-pressed="${s.f===k}"><b class="${cl}">${N[k]}</b><span>${l}</span></button>`;
  const R=XROWS[s.f];const total=s.dup==='new'?N.nove+N.dup:N.nove;
  return `<div class="grid g3" style="margin-bottom:16px">${tile('nove','Nové kontakty','grn')}${tile('dup','Už v systému','')}${tile('err','S chybou, přeskočí se','red')}</div>
  <section class="card" style="margin-bottom:16px"><div class="tbl-card"><table class="tbl"><thead><tr><th>${s.f==='err'?'Řádek':'Jméno'}</th><th>${s.f==='err'?'Hodnota':'Kontakt'}</th><th>${s.f==='nove'?'Město':s.f==='dup'?'Proč':'Chyba'}</th></tr></thead><tbody>${R.map(r=>`<tr style="cursor:default"><td class="med">${esc(r[0])}</td><td>${esc(r[1])}</td><td class="${s.f==='err'?'red':''}">${esc(r[2])}</td></tr>`).join('')}</tbody></table></div>${N[s.f]>R.length?`<p class="small mute" style="margin-top:8px">a dalších ${N[s.f]-R.length}</p>`:''}</section>
  <section class="card"><div class="card-head"><h2>Jak importovat</h2></div><div class="grid g2">
   <div class="field"><label for="xi-dup">Když kontakt už existuje</label><select class="inp" id="xi-dup" data-a="ximpsel" data-on="change" data-k="dup">${Object.entries(dupL).map(([v,l])=>`<option value="${v}" ${s.dup===v?'selected':''}>${l}</option>`).join('')}</select></div>
   <div class="field"><label for="xi-own">Správce kontaktů</label><select class="inp" id="xi-own" data-a="ximpsel" data-on="change" data-k="owner">${(isMgr()||isAdmin()?[me(),...myReports()]:[me()]).map(u=>`<option value="${u.id}" ${s.owner===u.id?'selected':''}>${esc(u.name)}</option>`).join('')}</select></div>
   <div class="field"><label for="xi-tag">Osobní štítek pro tento import</label><input class="inp" id="xi-tag" data-a="ximpsel" data-on="change" data-k="tag" value="${esc(s.tag)}"></div>
   <div class="field"><label for="xi-con">Marketingový souhlas</label><select class="inp" id="xi-con" data-a="ximpsel" data-on="change" data-k="cons"><option value="none" ${s.cons==='none'?'selected':''}>Neuvedeno</option><option value="yes" ${s.cons==='yes'?'selected':''}>Udělen, doložený mimo systém</option></select></div></div>
  <div class="x-foot"><button class="btn" data-a="ximpstep" data-v="1">Zpět</button><button class="btn pri" data-a="ximpgo">Importovat ${total} kontaktů</button></div></section>`;}
function xStep4(s){const u=user(s.owner);return `<section class="card empty">${ic('tick-circle','s32 grn')}<h3>Importováno ${s.done.n} kontaktů</h3><p class="mute" style="margin:8px 0 16px">${s.done.m?`${s.done.m} existujících doplněno · `:''}${s.done.e} řádků s chybou přeskočeno · správce ${esc(u?u.name:'')} · štítek ${esc(s.tag)}</p>
  <div class="row" style="justify-content:center;flex-wrap:wrap;gap:8px"><a class="btn pri" href="#/kontakty/osoby">Zobrazit kontakty</a><button class="btn" data-a="xerrdl">${ic('document-download','s16')}Řádky s chybou</button><button class="btn" data-a="xundo" data-id="${s.done.id}">Vrátit import</button><button class="btn" data-a="ximpnew">Nový import</button></div>
  <p class="small mute" style="margin-top:16px">Vrátit import jde 7 dní. Importované kontakty se deaktivují.</p></section>`;}
ACT.xtpl=()=>toast('Šablona je stažená');
ACT.ximpset=el=>{const s=UI.ximp;s[el.dataset.k]=el.dataset.v||null;if(el.dataset.k==='f')s.f=el.dataset.v;render();};
ACT.ximpsel=el=>{UI.ximp[el.dataset.k]=el.value;if(el.dataset.k==='dup')render();};
ACT.ximpmap=el=>{UI.ximp.map[el.dataset.c]=el.value;render();};
ACT.ximpstep=el=>{UI.ximp.step=+el.dataset.v;render();};
ACT.ximpgo=()=>{const s=UI.ximp,n=s.dup==='new'?230:212,m=s.dup==='merge'?18:0,id='x'+Date.now();
  DB.xfer.unshift({id,k:'imp',what:s.type,fmt:/csv$/.test(s.file)?'csv':'xlsx',n,who:ME,d:14,t:NOW,st:'done',skip:5,fresh:true});save();s.done={n,m,e:5,id};s.step=3;render();};
ACT.ximpnew=()=>{delete UI.ximp;render();};
ACT.xerrdl=()=>toast('Řádky s chybou jsou stažené, opravte je a naimportujte znovu');
ACT.xundo=el=>{const x=DB.xfer.find(r=>r.id===el.dataset.id);if(!x)return;const go=()=>{x.st='undo';save();closeLayer();toast(`Import vrácen, ${x.n} kontaktů deaktivováno`);render();};
  modal(`<h2>Vrátit import?</h2><p style="margin-top:16px">${x.n} kontaktů z tohoto importu se deaktivuje. Doplněné údaje u existujících kontaktů zůstanou.</p><div class="ft"><button class="btn" data-close>Zrušit</button><button class="btn danger" id="xu-ok">Vrátit import</button></div>`);document.getElementById('xu-ok').onclick=go;};

// ---------- Historie ----------
function xHistory(){const s=ui('xhist',{f:'',p:0});const all=DB.xfer.filter(xVisible);const L=all.filter(x=>!s.f||x.k===s.f);
  const per=24,pages=Math.max(1,Math.ceil(L.length/per));if(s.p>=pages)s.p=pages-1;const rows=L.slice(s.p*per,s.p*per+per);
  const showWho=isMgr()||isAdmin();
  const st=x=>x.k==='exp'?(x.st==='ready'?`<span class="badge b-grn">Ke stažení do ${x.d+7}. 9.</span>`:'<span class="badge">Vypršelo</span>'):(x.st==='undo'?'<span class="badge">Vráceno</span>':`<span class="badge b-grn">Importováno</span>`);
  const act=x=>x.k==='exp'?(x.st==='ready'&&x.who===ME?`<button class="btn" data-a="xdl">${ic('document-download','s16')}Stáhnout</button>`:''):(x.st==='done'&&(x.who===ME||isAdmin())&&x.d>=8?`<button class="btn" data-a="xundo" data-id="${x.id}">Vrátit</button>`:'');
  const chip=(v,l)=>`<button class="set-chip ${s.f===v?'on':''}" data-a="xhf" data-v="${v}" aria-pressed="${s.f===v}">${l} <span class="mute">${all.filter(x=>!v||x.k===v).length}</span></button>`;
  return `<div class="set-chips">${chip('','Vše')}${chip('exp','Exporty')}${chip('imp','Importy')}</div>
  <div class="tbl-card"><table class="tbl x-hist"><thead><tr><th>Kdy</th><th>Co</th><th>Počet</th><th>Formát</th>${showWho?'<th>Kdo</th>':''}<th>Stav</th><th></th></tr></thead><tbody>${rows.length?rows.map(x=>`<tr style="cursor:default" class="${x.fresh?'x-fresh':''}"><td>${x.d}. 9. 2026, ${x.t}</td><td><span class="row" style="gap:8px">${ic(x.k==='exp'?'export':'import','s16 mute')}<span><span class="med">${x.k==='exp'?'Export':'Import'}: ${esc(xWhatName(x.what))}</span>${x.sens?'<span class="small mute" style="display:block">Včetně citlivých údajů</span>':''}${x.k==='imp'&&x.skip?`<span class="small mute" style="display:block">${x.skip===1?'1 řádek přeskočen':x.skip<5?x.skip+' řádky přeskočeny':x.skip+' řádků přeskočeno'}</span>`:''}</span></span></td><td>${xNum(x.n)}</td><td>${XFMT[x.fmt]?XFMT[x.fmt].replace(/ \(.*\)/,''):x.fmt.toUpperCase()}</td>${showWho?`<td><span class="row" style="gap:8px">${av(x.who)}${esc(shortName(x.who))}</span></td>`:''}<td>${st(x)}</td><td class="r">${act(x)}</td></tr>`).join(''):`<tr style="cursor:default"><td colspan="7" class="mute" style="text-align:center;height:96px">Zatím žádný export ani import</td></tr>`}</tbody></table></div>
  ${L.length>per?`<div class="set-pg"><span class="small mute">${s.p*per+1}–${Math.min(L.length,s.p*per+per)} z ${L.length}</span><button class="more" data-a="xhp" data-v="-1" ${s.p?'':'disabled'} aria-label="Předchozí stránka">${ic('arrow-left-2','s16')}</button><button class="more" data-a="xhp" data-v="1" ${s.p<pages-1?'':'disabled'} aria-label="Další stránka">${ic('arrow-right-2','s16')}</button></div>`:''}
  <p class="small mute" style="margin-top:16px">${isAdmin()?'Vidíte exporty a importy celé organizace.':isMgr()?'Vidíte své exporty a importy a exporty svého týmu.':'Vidíte své exporty a importy.'} Soubor ke stažení platí 7 dní.</p>`;}
ACT.xhf=el=>{UI.xhist.f=el.dataset.v;UI.xhist.p=0;render();};
ACT.xhp=el=>{UI.xhist.p+=+el.dataset.v;render();};
ACT.xdl=()=>toast('Soubor je stažený');
