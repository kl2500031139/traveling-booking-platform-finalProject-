/* ===== Manager module =====
   Operations dashboard for the manager role: confirm paid bookings, watch payments and read reports.
   Managers cannot add or delete trips and cannot manage accounts (that stays with the admin). */
window.WF = window.WF || { routes: {} };

let mgrTab = 'overview';
function setMgrTab(t){ mgrTab = t; render(); }

function barRows(items, fmt){
  if(!items.length) return `<p class="muted">Nothing to show yet.</p>`;
  const max = Math.max(1, ...items.map(i => i[1]));
  return `<div class="bars">${items.map(([l,v]) => `<div class="bar"><span class="bl">${esc(l)}</span><span class="bt"><i style="width:${Math.max(3, Math.round(v/max*100))}%"></i></span><b>${fmt(v)}</b></div>`).join('')}</div>`;
}
function groupSum(list, keyFn, valFn){
  const m = {}; list.forEach(x => { const k = keyFn(x); m[k] = (m[k] || 0) + valFn(x); });
  return Object.entries(m).sort((a,b) => b[1] - a[1]);
}

function viewManager(){
  const B = bookings(), P = payments();
  const paid = P.filter(p => p.status === 'Paid'), refunded = P.filter(p => p.status === 'Refunded');
  const ready = B.filter(b => b.status === 'Pending' && b.paymentStatus === 'Paid');
  const unpaid = B.filter(b => b.status !== 'Cancelled' && b.paymentStatus !== 'Paid' && b.paymentStatus !== 'Refunded');
  const sum = l => l.reduce((s,p) => s + p.amount, 0);
  const tabs = [['overview','Overview'],['bookings','Bookings'],['payments','Payments'],['reports','Reports']];
  let content = '';
  if(mgrTab === 'overview'){
    content = `<div class="stats"><div class="stat hl"><b>${ready.length}</b><span>Paid, ready to confirm</span></div><div class="stat"><b>${unpaid.length}</b><span>Awaiting payment</span></div><div class="stat"><b>${money(sum(paid))}</b><span>Paid revenue</span></div><div class="stat"><b>${money(sum(refunded))}</b><span>Refunded</span></div></div>
    <h3 style="margin-bottom:12px">Ready to confirm</h3>` + (ready.length ? bookingsTable(ready, true) : `<div class="empty" style="grid-column:auto">Nothing is waiting. Paid bookings will show up here.</div>`);
  } else if(mgrTab === 'bookings'){
    content = bookingsTable([...B].sort((a,b) => b.created - a.created), true);
  } else if(mgrTab === 'payments'){
    content = paymentsTable([...P].sort((a,b) => b.paidAt - a.paidAt));
  } else {
    const byStatus = ['Confirmed','Pending','Cancelled'].map(s => [s, B.filter(b => b.status === s).length]).filter(x => x[1] > 0);
    content = `<div class="reports">
      <div class="rcard"><h3>Revenue by trip</h3>${barRows(groupSum(paid, p => p.title, p => p.amount), money)}</div>
      <div class="rcard"><h3>Bookings by status</h3>${barRows(byStatus, v => v)}</div>
      <div class="rcard"><h3>Payments by method</h3>${barRows(groupSum(paid, p => p.method, () => 1), v => v)}</div></div>`;
  }
  return `<div class="wrap section"><div class="section-head"><h2>Manager dashboard</h2></div>
  <div class="tabs" role="tablist">${tabs.map(([k,l]) => `<button role="tab" class="${mgrTab===k?'on':''}" onclick="setMgrTab('${k}')">${l}</button>`).join('')}</div>${content}</div>`;
}

WF.routes['/manager'] = { roles: ['manager'], view: viewManager };
