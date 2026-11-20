// Nápověda: samostatná stránka se všemi nápovědami (otazník v hlavičce). Rozcestník kategorií, hledání přes všechny články, kategorie jako rozbalovací seznam.
const HELP=[
 {k:'zaciname',t:'Začínáme',ic:'flag',d:'Přihlášení, orientace a hledání',a:[
  ['Jak se v systému vyznám?','<p>Vlevo je menu s moduly. Skupiny (Práce, Lidé) sbalíte kliknutím na jejich název. Úplně dole je <b>Sbalit menu</b> pro úzkou variantu s ikonami.</p><p>Vpravo nahoře jsou notifikace, kredity, tato nápověda a vaše fotka. Pod fotkou najdete svůj profil a odhlášení.</p>'],
  ['Jak najdu cokoli v systému?','<p>Klikněte do pole <b>Hledat</b> v hlavičce nebo stiskněte <kbd>/</kbd>. Otevře se okno hledání. Pište rovnou, výsledky se ukazují seskupené podle typu. Pod polem můžete hledání zúžit jen na kontakty, úkoly, projekty, obchody, dokumenty, události nebo uživatele, zapnout <b>Jen moje</b> nebo <b>Včetně hotových a neaktivních</b>.</p><p>Mezi výsledky se posunete šipkami, <kbd>Enter</kbd> otevře první výsledek, <kbd>Esc</kbd> okno zavře.</p><p>Na diakritice nezáleží, „novakova“ najde i „Nováková“.</p>'],
  ['Jak změním své údaje?','<p>Klikněte na svou fotku vpravo nahoře a vyberte <b>Můj profil</b>, pak <b>Upravit</b>. Které údaje si smíte měnit sami, určuje administrátor. Ostatní vám upraví on.</p>'],
  ['Kde nastavím notifikace a jazyk?','<p>V <b>Nastavení</b> v části Osobní. Notifikace si zapnete zvlášť pro aplikaci, e-mail a mobil.</p>']]},
 {k:'prehled',t:'Přehled',ic:'home-2',d:'Úvodní stránka a karty',a:[
  ['Co vidím na Přehledu?','<p>Dnešní úkoly, schůzky, narozeniny a svátky kontaktů a rychlé zkratky. Nadřízení navíc vidí, kdo z týmu je dnes v práci.</p>'],
  ['Jak si Přehled upravím?','<p>Tlačítkem <b>Přizpůsobit</b> skryjete nebo přeuspořádáte karty. <b>Obnovit výchozí</b> vrátí původní rozložení.</p>'],
  ['Jak skryju částky?','<p>Ikonou oka u karty s obchody. Hodí se, když se vám někdo dívá přes rameno.</p>']]},
 {k:'kontakty',t:'Kontakty',ic:'user',d:'Osoby, organizace, štítky a souhlasy',a:[
  ['Jak přidám kontakt?','<p>V seznamu Osob nebo Organizací tlačítkem <b>Přidat kontakt</b>. Povinná pole jsou označená, formulář vás upozorní, co chybí.</p>'],
  ['Jak udělám něco s více kontakty naráz?','<ol><li>V seznamu zaškrtněte kontakty (hlavička tabulky vybere celou stránku).</li><li>Nahoře se objeví <b>Hromadné akce</b> a <b>Zrušit výběr</b>.</li><li>V Hromadných akcích vyberte, co chcete udělat, například předat, přidat štítek nebo exportovat.</li></ol>'],
  ['Jak změním štítky kontaktu?','<p>Štítky se mění v editaci kontaktu: <b>Upravit</b> a záložka Základní údaje. V náhledu jsou jen pro čtení.</p><p>Týmové štítky vytváří administrátor, osobní štítky si založíte sami.</p>'],
  ['Jak propojím dva kontakty?','<p>V detailu kontaktu u Propojených kontaktů klikněte na <b>Přidat propojený kontakt</b>. V okně vyhledejte osobu nebo organizaci a zvolte roli vazby. Propojení se ukáže u obou kontaktů.</p>'],
  ['Jak sdílím nebo předám kontakt?','<p>Přes tři tečky v detailu nebo v seznamu. <b>Sdílet</b> kontakt nechá u vás a přidá dalšího správce. <b>Předat</b> ho svěří jinému kolegovi.</p>'],
  ['Kde zapíšu souhlas se zpracováním údajů?','<p>V editaci kontaktu, záložka <b>Souhlasy a komunikace</b>. U každého souhlasu nastavíte stav, zdroj a platnost. Každá změna se zapíše do Historie změn.</p>'],
  ['Jak kontakt smažu?','<p>Kontakty se nemažou, ale deaktivují. Deaktivovaný kontakt zmizí ze seznamů a jde ho kdykoli obnovit.</p>']]},
 {k:'ukoly',t:'Projekty a úkoly',ic:'task-square',d:'Úkoly, projekty a měření času',a:[
  ['Jak změřím, jak dlouho mi úkol trval?','<ol><li>Otevřete úkol a v jeho hlavičce klikněte na <b>Měřit čas</b>.</li><li>Stopky běží i když přejdete jinam. Uvidíte je v tmavém panelu vpravo dole.</li><li>Po zastavení se čas zapíše k úkolu.</li></ol><p>Čas jde zapsat i dodatečně: v kartě Záznamy času tlačítkem <b>Zapsat čas ručně</b>.</p>'],
  ['Jak dokončím úkol?','<p>Zaškrtnutím u úkolu. Hned po dokončení jde akce vrátit tlačítkem <b>Vrátit</b> v hlášce dole.</p>'],
  ['Jak předám úkol kolegovi?','<p>V editaci úkolu změňte řešitele. Kolega dostane notifikaci.</p>'],
  ['Co znamenají barvy u termínů?','<p>Červená = po termínu, oranžová = dnes, ostatní jsou nadcházející.</p>']]},
 {k:'kalendar',t:'Kalendář',ic:'calendar',d:'Schůzky a události',a:[
  ['Jak naplánuji schůzku?','<p>Klikněte do kalendáře na den nebo čas, nebo použijte <b>Přidat událost</b>. Schůzku propojte s kontaktem, uloží se do jeho časové osy.</p>'],
  ['Jak událost přesunu?','<p>Přetáhněte ji myší na jiný den nebo čas.</p>'],
  ['Jak si propojím Google nebo Outlook?','<p>V <b>Nastavení › Kalendář</b>, v části Propojené kalendáře.</p>']]},
 {k:'obchod',t:'Obchod',ic:'briefcase',d:'Pipeline a stav obchodů',a:[
  ['Jak posunu obchod do další fáze?','<p>V pipeline ho přetáhněte do jiného sloupce, nebo změňte fázi v jeho detailu.</p>'],
  ['Jak obchod uzavřu?','<p>V detailu obchodu zvolte <b>Vyhráno</b> nebo <b>Prohráno</b>. U prohry vyberte důvod, pomůže to s vyhodnocením.</p>'],
  ['Proč se modul u nás jmenuje jinak?','<p>Administrátor může názvy přizpůsobit oboru, například Smlouva ve financích nebo Případ v právu.</p>']]},
 {k:'dokumenty',t:'Dokumenty',ic:'document',d:'Nahrávání, podpis a vyhledávání',a:[
  ['Jak nahraji dokument?','<p>Tlačítkem <b>Přidat dokument</b> nebo přetažením souboru do seznamu dokumentů u kontaktu.</p>'],
  ['Jak nechám dokument podepsat?','<ol><li>U dokumentu, který čeká na podpis, klikněte na <b>Podepsat</b>.</li><li>Vyberte způsob: <b>Odeslat k podpisu</b> (e-mailem nebo SMS, i více lidem v pořadí), <b>Podepsat elektronicky sám</b> (Bankovní identita nebo kvalifikovaný certifikát), <b>Nahrát podepsaný sken</b>, nebo jen <b>Označit jako podepsané</b>.</li><li>Průběh podpisu uvidíte v detailu dokumentu, odtud jde i připomenout.</li></ol><p>Když klient podepsal na papíře, nahrajte sken a označte dokument jako podepsaný.</p>'],
  ['Jak najdu dokument mezi stovkami dalších?','<p>Použijte hledání a filtry podle typu, stavu a kontaktu. Hledá se v názvu i čísle dokumentu.</p>'],
  ['Jak propojím související dokumenty?','<p>Přes tři tečky zvolte <b>Spárovat</b>, například smlouvu s nabídkou.</p>']]},
 {k:'dochazka',t:'Docházka',ic:'calendar-tick',d:'Příchod, saldo a nepřítomnosti',a:[
  ['Jak zapíšu příchod do práce?','<p>Jedním kliknutím v hlavičce vpravo nahoře. Tamtéž zapíšete přestávku a odchod.</p>'],
  ['Kde vidím, kolik mám odpracováno?','<p>V <b>Docházka › Moje docházka</b>: odpracované hodiny z měsíčního fondu, saldo (hodiny navíc nebo chybějící) a kolik zbývá do konce měsíce.</p>'],
  ['Jdu k lékaři. Jak to zapíšu?','<p>V Docházce klikněte na <b>Nepřítomnost</b> a vyberte typ <b>Lékař</b>. Jde zapsat i jen část dne, třeba 7:00–9:30. Čas se započítá a pozdní příchod se neukáže.</p>'],
  ['Zapomenutý příchod. Co teď?','<p>Den se v přehledu ukáže jako <b>Chybí záznam</b>. Klikněte na <b>Doplnit</b> a zapište čas. Opravu schválí nadřízený.</p>'],
  ['Kdo schvaluje dovolenou?','<p>Dovolenou, náhradní a neplacené volno schvaluje nadřízený. Ostatní nepřítomnosti se zapíšou hned.</p>'],
  ['Kdo uvidí důvod mé nepřítomnosti?','<p>Důvod vidíte vy, váš nadřízený a administrátor. Kolegové uvidí jen „Nepřítomna“ nebo „Nepřítomen“, u dovolené „Dovolená“.</p>']]},
 {k:'uzivatele',t:'Uživatelé',ic:'people',d:'Kolegové, zástup a deaktivace',a:[
  ['Jak najdu kolegu?','<p>V modulu <b>Uživatelé</b>. Vidíte, kdo je dostupný, na přestávce nebo na dovolené.</p>'],
  ['Jak nastavím zástup na dovolenou?','<p>U uživatele přes tři tečky zvolte <b>Nastavit zástup</b>. Zástupce smí upravovat záznamy zastupovaného, ale nevidí jeho osobní poznámky.</p>'],
  ['Co se stane s prací po deaktivaci uživatele?','<p>Při deaktivaci jeho kontakty, úkoly a obchody předáte jinému kolegovi. Účet jde později obnovit.</p>']]},
 {k:'nastaveni',t:'Nastavení',ic:'setting-2',d:'Osobní a organizační nastavení',a:[
  ['Co si nastavím sám?','<p>V části Osobní: účet a přihlášení, notifikace, vzhled a jazyk, kalendář, e-mailový podpis a propojené aplikace.</p>'],
  ['Co nastavuje administrátor?','<p>V části Organizace: profil organizace, role, týmy a pobočky, vlastní pole, týmové štítky, číselníky, názvy modulů, docházku, dokumenty a podpisy, zabezpečení a fakturaci.</p>'],
  ['Jak najdu konkrétní nastavení?','<p>Napište do pole <b>Hledat v nastavení</b> nad seznamem sekcí, například „podpis“ nebo „heslo“.</p>']]},
 {k:'opravneni',t:'Oprávnění a citlivé údaje',ic:'shield-tick',d:'Kdo co vidí a smí',a:[
  ['Proč některé věci nevidím?','<p>Co vidíte, určuje vaše role. Uživatel pracuje se svými kontakty, nadřízený vidí svůj přímý tým, administrátor nastavuje celý systém.</p>'],
  ['Jak zobrazím rodné číslo nebo číslo dokladu?','<p>Citlivé údaje jsou skryté. Pokud na ně máte oprávnění, zobrazíte je ikonou oka a zkopírujete ikonou vedle. Bez oprávnění je u údaje zámek.</p>'],
  ['Proč dostal nadřízený upozornění na můj export?','<p>Export většího počtu kontaktů je chráněný. Od limitu, který nastavil administrátor, dostane vedení upozornění.</p>']]},
 {k:'zkratky',t:'Klávesové zkratky',ic:'flash',d:'Rychlejší práce bez myši',keys:[['/','Hledat v celém systému'],['Esc','Zavřít okno, menu nebo hledání'],['Enter','Potvrdit výběr nebo přidat hodnotu'],['Tab','Přejít na další pole']],a:[]}];
