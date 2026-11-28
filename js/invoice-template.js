// Šablona faktury (A4) a odeslání e-mailem. Návrh 28. 11. 2026, jen v prototypu.
// Vzhled odpovídá S-averu (Poppins, teal, tmavě modrá, zaoblení 8 px, mřížka 8 px), ale bez loga a názvu S-aver:
// nahoře je logo dodavatele z Profilu organizace (dokud ho nenahraje, monogram z názvu firmy).
// Stejná šablona je náhled v detailu faktury, PDF (tisk do PDF) i příloha e-mailu.

const iQr=seed=>{let h=0;for(const ch of String(seed))h=(h*31+ch.charCodeAt(0))>>>0;const n=25,cells=[];
  const fin=(x,y)=>{for(let i=0;i<7;i++)for(let j=0;j<7;j++){const e=i===0||i===6||j===0||j===6||(i>1&&i<5&&j>1&&j<5);if(e)cells.push([x+i,y+j]);}};
  fin(0,0);fin(n-7,0);fin(0,n-7);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){if((x<8&&y<8)||(x>n-9&&y<8)||(x<8&&y>n-9))continue;h=(h*1103515245+12345)>>>0;if((h>>16)&1)cells.push([x,y]);}
  return `<svg viewBox="-2 -2 ${n+4} ${n+4}" width="96" height="96" aria-label="QR Platba"><rect x="-2" y="-2" width="${n+4}" height="${n+4}" fill="#fff"/>${cells.map(([x,y])=>`<rect x="${x}" y="${y}" width="1" height="1"/>`).join('')}</svg>`;};
const iMono=name=>(String(name||'').replace(/s\.r\.o\.|a\.s\.|z\.s\./g,'').trim().split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('')||'—').toUpperCase();
const iNum=n=>String(n).replace('.',',');

// Částky na faktuře s haléři (zvyk českých faktur)
const iKc=n=>(Math.round(n*100)/100).toLocaleString('cs-CZ',{minimumFractionDigits:2,maximumFractionDigits:2})+' Kč';
// Jednoduchá šablona (styl jednoduchých fakturačních aplikací): bílý papír, výrazné číslo, dodavatel a odběratel vedle sebe,
// platba a data, tenké linky, jeden barevný akcent (částka k úhradě). Logo a název nahoře jen když ho klient CRM zapne.
function iTemplate(i){const o=orgS(),c=contact(i.contact),T=iTot(i),vr=i.vat!=null?i.vat:iVatRate(),u=user(i.by)||me();
  const addr=c&&((c.addresses||[]).find(a=>a.def)||(c.addresses||[])[0]);const vs=i.no?i.no.replace(/\D/g,''):'—';
  const ln=a=>a.filter(Boolean).map(x=>`<div>${x}</div>`).join('');
  const kv=(l,v,b)=>`<div class="ivp-kv"><span>${l}</span><span class="${b?'b':''}">${v}</span></div>`;
  const logo=pv('org','invLogo',false);
  return `<article class="ivp" aria-label="Faktura ${esc(iNo(i))}">
  ${logo?`<div class="ivp-logo"><span class="ivp-mono">${esc(iMono(o.name))}</span>${esc(o.name||'')}</div>`:''}
  <header class="ivp-head"><h2 class="ivp-no">Faktura ${esc(i.no||'(koncept)')}</h2><div class="ivp-kind">${vr?'Daňový doklad':'Nejsme plátci DPH'}</div></header>
  <section class="ivp-parties"><div><div class="ivp-lab">Dodavatel</div><div class="ivp-name">${esc(o.name||'')}</div>${ln([esc(o.street||''),esc(((o.zip||'')+' '+(o.city||'')).trim())])}<div class="ivp-ids">${o.ico?'IČO: '+esc(o.ico):''}${o.dic?'<br>DIČ: '+esc(o.dic):''}</div></div>
    <div><div class="ivp-lab">Odběratel</div><div class="ivp-name">${c?esc(c.name):'—'}</div>${ln([addr?esc(addr.street||''):'',addr?esc(((addr.zip||'')+' '+(addr.city||'')).trim()):''])}<div class="ivp-ids">${c&&c.ico?'IČO: '+esc(c.ico):''}${c&&c.dic?'<br>DIČ: '+esc(c.dic):''}</div></div></section>
  <section class="ivp-info"><div>${kv('Bankovní účet',esc(pv('org','invBank','2900123456/2010')),1)}${kv('Variabilní symbol',vs,1)}${kv('Způsob platby','Převodem')}</div>
    <div>${kv('Datum vystavení',i.issued?fmt(i.issued):'—')}${vr?kv('Datum zdanitelného plnění',i.issued?fmt(i.issued):'—'):''}${kv('Datum splatnosti',i.due?fmt(i.due):'—',1)}</div></section>
  <table class="ivp-items"><thead><tr><th>Položka</th><th class="r">Množství</th><th class="r">Cena za jedn.</th>${vr?'<th class="r">DPH</th>':''}<th class="r">Celkem</th></tr></thead><tbody>${i.items.map(x=>`<tr><td>${esc(x.t)}</td><td class="r">${iNum(x.q)} ${x.u}</td><td class="r">${iKc(x.p)}</td>${vr?`<td class="r">${vr} %</td>`:''}<td class="r">${iKc(x.q*x.p)}</td></tr>`).join('')}</tbody></table>
  <section class="ivp-sum">${vr?kv('Celkem bez DPH',iKc(T.base))+kv(`DPH ${vr} %`,iKc(T.vat)):''}<div class="ivp-grand"><span>Celkem k úhradě</span><b>${iKc(T.total)}</b></div></section>
  <section class="ivp-bottom"><div class="ivp-qr">${iQr(vs+T.total)}<div><b>QR Platba</b><br>Naskenujte v aplikaci své banky.</div></div><div class="ivp-by">Vystavil${u&&u.g==='m'?'':'a'}: ${esc(u?u.name:'')}${o.mail?'<br>'+esc(o.mail):''}${o.phone?'<br>'+esc(o.phone):''}</div></section>
  ${pv('org','invNote','')?`<p class="ivp-note">${esc(pv('org','invNote',''))}</p>`:''}
</article>`;}

