/* ===== User interface module =====
   Light/dark theme switch (remembered in localStorage) and the traveller profile page. */
window.WF = window.WF || { routes: {} };

(function applySavedTheme(){
  try{ const t = localStorage.getItem('wf_theme'); if(t) document.documentElement.dataset.theme = t; }catch(e){}
})();
function toggleTheme(){
  const cur = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try{ localStorage.setItem('wf_theme', next); }catch(e){}
}
WF.themeButton = () => `<button class="link" onclick="toggleTheme()" aria-label="Switch between light and dark theme">◐ Theme</button>`;

function viewProfile(){
  const u = me();
  const mine = bookings().filter(b => b.userId === u.id);
  const active = mine.filter(b => b.status !== 'Cancelled').length;
  const spent = payments().filter(p => p.userId === u.id && p.status === 'Paid').reduce((s,p) => s + p.amount, 0);
  return `<div class="wrap section"><div class="section-head"><h2>My profile</h2></div>
  <div class="stats"><div class="stat hl"><b>${money(spent)}</b><span>Total paid</span></div><div class="stat"><b>${active}</b><span>Active bookings</span></div><div class="stat"><b>${new Date(u.created).toLocaleDateString('en-IN',{month:'short',year:'numeric'})}</b><span>Member since</span></div></div>
  <div class="profile-grid">
    <div class="payform"><h3 style="margin-bottom:14px">Your details</h3><div id="pferr"></div>
      <form onsubmit="return doSaveProfile(event)"><div class="field"><label for="pn">Full name</label><input type="text" id="pn" value="${esc(u.name)}" required></div>
      <div class="field"><label for="pe">Email</label><input type="email" id="pe" value="${esc(u.email)}" disabled></div><button class="btn">Save changes</button></form></div>
    <div class="payform"><h3 style="margin-bottom:14px">Change password</h3><div id="pwerr"></div>
      <form onsubmit="return doChangePw(event)"><div class="field"><label for="cp">Current password</label><input type="password" id="cp" required autocomplete="current-password"></div>
      <div class="field"><label for="np">New password (6+ characters)</label><input type="password" id="np" required minlength="6" autocomplete="new-password"></div>
      <div class="field"><label for="np2">Repeat new password</label><input type="password" id="np2" required autocomplete="new-password"></div><button class="btn">Update password</button></form></div>
  </div></div>${foot}`;
}
function doSaveProfile(e){
  e.preventDefault();
  const name = $('#pn').value.trim();
  if(!name){ $('#pferr').innerHTML = `<div class="err">Enter your name.</div>`; return false; }
  const us = users(); us.find(x => x.id === me().id).name = name; LS.set('wf_users', us);
  toast('Profile saved.'); render(); return false;
}
function doChangePw(e){
  e.preventDefault();
  const u = me(), cp = $('#cp').value, np = $('#np').value, np2 = $('#np2').value;
  const fail = m => { $('#pwerr').innerHTML = `<div class="err">${esc(m)}</div>`; return false; };
  if(u.pass !== hash(cp)) return fail('Your current password is incorrect.');
  if(np.length < 6) return fail('Use at least 6 characters for the new password.');
  if(np !== np2) return fail('The two new passwords do not match.');
  const us = users(); us.find(x => x.id === u.id).pass = hash(np); LS.set('wf_users', us);
  toast('Password updated.'); render(); return false;
}
WF.routes['/profile'] = { roles: ['user'], view: viewProfile };
