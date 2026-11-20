// Doplněné ikony ve stylu sady (obrys 1.5): stopky, přehrát, pauza, stop, příchod.
Object.assign(window.ICONS,{
 "timer-start":["0 0 24 24",'<path d="M12 21.5C16.42 21.5 20 17.92 20 13.5C20 9.08 16.42 5.5 12 5.5C7.58 5.5 4 9.08 4 13.5C4 17.92 7.58 21.5 12 21.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 9V13.5L14.5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.5 2.5H14.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'],
 "play":["0 0 24 24",'<path d="M7 5.6V18.4C7 19.5 8.2 20.2 9.2 19.6L19.4 13.2C20.3 12.6 20.3 11.4 19.4 10.8L9.2 4.4C8.2 3.8 7 4.5 7 5.6Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'],
 "pause":["0 0 24 24",'<path d="M9.5 19V5C9.5 4.2 9 3.5 8 3.5H7C6 3.5 5.5 4.2 5.5 5V19C5.5 19.8 6 20.5 7 20.5H8C9 20.5 9.5 19.8 9.5 19Z" stroke="currentColor" stroke-width="1.5"/><path d="M18.5 19V5C18.5 4.2 18 3.5 17 3.5H16C15 3.5 14.5 4.2 14.5 5V19C14.5 19.8 15 20.5 16 20.5H17C18 20.5 18.5 19.8 18.5 19Z" stroke="currentColor" stroke-width="1.5"/>'],
 "stop":["0 0 24 24",'<path d="M8.5 19.5H15.5C18 19.5 19.5 18 19.5 15.5V8.5C19.5 6 18 4.5 15.5 4.5H8.5C6 4.5 4.5 6 4.5 8.5V15.5C4.5 18 6 19.5 8.5 19.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'],
 "login":["0 0 24 24",'<path d="M8.9 7.56C9.21 3.96 11.06 2.49 15.11 2.49H15.24C19.71 2.49 21.5 4.28 21.5 8.75V15.27C21.5 19.74 19.71 21.53 15.24 21.53H15.11C11.09 21.53 9.24 20.08 8.91 16.54" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 12H14.88" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12.65 8.65L16 12L12.65 15.35" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>']
});
// Měření času u úkolu.
// - V detailu úkolu je ovládání přímo v hlavičce („Měřit čas“, při měření živé stopky s pauzou a stopem) a dlaždice Odpracováno proti odhadu.
// - Na ostatních stránkách se běžící měření ukazuje v tmavém plovoucím panelu vpravo dole (na stránce měřeného úkolu se neukazuje, stopky jsou v hlavičce).
// - Po zastavení se čas potvrdí a zapíše k úkolu. Čas jde zapsat i ručně. Měřit se dá vždy jen jeden úkol.
// Růžová tečka = „teď“ (role brandové růžové, viz styles.css). Docházka je v attendance.js.

