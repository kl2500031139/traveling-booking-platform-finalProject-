/* ===== Payment module =====
   Checkout (UPI / Card / Net banking), receipt, and payment records in localStorage (wf_payments).
   This is a demo: no real money moves and card details are never stored (only the last 4 digits). */
window.WF = window.WF || { routes: {} };

const PAY_METHODS = [['upi','UPI'],['card','Card'],['netbanking','Net banking']];
const BANKS = ['State Bank of India','HDFC Bank','ICICI Bank','Axis Bank','Kotak Mahindra Bank'];
let payMethod = 'upi';

function payNotice(title, msg, href, label){
  return `<div class="wrap" style="padding:60px 20px"><h2>${esc(title)}</h2><p class="muted">${esc(msg)}</p><a class="btn" href="${href}" style="margin-top:14px">${esc(label)}</a></div>`;
}
function fmtCard(el){ el.value = el.value.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim(); }
function fmtExp(el){ let v = el.value.replace(/\D/g,'').slice(0,4); if(v.length > 2) v = v.slice(0,2) + '/' + v.slice(2); el.value = v; }
function setPayMethod(m){
  payMethod = m;
  $('.payform').dataset.method = m;
  document.querySelectorAll('.mtab').forEach(t => t.classList.toggle('on', t.dataset.m === m));
  $('#perr').innerHTML = '';
}

function viewPay(id){
  const u = me();
  const b = bookings().find(x => x.id === id && x.userId === u.id);
  if(!b) return payNotice('Booking not found','It may have been removed.', BASE+'#/my-bookings','My bookings');
  if(b.status === 'Cancelled') return payNotice('Booking cancelled','This booking was cancelled, so there is nothing to pay.', BASE+'#/my-bookings','My bookings');
  if(b.paymentStatus === 'Paid') return payNotice('Already paid','Payment for this booking is complete.', BASE+'#/receipt/'+b.paymentId,'View receipt');
  const tabs = PAY_METHODS.map(([k,l]) => `<button type="button" class="mtab ${payMethod===k?'on':''}" data-m="${k}" onclick="setPayMethod('${k}')">${l}</button>`).join('');
  return `<div class="wrap section"><a class="back" style="margin-top:0" href="${BASE}#/my-bookings">‹ My bookings</a>
  <div class="trip pay" style="padding-top:12px">
    <div class="payform" data-method="${payMethod}">
      <h2>Choose how to pay</h2>
      <div class="mtabs" role="tablist" aria-label="Payment method">${tabs}</div>
      <div id="perr"></div>
      <div class="mpanel" data-m="upi"><div class="field"><label for="upi">UPI ID</label><input type="text" id="upi" placeholder="name@bank" autocomplete="off"></div></div>
      <div class="mpanel" data-m="card">
        <div class="field"><label for="cname">Name on card</label><input type="text" id="cname" autocomplete="cc-name"></div>
        <div class="field"><label for="cnum">Card number</label><input type="text" id="cnum" inputmode="numeric" placeholder="1234 5678 9012 3456" oninput="fmtCard(this)" autocomplete="cc-number"></div>
        <div class="row2"><div class="field"><label for="cexp">Expiry (MM/YY)</label><input type="text" id="cexp" inputmode="numeric" placeholder="08/29" oninput="fmtExp(this)" autocomplete="cc-exp"></div>
        <div class="field"><label for="ccvv">CVV</label><input type="password" id="ccvv" inputmode="numeric" maxlength="3" placeholder="123" autocomplete="cc-csc"></div></div>
      </div>
      <div class="mpanel" data-m="netbanking"><div class="field"><label for="bank">Select your bank</label><select id="bank">${BANKS.map(x=>`<option>${x}</option>`).join('')}</select></div></div>
      <button class="btn block" id="paybtn" onclick="doPay('${b.id}')">Pay ${money(b.total)}</button>
      <p class="hint">Demo mode: no real money moves. Use a UPI ID like name@bank, any 16 digits, a future expiry and any 3-digit CVV.</p>
    </div>
    <aside class="panel"><h3>Order summary</h3>
      <div class="pic" style="border-radius:10px;overflow:hidden;aspect-ratio:5/3;margin-bottom:12px">${scene(b.category)}</div>
      <div class="sumrow"><span>Trip</span><b>${esc(b.title)}</b></div>
      <div class="sumrow"><span>Travel date</span><b>${fmtDate(b.date)}</b></div>
      <div class="sumrow"><span>Travellers</span><b>${b.travellers}</b></div>
      <div class="total"><span class="muted">Amount to pay</span><b>${money(b.total)}</b></div>
      <a class="back" style="margin:0" href="${BASE}#/my-bookings">Pay later</a>
    </aside>
  </div></div>${foot}`;
}