// PDF: tisk jen šablony (v prohlížeči „Uložit jako PDF“)
ACT.ipdf=el=>{const i=inv(el.dataset.id);document.body.classList.add('iv-printing');toast(`Faktura ${i.no}: v okně tisku zvolte „Uložit jako PDF“`);setTimeout(()=>{try{window.print();}catch(e){}document.body.classList.remove('iv-printing');},50);};

// ---------- Odeslání e-mailem ----------
const I_MAIL_DEF=`Dobrý den,\n\nv příloze posíláme fakturu {cislo} na částku {castka} se splatností {splatnost}.\nPlatbu prosím pošlete na účet {ucet}, variabilní symbol {vs}. Rychlejší je naskenovat QR kód na faktuře.\n\nDěkujeme a přejeme hezký den\n{jmeno}\n{firma}`;
const iMailText=i=>{const o=orgS(),T=iTot(i),u=user(i.by)||me();return (pv('org','invMail','')||I_MAIL_DEF)
  .replace(/\{cislo\}/g,i.no).replace(/\{castka\}/g,bKc(T.total)).replace(/\{splatnost\}/g,fmt(i.due)).replace(/\{ucet\}/g,pv('org','invBank','2900123456/2010')).replace(/\{vs\}/g,i.no.replace(/\D/g,'')).replace(/\{jmeno\}/g,u?u.name:'').replace(/\{firma\}/g,o.name||'');};
