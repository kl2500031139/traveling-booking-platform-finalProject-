/* ---------- storage (localStorage with in-memory fallback) ---------- */
const mem = {};
const LS = {
  get(k, d){ try{ const v = localStorage.getItem(k); if(v!==null) return JSON.parse(v);}catch(e){} return k in mem ? mem[k] : d; },
  set(k, v){ mem[k] = v; try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};
const hash = s => { let x = 5381; for(const c of String(s)) x = ((x<<5)+x+c.charCodeAt(0))|0; return 'h'+(x>>>0).toString(16); };
const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2,6);

const SEED_TRIPS = [
  {id:'t_goa',title:'Goa Beach Escape',destination:'Goa',country:'India',category:'Beach',days:5,price:18500,seats:24,description:'Five easy days between Baga and Palolem. Sunrise yoga on the sand, a Fontainhas heritage walk, and a sunset cruise on the Mandovi.'},
  {id:'t_manali',title:'Manali Snow Trails',destination:'Manali',country:'India',category:'Mountain',days:6,price:24900,seats:16,description:'Solang Valley, the Rohtang approach and cosy riverside stays. Includes a guided snow trek and hot-spring stop at Vashisht.'},
  {id:'t_jaipur',title:'Jaipur Royal Circuit',destination:'Jaipur',country:'India',category:'Heritage',days:4,price:15800,seats:30,description:'Amber Fort at opening time, City Palace, the Hawa Mahal bazaars and a rooftop dinner overlooking the old city.'},
  {id:'t_kerala',title:'Kerala Backwater Drift',destination:'Alleppey',country:'India',category:'Nature',days:5,price:21700,seats:14,description:'Two nights on a private houseboat, a Munnar tea estate day, and a village cooking class with a local family.'},
  {id:'t_ladakh',title:'Ladakh High Passes',destination:'Leh',country:'India',category:'Mountain',days:8,price:46500,seats:12,description:'Pangong Lake, Nubra Valley and Khardung La. Acclimatisation day, oxygen-backed vehicle and a trip lead are included.'},
  {id:'t_andaman',title:'Andaman Island Hop',destination:'Port Blair',country:'India',category:'Beach',days:6,price:38200,seats:18,description:'Radhanagar beach, snorkelling at Elephant Beach, and the Cellular Jail light show. Ferries between islands included.'},
  {id:'t_jaisalmer',title:'Jaisalmer Desert Camp',destination:'Jaisalmer',country:'India',category:'Desert',days:3,price:12400,seats:26,description:'Golden fort at dawn, camel safari to the Sam dunes, and a night in a camp with folk music under the stars.'},
  {id:'t_mumbai',title:'Mumbai After Dark',destination:'Mumbai',country:'India',category:'City',days:3,price:14900,seats:22,description:'Street-food trail, Marine Drive at night, a Dharavi walking tour and a ride on the local train at golden hour.'}
];
const SEED_USERS = [
  {id:'u_admin',name:'Administrator',email:'admin@wayfare.com',pass:hash('admin123'),role:'admin',created:Date.now()},
  {id:'u_demo',name:'Demo Traveller',email:'user@wayfare.com',pass:hash('user123'),role:'user',created:Date.now()}
];
if(!LS.get('wf_trips')) LS.set('wf_trips', SEED_TRIPS);
if(!LS.get('wf_users')) LS.set('wf_users', SEED_USERS);
if(!LS.get('wf_bookings')) LS.set('wf_bookings', []);

const trips = () => LS.get('wf_trips', []);
const users = () => LS.get('wf_users', []);
const bookings = () => LS.get('wf_bookings', []);
const me = () => { const s = LS.get('wf_session', null); return s ? users().find(u => u.id === s.userId) || null : null; };