function doPay(id){
  const u = me();
  const b = bookings().find(x => x.id === id && x.userId === u.id);
  const err = m => { $('#perr').innerHTML = `<div class="err">${esc(m)}</div>`; return false; };
  if(!b || b.status === 'Cancelled' || b.paymentStatus === 'Paid') return err('This booking can’t be paid.');
  let label = '', detail = '';
  if(payMethod === 'upi'){
    const v = $('#upi').value.trim();
    if(!/^[\w.\-]{2,}@[A-Za-z]{2,}$/.test(v)) return err('Enter a valid UPI ID, for example name@bank.');
    label = 'UPI'; detail = v;
  } else if(payMethod === 'card'){
    const name = $('#cname').value.trim(), num = $('#cnum').value.replace(/\s/g,''), exp = $('#cexp').value.trim(), cvv = $('#ccvv').value.trim();
    if(!name) return err('Enter the name on the card.');
    if(!/^\d{16}$/.test(num)) return err('The card number must have 16 digits.');
    const m = exp.match(/^(\d{2})\/(\d{2})$/);
    if(!m || +m[1] < 1 || +m[1] > 12) return err('Enter the expiry as MM/YY.');
    if(new Date(2000 + +m[2], +m[1], 1) <= new Date()) return err('This card has expired.');
    if(!/^\d{3}$/.test(cvv)) return err('The CVV must have 3 digits.');
    label = 'Card'; detail = '•••• ' + num.slice(-4);       // CVV and full number are never stored
  } else {
    label = 'Net banking'; detail = $('#bank').value;
  }
  const btn = $('#paybtn'); btn.disabled = true; btn.textContent = 'Processing payment…';
  setTimeout(() => {
    const bs = bookings(); const bk = bs.find(x => x.id === id);
    const p = { id: uid('p_'), txnId: 'WF' + Date.now().toString().slice(-8) + Math.floor(100 + Math.random()*900),
      bookingId: bk.id, userId: u.id, title: bk.title, amount: bk.total, method: label, detail, status: 'Paid', paidAt: Date.now() };
    const ps = payments(); ps.push(p); LS.set('wf_payments', ps);
    bk.paymentStatus = 'Paid'; bk.paymentId = p.id; LS.set('wf_bookings', bs);
    toast('Payment successful.'); go('/receipt/' + p.id);
  }, 1100);
  return false;
}

function viewReceipt(id){
  const u = me();
  const p = payments().find(x => x.id === id && x.userId === u.id);
  if(!p) return payNotice('Receipt not found','We could not find this payment.', BASE+'#/my-bookings','My bookings');
  const b = bookings().find(x => x.id === p.bookingId) || {};
  const row = (a,v) => `<div class="sumrow"><span>${a}</span><b>${v}</b></div>`;
  return `<div class="wrap section"><div class="receipt"><div class="tick" aria-hidden="true">✓</div>
    <h2>${p.status==='Refunded' ? 'Payment refunded' : 'Payment successful'}</h2>
    <p class="muted">${p.status==='Refunded' ? 'This payment was refunded after the booking was cancelled.' : 'Your booking now waits for the manager’s confirmation.'}</p>
    <div class="rbox">${row('Amount', money(p.amount))}${row('Transaction ID', esc(p.txnId))}${row('Paid on', new Date(p.paidAt).toLocaleString('en-IN'))}${row('Method', esc(p.method) + ' · ' + esc(p.detail))}${row('Trip', esc(p.title))}${row('Travel date', b.date ? fmtDate(b.date) : '-')}${row('Travellers', b.travellers || '-')}${row('Booking status', esc(b.status || '-'))}</div>
    <div class="actions noprint" style="justify-content:center"><button class="btn ghost" onclick="window.print()">Print receipt</button><a class="btn" href="${BASE}#/my-bookings">My bookings</a></div></div></div>`;
}

WF.routes['/pay'] = { roles: ['user'], view: viewPay };
WF.routes['/receipt'] = { roles: ['user'], view: viewReceipt };