const tmrSec=()=>{const t=DB.timer;if(!t)return 0;return Math.floor((t.acc+(t.run?Date.now()-t.run:0))/1000);};
const fmtSec=s=>`${Math.floor(s/3600)}:${String(Math.floor(s/60)%60).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
const taskMinLogged=t=>(t.log||[]).reduce((a,x)=>a+x.min,0);

// Ukázkový záznam času, aby karta Záznamy času nebyla ve výchozích datech prázdná.
const tlogSeed=()=>{if(DB._tl)return;const t=DB.tasks.find(x=>x.title==='Zkontrolovat kvalitu maleb');if(t)t.log=[{who:'AN',date:'2026-09-11',min:40,note:'Obhlídka prvního patra',how:'Měření'}];DB._tl=1;};
// Plovoucí panel běžícího měření (volá ho shell na každé stránce).
function workPills(){tlogSeed();
  const t=DB.timer,tk=t&&task(t.task);if(!tk||location.hash==='#/ukol/'+tk.id)return '';
  return `<div class="wp-tmr ${t.run?'run':''}" role="group" aria-label="Měření času">${icN('timer-start')}<span class="wp-l"><span class="wp-s">${t.run?'Měří se':'Pozastaveno'}</span><a href="#/ukol/${tk.id}" class="wp-n" data-tip="${esc(tk.title)}">${esc(tk.title)}</a></span><i class="wp-dot ${t.run?'pink':''}"></i><b class="tmr-t">${fmtSec(tmrSec())}</b><button data-a="tmrtoggle" aria-label="${t.run?'Pozastavit':'Pokračovat'}" data-tip="${t.run?'Pozastavit':'Pokračovat'}">${icN(t.run?'pause':'play')}</button><button data-a="tmrstop" aria-label="Zastavit a zapsat" data-tip="Zastavit a zapsat">${icN('stop')}</button></div>`;}
// Ovládání v hlavičce detailu úkolu.
function tmrHead(t){if(t.done)return '';const T=DB.timer;
  if(T&&T.task===t.id)return `<div class="tmr-in ${T.run?'run':''}" role="group" aria-label="Měření času"><i class="wp-dot ${T.run?'pink':''}"></i><span class="wp-s">${T.run?'Měří se':'Pozastaveno'}</span><b class="tmr-t">${fmtSec(tmrSec())}</b><button data-a="tmrtoggle" aria-label="${T.run?'Pozastavit':'Pokračovat'}" data-tip="${T.run?'Pozastavit':'Pokračovat'}">${icN(T.run?'pause':'play')}</button><button data-a="tmrstop" aria-label="Zastavit a zapsat" data-tip="Zastavit a zapsat">${icN('stop')}</button></div>`;
  return `<button class="btn" data-a="tmrstart" data-id="${t.id}">${ic('timer-start','s16')}Měřit čas</button>`;}
// Dlaždice v hero pruhu detailu úkolu.
function taskTimeStat(t){const sum=taskMinLogged(t),est=estMin(t),over=sum>est,pct=Math.min(100,Math.round(sum/est*100));
  return `<button class="stat stat-a" data-a="tlogjump" aria-label="Záznamy času"><b class="${over?'amb':''}" style="font-size:16px;line-height:24px">${sum?fmtMin(sum):'0 min'} <small class="mute" style="font:400 12px/16px Poppins">z ${fmtMin(est)}</small></b><span>Odpracováno</span><div class="prog ${over?'prog-amb':''}" style="margin-top:8px;height:4px"><i style="width:${pct}%"></i></div></button>`;}
ACT.tlogjump=()=>{const c=document.getElementById('tlog');if(c)c.scrollIntoView({behavior:'smooth',block:'center'});};

setInterval(()=>{if(!DB.timer||!DB.timer.run)return;const v=fmtSec(tmrSec());document.querySelectorAll('.tmr-t').forEach(a=>a.textContent=v);},1000);

function tmrStart(id){const t=task(id);if(!t)return;
  const start=()=>{DB.timer={task:id,run:Date.now(),acc:0};save();closeLayer();toast('Měření času: '+t.title);render();};
  if(DB.timer&&DB.timer.task===id){if(!DB.timer.run){DB.timer.run=Date.now();save();render();}return;}
  if(DB.timer){tmrFinish(start,'Měřit jde jen jeden úkol. Nejdřív zapište čas u předchozího.');return;}start();}
ACT.tmrstart=el=>tmrStart(el.dataset.id);
ACT.tmrtoggle=()=>{const t=DB.timer;if(!t)return;if(t.run){t.acc+=Date.now()-t.run;t.run=0;}else t.run=Date.now();save();render();};
ACT.tmrstop=()=>tmrFinish();
// Potvrzení: změřený čas jde upravit (zapomněl jsem vypnout), přidat poznámku, nebo zahodit.
function tmrFinish(after,why){const t=DB.timer,tk=t&&task(t.task);if(!tk){DB.timer=null;save();render();return;}
  if(t.run){t.acc+=Date.now()-t.run;t.run=0;save();}
  const m=Math.max(1,Math.round(t.acc/60000));
  modal(`<h2>Zapsat odpracovaný čas</h2>${why?`<p class="small mute" style="margin-top:8px">${why}</p>`:''}<p style="margin-top:8px"><a href="#/ukol/${tk.id}">${esc(tk.title)}</a></p><div class="stack" style="margin-top:16px">${timeFields(m)}</div><div class="ft"><button class="btn" id="tf-x">Zahodit měření</button><span class="spacer"></span><button class="btn" data-close>Měřit dál</button><button class="btn pri" id="tf-ok">Zapsat</button></div>`);
  document.getElementById('tf-x').onclick=()=>{DB.timer=null;save();closeLayer();toast('Měření je zahozené');render();if(after)after();};
  document.querySelector('[data-close]').onclick=()=>{if(!after){t.run=Date.now();save();}closeLayer();render();};
  document.getElementById('tf-ok').onclick=()=>{const v=readTime();if(!v)return;logTime(tk,v.min,v.note,'Měření');DB.timer=null;save();closeLayer();toast('Zapsáno '+fmtMin(v.min)+': '+tk.title);render();if(after)after();};}
const timeFields=(m,note='')=>`<div class="grid g3"><div class="field"><label for="tf-h">Hodiny</label><input class="inp" id="tf-h" type="number" min="0" value="${Math.floor(m/60)}"></div><div class="field"><label for="tf-m">Minuty</label><input class="inp" id="tf-m" type="number" min="0" max="59" value="${m%60}"></div><div class="field"><label for="tf-d">Den</label><input class="inp" id="tf-d" type="date" value="${TODAY}"></div></div><div class="field"><label for="tf-n">Co jste dělali (nepovinné)</label><input class="inp" id="tf-n" value="${esc(note)}" placeholder="Např. objednávka u dodavatele"></div><div class="err-t" id="tf-e"></div>`;
function readTime(){const h=+document.getElementById('tf-h').value||0,mm=+document.getElementById('tf-m').value||0,min=h*60+mm;if(min<=0){document.getElementById('tf-e').textContent='Zadejte čas větší než 0.';return null;}return {min,note:document.getElementById('tf-n').value.trim(),date:document.getElementById('tf-d').value||TODAY};}
function logTime(tk,min,note,how,date){(tk.log=tk.log||[]).unshift({who:ME,date:date||TODAY,min,note,how});}
ACT.timeadd=el=>{const tk=task(el.dataset.id);modal(`<h2>Zapsat čas</h2><p style="margin-top:8px">${esc(tk.title)}</p><div class="stack" style="margin-top:16px">${timeFields(estMin(tk))}</div><div class="ft"><button class="btn" data-close>Zrušit</button><button class="btn pri" id="tf-ok">Zapsat</button></div>`);
  document.getElementById('tf-ok').onclick=()=>{const v=readTime();if(!v)return;logTime(tk,v.min,v.note,'Ručně',v.date);save();closeLayer();toast('Zapsáno '+fmtMin(v.min));render();};};
ACT.timedel=el=>{const tk=task(el.dataset.id),i=+el.dataset.i,x=tk.log[i];tk.log.splice(i,1);save();toast('Záznam času je odebraný',()=>{tk.log.splice(i,0,x);save();render();});render();};

// Karta v detailu úkolu: jen historie záznamů. Součet a ovládání jsou nahoře (dlaždice a hlavička).
function taskTimeCard(t){
  return `<section class="card" id="tlog"><div class="card-head"><h3 class="sec-t" style="margin:0">Záznamy času</h3><div class="r"><button class="btn" data-a="timeadd" data-id="${t.id}">${ic('add','s16')}Zapsat čas ručně</button></div></div>
  ${(t.log||[]).length?t.log.map((x,i)=>`<div class="tlog">${av(x.who,'a32')}<span class="tlog-d mute small">${fmt(x.date)}</span><span class="med" style="width:88px;flex:none">${fmtMin(x.min)}</span><span class="spacer small">${esc(x.note||'')}<span class="mute"> · ${x.how==='Měření'?'změřeno':'zapsáno ručně'}</span></span>${x.who===ME?`<button class="more" data-a="timedel" data-id="${t.id}" data-i="${i}" aria-label="Odebrat záznam">${ic('trash','s16')}</button>`:''}</div>`).join(''):'<p class="mute small">Zatím žádný záznam.</p>'}</section>`;}
