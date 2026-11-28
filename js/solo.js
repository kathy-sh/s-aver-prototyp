// Vzorový uživatel OSVČ (návrh 28. 11. 2026, jen v prototypu): Viktor Horák, finanční poradce, pracuje sám.
// Má vlastní účet a vlastní data (localStorage klíč …-osvc): stejné ukázkové kontakty, projekty a úkoly,
// ale všechno patří jemu, není žádný tým. Je zároveň administrátorem svého účtu, má zapnuté „Pracuji sám (OSVČ)“
// (bez schvalování a oprávnění k fakturaci) a není plátce DPH. V menu nemá Docházku ani Uživatele.

const SOLO_USER={id:'VH',ini:'VH',name:'Viktor Horák',state:'Aktivní',last:'14. 9. 2026',avail:'Dostupná',pos:'Finanční poradce',branch:'Brno',boss:'',g:'m',email:'viktor@horak-poradce.cz',phone:'+420 603 444 555'};
// Všechny odkazy na kolegy přepíše na OSVČ (jen přesné hodnoty, texty zůstávají)
function soloFix(D){const ids=new Set((D._soloIds||[]).concat((D.users||[]).map(u=>u.id)));ids.delete('VH');ids.delete('S');if(!ids.size)return;
  const walk=o=>{if(Array.isArray(o)){for(let i=0;i<o.length;i++){if(typeof o[i]==='string'&&ids.has(o[i]))o[i]='VH';else if(o[i]&&typeof o[i]==='object')walk(o[i]);}
      if(o.length&&o.every(x=>typeof x==='string')){const u=[...new Set(o)];o.length=0;o.push(...u);}return;}
    for(const k in o){const v=o[k];if(typeof v==='string'&&ids.has(v))o[k]='VH';else if(v&&typeof v==='object')walk(v);}};
  const keepUsers=D.users;D.users=[];walk(D);D.users=[SOLO_USER];
  (D.tasks||[]).forEach(t=>t.team=[]);(D.contacts||[]).forEach(c=>{c.sharedWith=[];if(c.managers)c.managers=c.managers.filter(x=>x!=='VH');});
  if(D.settings&&D.settings.rates)D.settings.rates.u={VH:1200};
  D._soloIds=[...ids];}
function seedSolo(){const D=seedData();D._soloIds=D.users.map(u=>u.id);soloFix(D);
  D.settings.org=Object.assign({},D.settings.org||{},{name:'Viktor Horák – finanční poradenství',ico:'08812345',dic:'',street:'Masarykova 24',zip:'602 00',city:'Brno',mail:'viktor@horak-poradce.cz',phone:'+420 603 444 555',web:'www.horak-poradce.cz',obor:'Finanční poradenství',lic:1,bSolo:true,invVatPayer:false,invBank:'2701234567/2010',rateDef:1200});
  D.settings.teams=[];D.solo=true;
  const ev=(id,o)=>{const e=(D.events||[]).find(x=>x.id===id);if(e)Object.assign(e,o);};
  ev('e7',{title:'Podklady pro účetní',type:'Událost',place:'Kancelář'});ev('e15',{title:'Podklady pro účetní',type:'Událost',place:'Kancelář'});
  ev('e8',{title:'Schůzka: nový klient – hypotéka',place:'Brno, kavárna Morava'});ev('e10',{title:'Kontrola plateb a faktur',place:''});ev('e20',{title:'Webinář: změny v pojištění 2027',place:'Online'});
  const p6=(D.projects||[]).find(p=>p.id==='p6');if(p6)Object.assign(p6,{name:'Administrativa a účetnictví',desc:'Vlastní administrativa, podklady pro účetní, licence a nástroje.'});
  const t4=(D.tasks||[]).find(t=>t.id==='t4');if(t4)t4.title='Připravit podklady pro účetní';
  D.notifications=[{id:'n4',m:'Úkol „Doplnit chybějící údaje ke smlouvě“ je po termínu',d:'dnes 8:00',k:'Úkoly',un:true,to:'user',go:'#/ukol/t2'},{id:'s1',m:'Anně Nové končí 30. 9. souhlas se zpracováním údajů',d:'dnes 7:00',k:'Souhlasy',un:true,to:'user',go:'#/kontakt/anna/souhlasy'},{id:'n6',m:'Dnes má narozeniny Martin Kříž',d:'dnes',k:'Narozeniny',un:false,to:'user',go:'#/kontakty/osoby'}];
  return D;}