function iSendDlg(i,fresh){const c=contact(i.contact),o=orgS(),re=!!i.sent;
  modal(`<h2>${re?'Odeslat fakturu znovu':'Odeslat fakturu'}</h2>${fresh?`<p class="small mute" style="margin-top:8px">Faktura ${esc(i.no)} je vystavená. Můžete ji hned poslat odběrateli.</p>`:''}<div class="stack" style="margin-top:16px">
    <div class="field"><label for="im-to">Komu *</label><input class="inp" id="im-to" type="email" value="${esc(i.sentTo||(c&&c.email)||'')}" placeholder="e-mail odběratele"><div class="err-t" id="im-e"></div></div>
    <div class="field"><label for="im-cc">Kopie</label><input class="inp" id="im-cc" type="email" value="${esc(pv('org','invCc',''))}" placeholder="např. účetní"></div>
    <div class="field"><label for="im-s">Předmět</label><input class="inp" id="im-s" value="Faktura ${esc(i.no)} – ${esc(o.name||'')}"></div>
    <div class="field"><label for="im-t">Zpráva</label><textarea class="inp" id="im-t" rows="9">${esc(iMailText(i))}</textarea></div>
    <div class="row iv-att">${ic('document','s16')}<span class="spacer">${esc(i.no)}.pdf</span><span class="small mute">Příloha</span></div>
    <label class="row"><input type="checkbox" class="cb" id="im-isdoc" ${pv('org','invIsdoc',true)?'checked':''}><span>Přiložit i ISDOC<span class="small mute" style="display:block">Strojově čitelná faktura, odběratel si ji načte do účetnictví.</span></span></label></div>
  <p class="small mute" style="margin-top:16px">${ic('info-circle','s16')} Prototyp nic neodesílá. Ukáže, co by odešlo, a zapíše to do průběhu faktury.</p><div class="ft"><button class="btn" data-close>${fresh?'Odeslat později':'Zrušit'}</button><button class="btn pri" id="im-ok">${ic('sms','s16')}Odeslat</button></div>`);
  document.getElementById('im-ok').onclick=()=>{const to=document.getElementById('im-to').value.trim();if(!/^\S+@\S+\.\S+$/.test(to)){document.getElementById('im-e').textContent='Zadejte e-mail odběratele.';return;}
    i.sent=TODAY;i.sentTo=to;i.mail={to,cc:document.getElementById('im-cc').value.trim(),subj:document.getElementById('im-s').value,text:document.getElementById('im-t').value,att:[i.no+'.pdf',...(document.getElementById('im-isdoc').checked?[i.no+'.isdoc']:[])]};(i.log=i.log||[]).push([TODAY,`Odesláno e-mailem na ${to}`]);save();closeLayer();toast(`Faktura ${i.no} by teď odešla na ${to} (simulace). Najdete ji v průběhu faktury.`);render();};}

// Nastavení > Vydané faktury: vzhled faktury a e-mail s fakturou
{const base=SBODY.faktury;SBODY.faktury=()=>base()
  +sCard('Vzhled faktury',`${swRow('org','invLogo','Logo a název firmy nahoře na faktuře','Vypnuto: čistá faktura bez hlavičky. Zapněte, když o to klient stojí. Logo se bere z Profilu organizace.',false)}<div class="grid g2" style="margin-top:16px">${sInp('org','invNote','Text na faktuře','','text','Např. zápis v obchodním rejstříku nebo poděkování.')}</div>`)
  +sCard('E-mail s fakturou',`<div class="grid g2">${sInp('org','invCc','Posílat kopii na','','email','Např. účetní.')}</div><div class="field" style="margin-top:16px"><label for="s-invMail">Text e-mailu</label><textarea class="inp" id="s-invMail" rows="9" data-a="sset" data-on="change" data-s="org" data-k="invMail">${esc(pv('org','invMail','')||I_MAIL_DEF)}</textarea><div class="small mute set-hint">Doplní se: {cislo}, {castka}, {splatnost}, {ucet}, {vs}, {jmeno}, {firma}.</div></div><div class="field" style="margin-top:16px"><label for="s-invRemindText">Text upomínky</label><textarea class="inp" id="s-invRemindText" rows="8" data-a="sset" data-on="change" data-s="org" data-k="invRemindText">${esc(pv('org','invRemindText','')||I_REMIND_DEF)}</textarea></div>${swRow('org','invIsdoc','Přikládat ISDOC','Strojově čitelná faktura pro účetnictví odběratele.',true)}`);}