/* ---------- helpers ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = n => '₹' + Number(n).toLocaleString('en-IN');
const today = () => new Date(Date.now() - new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);
const fmtDate = d => new Date(d + 'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
let toastTimer;
function toast(msg){ const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(()=>t.classList.remove('show'), 2800); }
const PAGE = document.body.dataset.page || '';           // '', 'login', 'register' or 'admin-login'
const BASE = PAGE ? 'index.html' : '';                   // prefix for links back into the main page
const FILES = {'/login':'login.html','/register':'register.html','/admin-login':'admin-login.html'};
const curRoute = () => PAGE ? '/' + PAGE : (location.hash.slice(1) || '/');
function go(path){
  if(FILES[path]) { location.href = FILES[path]; return; }
  if(PAGE) { location.href = 'index.html#' + path; return; }
  location.hash = '#' + path;
}
function modal(html){ const d = $('#dlg'); d.innerHTML = html; if(!d.open) d.showModal(); }
function closeModal(){ const d = $('#dlg'); if(d.open) d.close(); }
function askConfirm(msg, yesLabel, cb){
  window.__cb = cb;
  modal(`<h3>Are you sure?</h3><p>${esc(msg)}</p><div class="dlgfoot"><button class="btn ghost" onclick="closeModal()">Keep it</button><button class="btn danger" onclick="closeModal();window.__cb()">${esc(yesLabel)}</button></div>`);
}

/* ---------- illustrated scenes (no remote images) ---------- */
let gid = 0;
function scene(cat){
  const g = 'g' + (++gid);
  const sky = (a,b) => `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="400" height="240" fill="url(#${g})"/>`;
  let s = '';
  if(cat==='Beach') s = sky('#8FD3E6','#FCE3B0') + `<circle cx="300" cy="78" r="34" fill="#F2B84B"/><rect y="146" width="400" height="60" fill="#1F8A9E"/><path d="M0 160 Q25 150 50 160 T100 160 T150 160 T200 160 T250 160 T300 160 T350 160 T400 160" stroke="#fff" stroke-width="2" fill="none" opacity=".6"/><path d="M0 206 Q120 176 250 200 T400 190 V240 H0Z" fill="#EBD29E"/><path d="M92 214 Q98 170 108 128" stroke="#6B4A2B" stroke-width="6" fill="none"/><path d="M108 128 Q80 112 56 128 M108 128 Q96 102 70 98 M108 128 Q124 104 150 108 M108 128 Q138 124 156 144" stroke="#2F7A52" stroke-width="7" fill="none" stroke-linecap="round"/>`;
  else if(cat==='Mountain') s = sky('#BFD8EA','#EAF2F7') + `<circle cx="320" cy="60" r="22" fill="#fff" opacity=".85"/><polygon points="0,200 90,90 170,190 240,70 330,200 400,120 400,240 0,240" fill="#7C9BBB"/><polygon points="240,70 214,106 232,98 244,112 258,100 270,108" fill="#fff"/><polygon points="90,90 72,116 88,110 98,120 110,108" fill="#fff"/><polygon points="-20,240 70,160 160,240" fill="#3F5F82"/><polygon points="120,240 250,140 400,240" fill="#34506F"/>`;
  else if(cat==='City') s = sky('#6C83B5','#F5B58A') + `<circle cx="64" cy="58" r="20" fill="#FBEFD5"/>` + [[20,110,46],[70,80,40],[116,126,36],[158,60,48],[210,100,42],[256,72,44],[304,118,38],[348,90,44]].map(([x,y,w])=>`<rect x="${x}" y="${y}" width="${w}" height="${240-y}" fill="#1D2F44"/>` + [0,1,2,3].map(i=>`<rect x="${x+8}" y="${y+10+i*22}" width="6" height="8" fill="#F2B84B" opacity="${(i+x)%3?'.9':'.25'}"/><rect x="${x+w-16}" y="${y+10+i*22}" width="6" height="8" fill="#F2B84B" opacity="${(i+x)%2?'.9':'.3'}"/>`).join('')).join('');
  else if(cat==='Desert') s = sky('#FFE2A8','#F7B267') + `<circle cx="280" cy="110" r="52" fill="#F28F3B" opacity=".9"/><path d="M0 170 Q100 120 200 168 T400 150 V240 H0Z" fill="#E0A458"/><path d="M0 210 Q140 160 260 206 T400 196 V240 H0Z" fill="#C9823A"/><path d="M120 150 q8 -26 16 0 M170 142 q8 -22 16 0" stroke="#7a4b1d" stroke-width="3" fill="none"/>`;
  else if(cat==='Heritage') s = sky('#F9D5A7','#E89A7B') + `<circle cx="70" cy="60" r="24" fill="#FFF1D0"/><rect x="40" y="120" width="320" height="120" fill="#9A4F3C"/><path d="M140 120 Q200 30 260 120Z" fill="#B0604A"/><rect x="198" y="54" width="4" height="22" fill="#F2B84B"/><rect x="20" y="86" width="26" height="154" fill="#8E4B3A"/><rect x="354" y="86" width="26" height="154" fill="#8E4B3A"/><path d="M20 86 L33 66 L46 86Z M354 86 L367 66 L380 86Z" fill="#B0604A"/>` + [70,120,170,230,280,330].map(x=>`<path d="M${x-14} 240 V182 Q${x} 156 ${x+14} 182 V240Z" fill="#5A2B22"/>`).join('');
  else s = sky('#CDEBD3','#EFF7E8') + `<circle cx="330" cy="58" r="20" fill="#F2B84B"/><path d="M0 150 Q80 90 170 140 T400 120 V240 H0Z" fill="#5AAE78"/><path d="M0 190 Q120 140 220 186 T400 170 V240 H0Z" fill="#2F7A52"/><path d="M60 240 Q150 190 190 214 T330 198 L400 240Z" fill="#5AB2C7"/>` + [[40,170],[78,178],[320,160],[356,170]].map(([x,y])=>`<rect x="${x-2}" y="${y}" width="4" height="16" fill="#4A3524"/><circle cx="${x}" cy="${y-6}" r="13" fill="#1F5E3E"/>`).join('');
  return `<svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${esc(cat)} illustration">${s}</svg>`;
}

