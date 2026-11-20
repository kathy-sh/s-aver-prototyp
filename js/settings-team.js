// Nastavení > Můj tým (nadřízený; administrátor jako vedoucí svého týmu). Návrh 16. 11. 2026 k posouzení.
// Platí jen pro přímý tým. Nadřízený nemůže povolit víc, než dovolí role (Organizace > Role a viditelnost).
const mtS=()=>{const s=SG();s.team=s.team||{};return s.team[ME]=s.team[ME]||{perm:{},appr:{},plan:{},away:''};};
const mtTeam=()=>DB.users.filter(u=>u.boss===ME&&u.state!=='Neaktivní');
const roleV=(r,k)=>{const i=ROLES.indexOf(r),p=PERMS.find(x=>x[0]===k);return DB.settings.perm[r+':'+k]||p[3][i];};
const mtDate=d=>{const [y,m,dd]=String(d).split('-');return `${+dd}. ${+m}.`;};

function secMtLide(){const T=mtTeam(),s=mtS();
  const sub=u=>u.sub&&user(u.sub.who)?`${esc(user(u.sub.who).name)}<span class="small mute" style="display:block">${mtDate(u.sub.from)} – ${mtDate(u.sub.to)}</span>`:'<span class="mute">—</span>';
  const boss=user(me().boss);
  return sCard(`Přímý tým <span class="mute" style="font-weight:400">${T.length}</span>`,`<div class="tbl-card"><table class="tbl"><thead><tr><th>Jméno</th><th>Pozice</th><th>Role</th><th>Zástup</th><th></th></tr></thead><tbody>${T.map(u=>`<tr style="cursor:default"><td><a class="row" style="gap:8px" href="#/uzivatel/${u.id}/prehled">${av(u.id)}<span class="med">${esc(u.name)}</span></a></td><td>${esc(u.pos)}</td><td>${esc(u.role||'Uživatel')}</td><td>${sub(u)}</td><td style="text-align:right"><button class="btn" data-a="mtsub" data-id="${u.id}">${u.sub?'Změnit zástup':'Nastavit zástup'}</button></td></tr>`).join('')||emptyRow(5,'Nikoho nevedete')}</tbody></table></div>`,'','Členy týmu přiřazuje administrátor v Týmech a pobočkách.')+
  sCard('Když jsem pryč',`<div class="grid g2"><div class="field"><label for="mt-away">Žádosti týmu schvaluje</label><select class="inp" id="mt-away" data-a="mtset" data-on="change" data-g="away">${[['',boss?'Můj nadřízený: '+boss.name:'Můj nadřízený'],...T.map(u=>[u.id,u.name])].map(([v,l])=>`<option value="${v}" ${s.away===v?'selected':''}>${esc(l)}</option>`).join('')}</select></div></div>`,'','Platí, když máte zapsanou dovolenou nebo jinou nepřítomnost.');}
ACT.mtsub=el=>substitute(user(el.dataset.id));
ACT.mtset=el=>{mtS()[el.dataset.g]=el.value;save();toast('Uloženo');};

// Oprávnění: akce × role v týmu. Zamčené buňky zakazuje role.
const MT_ACT=[['add','Zakládat kontakty za tým',null],['edit','Upravovat kontakty týmu','kontakty'],['hand','Předávat kontakty mezi členy týmu',null],['task','Přidělovat úkoly členům týmu',null],['deal','Vidět obchody týmu',null],['exp','Exportovat kontakty týmu','export'],['sens','Vidět citlivé údaje kontaktů týmu','citlive']];
const MT_DEF={Asistentka:{add:1,edit:1,hand:0,task:1,deal:0,exp:0,sens:0},'Zástupce':{add:0,edit:1,hand:0,task:1,deal:1,exp:0,sens:1}};
const mtLock=(r,lim)=>lim==='kontakty'?roleV(r,'kontakty')==='Vlastní':lim==='export'?roleV(r,'export')==='Ne':lim==='citlive'?roleV(r,'citlive')==='Nevidí':false;
function secMtPrava(){const s=mtS(),R=['Asistentka','Zástupce'];
  return `<div class="tbl-card"><table class="tbl tm-perm"><thead><tr><th>Co smí</th>${R.map(r=>`<th>${r}</th>`).join('')}</tr></thead><tbody>${MT_ACT.map(([k,l,lim])=>`<tr style="cursor:default"><td>${l}</td>${R.map(r=>{const lock=mtLock(r,lim),on=!lock&&(s.perm[r+':'+k]!==undefined?s.perm[r+':'+k]:!!MT_DEF[r][k]);return lock?`<td><span class="tm-lock" data-tip="Role ${r} to nedovoluje. Mění administrátor." aria-label="${r}: ${l}, nedovoluje role">${ic('lock','s16')}</span></td>`:`<td><span class="switch"><input type="checkbox" data-a="mtperm" data-on="change" data-k="${r}:${k}" aria-label="${r}: ${l}" ${on?'checked':''}><i></i></span></td>`;}).join('')}</tr>`).join('')}</tbody></table></div>
  <p class="small mute" style="margin-top:16px">Zástupce má práva jen po dobu zástupu a nevidí osobní poznámky. Volby se zámkem zakazuje role${isAdmin()?`, změníte je v <a href="#/nastaveni/role" data-rep>Rolích a viditelnosti</a>`:', mění je administrátor'}.</p>`;}
