// Přihlášení a start aplikace. Vzhled podle Figmy: sekce Přihlášení na 04_Pages.
const SSO={
  google:['Google','<svg viewBox="0 0 48 48" width="20" height="20"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>'],
  microsoft:['Microsoft','<svg viewBox="0 0 20 20" width="20" height="20"><rect width="9.5" height="9.5" fill="#F25022"/><rect x="10.5" width="9.5" height="9.5" fill="#7FBA00"/><rect y="10.5" width="9.5" height="9.5" fill="#00A4EF"/><rect x="10.5" y="10.5" width="9.5" height="9.5" fill="#FFB900"/></svg>'],
  apple:['Apple','<svg viewBox="0 0 24 24" width="20" height="20"><path fill="#131A1C" d="M17.05 12.54c-.03-2.6 2.12-3.85 2.22-3.91-1.21-1.77-3.09-2.01-3.76-2.04-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.89-1.74.03-3.35 1.01-4.25 2.57-1.81 3.14-.46 7.8 1.3 10.35.86 1.25 1.89 2.65 3.24 2.6 1.3-.05 1.79-.84 3.36-.84 1.57 0 2.01.84 3.39.81 1.4-.02 2.29-1.27 3.14-2.53.99-1.45 1.4-2.86 1.42-2.93-.03-.01-2.72-1.04-2.74-4.13zM14.46 4.9c.72-.87 1.2-2.08 1.07-3.29-1.03.04-2.29.69-3.03 1.56-.66.77-1.24 2-1.09 3.18 1.15.09 2.33-.58 3.05-1.45z"/></svg>'],
};
const coloredLogo=()=>LOGO.replace(/fill="white"/g,'fill="#77676c"').replace(/<path d="M8\.94917[^>]*fill="#77676c"/,m=>m.replace('#77676c','#224f5d')).replace(/<path d="M14\.5111[^>]*fill="#77676c"/,m=>m.replace('#77676c','#41acb6'));
const PERSONAS={AN:['Alena Novotná','alena.novotna@saver.example'],JD:['Jana Dvořáková','jana.dvorakova@saver.example'],PN:['Petra Nováková','petra.novakova@saver.example'],VH:['Viktor OSVČ','viktor.horak@poradce.example']};
function viewLogin(){const s=ui('login',{who:'AN',more:false,err:false,forgot:false,showPw:false});
  const ssoBtn=k=>`<button class="sso" data-a="sso" data-k="${k}">${SSO[k][1]}Pokračovat s účtem ${SSO[k][0]}</button>`;
  const head=(t)=>`<div class="lg-logo">${coloredLogo()}</div><div class="lg-head"><h1>${t}</h1></div>`;
  const body=s.forgot?`${head('Zapomenuté heslo')}<div class="field"><label for="fp">E-mail</label><input class="inp" id="fp" value="${PERSONAS[s.who][1]}"></div><button class="btn pri wide" data-a="forgotsend">Poslat odkaz</button><div class="ct"><a class="small" data-a="forgot" data-v="0">Zpět na přihlášení</a></div>`
  :`${head('Přihlášení')}${s.err?`<div class="banner err" role="alert">${ic('danger','s16')}<span>E-mail nebo heslo nesedí. Zkuste to znovu.</span></div>`:''}
   <div class="field"><label for="le">E-mail</label><input class="inp" id="le" autocomplete="username" value="${PERSONAS[s.who][1]}"></div>
   <div class="field"><label for="lp">Heslo</label><div class="pw"><input class="inp" id="lp" type="${s.showPw?'text':'password'}" autocomplete="current-password" value="prototyp"><button type="button" data-a="pwshow" aria-label="${s.showPw?'Skrýt heslo':'Zobrazit heslo'}">${ic(s.showPw?'eye-slash':'eye','s16')}</button></div></div>
   <div class="rt"><a class="small" data-a="forgot" data-v="1">Zapomněli jste heslo?</a></div>
   <button class="btn pri wide" data-a="login">Přihlásit se</button>
   <div class="or"><i></i><span>nebo</span><i></i></div>
   ${ssoBtn('google')}${ssoBtn('microsoft')}${s.more?`${ssoBtn('apple')}<button class="sso" data-a="sso" data-k="sso">${ic('key')}Firemní přihlášení (SSO)</button>`:''}
   <div class="ct"><a class="small row" style="justify-content:center;display:inline-flex" data-a="moreopts">${s.more?'Méně možností':'Další možnosti přihlášení'}${ic(s.more?'arrow-up-2':'arrow-down','s16')}</a></div>`;
  const persona=`<div class="proto-who"><span class="small">Prototyp: přihlásit jako</span><div class="seg">${Object.entries(PERSONAS).map(([k,v])=>`<button class="${s.who===k?'on':''}" data-a="pickp" data-id="${k}">${v[0].replace(/ (.*)/,`<span class="pw-l"> $1</span>`)}</button>`).join('')}</div></div>`;
  return `<div class="login"><div class="login-card">${body}</div>${persona}</div>`;}
ACT.pickp=el=>{Object.assign(UI.login,{who:el.dataset.id,err:false});render();};
ACT.moreopts=()=>{UI.login.more=!UI.login.more;render();};
ACT.pwshow=()=>{const v=document.getElementById('lp').value;UI.login.showPw=!UI.login.showPw;render();document.getElementById('lp').value=v;};
ACT.forgot=el=>{Object.assign(UI.login,{forgot:el.dataset.v==='1',err:false});render();};
ACT.forgotsend=()=>{const e=document.getElementById('fp');if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e.value)){e.classList.add('err');e.focus();return;}UI.login.forgot=false;render();toast('Odkaz na nové heslo je odeslaný. V prototypu se nic neposílá.');};
const enter=()=>{setMe(UI.login.who);UI.login.err=false;if(location.hash==='#/prehled')render();else location.hash='#/prehled';};
ACT.login=()=>{const pw=document.getElementById('lp');const em=document.getElementById('le');if(pw&&(pw.value!=='prototyp'||!em.value.includes('@'))){const keep=em.value;UI.login.err=true;render();document.getElementById('le').value=keep;document.getElementById('lp').focus();return;}enter();};
ACT.sso=()=>enter();
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.target.id==='lp'||e.target.id==='le'))ACT.login();});
window.onerror=(m,src,l)=>{console.error(m,src,l);};
render();