/* ---------- layout ---------- */
function nav(){
  const u = me(); const r = curRoute();
  const on = p => r === p ? 'on' : '';
  let links = `<a class="link ${on('/')}" href="${BASE}#/">Explore</a>`;
  if(!u) links += `<a class="link ${on('/login')}" href="login.html">Log in</a><a class="link ${on('/register')}" href="register.html">Sign up</a><a class="link ${on('/admin-login')}" href="admin-login.html">Admin</a>`;
  else if(u.role==='admin') links += `<a class="link ${r.startsWith('/admin')?'on':''}" href="${BASE}#/admin">Dashboard</a><span class="who">${esc(u.name)}</span><button class="link" onclick="logout()">Log out</button>`;
  else links += `<a class="link ${on('/my-bookings')}" href="${BASE}#/my-bookings">My bookings</a><span class="who">${esc(u.name)}</span><button class="link" onclick="logout()">Log out</button>`;
  return `<header class="nav"><div class="wrap"><a class="brand" href="${BASE}#/"><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="15" fill="#1F8A9E"/><path d="M6 20 C10 8 20 8 26 12" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-dasharray="1 5"/><path d="M22 7 L28 12 L21 14Z" fill="#F2B84B"/></svg>Wayfare</a><nav aria-label="Main">${links}</nav></div></header>`;
}
const foot = `<footer><div class="wrap">Wayfare is a demo. Everything you enter is saved only in this browser (localStorage).</div></footer>`;

/* ---------- views ---------- */
let filt = {q:'', cat:'All'};
const CATS = ['All','Beach','Mountain','City','Desert','Heritage','Nature'];