const hpNorm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const hpText=h=>h.replace(/<[^>]+>/g,' ');
const hpItem=(q,a,open)=>`<details ${open?'open':''}><summary><span>${q}</span>${ic('arrow-down','s16')}</summary><div class="hp-a">${a}</div></details>`;
const hpKeys=c=>`<div class="tbl-card"><table class="tbl hp-keys"><tbody>${c.keys.map(([k,t])=>`<tr style="cursor:default"><td><kbd>${k}</kbd></td><td>${t}</td></tr>`).join('')}</tbody></table></div>`;
const hpSupport=()=>`<div class="hp-sup"><span class="hp-i" style="width:40px;height:40px;border-radius:8px;background:var(--teal-bg);color:var(--teal-a);display:grid;place-items:center">${ic('message-text')}</span><div class="spacer"><b>Nenašli jste odpověď?</b><div class="small mute">Podpora odpovídá v pracovní dny do 4 hodin. Telefon +420 222 333 555.</div></div><button class="btn pri" data-a="hpsupport">Kontaktovat podporu</button></div>`;
function viewHelp(b){const c=HELP.find(x=>x.k===b);
  if(!c)return {nav:'napoveda',html:`<div class="crumbs">Nápověda</div><div class="page-head">${ic('question-circle','s32')}<h1>Nápověda</h1></div>
   <div class="hp-hero"><h2>S čím potřebujete poradit?</h2><div class="set-search"><span class="sib">${icN('search-normal')}</span><input class="inp" id="hpq" data-input="hpq" placeholder="Napište otázku, například „lékař“ nebo „podpis“" aria-label="Hledat v nápovědě" autocomplete="off"></div></div>
   <div id="hp-res" hidden></div><div class="hp-cats" id="hp-cats">${HELP.map(x=>`<a class="hp-cat" href="#/napoveda/${x.k}"><span class="hp-i">${ic(x.ic)}</span><span><b>${x.t}</b><span class="small mute">${x.d}</span></span></a>`).join('')}</div>${hpSupport()}`};
  return {nav:'napoveda',html:`<div class="crumbs"><a href="#/napoveda">Nápověda</a><span>/</span>${c.t}</div><div class="page-head">${ic(c.ic,'s32')}<h1>${c.t}</h1></div>
   <div class="hp-wrap"><aside class="set-nav" aria-label="Kategorie nápovědy">${HELP.map(x=>`<a class="set-l ${x===c?'on':''}" href="#/napoveda/${x.k}" data-rep ${x===c?'aria-current="page"':''}>${ic(x.ic,'s16')}<span>${x.t}</span></a>`).join('')}</aside>
   <div>${c.keys?hpKeys(c):''}${c.a.length?`<div class="hp-acc">${c.a.map((x,i)=>hpItem(x[0],x[1],i===0)).join('')}</div>`:''}${hpSupport()}</div></div>`};}
