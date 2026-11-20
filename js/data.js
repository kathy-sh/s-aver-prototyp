// Ukázková data. Výchozí obsah vychází z obrazovek ve Figmě, referenční „dnes“ je 14. 9. 2026.
window.TODAY = '2026-09-14';
window.NOW = '10:24';
window.CALL_RES = ['Dovoláno','Schůzka','Později','Nedostupný','Odmítnuto'];
// Propojení kontaktů je vždy oboustranné.
// Role u odkazu X → Y popisuje vztah z pohledu X:
// - osoba a organizace: role osoby v organizaci, na obou stranách stejná (Jednatelka),
// - dvě osoby: role popisuje druhou osobu, z druhé strany se otočí podle pohlaví (Manžel ↔ Manželka, Dcera ↔ Matka),
// - dvě organizace: otočí se obchodní vztah (Dodavatel ↔ Odběratel).
window.REL_ROLES={spouse:['Manžel','Manželka'],child:['Syn','Dcera'],parent:['Otec','Matka'],sibling:['Bratr','Sestra'],partner:['Partner','Partnerka'],bizpartner:['Obchodní partner','Obchodní partnerka'],colleague:['Kolega','Kolegyně'],grandchild:['Vnuk','Vnučka'],grandparent:['Dědeček','Babička']};
window.REL_BACK={spouse:'spouse',child:'parent',parent:'child',sibling:'sibling',partner:'partner',bizpartner:'bizpartner',colleague:'colleague',grandchild:'grandparent',grandparent:'grandchild'};
window.ORG_BACK={'Dodavatel':'Odběratel','Odběratel':'Dodavatel','Mateřská společnost':'Dceřiná společnost','Dceřiná společnost':'Mateřská společnost'};
window.isFemale=c=>c.gender?c.gender==='Žena':/á$/.test(c.last||'')||/a$/.test(c.first||'');
// Role, kterou uvidí kontakt "to" u odkazu zpět na "from"
window.backRole=(from,to,role)=>{const po=from.type==='organizace',to_o=to.type==='organizace';
  if(po&&to_o)return ORG_BACK[role]||role;
  if(po!==to_o)return role;
  const g=Object.keys(REL_ROLES).find(k=>REL_ROLES[k].includes(role));if(!g)return role;
  return REL_ROLES[REL_BACK[g]][isFemale(from)?1:0];};
// Doplní chybějící odkazy zpět
window.linkBack=(from,to,role)=>{to.links=to.links||[];if(to.links.some(l=>l.id===from.id||l.name===from.name))return null;const r=backRole(from,to,role);to.links.push({id:from.id,name:from.name,role:r,org:from.type==='organizace'?1:0});return r;};

// Svátek podle českého kalendáře. Obvykle jedno jméno, někdy dvě, o státních svátcích žádné.
window.NAME_DAY = ['Radka'];
// Ukázka na září 2026. V ostré verzi přijde celý kalendář z datového zdroje.
window.NAME_DAYS = {'09-01':['Linda','Samuel'],'09-02':['Adéla'],'09-03':['Bronislav'],'09-04':['Jindra','Jindřiška'],'09-05':['Boris'],'09-06':['Boleslav'],'09-07':['Regína'],'09-08':['Mariana'],'09-09':['Daniela'],'09-10':['Irma'],'09-11':['Denisa'],'09-12':['Marie'],'09-13':['Lubor'],'09-14':['Radka'],'09-15':['Jolana'],'09-16':['Ludmila'],'09-17':['Naděžda'],'09-18':['Kryštof'],'09-19':['Zita'],'09-20':['Oleg'],'09-21':['Matouš'],'09-22':['Darina'],'09-23':['Berta'],'09-24':['Jaromír'],'09-25':['Zlata'],'09-26':['Andrea'],'09-27':['Jonáš'],'09-28':['Václav'],'09-29':['Michal'],'09-30':['Jeroným']};