function tripCard(t){
  return `<a class="card" href="${BASE}#/trip/${t.id}"><div class="pic">${scene(t.category)}</div><div class="body"><span class="tag">${esc(t.category)}</span><h3>${esc(t.title)}</h3><div class="meta"><span>${esc(t.destination)}, ${esc(t.country)}</span><span>${t.days} days</span></div><div class="price"><span class="muted">${t.seats>0 ? t.seats+' seats left' : 'Sold out'}</span><span><small class="muted">from</small> <b>${money(t.price)}</b></span></div></div></a>`;
}
function filtered(){
  const q = filt.q.trim().toLowerCase();
  return trips().filter(t => (filt.cat==='All' || t.category===filt.cat) && (!q || (t.title+' '+t.destination+' '+t.country+' '+t.description).toLowerCase().includes(q)));
}
function renderGrid(){
  const g = $('#grid'); if(!g) return;
  const l = filtered();
  g.innerHTML = l.length ? l.map(tripCard).join('') : `<div class="empty">No trips match your search. Clear the search box or pick another category.</div>`;
  $('#count').textContent = l.length + (l.length===1 ? ' trip' : ' trips');
  document.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c.dataset.cat === filt.cat));
}
function setCat(c){ filt.cat = c; renderGrid(); }
function setQ(v){ filt.q = v; renderGrid(); }

function viewHome(){
  return `<section class="hero"><svg class="route" viewBox="0 0 600 260" fill="none" aria-hidden="true"><path d="M10 230 C120 40 300 20 400 120 S560 150 590 40" stroke="#F2B84B" stroke-width="3" stroke-dasharray="2 12" stroke-linecap="round"/><circle cx="10" cy="230" r="8" fill="#F2B84B"/><path d="M590 40 l-26 6 6 -20z" fill="#F2B84B"/></svg>
  <div class="wrap"><h1>Where to next?</h1><p>Pick a trip, choose a date and book in a minute. Pay at the airport desk, not on the website.</p>
  <div class="search"><input type="text" id="q" value="${esc(filt.q)}" placeholder="Search a place, e.g. Goa or desert" aria-label="Search trips" oninput="setQ(this.value)"></div>
  <div class="chips">${CATS.map(c=>`<button class="chip" data-cat="${c}" onclick="setCat('${c}')">${c}</button>`).join('')}</div></div></section>
  <section class="section"><div class="wrap"><div class="section-head"><h2>Available trips</h2><span class="muted" id="count"></span></div><div class="grid" id="grid"></div></div></section>${foot}`;
}

function viewTrip(id){
  const t = trips().find(x => x.id === id);
  if(!t) return `<div class="wrap" style="padding:60px 20px"><h2>Trip not found</h2><p class="muted">It may have been removed.</p><a class="btn" href="${BASE}#/">Back to trips</a></div>`;
  const u = me();
  let panel;
  if(t.seats <= 0) panel = `<h3>Sold out</h3><p class="muted">All seats on this trip are taken. Check back later or choose another trip.</p>`;
  else if(u && u.role==='admin') panel = `<h3>Admin view</h3><p class="muted">Admin accounts can't make bookings. Edit this trip from the dashboard.</p><a class="btn block" href="${BASE}#/admin">Open dashboard</a>`;
  else panel = `<h3>Book this trip</h3><div id="berr"></div>
    <div class="field"><label for="bdate">Travel date</label><input type="date" id="bdate" min="${today()}"></div>
    <div class="field"><label for="btrav">Travellers (max ${Math.min(t.seats,10)})</label><input type="number" id="btrav" min="1" max="${Math.min(t.seats,10)}" value="1" oninput="updTotal(${t.price})"></div>
    <div class="total"><span class="muted">Total</span><b id="btotal">${money(t.price)}</b></div>
    <button class="btn block" onclick="book('${t.id}')">${u ? 'Confirm booking' : 'Log in to book'}</button>
    ${u ? '' : '<p class="hint">You will return to this trip after logging in.</p>'}`;
  return `<div class="wrap"><a class="back" href="${BASE}#/">‹ All trips</a><div class="trip"><div><div class="pic">${scene(t.category)}</div><h1>${esc(t.title)}</h1>
    <div class="meta" style="margin-bottom:14px"><span>${esc(t.destination)}, ${esc(t.country)}</span><span>${t.days} days</span><span>${esc(t.category)}</span><span>${t.seats} seats left</span></div>
    <p class="lead">${esc(t.description)}</p><p class="muted">${money(t.price)} per traveller. Free cancellation from your bookings page.</p></div>
    <aside class="panel">${panel}</aside></div></div>${foot}`;
}
function updTotal(price){ const n = Math.max(1, parseInt($('#btrav').value)||1); $('#btotal').textContent = money(n*price); }