ACT.hpq=el=>{const q=hpNorm(el.value.trim()),res=document.getElementById('hp-res'),cats=document.getElementById('hp-cats');if(q.length<2){res.hidden=true;cats.hidden=false;return;}
  const words=q.split(/\s+/);const hits=[];HELP.forEach(c=>c.a.forEach(([t,a])=>{const hay=hpNorm(t+' '+hpText(a)+' '+c.t);if(words.every(w=>hay.includes(w)))hits.push([c,t,a,hpNorm(t).includes(words[0])?0:1]);}));hits.sort((x,y)=>x[3]-y[3]);
  const mark=s=>{let o=s;words.forEach(w=>{const n=hpNorm(o);const i=n.indexOf(w);if(i>=0)o=o.slice(0,i)+'<mark>'+o.slice(i,i+w.length)+'</mark>'+o.slice(i+w.length);});return o;};
  const by={};hits.forEach(h=>(by[h[0].k]=by[h[0].k]||[]).push(h));
  res.innerHTML=hits.length?Object.values(by).map(g=>`<div class="hp-sec"><h3>${g[0][0].t}<span class="small mute">${g.length}</span></h3><div class="hp-acc">${g.map(h=>hpItem(mark(h[1]),h[2],hits.length<=3)).join('')}</div></div>`).join(''):`<div class="card empty">${ic('search-normal')}<h3>Nic jsme nenašli</h3><p>Zkuste jiné slovo nebo se zeptejte podpory.</p></div>`;
  res.hidden=false;cats.hidden=true;};
ACT.hpsupport=()=>{modal(`<h2>Kontaktovat podporu</h2><div class="stack" style="margin-top:16px"><div class="field"><label for="hs-t">Téma</label><select class="inp" id="hs-t">${HELP.filter(x=>x.a.length).map(x=>`<option>${x.t}</option>`).join('')}<option>Něco jiného</option></select></div><div class="field"><label for="hs-m">S čím potřebujete pomoct?</label><textarea class="inp" id="hs-m" rows="4"></textarea></div></div><div class="ft"><button class="btn" data-close>Zrušit</button><button class="btn pri" id="hs-ok">Odeslat</button></div>`);
  const t=document.getElementById('hs-t'),c=HELP.find(x=>location.hash.endsWith('/'+x.k));if(c)t.value=c.t;document.getElementById('hs-m').focus();
  document.getElementById('hs-ok').onclick=()=>{const m=document.getElementById('hs-m');if(!m.value.trim()){m.classList.add('err');m.focus();return;}closeLayer();toast('Zpráva je odeslaná. Odpověď přijde e-mailem.');};};