ACT.mtperm=el=>{mtS().perm[el.dataset.k]=el.checked;save();toast('Uloženo');};

function secMtSchval(){const a=mtS().appr,v=(k,d)=>a[k]===undefined?d:a[k];
  const sel=(k,l,opts,d)=>`<div class="field"><label for="ma-${k}">${l}</label><select class="inp" id="ma-${k}" data-a="mtappr" data-on="change" data-k="${k}">${opts.map(([o,t])=>`<option value="${o}" ${v(k,d)===o?'selected':''}>${t}</option>`).join('')}</select></div>`;
  return sCard('Žádosti',`<div class="grid g3">${sel('vac','Dovolená a volno',[['me','Schvaluji já'],['me1','Jeden den schválit automaticky']],'me')}${sel('fix','Opravy docházky',[['me','Schvaluji já'],['auto','Automaticky, zapíšou se do historie']],'me')}${sel('ntf','Upozornit mě na žádost',[['now','Hned'],['day','Souhrnem ráno v 8:00']],'now')}</div>`)+
  sCard('Hlídání docházky',`<label class="row set-row"><span class="spacer">Chybějící záznam za předchozí den<span class="small mute" style="display:block">Ráno dostanete seznam lidí, kterým chybí záznam. Neomluvenou absenci zapisujete jen vy.</span></span><span class="switch"><input type="checkbox" data-a="mtappr" data-on="change" data-k="miss" ${v('miss',true)?'checked':''} aria-label="Chybějící záznam za předchozí den"><i></i></span></label>`);}
ACT.mtappr=el=>{mtS().appr[el.dataset.k]=el.type==='checkbox'?el.checked:el.value;save();toast('Uloženo');};

// Plán: nastavuje nadřízený, člen týmu ho vidí v kartě Můj plán na Přehledu
const planTarget=id=>{const T=(DB.settings&&DB.settings.team)||{};for(const k in T){const p=T[k].plan;if(p&&p[id])return +p[id];}return PLAN_TARGET[id]||400000;};
function secMtPlan(){const T=mtTeam(),sum=T.reduce((n,u)=>n+planTarget(u.id),0);
  return sCard('Plán na září 2026',`<div class="tbl-card"><table class="tbl tm-plan"><thead><tr><th>Jméno</th><th>Pozice</th><th style="text-align:right">Plán (Kč)</th></tr></thead><tbody>${T.map(u=>`<tr style="cursor:default"><td><span class="row" style="gap:8px">${av(u.id)}<span class="med">${esc(u.name)}</span></span></td><td>${esc(u.pos)}</td><td style="text-align:right"><input class="inp" inputmode="numeric" value="${planTarget(u.id).toLocaleString('cs-CZ')}" data-a="mtplan" data-on="change" data-id="${u.id}" aria-label="Plán: ${esc(u.name)}"></td></tr>`).join('')||emptyRow(3,'Nikoho nevedete')}</tbody><tfoot><tr><td class="med">Celkem tým</td><td></td><td style="text-align:right" class="med">${sum.toLocaleString('cs-CZ')} Kč</td></tr></tfoot></table></div>`,'','Plán se ukazuje na Přehledu v kartě Můj plán. Členové týmu ho vidí, ale nemění.');}
ACT.mtplan=el=>{mtS().plan[el.dataset.id]=Math.max(0,+el.value.replace(/\D/g,'')||0);save();toast('Uloženo');render();};

Object.assign(SBODY,{'mt-lide':secMtLide,'mt-prava':secMtPrava,'mt-schval':secMtSchval,'mt-plan':secMtPlan});
Object.assign(SDESC,{'mt-lide':'Váš přímý tým. Zástup platí po dobu nepřítomnosti.','mt-prava':'Co smí asistentka a zástupce u vašeho týmu.','mt-schval':'Jak se ve vašem týmu schvalují žádosti.','mt-plan':'Měsíční plán pro každého člena týmu.'});

// Hodnocení kontaktů je volitelné (rozhodnutí 13. 11. 2026). Vypnuté zmizí z hlavičky kontaktu, seznamů i editace.
const _secPole=secPole;
SBODY.pole=()=>sCard('Hodnocení kontaktů',swRow('org','rating','Používat hodnocení','Kolečko s číslem 1–5 v hlavičce kontaktu, sloupec v seznamech a pole v editaci.',true))+_secPole();