window.seedData = function () {
  const P = [ // Seznam Osob 1:1 z 436:7409: jméno, stav, vztah, hodnocení, aktivita, typ aktivity, správce, telefon, štítky, sdílený
    ['Petr','Beneš','Potenciální','Odběratel',5,'2026-09-12','call','AN','+420 725 681 989',['Osobně']],
    ['Hana','Blažková','Aktuální','Partner',5,'2026-09-03','meet','PS','+420 725 385 565',['VIP zákazník'],1],
    ['Lucie','Černá','Odložený','Konkurent',1,'2026-08-28','meet','PS','+420 602 496 724',['Doporučení']],
    ['Tomáš','Dvořák','Odložený','Dodavatel',3,'2026-09-05','mail','AN','+420 608 755 195',['Veletrh']],
    ['Filip','Horák','Potenciální','Dodavatel',2,'2026-09-14','call','AN','+420 602 348 512',['Osobně']],
    ['David','Král','Nezajímavý','Konkurent',2,'2026-09-08','mail','AN','+420 777 274 406',['Servis','Praha','Veletrh']],
    ['Martin','Kříž','Nezajímavý','Partner',5,'2026-09-09','mail','AN','+420 777 570 830',['Servis']],
    ['Ondřej','Kučera','Nezajímavý','Odběratel',1,'2026-08-19','meet','AN','+420 608 607 883',['Veletrh']],
    ['Tereza','Malá','Aktuální','Dodavatel',5,'2026-08-11','meet','PS','+420 777 718 142',['Doporučení']],
    ['Pavel','Mareš','Odložený','Konkurent',3,'2026-08-15','meet','AN','+420 602 644 936',['Servis']],
    ['Anna','Nová','Aktuální','Odběratel',4,'2026-09-12','call','PS','+420 777 123 456',['VIP zákazník'],1],
    ['Jana','Pokorná','Aktuální','Odběratel',3,'2026-08-31','meet','PS','+420 777 422 618',['Praha'],1],
    ['Eva','Procházková','Aktuální','Partner',2,'2026-09-06','mail','PS','+420 608 311 459',['VIP zákazník']],
    ['Marek','Šimek','Potenciální','Partner',3,'2026-08-24','meet','AN','+420 725 533 777',['Veletrh']],
    ['Alena','Vaňková','Nezajímavý','Dodavatel',4,'2026-09-13','call','PS','+420 725 237 353',['Doporučení']],
    ['Lenka','Veselá','Odložený','Partner',4,'2026-09-13','call','PS','+420 608 459 671',['Praha']],
    ['Petr','Svoboda','Aktuální','Odběratel',4,'2026-09-10','call','JD','+420 603 412 877',['Osobně']],
    ['Radka','Fialová','Aktuální','Odběratel',4,'2026-09-02','mail','AN','+420 602 555 148',['Osobně']],
    ['Radka','Urbanová','Potenciální','Partner',3,'2026-08-20','call','AN','+420 777 301 228',['Veletrh']],
    ['Radka','Hájková','Aktuální','Odběratel',5,'2026-09-11','meet','PS','+420 608 244 610',['VIP zákazník']],
  ];
  // Doplnění, aby šlo opravdu zkoušet hledání, filtry a stránkování. Tyhle řádky ve Figmě nejsou.
  const first=['Jan','Karel','Michal','Ivana','Jitka','Roman','Klára','Zdeněk','Monika','Vít','Šárka','Aleš','Dana','Radim','Olga','Tomáš','Nikola','Josef','Markéta','Libor'];
  const last=[['Havel','Havlová'],['Urban','Urbanová'],['Bartoš','Bartošová'],['Fiala','Fialová'],['Sedlák','Sedláková'],['Doležal','Doležalová'],['Zeman','Zemanová'],['Kolář','Kolářová'],['Navrátil','Navrátilová'],['Čermák','Čermáková'],['Vlček','Vlčková'],['Pospíšil','Pospíšilová'],['Hájek','Hájková'],['Jelínek','Jelínková'],['Růžička','Růžičková'],['Beneš','Benešová'],['Tichý','Tichá'],['Marek','Marková'],['Štěpánek','Štěpánková'],['Kadlec','Kadlecová']];
  const fem=new Set(['Ivana','Jitka','Klára','Monika','Šárka','Dana','Olga','Nikola','Markéta']);
  const sts=['Aktuální','Potenciální','Odložený','Nezajímavý'],rel=['Odběratel','Partner','Dodavatel','Konkurent'],tg=['VIP zákazník','Osobně','Doporučení','Veletrh','Servis','Praha'],acts=['call','mail','meet'];
  for(let i=0;i<first.length*2;i++){const f=first[i%20],l=last[(i*7+(i>=20?3:0))%20][fem.has(f)?1:0];const d=1+(i*3)%28;P.push([f,l,sts[i%4],rel[(i*3)%4],1+(i*2)%5,`2026-0${8+(i%2)}-${String(d>13&&i%2?13-(i%5):d).padStart(2,'0')}`,acts[i%3],i%2?'AN':'PS',`+420 ${['602','608','725','777'][i%4]} ${100+i*17} ${200+i*13}`,[tg[i%6]]]);}
  const O = [
    ['Ateliér Lípa s.r.o.','Odložený','Dodavatel',3,'2026-09-10','mail','AN','+420 602 792 248',['Servis']],
    ['Centrum Rozvoj','Nezajímavý','Konkurent',2,'2026-09-14','call','AN','+420 725 829 301',['Osobně']],
    ['Delta projekt s.r.o.','Potenciální','Dodavatel',2,'2026-08-26','meet','PS','+420 777 866 354',['Praha']],
    ['Javor s.r.o.','Aktuální','Odběratel',4,'2026-09-12','call','PS','+420 541 210 800',['VIP zákazník']],
    ['Javor Servis s.r.o.','Odložený','Konkurent',3,'2026-09-13','call','PS','+420 608 903 407',['Doporučení']],
    ['Lípa Design s.r.o.','Nezajímavý','Partner',5,'2026-08-06','meet','PS','+420 602 940 460',['Doporučení']],
    ['Most Trade s.r.o.','Aktuální','Dodavatel',5,'2026-09-07','mail','AN','+420 725 977 513',['Veletrh']],
    ['Nadace Jaro','Potenciální','Partner',3,'2026-08-17','meet','AN','+420 777 114 566',['Servis']],
    ['Nadace Pomoc','Aktuální','Partner',2,'2026-08-29','meet','AN','+420 608 151 619',['Osobně']],
    ['Nový Směr s.r.o.','Nezajímavý','Odběratel',1,'2026-09-12','call','PS','+420 602 188 672',['VIP zákazník']],
    ['Obec Javorná','Potenciální','Odběratel',5,'2026-08-22','meet','AN','+420 725 225 725',['Veletrh']],
    ['Orion servis a.s.','Aktuální','Partner',5,'2026-09-09','mail','PS','+420 777 262 778',['Doporučení']],
    ['Spolek Most','Odložený','Konkurent',1,'2026-08-13','meet','AN','+420 608 299 831',['Veletrh']],
    ['Spolek Sousedé','Odložený','Partner',4,'2026-09-04','meet','AN','+420 602 336 884',['Servis']],
    ['Studio Most a.s.','Nezajímavý','Dodavatel',4,'2026-07-31','meet','PS','+420 725 373 937',['Praha']],
    ['Zelená cesta z.s.','Aktuální','Odběratel',3,'2026-09-06','mail','PS','+420 777 410 990',['VIP zákazník']],
  ];
  const ascii=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
  let n=0;
  const contacts=[
    ...P.map(p=>({id:'c'+(++n),type:'osoba',first:p[0],last:p[1],name:p[0]+' '+p[1],status:p[2],rel:p[3],rating:p[4],act:p[5],actType:p[6],owner:p[7],phone:p[8],tags:p[9],sharedWith:p[10]?['AN']:[],email:ascii(p[0])+'.'+ascii(p[1])+'@example.cz',city:['Praha','Brno','Ostrava','Zlín'][n%4],personal:[],active:true})),
    ...O.map(p=>({id:'c'+(++n),type:'organizace',name:p[0],status:p[1],rel:p[2],rating:p[3],act:p[4],actType:p[5],owner:p[6],phone:p[7],tags:p[8],sharedWith:[],email:'info@'+ascii(p[0]).replace(/[^a-z]/g,'').slice(0,12)+'.example',city:['Praha','Brno','Ostrava','Zlín'][n%4],personal:[],active:true})),
  ];
  contacts.forEach((c,i)=>{if(c.actType==='call'){c.called=c.act;c.callRes=CALL_RES[1+i%4];}else if(i%3){c.called=c.act;c.callRes=CALL_RES[1+(i+1)%4];}else{c.called=null;c.callRes=null;}});
  contacts.filter(c=>c.type==='organizace').forEach((c,i)=>{c.ico=String(26100000+i*137);c.dic='CZ'+c.ico;c.form=/a\.s\./.test(c.name)?'a.s.':'s.r.o.';});
  const anna=contacts.find(c=>c.name==='Anna Nová');anna.callRes='Později';anna.custom={f1:'Strategický kontakt',f2:'Enterprise',f3:'Saver CRM'};
  Object.assign(anna,{id:'anna',photo:'assets/img/anna.png',email:'anna@javor.example',city:'Brno',titleBefore:'Ing.',titleAfter:'',birth:'15. 3. 1988',rc:'885315/1234',gender:'Žena',bank:'123456789/0800',mobile:'+420 777 123 457',web:'www.javor.example',linkedin:'linkedin.com/in/anna-nova',skype:'anna.nova',personal:['Má psa'],
    addresses:[{id:'a1',type:'Trvalé bydliště',def:true,street:'Javorová 18',city:'Brno',zip:'620 00',region:'Jihomoravský',state:'Česká republika'},{id:'a2',type:'Korespondenční adresa',street:'Husova 5',city:'Brno',zip:'602 00',region:'Jihomoravský',state:'Česká republika'}],
    docs:{op:true,driver:false,passport:false,other:false},opNo:'123456789',
    consents:{commercial:'Povoleno',marketing:'Udělen',profiling:'Neudělen',personal:'Udělen'},consentTo:'2026-09-30',managers:['PS'],meta:{priority:'Vysoká',potential:'Vysoký',risk:'Nízká',team:'Sales',internal:'Hodnocení 4/5 nastavila Petra Svobodová.',intId:'PER-2026-000017',extId:'EXT-884291',accId:'ACC-553920',source:'Import z Excelu',campaign:'Podzimní akvizice 2026',segment:'B2B / Střední firmy',how:'Vykat, přátelsky a stručně.',greeting:'Dobrý den, paní Nová',when:'Volat dopoledne telefonicky.',whenNo:'Nevolat 12:00-13:00',callHint:'Volat dopoledne · ne 12–13 h',prefs:['Telefon','Dopoledne','12-13 h nevolat','Čeština']},
    extra:{rodinny:'Vdaná',deti:'2',status:'Zaměstnanec',obor:'Pojišťovnictví',smluvni:'Jednatelka: Anna Nová',pozn:'Relevantní pro smluvní dokumentaci'},
    links:[{name:'Javor s.r.o.',role:'Jednatelka',org:1},{name:'Spolek Most',role:'Členka výboru',org:1},{name:'Pavel Nový',role:'Manžel'},{name:'Ema Nová',role:'Dcera'},{name:'Filip Nový',role:'Syn'}],
    history:[
      {who:'PS',f:'Telefon',t:'Změnila telefon z „+420 777 111 222“ na „+420 777 123 456“.',d:'14. 9. 2026, 10:42'},
      {who:'AN',f:'E-mail',t:'Změnil e-mail z „a.nova@javor.example“ na „anna@javor.example“.',d:'13. 9. 2026, 11:05'},
      {who:'PS',f:'Štítek',t:'Přidala štítek „VIP zákazník“ ke kontaktu.',d:'12. 9. 2026, 16:45'},
      {who:'AN',f:'Správce kontaktu',t:'Přidal Petru Svobodovou jako správkyni kontaktu.',d:'10. 9. 2026, 09:15'},
      {who:'AN',f:'Propojení',t:'Propojil kontakt s Javor s.r.o. v roli jednatelky.',d:'9. 9. 2026, 10:00'},
      {who:'PS',f:'Dokument',t:'Nahrála OP. Jméno, narození, rodné číslo a adresa byly propsány do kontaktu.',d:'8. 9. 2026'},
      {who:'S',f:'Vytvoření kontaktu',t:'Vytvořil kontakt importem z Excelu.',d:'1. 9. 2026'}],
    timeline:[
      {g:'12. září 2026',k:'Hovor',ic:'call',b:'Proběhlo',d:'12. 9. 2026, 14:32',t:'Příchozí hovor, 4 min 22 s',x:'Petra Svobodová hovořila s Annou Novou o nabídce. Další hovor je domluven na 18. 9.',who:'PS'},
      {g:'12. září 2026',k:'E-mail',ic:'sms',d:'12. 9. 2026, 11:05',t:'Re: Nabídka spolupráce',x:'Anna Nová potvrdila přijetí nabídky. Podrobnosti projdeme při hovoru 18. září.',who:'PS'},
      {g:'11. září 2026',k:'Poznámka',ic:'note-text',d:'11. 9. 2026, 16:45',t:'Zájem o dlouhodobou spolupráci',x:'Anna Nová má zájem o dlouhodobou spolupráci. Podklady připraví Petra Svobodová.',who:'PS'},
      {g:'11. září 2026',k:'Schůzka',ic:'people',b:'Proběhlo',d:'11. 9. 2026, 09:15',t:'Online demo produktu',x:'Účastníci: Anna Nová za Javor s.r.o. a Petra Svobodová. Probrán rozsah spolupráce.',who:'PS'},
      {g:'Starší',k:'Úkol',ic:'task-square',d:'10. 9. 2026, 10:00',t:'Úkol dokončen: Odeslat cenovou nabídku',x:'Cenová nabídka byla odeslána v příloze e-mailu.',who:'PS'},
      {g:'Starší',k:'E-mail',ic:'sms',b:'Automaticky',d:'8. 9. 2026',t:'Úvodní oslovení - Saver CRM',x:'Dobrý den, rádi bychom Vám představili náš nový systém pro správu vztahů se zákazníky...',who:'S'},
      {g:'Starší',k:'Systém',ic:'setting-2',d:'1. 9. 2026',t:'Kontakt vytvořen',x:'Kontakt byl přidán do systému prostřednictvím importu z Excelu.',who:'PS'}],
    deals:{kpi:[[3,'Otevřené příležitosti','420 000 Kč','Součet otevřených příležitostí'],[2,'Nabídky a smlouvy','340 000 Kč','Aktuální hodnota nabídek a smluv'],[5,'Vyhrané obchody','640 000 Kč','Hodnota vyhraných obchodů'],[2,'Ztracené obchody','95 000 Kč','Hodnota ztracených obchodů']],
      open:[{b:'Vyjednávání',t:'Implementace Saver CRM',n:'Domluvit schůzku k finální nabídce.',m:'Pravděpodobnost uzavření: 70 % · Plánované uzavření: 30. 9. 2026',o:'PS',r:'Rozhodovatel',v:'250 000 Kč'},{b:'Kvalifikace',t:'Rozšíření uživatelských licencí',n:'Poslat cenovou kalkulaci pro rozšířený tým.',m:'Pravděpodobnost uzavření: 40 % · Plánované uzavření: 15. 10. 2026',o:'AN',r:'Doporučitel',v:'90 000 Kč'},{b:'Analýza potřeb',t:'Konzultační projekt Q4',n:'Naplánovat úvodní konzultační hovor.',m:'Pravděpodobnost uzavření: 25 %',o:'PS',r:'Kontaktní osoba',v:'80 000 Kč'}],
      docs:[{b:'Odesláno',t:'Nabídka 2026-032',m:'Platnost do: 25. 9. 2026',o:'PS',v:'90 000 Kč'},{b:'Čeká na podpis',t:'Smlouva 2026-014',m:'Termín podpisu: 27. 9. 2026',v:'250 000 Kč'}],
      won:[{b:'Vyhráno',t:'Roční licence Saver CRM',m:'Vyhráno: 5. 9. 2026',o:'AN',v:'180 000 Kč'}]},
    documents:[{g:'Smlouvy a obchodní dokumenty',f:'PDF',t:'Smlouva 2026-014',b:'Čeká na podpis',c:'amb',m:'Aktualizováno: 12. 9. 2026 · Verze: 2 · Vazba: Obchod 2026-014',dl:'Termín podpisu',dv:'27. 9. 2026',o:'PS'},{g:'Smlouvy a obchodní dokumenty',f:'PDF',t:'Nabídka 2026-032',b:'Čeká na reakci',c:'amb',m:'Aktualizováno: 10. 9. 2026',dl:'Platnost do',dv:'25. 9. 2026',o:'PS'},{g:'Doklady',f:'JPG',t:'Občanský průkaz',b:'Nahráno',c:'grn',m:'Nahráno: 8. 9. 2026',dl:'Platnost do',dv:'15. 3. 2030',o:'PS'},{g:'Doklady',t:'Řidičský průkaz',b:'Nenahráno',up:1},{g:'Doklady',t:'Pas',b:'Nenahráno',up:1},{g:'Souhlasy a GDPR',f:'PDF',t:'Souhlas se zpracováním osobních údajů',b:'Končí platnost',c:'red',m:'Zdroj: Webový formulář · Uděleno: 1. 9. 2026',dl:'Platnost do',dv:'30. 9. 2026'}],
    integrations:[['G','Google Contacts','anna@javor.example · Synchronizováno: E-mail, Telefon, Organizace','Synchronizováno','13. 9. 2026, 17:30'],['M','Mailchimp','anna@javor.example · Audience: Zákazníci CZ','Synchronizováno','13. 9. 2026, 17:30'],['P','Pohoda','Kontakt ID: PER-17 · Synchronizováno: Kontaktní údaje, Firma, Fakturační údaje','Synchronizováno','13. 9. 2026, 17:30'],['O','Microsoft Outlook','anna@javor.example · Je nutné znovu autorizovat účet.','Chyba synchronizace','13. 9. 2026, 14:05']],
    newsletter:true});
  const projects=[
    {id:'p1',name:'Rekonstrukce kanceláří',health:'V riziku',client:'Javor s.r.o.',phase:'Probíhá',total:10,done:6,due:'2026-10-30',owner:'TH',budget:'180 000 Kč',created:'2. 9. 2026',why:'1 úkol po termínu',desc:'Kompletní rekonstrukce kancelářských prostor Javor s.r.o. v Brně – nová elektroinstalace, podlahy, malby a nábytek. Cílem je předat prostory do plného provozu do konce října 2026, včetně koordinace s dodavateli a úklidu po dokončení prací.'},
    {id:'p2',name:'Prodej bytu Vinohrady',health:'V riziku',client:'Petr Svoboda',phase:'Čeká na klienta',total:8,done:3,due:'2026-11-15',owner:'JD',budget:'—',created:'20. 8. 2026',why:'1 úkol po termínu',desc:'Příprava a prodej bytu 3+kk na Vinohradech.'},
    {id:'p3',name:'Marketingová kampaň Q4',health:'Podle plánu',client:'Nová Media s.r.o.',phase:'Plánování',total:12,done:1,due:'2026-12-01',owner:'MK',budget:'95 000 Kč',created:'1. 9. 2026',why:'',desc:'Kampaň pro čtvrté čtvrtletí napříč sociálními sítěmi a e-mailem.'},
    {id:'p4',name:'Audit pojistných smluv',health:'Dokončeno',client:'Kolářová & partneři',phase:'Dokončeno',total:14,done:14,due:'2026-09-10',owner:'BS',budget:'60 000 Kč',created:'3. 6. 2026',why:'',desc:'Revize stávajících pojistných smluv klienta.'},
    {id:'p5',name:'Webová prezentace – redesign',health:'Pozastaveno',client:'Dušek Trading',phase:'Pozastaveno',total:9,done:4,due:'2027-01-10',owner:'RP',budget:'120 000 Kč',created:'10. 7. 2026',why:'',desc:'Nový web klienta, pozastaveno do rozhodnutí o rozpočtu.'},
    {id:'p6',name:'Konzultace – nastavení CRM',health:'V riziku',client:'Interní',phase:'Probíhá',total:5,done:2,due:'2026-10-05',owner:'TH',budget:'—',created:'25. 8. 2026',why:'1 úkol po termínu',desc:'Interní nastavení CRM pro nové pobočky.'},
  ];
  // Vzorové kontakty s vyplněnými všemi údaji
  contacts.push({id:'kamila',type:'osoba',first:'Kamila',last:'Růžičková',name:'Kamila Růžičková',titleBefore:'Ing.',titleAfter:'Ph.D.',photo:'assets/img/anna.png',status:'Aktuální',rel:'Partner',rating:5,act:'2026-09-14',actType:'meet',owner:'AN',managers:['PS','BS'],sharedWith:['JD'],phone:'+420 608 214 730',mobile:'+420 731 552 118',email:'kamila.ruzickova@zeleny-dvur.example',web:'www.kamilaruzickova.example',linkedin:'linkedin.com/in/kamila-ruzickova',skype:'kamila.ruzickova',city:'Brno',birth:'22. 6. 1985',rc:'855622/1234',gender:'Žena',bank:'2401234567/2010',tags:['VIP zákazník','Doporučení','Osobně','Servis'],personal:['Preferuje ranní schůzky','Běhá maratony'],active:true,called:'2026-09-14',callRes:'Schůzka',
    addresses:[{id:'a1',type:'Trvalé bydliště',def:true,street:'Lipová 42',city:'Brno',zip:'602 00',region:'Jihomoravský',state:'Česká republika'},{id:'a2',type:'Korespondenční adresa',street:'Údolní 11',city:'Brno',zip:'602 00',region:'Jihomoravský',state:'Česká republika'},{id:'a3',type:'Pobočka',street:'Palackého 7',city:'Olomouc',zip:'779 00',region:'Olomoucký',state:'Česká republika'}],
    docs:{op:true,driver:true,passport:true,other:true},opNo:'209384756',opFrom:'4. 2. 2021',opTo:'4. 2. 2031',opBy:'Magistrát města Brna',
    consents:{commercial:'Povoleno',marketing:'Udělen',profiling:'Udělen',personal:'Udělen'},newsletter:true,
    
    custom:{f1:'Klíčový partner',f2:'Enterprise',f3:'Správa nemovitostí'},
    extra:{rodinny:'Vdaná',deti:'1',status:'Podnikatelka',obor:'Reality a správa nemovitostí',smluvni:'Jednatelka: Zelený Dvůr Reality s.r.o.',pozn:'Rozhoduje o všech smlouvách nad 100 000 Kč.'},
    links:[{name:'Zelený Dvůr Reality s.r.o.',role:'Jednatelka',org:1},{name:'Anna Nová',role:'Obchodní partnerka'},{name:'Javor s.r.o.',role:'Konzultantka',org:1}],
    meta:{priority:'Vysoká',potential:'Vysoký',risk:'Nízká',team:'Sales Brno',internal:'Doporučila nám tři další klienty.',intId:'PER-2026-000412',extId:'EXT-771204',accId:'ACC-660187',source:'Doporučení',campaign:'Partnerský program 2026',segment:'B2B / Reality',prefChannel:'E-mail',prefTime:'Dopoledne',how:'Vykat, věcně a s čísly.',greeting:'Dobrý den, paní inženýrko',when:'Psát e-mail, volat po domluvě.',whenNo:'Nevolat v pátek odpoledne',callHint:'Raději e-mail · ne v pátek odp.',prefs:['E-mail','Dopoledne','Pátek odpoledne nevolat','Čeština','Angličtina'],consentDate:'3. 2. 2026',consentSource:'Písemně',consentUntil:'3. 2. 2029'},
    integrations:[['G','Google Contacts','kamila.ruzickova@zeleny-dvur.example · Synchronizováno: E-mail, Telefon, Organizace','Synchronizováno','14. 9. 2026, 8:30'],['M','Mailchimp','kamila.ruzickova@zeleny-dvur.example · Audience: Partneři','Synchronizováno','14. 9. 2026, 8:30'],['O','Microsoft Outlook','kamila.ruzickova@zeleny-dvur.example · Kalendář a e-maily','Synchronizováno','14. 9. 2026, 8:30']],
    history:[{who:'AN',f:'Správce kontaktu',t:'Přidal Barboru Sedláčkovou jako správkyni kontaktu.',d:'14. 9. 2026, 9:40'},{who:'PS',f:'Štítek',t:'Přidala štítek „VIP zákazník“ ke kontaktu.',d:'10. 9. 2026, 15:12'},{who:'AN',f:'Telefon',t:'Změnil telefon z „+420 608 214 700“ na „+420 608 214 730“.',d:'2. 9. 2026, 11:20'},{who:'PS',f:'Dokument',t:'Nahrála pas a řidičský průkaz.',d:'20. 8. 2026, 10:05'},{who:'BS',f:'Sdílení',t:'Sdílela kontakt: Jana Dvořáková.',d:'12. 8. 2026, 9:00'},{who:'AN',f:'Vytvoření kontaktu',t:'Vytvořil kontakt ručně.',d:'3. 2. 2026, 14:30'}],
    timeline:[{g:'14. září 2026',k:'Schůzka',ic:'people',b:'Proběhlo',d:'14. 9. 2026, 9:00',t:'Revize smlouvy o správě',x:'Prošli jsme podmínky a další postup. Kamila chce upravit výpovědní lhůtu.',who:'AN'},{g:'14. září 2026',k:'Poznámka',ic:'note-text',d:'14. 9. 2026, 9:45',t:'Požadavek na úpravu smlouvy',x:'Připravit návrh s tříměsíční výpovědní lhůtou.',who:'AN'},{g:'10. září 2026',k:'E-mail',ic:'sms',d:'10. 9. 2026, 13:20',t:'Podklady ke smlouvě',x:'Odeslány podklady a aktuální ceník.',who:'PS'},{g:'2. září 2026',k:'Hovor',ic:'call',b:'Proběhlo',d:'2. 9. 2026, 11:00',t:'Odchozí hovor, 8 min 05 s',x:'Domluven termín schůzky na 14. 9.',who:'AN'},{g:'Starší',k:'Úkol',ic:'task-square',d:'20. 8. 2026, 10:00',t:'Úkol dokončen: Ověřit doklady',x:'Doklady jsou ověřené a nahrané.',who:'PS'},{g:'Starší',k:'Systém',ic:'setting-2',d:'3. 2. 2026',t:'Kontakt vytvořen',x:'Kontakt byl přidán ručně.',who:'AN'}]});
  contacts.push({id:'zdvur',type:'organizace',name:'Zelený Dvůr Reality s.r.o.',photo:"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2088%2088%22%3E%3Crect%20width%3D%2288%22%20height%3D%2288%22%20fill%3D%22%23fff%22%2F%3E%3Cpath%20d%3D%22M44%2016C26%2026%2020%2044%2028%2066c22-4%2036-20%2036-46-8-2-14-2-20-4Z%22%20fill%3D%22%232f9e6e%22%2F%3E%3Cpath%20d%3D%22M28%2066C36%2050%2044%2040%2056%2030%22%20stroke%3D%22%23fff%22%20stroke-width%3D%223%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%3C%2Fsvg%3E",ico:'27654321',dic:'CZ27654321',form:'s.r.o.',status:'Aktuální',rel:'Odběratel',rating:4,act:'2026-09-14',actType:'call',owner:'PS',managers:['AN','TH'],sharedWith:['JD','BS'],phone:'+420 541 220 118',mobile:'+420 731 220 119',email:'info@zeleny-dvur.example',web:'www.zeleny-dvur.example',linkedin:'linkedin.com/company/zeleny-dvur',skype:'zeleny.dvur',city:'Brno',tags:['VIP zákazník','Servis','Praha'],personal:['Fakturace vždy k 15. dni'],active:true,called:'2026-09-14',callRes:'Později',
    addresses:[{id:'a1',type:'Sídlo',def:true,street:'Údolní 11',city:'Brno',zip:'602 00',region:'Jihomoravský',state:'Česká republika'},{id:'a2',type:'Korespondenční adresa',street:'P. O. Box 214',city:'Brno',zip:'601 00',region:'Jihomoravský',state:'Česká republika'},{id:'a3',type:'Pobočka',street:'Vinohradská 88',city:'Praha',zip:'130 00',region:'Hlavní město Praha',state:'Česká republika'}],
    docs:{op:false,driver:false,passport:false,other:false},
    consents:{commercial:'Povoleno',marketing:'Udělen',profiling:'Neudělen',personal:'Udělen'},newsletter:true,
    
    custom:{f1:'Strategický zákazník',f2:'Enterprise',f3:'Saver CRM'},
    extra:{empl:'48',turn:'62 000 000 Kč',obor:'Reality a správa nemovitostí',smluvni:'Rámcová smlouva 2026-021',pozn:'Rozšiřují pobočku v Praze.'},
    links:[{name:'Kamila Růžičková',role:'Jednatelka'},{name:'Javor s.r.o.',role:'Dodavatel',org:1},{name:'Anna Nová',role:'Kontaktní osoba'}],
    meta:{priority:'Vysoká',potential:'Vysoký',risk:'Střední',team:'Sales Brno',internal:'Platí včas, chtějí roční vyhodnocení.',intId:'ORG-2026-000093',extId:'EXT-554018',accId:'ACC-310922',source:'Veletrh',campaign:'Podzimní akvizice 2026',segment:'B2B / Reality',prefChannel:'Telefon',prefTime:'Odpoledne',how:'Vykat, přes jednatelku.',greeting:'Dobrý den, paní Růžičková',when:'Volat odpoledne.',whenNo:'Nevolat v pondělí dopoledne',callHint:'Volat odpoledne · ne v po dop.',prefs:['Telefon','Odpoledne','Pondělí dopoledne nevolat','Čeština'],consentDate:'18. 3. 2026',consentSource:'Webový formulář',consentUntil:'18. 3. 2029'},
    integrations:[['G','Google Contacts','info@zeleny-dvur.example · Synchronizováno: E-mail, Telefon','Synchronizováno','14. 9. 2026, 8:30'],['A','Účetní systém','Odběratel 310922 · Faktury a platby','Synchronizováno','14. 9. 2026, 6:00'],['O','Microsoft Outlook','info@zeleny-dvur.example · Vypršelo přihlášení','Chyba synchronizace','12. 9. 2026, 18:00']],
    history:[{who:'PS',f:'Správce kontaktu',t:'Přidala Terezu Horákovou jako správkyni kontaktu.',d:'11. 9. 2026, 10:10'},{who:'PS',f:'IČO',t:'Doplnila IČO z registru. Odesláno upozornění.',d:'18. 3. 2026, 9:30'},{who:'AN',f:'Štítek',t:'Přidal štítek „Servis“ ke kontaktu.',d:'6. 3. 2026, 13:00'},{who:'AN',f:'Vytvoření kontaktu',t:'Vytvořil kontakt ručně.',d:'4. 3. 2026, 11:15'}],
    timeline:[{g:'14. září 2026',k:'Hovor',ic:'call',b:'Proběhlo',d:'14. 9. 2026, 8:40',t:'Příchozí hovor, 3 min 10 s',x:'Chtějí rozšířit licence pro pražskou pobočku.',who:'PS'},{g:'8. září 2026',k:'Schůzka',ic:'people',b:'Proběhlo',d:'8. 9. 2026, 10:00',t:'Roční vyhodnocení',x:'Prošli jsme využití systému a plán na další rok.',who:'PS'},{g:'Starší',k:'E-mail',ic:'sms',d:'20. 8. 2026, 9:10',t:'Faktura 2026-118',x:'Odeslána faktura za licence.',who:'AN'},{g:'Starší',k:'Systém',ic:'setting-2',d:'4. 3. 2026',t:'Kontakt vytvořen',x:'Kontakt byl přidán po veletrhu.',who:'AN'}]});
  const T=(id,title,cat,due,time,who,contact,project,done,desc)=>({id,title,cat,due,time,who,contact,project,done:!!done,desc:desc||'',prio:'Střední',by:'TH',created:'7. 9. 2026'});
  const tasks=[
    T('t1','Objednat podlahové krytiny','Materiál','2026-09-13','','AN',null,'p1'),
    T('t2','Doplnit chybějící údaje ke smlouvě','Dokument','2026-09-13','','AN','anna',null),
    T('t3','Odeslat kupní smlouvu ke kontrole','Dokument','2026-09-11','','JD','Petr Svoboda','p2'),
    T('t4','Nastavit přístupy do CRM','Administrativa','2026-09-10','','JD',null,'p6'),
    T('t5','Domluvit termín s elektrikářem','Realizace','2026-09-14','14:00','PS','anna','p1',0,'Domluvit s elektrikářem přesný termín nové elektroinstalace v kancelářích tak, aby navazovala na harmonogram ostatních řemesel. Potvrdit rozsah prací a případně upřesnit požadavky na umístění zásuvek a osvětlení.'),
    T('t6','Připravit prezentaci pro klienta','Kontrola','2026-09-14','','BS',null,'p3'),
    T('t7','Potvrdit termín podpisu smlouvy','Hovor','2026-09-14','14:00','PS','anna',null,0,'Domluvit termín podpisu s Annou Novou, jednatelkou Javor s.r.o.'),
    T('t8','Projít podmínky spolupráce','Kontrola','2026-09-14','17:00','AN','anna',null),
    T('t9','Zkontrolovat kvalitu maleb','Kontrola','2026-09-14','17:00','AN',null,'p1'),
    T('t10','Připravit podklady pro předání prostor','Administrativa','2026-09-18','','PS','anna','p1'),
    T('t11','Zajistit prohlídku bytu se zájemcem','Administrativa','2026-09-22','','JD','Petr Svoboda','p2'),
    T('t12','Aktualizovat ceník služeb','Administrativa','2026-09-30','','TH',null,null),
    T('t13','Připravit podklady pro hovor','E-mail','2026-09-18','','PS','anna',null),
    T('t14','Ověřit preferovaný způsob komunikace','Kontrola','','','AN','anna',null),
    T('t15','Připravit shrnutí za třetí čtvrtletí','Materiál','','','JD',null,null),
    T('t16','Projít nové zákaznické recenze','Materiál','','','RP',null,null),
    T('t17','Odstranit starý nábytek','Realizace','2026-09-09','','AN',null,'p1',1),
    T('t18','Odeslat nabídku klientovi','Dokument','2026-09-10','','JD',null,'p2',1),
    T('t19','Naplánovat kampaň na sociálních sítích','Administrativa','2026-09-11','','BS',null,'p3',1),
    T('t20','Zaslat úvodní e-mail s podklady','E-mail','2026-09-08','','AN','anna',null,1),
    T('t21','Aktualizovat kontaktní údaje v systému','Administrativa','2026-09-13','','AN','anna',null,1),
  ];
  tasks.push(T('t90','Připravit návrh smlouvy s novou výpovědní lhůtou','Dokument','2026-09-16','','AN','kamila',null,0,'Tříměsíční výpovědní lhůta podle schůzky.'),T('t91','Zavolat kvůli pražské pobočce','Hovor','2026-09-18','14:00','PS','zdvur',null,0,'Rozsah licencí pro novou pobočku.'),T('t92','Ověřit doklady','Kontrola','2026-08-20','','PS','kamila',null,1,''),T('t93','Odeslat roční vyhodnocení','E-mail','2026-09-15','','AN','zdvur',null,0,''));
  const coWork={t4:['TR'],t5:['LM'],t6:['KB'],t10:['IK'],t11:['LM']};tasks.forEach(t=>t.team=coWork[t.id]||[]);
  const U=(ini,name,state,last,av,pos,br,boss,g)=>({id:ini,ini,name,state,last,avail:av,pos,branch:br,boss,g:g||'f'});
  const users=[
    U('PN','Petra Nováková','Aktivní','14. 9. 2026','Dostupná','Ředitelka','Praha',''),
    U('JD','Jana Dvořáková','Aktivní','14. 9. 2026','Přestávka','Obchodní ředitelka','Brno','PN'),
    U('TH','Tereza Horáková','Aktivní','14. 9. 2026','Dostupná','Makléřka','Praha','JD'),
    U('MK','Michal König','Aktivní','10. 9. 2026','Dovolená','Makléř','Zlín','JD','m'),
    U('BS','Barbora Sedláčková','Aktivní','14. 9. 2026','Dostupná','Makléřka','Brno','JD'),
    U('RP','Radek Procházka','Aktivní','11. 9. 2026','Offline','Makléř','Ostrava','JD','m'),
    U('KB','Klára Bartošová','Aktivní','14. 9. 2026','Dostupná','Pracovnice call centra','Praha','PN'),
    U('FD','Filip Dušek','Aktivní','14. 9. 2026','Přestávka','Pracovník call centra','Praha','KB','m'),
    U('IK','Ivana Kolářová','Aktivní','14. 9. 2026','Dostupná','Sekretářka','Praha','PN'),
    U('LM','Lucie Marešová','Aktivní','13. 9. 2026','Dostupná','Asistentka obchodu','Brno','PN'),
    U('OB','Ondřej Beneš','Aktivní','14. 9. 2026','Dostupná','Specialista pojištění','Zlín','PN','m'),
    U('SV','Simona Vaňková','Pozvaný','Nikdy','—','HR manažerka','Praha','PN'),
    U('TR','Tomáš Rychlý','Aktivní','14. 9. 2026','Dostupná','IT správce','Praha','PN','m'),
    U('EK','Eliška König','Neaktivní','28. 3. 2026','Offline','Makléřka','Ostrava','PN'),
    U('PS','Petra Svobodová','Aktivní','14. 9. 2026','Dostupná','Obchodní ředitelka','Brno','JD'),
    U('AN','Alena Novotná','Aktivní','14. 9. 2026','Dostupná','Správkyně kontaktů','Brno','JD'),
  ];
  users.find(u=>u.id==='JD').avail='Dostupná'; // Pohled z rána, přestávka je jen ukázka v Docházce.
  users.find(u=>u.id==='PS').avail='Přestávka';
  // Profil: kontakt, pracovní doba, specializace, certifikace, nástup, role v systému
  const UX={PN:{start:'2016-03-01',spec:'Vedení společnosti',lang:'Angličtina, Němčina',region:'Celá ČR'},
    JD:{start:'2019-06-01',spec:'Obchod, Hypotéky',lang:'Angličtina',region:'Jihomoravský kraj',certs:[['Certifikace ČNB – zprostředkovatel hypoték','2026-11-30']]},
    TH:{start:'2021-04-03',phone:'+420 601 234 567',mobile:'+420 731 234 567',contract:'Externí spolupracovník (OSVČ)',spec:'Hypotéky, Pojištění',lang:'Angličtina',region:'Praha-východ',certs:[['Makléřská zkouška (MŠMT)',''],['Certifikace ČNB – zprostředkovatel hypoték','2027-12-31'],['Člen asociace realitních kanceláří API ČR','']]},
    MK:{start:'2022-01-10',spec:'Prodej bytů',lang:'Němčina',region:'Zlínský kraj',awayTo:'2026-09-25',sub:{who:'BS',from:'2026-09-14',to:'2026-09-25'},certs:[['Certifikace ČNB – zprostředkovatel pojištění','2026-08-31']]},
    BS:{start:'2024-05-01',spec:'Pronájmy',region:'Brno'},RP:{start:'2023-09-01',region:'Moravskoslezský kraj'},
    PS:{start:'2020-09-01',spec:'Firemní klienti',lang:'Angličtina',region:'Brno',certs:[['Certifikace ČNB – zprostředkovatel hypoték','2028-03-31']]},
    AN:{start:'2023-02-01',spec:'Správa kontaktů, Import dat',lang:'Angličtina',region:'Brno',hours:'Po–Pá 8:00–16:30, pátek home office'},
    KB:{start:'2022-03-01'},EK:{start:'2020-02-01'}};
  const asc=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  users.forEach((u,i)=>{const reps=users.some(x=>x.boss===u.id);Object.assign(u,{email:asc(u.name).replace(' ','.')+'@saver.example',phone:'+420 601 000 '+(100+i),mobile:'',hours:'Po–Pá 8:00–16:30',contract:'Zaměstnanec',start:'2023-02-01',spec:'',lang:'',region:'',certs:[],
    role:u.id==='PN'?'Administrátor':reps?'Nadřízený':['IK','LM'].includes(u.id)?'Asistentka':'Uživatel'},UX[u.id]||{});});
  // Docházka: měsíční matice z 1263:2, září 2026
  const row=s=>s.split('');
  const attendance={
    TH:row('PPPP..PZPPP..P'),JD:row('PPPP..PPPPN..P'),MK:row('PPPP..PPPPD..D'),PS:row('PZPP..PPPPP..P'),RP:row('PPPP..PPPPP..N'),BS:row('PPPP..PPPPP..Z'),
  };
  const notifications=[
    {id:'n1',m:'Alena Novotná exportovala 864 kontaktů',d:'dnes 9:12',k:'Export většího množství',un:true,to:'manager',go:'#/uzivatel/AN/prehled'},
    {id:'n2',m:'Alena Novotná má 2 úkoly po termínu',d:'dnes 8:00',k:'Tým',un:true,to:'manager',go:'#/ukoly'},
    {id:'n3',m:'Výročí nastoupení: Tereza Horáková za měsíc',d:'dnes',k:'Výročí',un:false,to:'manager',go:'#/uzivatel/TH/prehled'},
    {id:'n4',m:'Úkol „Doplnit chybějící údaje ke smlouvě“ je po termínu',d:'dnes 8:00',k:'Úkoly',un:true,to:'user',go:'#/ukol/t2'},
    {id:'n5',m:'Petra Svobodová s vámi sdílela kontakt Anna Nová',d:'včera 16:40',k:'Sdílení',un:true,to:'user',go:'#/kontakt/anna/zakladni'},
    {id:'n6',m:'Dnes má narozeniny Martin Kříž',d:'dnes',k:'Narozeniny',un:false,to:'user',go:'#/kontakty/osoby'},
  ];
  // Rodina Anny Nové: propojené kontakty musí existovat, aby šly otevřít
  [['Pavel','Nový'],['Ema','Nová'],['Filip','Nový']].forEach(([f,l],i)=>contacts.push({id:'c'+(++n),type:'osoba',first:f,last:l,name:f+' '+l,status:'Aktuální',rel:'Partner',rating:3,act:'2026-08-20',actType:'call',owner:'PS',phone:'+420 777 123 4'+(70+i),tags:[],sharedWith:[],email:ascii(f)+'.'+ascii(l)+'@example.cz',city:'Brno',personal:[],active:true,called:null,callRes:null}));
  contacts.forEach(c=>(c.links||[]).forEach(l=>{if(!l.id)l.id=(contacts.find(x=>x.name===l.name)||{}).id||null;}));
  contacts.forEach(c=>(c.links||[]).slice().forEach(l=>{const t=contacts.find(x=>x.id===l.id);if(t)linkBack(c,t,l.role);}));
  const byName=n=>(contacts.find(c=>c.name===n)||{}).id||null;
  const bd={'Jana Pokorná':'09-14','Pavel Mareš':'09-14','Tomáš Dvořák':'09-16','Lucie Černá':'09-18','Martin Kříž':'09-14','Filip Horák':'09-03','Hana Blažková':'09-22','Eva Procházková':'09-28','Petr Beneš':'10-05','Anna Nová':'03-15','Lenka Veselá':'09-09'};Object.entries(bd).forEach(([n,d])=>{const c=contacts.find(x=>x.name===n);if(c)c.birthday=d;});
  const E=(id,title,type,date,start,end,who,contact,place,status)=>({id,title,type,date,start,end,who,contact:contact?byName(contact):null,place:place||'',status:status||(date<TODAY?'Proběhlá':'Naplánovaná')});
  const events=[
    E('e1','Hovor: Filip Horák','Hovor','2026-09-14','9:00','9:30',['AN'],'Filip Horák','','Proběhlá'),
    E('e2','Schůzka: Marek Šimek','Schůzka','2026-09-14','11:30','12:30',['AN'],'Marek Šimek','Praha, kancelář'),
    E('e3','Schůzka: Petr Beneš','Schůzka','2026-09-14','15:00','16:00',['AN'],'Petr Beneš','Online'),
    E('e4','Hovor: Anna Nová','Hovor','2026-09-18','10:00','10:30',['PS','AN'],'Anna Nová',''),
    E('e5','Prohlídka bytu Vinohrady','Schůzka','2026-09-22','16:00','17:00',['JD'],'Petr Svoboda','Vinohrady'),
    E('e6','Podpis smlouvy 2026-014','Schůzka','2026-09-27','10:00','11:00',['PS'],'Anna Nová','Brno, Javorová 18'),
    E('e7','Porada týmu','Událost','2026-09-14','8:30','9:15',['JD','AN','PS','BS','TH'],null,'Zasedačka Brno','Proběhlá'),
    E('e8','Pohovor: nový makléř','Schůzka','2026-09-14','11:00','12:00',['JD'],null,'Brno, zasedačka'),
    E('e9','Hovor: Petr Svoboda','Hovor','2026-09-14','14:00','14:30',['JD'],'Petr Svoboda','Prodej bytu Vinohrady'),
    E('e10','Přehled plnění plánu','Událost','2026-09-14','16:30','17:00',['JD','PN'],null,''),
    E('e11','Online demo produktu','Schůzka','2026-09-11','9:15','10:00',['PS'],'Anna Nová','Online'),
    E('e12','Schůzka: David Král','Schůzka','2026-09-15','10:00','11:00',['AN'],'David Král','Praha, kancelář'),
    E('e13','Schůzka: Tomáš Dvořák','Schůzka','2026-09-09','13:00','14:00',['AN'],'Tomáš Dvořák','Praha','Neuskutečněná'),
    E('e14','Hovor: Lucie Černá','Hovor','2026-09-16','9:00','9:15',['AN'],'Lucie Černá',''),
    E('e15','Porada týmu','Událost','2026-09-21','8:30','9:15',['JD','AN','PS','BS','TH'],null,'Zasedačka Brno'),
    E('e16','Schůzka: Eva Procházková','Schůzka','2026-09-17','14:00','15:30',['AN','PS'],'Eva Procházková','Online'),
    E('e17','Předání prostor Javor','Schůzka','2026-09-30','9:00','11:00',['TH','AN'],'Anna Nová','Brno'),
    E('e18','Hovor: Martin Kříž','Hovor','2026-09-07','11:00','11:15',['AN'],'Martin Kříž',''),
    E('e19','Schůzka: Hana Blažková','Schůzka','2026-09-03','10:00','11:00',['PS'],'Hana Blažková','Brno'),
    E('e20','Školení CRM','Událost','2026-09-24','13:00','15:00',['AN','BS','TH','RP'],null,'Online'),
  ];
  events.push(E('e90','Schůzka: Kamila Růžičková','Schůzka','2026-09-21','9:00','10:00',['AN'],'Kamila Růžičková','Brno, Údolní 11'),E('e91','Hovor: Zelený Dvůr Reality','Hovor','2026-09-18','14:00','14:30',['PS'],'Zelený Dvůr Reality s.r.o.','Telefon'));
  const DL=(id,title,cn,owner,phase,value,prob,close,next,role,x)=>Object.assign({id,title,contact:byName(cn),owner,phase,value,prob,close,next:next||'',role:role||'',state:'open',co:null,log:[{who:owner,t:'Vytvořen.',d:'1. 9. 2026'}]},x||{});
  const WON=(c,d)=>({state:'won',closed:d,prob:100,close:d}),LOST=(d,r)=>({state:'lost',closed:d,prob:0,close:d,reason:r});
  const deals=[
    DL('d1','Implementace Saver CRM','Anna Nová','PS','Vyjednávání',250000,70,'2026-09-30','Domluvit schůzku k finální nabídce.','Rozhodovatel'),
    DL('d2','Rozšíření uživatelských licencí','Anna Nová','AN','Kvalifikace',90000,40,'2026-10-15','Poslat cenovou kalkulaci pro rozšířený tým.','Doporučitel'),
    DL('d3','Konzultační projekt Q4','Anna Nová','PS','Analýza potřeb',80000,25,'','Naplánovat úvodní konzultační hovor.','Kontaktní osoba'),
    DL('d4','Nabídka 2026-032','Anna Nová','PS','Nabídka',90000,50,'2026-09-25','Čeká se na reakci.'),
    DL('d5','Smlouva 2026-014','Anna Nová','PS','Smlouva',250000,90,'2026-09-27','Podpis smlouvy.'),
    DL('d6','Roční licence Saver CRM','Anna Nová','AN','Smlouva',180000,100,'',null,null,WON(0,'2026-09-05')),
    DL('d7','Školení týmu','Anna Nová','PS','Smlouva',120000,100,'',null,null,WON(0,'2026-06-12')),
    DL('d8','Migrace dat','Anna Nová','PS','Smlouva',140000,100,'',null,null,WON(0,'2026-05-20')),
    DL('d9','Podpora 2025','Anna Nová','PS','Smlouva',100000,100,'',null,null,WON(0,'2025-12-10')),
    DL('d10','Úvodní audit','Anna Nová','PS','Smlouva',100000,100,'',null,null,WON(0,'2025-10-02')),
    DL('d11','Doplňkové moduly','Anna Nová','PS','Nabídka',60000,0,'',null,null,LOST('2026-04-15','Cena')),
    DL('d12','Pilot pro pobočku','Anna Nová','AN','Nabídka',35000,0,'',null,null,LOST('2026-09-08','Načasování')),
    DL('d13','Nabídka pro Davida Krále','David Král','AN','Nabídka',60000,50,'2026-09-29','Zavolat po odeslání nabídky.'),
    DL('d14','Smlouva Marek Šimek','Marek Šimek','AN','Smlouva',150000,85,'2026-09-12','Doplnit přílohy.'),
    DL('d15','Nabídka Petr Beneš','Petr Beneš','AN','Nabídka',45000,40,'2026-10-02','Probrat na schůzce.'),
    DL('d16','Prodej bytu Vinohrady','Petr Svoboda','JD','Vyjednávání',60000,60,'2026-11-15','Prohlídka se zájemcem.'),
    DL('d17','Správa nemovitosti','Petr Svoboda','JD','Smlouva',120000,100,'',null,null,WON(0,'2026-09-02')),
    DL('d18','Rámcová smlouva Hana Blažková','Hana Blažková','TH','Nabídka',120000,50,'2026-10-05','Upravit podmínky.'),
    DL('d19','Smlouva Eva Procházková','Eva Procházková','BS','Smlouva',200000,80,'2026-10-01','Podpis.','',{co:{who:'PS',pct:30}}),
    DL('d20','Javor Servis: servisní smlouva','Javor Servis s.r.o.','RP','Nabídka',75000,30,'2026-10-20','Ověřit rozpočet.'),
    DL('d21','Zakázka Lenka Veselá','Lenka Veselá','PS','Smlouva',160000,100,'',null,null,WON(0,'2026-09-04')),
    DL('d22','Zakázka Tereza Malá','Tereza Malá','TH','Smlouva',140000,100,'',null,null,WON(0,'2026-09-07')),
    DL('d23','Zakázka Jana Pokorná','Jana Pokorná','BS','Smlouva',90000,100,'',null,null,WON(0,'2026-09-09')),
    DL('d24','Zakázka Tomáš Dvořák','Tomáš Dvořák','RP','Smlouva',50000,100,'',null,null,WON(0,'2026-09-10')),
    DL('d25','Zakázka Alena Vaňková','Alena Vaňková','MK','Smlouva',20000,100,'',null,null,WON(0,'2026-09-03')),
  ];
  const DOC=(id,title,type,file,state,cn,deal,owner,added,x)=>Object.assign({id,title,type,file,state,contact:cn?byName(cn):null,deal,owner,added,version:1,number:'',valid:'',links:[],log:[{who:owner,t:'Nahráno.',d:fmtIso(added)}],active:true},x||{});
  const fmtIso=s=>{const[y,m,d]=s.split('-');return +d+'. '+(+m)+'. '+y;};
  const documents=[
    DOC('doc1','Smlouva 2026-014','Smlouva','PDF','Čeká na podpis','Anna Nová','d5','PS','2026-09-12',{number:'2026-014',version:2,valid:'2026-09-27',links:['doc5','doc2']}),
    DOC('doc2','Nabídka 2026-032','Nabídka','PDF','Čeká na reakci','Anna Nová','d4','PS','2026-09-10',{number:'2026-032',valid:'2026-09-25',links:['doc1']}),
    DOC('doc3','Občanský průkaz','Doklad','JPG','Nahráno','Anna Nová',null,'PS','2026-09-08',{valid:'2030-03-15',sensitive:true}),
    DOC('doc4','Souhlas se zpracováním osobních údajů','Souhlas','PDF','Podepsáno','Anna Nová',null,'PS','2026-09-01',{valid:'2026-09-30'}),
    DOC('doc5','Záznam z jednání 11. 9.','Záznam z jednání','DOCX','Nahráno','Anna Nová','d1','PS','2026-09-11',{links:['doc1']}),
    DOC('doc6','Smlouva 2026-018','Smlouva','PDF','Čeká na podpis','Marek Šimek','d14','AN','2026-09-09',{number:'2026-018',valid:'2026-09-30'}),
    DOC('doc7','Nabídka 2026-040','Nabídka','PDF','Čeká na reakci','David Král','d13','AN','2026-09-13',{number:'2026-040',valid:'2026-10-13'}),
    DOC('doc8','Nabídka 2026-041','Nabídka','PDF','Nahráno','Petr Beneš','d15','AN','2026-09-14',{number:'2026-041',valid:'2026-11-14'}),
    DOC('doc9','Fotky bytu Vinohrady','Ostatní','JPG','Nahráno','Petr Svoboda','d16','JD','2026-09-05'),
    DOC('doc10','Kupní smlouva Vinohrady','Smlouva','PDF','Čeká na podpis','Petr Svoboda','d16','JD','2026-09-07',{number:'2026-022'}),
    DOC('doc11','Rámcová nabídka','Nabídka','PDF','Čeká na reakci','Hana Blažková','d18','TH','2026-09-03',{number:'2026-035',valid:'2026-10-03'}),
    DOC('doc12','Smlouva 2026-025','Smlouva','PDF','Podepsáno','Eva Procházková','d19','BS','2026-08-28',{number:'2026-025'}),
    DOC('doc13','Ceník služeb 2026','Ostatní','XLSX','Nahráno',null,null,'AN','2026-08-15'),
    DOC('doc14','Záznam z jednání 8. 9.','Záznam z jednání','DOCX','Nahráno','David Král','d13','AN','2026-09-08'),
  ];
  deals.push(DL('d90','Správa nemovitostí 2027','Kamila Růžičková','AN','Vyjednávání',320000,70,'2026-10-15','Poslat upravenou smlouvu','Rozhodovatelka'),DL('d91','Poradenství pro Olomouc','Kamila Růžičková','AN','Kvalifikace',85000,30,'2026-11-30','Domluvit rozsah','Rozhodovatelka'),DL('d92','Licence 2026','Kamila Růžičková','PS','Smlouva',140000,100,'',null,null,WON(0,'2026-08-28')),DL('d93','Školení týmu','Kamila Růžičková','AN','Nabídka',30000,0,'',null,null,LOST('2026-07-10','Vyřešili interně')),DL('d94','Licence pro pražskou pobočku','Zelený Dvůr Reality s.r.o.','PS','Nabídka',210000,60,'2026-10-31','Zavolat 18. 9.','Kupující'),DL('d95','Roční podpora','Zelený Dvůr Reality s.r.o.','AN','Analýza potřeb',75000,40,'2026-12-15','Odeslat vyhodnocení','Kupující'),DL('d96','Implementace Saver CRM','Zelený Dvůr Reality s.r.o.','PS','Smlouva',260000,100,'',null,null,WON(0,'2026-03-30')));
  documents.push(DOC('doc90','Občanský průkaz','Doklad','JPG','Nahráno','Kamila Růžičková',null,'PS','2026-08-20',{number:'209384756',valid:'2031-02-04',sensitive:true}),DOC('doc91','Řidičský průkaz','Doklad','JPG','Nahráno','Kamila Růžičková',null,'PS','2026-08-20',{number:'EK 481205',valid:'2033-05-11',sensitive:true}),DOC('doc92','Cestovní pas','Doklad','PDF','Nahráno','Kamila Růžičková',null,'PS','2026-08-20',{number:'41928375',valid:'2030-09-30',sensitive:true}),DOC('doc93','Plná moc','Doklad','PDF','Nahráno','Kamila Růžičková',null,'AN','2026-09-01',{sensitive:true}),DOC('doc94','Smlouva o správě 2026-040','Smlouva','PDF','Čeká na podpis','Kamila Růžičková','d90','AN','2026-09-12',{number:'2026-040',version:2,valid:'2026-10-15'}),DOC('doc95','Souhlas se zpracováním údajů','Souhlas','PDF','Podepsáno','Kamila Růžičková',null,'AN','2026-02-03'),DOC('doc96','Záznam ze schůzky 14. 9.','Záznam z jednání','DOCX','Nahráno','Kamila Růžičková','d90','AN','2026-09-14'),DOC('doc97','Rámcová smlouva 2026-021','Smlouva','PDF','Podepsáno','Zelený Dvůr Reality s.r.o.','d96','PS','2026-03-30',{number:'2026-021',valid:'2029-03-30'}),DOC('doc98','Nabídka 2026-077','Nabídka','PDF','Čeká na reakci','Zelený Dvůr Reality s.r.o.','d94','PS','2026-09-10',{number:'2026-077',valid:'2026-10-10'}),DOC('doc99','Výpis z obchodního rejstříku','Ostatní','PDF','Nahráno','Zelený Dvůr Reality s.r.o.',null,'AN','2026-03-04'),DOC('doc100','Záznam z vyhodnocení 8. 9.','Záznam z jednání','DOCX','Nahráno','Zelený Dvůr Reality s.r.o.',null,'PS','2026-09-08'));
  contacts.find(c=>c.id==='kamila').birthday='06-22';
  const settings={phases:['Kvalifikace','Analýza potřeb','Nabídka','Vyjednávání','Smlouva'],names:{},statuses:['Aktuální','Potenciální','Odložený','Nezajímavý'],tags:['VIP zákazník','Osobně','Doporučení','Veletrh','Servis','Praha'],fields:[{id:'f1',n:'Interní typ kontaktu',t:'Text',on:true},{id:'f2',n:'Zákaznická skupina',t:'Výběr',on:true},{id:'f3',n:'Preferovaný produkt',t:'Text',on:true}],notif:{},perm:{}};
  notifications.push({id:'n7',m:'Dnes má svátek Radka Fialová',d:'dnes',k:'Svátek',un:true,to:'user',go:'#/kontakty/osoby'});
  return {documents,deals,events,settings,contacts,tasks,projects,users,attendance,notifications,checkIn:{inFrom:'8:02',out:null},hidden:[],recent:[],plan:{hide:false},absences:[]};
};