// ---------- Náhled faktury: celá faktura přes celou obrazovku ----------
// Ze seznamu faktur (ikona oka, menu), z detailu (klik na fakturu), z okna Vyfakturovat a ze stránky Nová faktura.
function iPreview(i,opt={}){const st=i.id?iSt(i):'draft';
  const acts=opt.back?`<button class="btn" id="pv-back">${ic('arrow-left-2','s16')}Zpět</button>`
    :`${st!=='draft'?`<button class="btn" data-a="ipdf" data-id="${i.id}">${ic('document-download','s16')}PDF</button>`:''}${st==='send'?`<button class="btn" data-a="iact" data-v="send" data-id="${i.id}">${ic('sms','s16')}Odeslat</button>`:''}${location.hash!=='#/faktura/'+i.id?`<button class="btn" id="pv-open">Detail faktury</button>`:''}`;
  layer().innerHTML=`<div class="ivv" role="dialog" aria-modal="true" aria-label="Náhled faktury"><div class="ivv-bar"><b class="spacer">${i.no?'Faktura '+esc(i.no):'Náhled faktury'}${i.no?'':'<span class="small" style="font-weight:400;opacity:.72;margin-left:8px">číslo dostane při vystavení</span>'}</b>${acts}<button class="ivv-x" data-close aria-label="Zavřít">${ic('close-circle','s20')}</button></div><div class="ivv-body">${iTemplate(i)}</div></div>`;
  const b=document.getElementById('pv-back');if(b)b.onclick=opt.back;
  const o=document.getElementById('pv-open');if(o)o.onclick=()=>{closeLayer();go('#/faktura/'+i.id);};
  document.querySelectorAll('.ivv [data-close]').forEach(x=>x.onclick=()=>closeLayer());}
ACT.iprev=el=>iPreview(inv(el.dataset.id));
// Dočasná faktura pro náhled před vystavením
const iTmp=(c,items,dueDays)=>({no:'',contact:c,items,issued:TODAY,due:addDays(TODAY,+dueDays||14),by:ME,state:'draft'});