function book(id){
  const u = me();
  if(!u){ sessionStorage.setItem('wf_next', '/trip/'+id); return go('/login'); }
  const t = trips().find(x => x.id === id); const err = $('#berr');
  const date = $('#bdate').value, n = parseInt($('#btrav').value);
  const fail = m => err.innerHTML = `<div class="err">${esc(m)}</div>`;
  if(!date) return fail('Choose a travel date.');
  if(date < today()) return fail('The travel date can’t be in the past.');
  if(!n || n < 1) return fail('Enter at least 1 traveller.');
  if(n > t.seats) return fail(`Only ${t.seats} seats are left on this trip.`);
  if(n > 10) return fail('You can book up to 10 travellers at a time.');
  const all = trips(); all.find(x => x.id===id).seats -= n; LS.set('wf_trips', all);
  const bs = bookings();
  bs.push({id:uid('b_'), userId:u.id, tripId:t.id, title:t.title, destination:t.destination, category:t.category, date, travellers:n, total:n*t.price, status:'Pending', created:Date.now()});
  LS.set('wf_bookings', bs);
  toast('Booked. We will confirm it shortly.'); go('/my-bookings');
}

function viewAuth(kind){
  const admin = kind==='admin', reg = kind==='register';
  const side = admin
    ? `<div class="side admin"><h1>Admin console</h1><p>Manage trips, review bookings and keep an eye on revenue.</p></div>`
    : `<div class="side"><h1>${reg?'Start planning your next trip.':'Welcome back.'}</h1><p>${reg?'Create an account to book trips and manage them in one place.':'Log in to see your bookings and reserve your next trip.'}</p></div>`;
  const form = admin ? `
    <h2>Admin log in</h2><p class="sub">For staff accounts only.</p><div id="aerr"></div>
    <form onsubmit="return doLogin(event,'admin')"><div class="field"><label for="em">Admin email</label><input type="email" id="em" required autocomplete="username"></div>
    <div class="field"><label for="pw">Password</label><input type="password" id="pw" required autocomplete="current-password"></div><button class="btn block">Log in as admin</button></form>
    <p class="hint">Demo admin: admin@wayfare.com / admin123</p><p class="alt">Not an admin? <a href="login.html">Go to traveller log in</a></p>`
  : reg ? `
    <h2>Create account</h2><p class="sub">It takes less than a minute.</p><div id="aerr"></div>
    <form onsubmit="return doRegister(event)"><div class="field"><label for="nm">Full name</label><input type="text" id="nm" required autocomplete="name"></div>
    <div class="field"><label for="em">Email</label><input type="email" id="em" required autocomplete="email"></div>
    <div class="field"><label for="pw">Password (6+ characters)</label><input type="password" id="pw" required minlength="6" autocomplete="new-password"></div><button class="btn block">Create account</button></form>
    <p class="alt">Already registered? <a href="login.html">Log in</a></p>`
  : `
    <h2>Log in</h2><p class="sub">Use the email you signed up with.</p><div id="aerr"></div>
    <form onsubmit="return doLogin(event,'user')"><div class="field"><label for="em">Email</label><input type="email" id="em" required autocomplete="username"></div>
    <div class="field"><label for="pw">Password</label><input type="password" id="pw" required autocomplete="current-password"></div><button class="btn block">Log in</button></form>
    <p class="hint">Demo traveller: user@wayfare.com / user123</p>
    <p class="alt">New here? <a href="register.html">Create an account</a> · <a href="admin-login.html">Admin log in</a></p>`;
  return `<div class="auth">${side}<div class="formcol"><div class="box">${form}</div></div></div>`;
}
function authErr(m){ $('#aerr').innerHTML = `<div class="err">${esc(m)}</div>`; return false; }
function doLogin(e, kind){
  e.preventDefault();
  const em = $('#em').value.trim().toLowerCase(), pw = $('#pw').value;
  const u = users().find(x => x.email === em);
  if(!u || u.pass !== hash(pw)) return authErr('Email or password is incorrect. Check both and try again.');
  if(kind==='admin' && u.role!=='admin') return authErr('This account is not an admin. Use the traveller log in instead.');
  if(kind==='user' && u.role==='admin') return authErr('This is an admin account. Use the admin log in instead.');
  LS.set('wf_session', {userId:u.id});
  toast('Welcome, ' + u.name.split(' ')[0] + '.');
  if(u.role==='admin') return go('/admin'), false;
  const next = sessionStorage.getItem('wf_next'); sessionStorage.removeItem('wf_next');
  go(next || '/'); return false;
}
function doRegister(e){
  e.preventDefault();
  const nm = $('#nm').value.trim(), em = $('#em').value.trim().toLowerCase(), pw = $('#pw').value;
  if(users().some(x => x.email === em)) return authErr('An account with this email already exists. Try logging in.');
  if(pw.length < 6) return authErr('Use at least 6 characters for the password.');
  const us = users(); const u = {id:uid('u_'), name:nm, email:em, pass:hash(pw), role:'user', created:Date.now()};
  us.push(u); LS.set('wf_users', us); LS.set('wf_session', {userId:u.id});
  toast('Account created.');
  const next = sessionStorage.getItem('wf_next'); sessionStorage.removeItem('wf_next');
  go(next || '/'); return false;
}
function logout(){ LS.set('wf_session', null); toast('Logged out.'); go('/'); render(); }