// ---------- Průběh faktury: co se stalo a co se stane automaticky ----------
// Prototyp nic neodesílá, ale ukazuje všechno, co by systém udělal: odeslání, upozornění, upomínky, zastavení po úhradě.
const I_REMIND_DEF=`Dobrý den,\n\nrádi bychom připomněli fakturu {cislo} na částku {castka}, která byla splatná {splatnost}. Pokud jste ji už uhradili, děkujeme a tento e-mail prosím ignorujte.\n\nPlatbu pošlete na účet {ucet}, variabilní symbol {vs}.\n\nDěkujeme\n{jmeno}\n{firma}`;
function iFlowCard(i){const st=iSt(i);if(st==='draft')return '';const c=contact(i.contact),rem=pv('org','invRemind',false),rd=+pv('org','invRemindDays',7),nl=pv('org','invNotifyLate',true),u=user(i.by);
  const S=[];const add=(d,t,k,act)=>S.push({d,t,k,act});
  add(i.issued,`Vystaveno${u?' · '+esc(u.name):''}`,'done');
  if(i.sent)add(i.sent,`Odesláno e-mailem na ${esc(i.sentTo||(c&&c.email)||'odběratele')} · ${(i.mail&&i.mail.att||[i.no+'.pdf']).join(', ')}`,'done',`<button class="btn-link" data-a="imailpv" data-id="${i.id}" data-v="inv">Zobrazit e-mail</button>`);
  else add('',`Čeká na odeslání. Odběratel o faktuře zatím neví.`,'todo',`<button class="btn-link" data-a="iact" data-v="send" data-id="${i.id}">Odeslat</button>`);
  if(i.state==='storno'){add('','Stornováno. Upomínky ani upozornění se neposílají a čas z faktury je znovu k fakturaci.','off');}
  else if(i.paid){add(i.paid,'Uhrazeno. Upomínky a upozornění se zastavily.','done');}
  else{add(i.due,'Splatnost',i.due<=TODAY?'done':'plan');
    if(nl){const d=addDays(i.due,1);add(d,'Upozornění v notifikacích pro toho, kdo fakturu vystavil, že není uhrazená',d<=TODAY?'done':'plan');}
    const rdt=addDays(i.due,rd);
    if(rem)add(rdt,`Automatická upomínka odběrateli (${rd} dní po splatnosti)`,rdt<=TODAY&&i.sent?'done':'plan',`<button class="btn-link" data-a="imailpv" data-id="${i.id}" data-v="rem">${rdt<=TODAY&&i.sent?'Zobrazit e-mail':'Ukázat e-mail'}</button>`);
    else add('','Automatické upomínky jsou vypnuté.','off',isAdmin()?'<a class="btn-link" href="#/nastaveni/faktury">Zapnout</a>':'');}
  if(i.remind)add(i.remind,'Ručně poslaná upomínka','done',`<button class="btn-link" data-a="imailpv" data-id="${i.id}" data-v="rem">Zobrazit e-mail</button>`);
  const ICN={done:['tick-circle','grn'],plan:['clock','tea'],todo:['danger','amb'],off:['minus','mute']};
  S.sort((a,b)=>(a.d||'9999').localeCompare(b.d||'9999'));
  return `<section class="card"><div class="card-head"><h3 class="sec-t" style="margin:0">Průběh</h3><div class="r small mute">Prototyp nic neodesílá, jen ukazuje, co se děje.</div></div><ol class="iv-flow">${S.map(x=>`<li class="${x.k}"><span class="iv-fi ${ICN[x.k][1]}">${ic(ICN[x.k][0],'s16')}</span><span class="iv-fd small mute">${x.d?fmt(x.d):''}</span><span class="spacer">${x.t}${x.k==='plan'?' <span class="small mute">· naplánováno</span>':''}</span>${x.act||''}</li>`).join('')}</ol></section>`;}
ACT.imailpv=el=>{const i=inv(el.dataset.id),rem=el.dataset.v==='rem',c=contact(i.contact),o=orgS(),T=iTot(i),u=user(i.by)||me();
  const fill=t=>t.replace(/\{cislo\}/g,i.no).replace(/\{castka\}/g,bKc(T.total)).replace(/\{splatnost\}/g,fmt(i.due)).replace(/\{ucet\}/g,pv('org','invBank','2900123456/2010')).replace(/\{vs\}/g,i.no.replace(/\D/g,'')).replace(/\{jmeno\}/g,u?u.name:'').replace(/\{firma\}/g,o.name||'');
  const m=rem?{to:i.sentTo||(c&&c.email)||'',cc:'',subj:`Upomínka: faktura ${i.no} – ${o.name||''}`,text:fill(pv('org','invRemindText','')||I_REMIND_DEF),att:[i.no+'.pdf']}:(i.mail||{to:i.sentTo||(c&&c.email)||'',cc:'',subj:`Faktura ${i.no} – ${o.name||''}`,text:iMailText(i),att:[i.no+'.pdf']});
  modal(`<h2>${rem?'Upomínka':'Odeslaný e-mail'}</h2><p class="small mute" style="margin-top:8px">Takhle e-mail uvidí odběratel. V prototypu se nic neodesílá.</p><div class="iv-mail"><div><span class="mute">Od:</span> ${esc(o.name||'')} &lt;${esc(o.mail||'')}&gt;</div><div><span class="mute">Komu:</span> ${esc(m.to)}</div>${m.cc?`<div><span class="mute">Kopie:</span> ${esc(m.cc)}</div>`:''}<div><span class="mute">Předmět:</span> <b>${esc(m.subj)}</b></div><pre>${esc(m.text)}</pre><div class="row" style="gap:8px;flex-wrap:wrap">${m.att.map(a=>`<span class="iv-att row">${ic('document','s16')}${esc(a)}</span>`).join('')}</div></div><div class="ft"><button class="btn pri" data-close>Zavřít</button></div>`);};