/* ---------- user: my bookings ---------- */
function viewMine(){
  const u = me();
  const list = bookings().filter(b => b.userId === u.id).sort((a,b) => b.created - a.created);
  const body = list.length ? `<div class="blist">${list.map(b => `
    <div class="bcard"><div class="pic">${scene(b.category)}</div>
    <div><h3>${esc(b.title)}</h3><div class="meta"><span>${esc(b.destination)}</span><span>${fmtDate(b.date)}</span><span>${b.travellers} traveller${b.travellers>1?'s':''}</span></div></div>
    <div class="side"><span class="status ${b.status}">${b.status}</span><b>${money(b.total)}</b>${b.status!=='Cancelled' ? `<button class="btn danger sm" onclick="cancelBooking('${b.id}')">Cancel booking</button>`:''}</div></div>`).join('')}</div>`
    : `<div class="empty" style="grid-column:auto">You have no bookings yet. <a href="${BASE}#/" style="color:var(--accent);font-weight:600">Browse trips</a> to make your first one.</div>`;
  return `<div class="wrap section"><div class="section-head"><h2>My bookings</h2><span class="muted">${list.length} total</span></div>${body}</div>${foot}`;
}
function setBookingStatus(id, status){
  const bs = bookings(); const b = bs.find(x => x.id === id); if(!b) return;
  if(b.status === 'Cancelled') return;
  if(status === 'Cancelled'){
    const ts = trips(); const t = ts.find(x => x.id === b.tripId);
    if(t){ t.seats += b.travellers; LS.set('wf_trips', ts); }
  }
  b.status = status; LS.set('wf_bookings', bs);
}
function cancelBooking(id){
  askConfirm('This releases your seats. You can book again any time.', 'Cancel booking', () => { setBookingStatus(id,'Cancelled'); toast('Booking cancelled.'); render(); });
}

/* ---------- admin ---------- */
let adminTab = 'overview';
function setTab(t){ adminTab = t; render(); }
function viewAdmin(){
  const T = trips(), B = bookings(), U = users();
  const rev = B.filter(b => b.status==='Confirmed').reduce((s,b)=>s+b.total,0);
  const tabs = [['overview','Overview'],['trips','Trips'],['bookings','Bookings'],['users','Travellers']];
  let content = '';
  const bname = b => esc((U.find(u=>u.id===b.userId)||{name:'Deleted user'}).name);
  const brow = (b, act) => `<tr><td>${bname(b)}</td><td>${esc(b.title)}</td><td>${fmtDate(b.date)}</td><td>${b.travellers}</td><td>${money(b.total)}</td><td><span class="status ${b.status}">${b.status}</span></td>${act?`<td><div class="actions">${b.status==='Pending'?`<button class="btn sm" onclick="adminStatus('${b.id}','Confirmed')">Confirm</button>`:''}${b.status!=='Cancelled'?`<button class="btn danger sm" onclick="adminStatus('${b.id}','Cancelled')">Cancel</button>`:''}</div></td>`:''}</tr>`;
  if(adminTab==='overview'){
    const recent = [...B].sort((a,b)=>b.created-a.created).slice(0,5);
    content = `<div class="stats"><div class="stat hl"><b>${money(rev)}</b><span>Confirmed revenue</span></div><div class="stat"><b>${T.length}</b><span>Trips listed</span></div><div class="stat"><b>${B.length}</b><span>Bookings (${B.filter(b=>b.status==='Pending').length} pending)</span></div><div class="stat"><b>${U.filter(u=>u.role!=='admin').length}</b><span>Registered travellers</span></div></div>
    <h3 style="margin-bottom:12px">Latest bookings</h3>` + (recent.length ? `<div class="tablewrap"><table><thead><tr><th>Traveller</th><th>Trip</th><th>Date</th><th>Seats</th><th>Total</th><th>Status</th></tr></thead><tbody>${recent.map(b=>brow(b,false)).join('')}</tbody></table></div>` : `<div class="empty" style="grid-column:auto">No bookings yet. They will appear here as travellers book.</div>`);
  } else if(adminTab==='trips'){
    content = `<div class="section-head"><h3>${T.length} trips</h3><button class="btn" onclick="tripForm()">Add trip</button></div><div class="tablewrap"><table><thead><tr><th>Trip</th><th>Category</th><th>Days</th><th>Price</th><th>Seats left</th><th></th></tr></thead><tbody>${T.map(t=>`<tr><td><b>${esc(t.title)}</b><br><span class="muted">${esc(t.destination)}, ${esc(t.country)}</span></td><td>${esc(t.category)}</td><td>${t.days}</td><td>${money(t.price)}</td><td>${t.seats}</td><td><div class="actions"><button class="btn ghost sm" onclick="tripForm('${t.id}')">Edit</button><button class="btn danger sm" onclick="delTrip('${t.id}')">Delete</button></div></td></tr>`).join('')}</tbody></table></div>`;
  } else if(adminTab==='bookings'){
    const l = [...B].sort((a,b)=>b.created-a.created);
    content = l.length ? `<div class="tablewrap"><table><thead><tr><th>Traveller</th><th>Trip</th><th>Date</th><th>Seats</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead><tbody>${l.map(b=>brow(b,true)).join('')}</tbody></table></div>` : `<div class="empty" style="grid-column:auto">No bookings yet.</div>`;
  } else {
    const l = U.filter(u=>u.role!=='admin');
    content = l.length ? `<div class="tablewrap"><table><thead><tr><th>Name</th><th>Email</th><th>Joined</th><th>Bookings</th></tr></thead><tbody>${l.map(u=>`<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${new Date(u.created).toLocaleDateString('en-IN')}</td><td>${B.filter(b=>b.userId===u.id).length}</td></tr>`).join('')}</tbody></table></div>` : `<div class="empty" style="grid-column:auto">No travellers yet.</div>`;
  }
  return `<div class="wrap section"><div class="section-head"><h2>Admin dashboard</h2><button class="btn ghost sm" onclick="resetData()">Reset demo data</button></div>
  <div class="tabs" role="tablist">${tabs.map(([k,l])=>`<button role="tab" class="${adminTab===k?'on':''}" onclick="setTab('${k}')">${l}</button>`).join('')}</div>${content}</div>`;
}
function adminStatus(id, s){ setBookingStatus(id, s); toast('Booking ' + s.toLowerCase() + '.'); render(); }
function tripForm(id){
  const t = id ? trips().find(x=>x.id===id) : {title:'',destination:'',country:'India',category:'Beach',days:3,price:10000,seats:20,description:''};
  modal(`<h3>${id?'Edit trip':'Add trip'}</h3><div id="terr"></div>
  <div class="field"><label for="f_title">Title</label><input type="text" id="f_title" value="${esc(t.title)}"></div>
  <div class="row2"><div class="field"><label for="f_dest">Destination</label><input type="text" id="f_dest" value="${esc(t.destination)}"></div><div class="field"><label for="f_country">Country</label><input type="text" id="f_country" value="${esc(t.country)}"></div></div>
  <div class="row2"><div class="field"><label for="f_cat">Category</label><select id="f_cat">${CATS.slice(1).map(c=>`<option ${c===t.category?'selected':''}>${c}</option>`).join('')}</select></div><div class="field"><label for="f_days">Days</label><input type="number" id="f_days" min="1" value="${t.days}"></div></div>
  <div class="row2"><div class="field"><label for="f_price">Price per traveller (₹)</label><input type="number" id="f_price" min="0" value="${t.price}"></div><div class="field"><label for="f_seats">Seats available</label><input type="number" id="f_seats" min="0" value="${t.seats}"></div></div>
  <div class="field"><label for="f_desc">Description</label><textarea id="f_desc">${esc(t.description)}</textarea></div>
  <div class="dlgfoot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="saveTrip('${id||''}')">Save trip</button></div>`);
}
function saveTrip(id){
  const v = k => $('#f_'+k).value.trim();
  const rec = {title:v('title'), destination:v('dest'), country:v('country'), category:v('cat'), days:parseInt(v('days')), price:parseInt(v('price')), seats:parseInt(v('seats')), description:v('desc')};
  const bad = !rec.title ? 'Add a trip title.' : !rec.destination ? 'Add a destination.' : !(rec.days>0) ? 'Days must be 1 or more.' : !(rec.price>=0) ? 'Enter a valid price.' : !(rec.seats>=0) ? 'Enter the seats available.' : '';
  if(bad){ $('#terr').innerHTML = `<div class="err">${esc(bad)}</div>`; return; }
  const ts = trips();
  if(id){ Object.assign(ts.find(x=>x.id===id), rec); } else { ts.unshift({id:uid('t_'), ...rec}); }
  LS.set('wf_trips', ts); closeModal(); toast(id?'Trip updated.':'Trip added.'); render();
}
function delTrip(id){
  askConfirm('The trip will be removed from the site. Existing bookings stay in your records.', 'Delete trip', () => { LS.set('wf_trips', trips().filter(t=>t.id!==id)); toast('Trip deleted.'); render(); });
}
function resetData(){
  askConfirm('This erases all trips, bookings and accounts you added, and restores the starting demo data.', 'Reset everything', () => {
    LS.set('wf_trips', SEED_TRIPS); LS.set('wf_users', SEED_USERS); LS.set('wf_bookings', []); LS.set('wf_session', null);
    toast('Demo data restored.'); go('/admin-login'); render();
  });
}

/* ---------- router ---------- */
function render(){
  const r = curRoute();
  const u = me(); let view;
  if(r.startsWith('/admin') && r !== '/admin-login' && !(u && u.role==='admin')) return go('/admin-login');
  if(r === '/my-bookings' && !u){ sessionStorage.setItem('wf_next','/my-bookings'); return go('/login'); }
  if(r === '/my-bookings' && u.role==='admin') return go('/admin');
  if((r==='/login'||r==='/register') && u) return go(u.role==='admin'?'/admin':'/');
  if(r==='/admin-login' && u && u.role==='admin') return go('/admin');
  if(r==='/') view = viewHome();
  else if(r.startsWith('/trip/')) view = viewTrip(r.slice(6));
  else if(r==='/login') view = viewAuth('user');
  else if(r==='/register') view = viewAuth('register');
  else if(r==='/admin-login') view = viewAuth('admin');
  else if(r==='/my-bookings') view = viewMine();
  else if(r==='/admin') view = viewAdmin();
  else view = `<div class="wrap" style="padding:60px 20px"><h2>Page not found</h2><a class="btn" href="${BASE}#/" style="margin-top:14px">Back to trips</a></div>`;
  $('#app').innerHTML = nav() + view;
  if(r==='/') renderGrid();
  if(!(r==='/' )) window.scrollTo(0,0);
}
window.addEventListener('hashchange', render);
render();
