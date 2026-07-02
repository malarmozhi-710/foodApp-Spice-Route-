const MENU = [
  { id: 'burger', name: 'Burger', price: 120, emoji: '🍔' },
  { id: 'pizza', name: 'Pizza', price: 250, emoji: '🍕' },
  { id: 'sandwich', name: 'Sandwich', price: 90, emoji: '🥪' },
  { id: 'fries', name: 'Fries', price: 80, emoji: '🍟' },
  { id: 'juice', name: 'Juice', price: 60, emoji: '🧃' }
  
];

const menuList = document.getElementById('menuList');
const form = document.getElementById('orderForm');
const summaryBody = document.getElementById('summaryBody');
const summaryHint = document.getElementById('summaryHint');
const thankModal = document.getElementById('thankModal');
const closeModal = document.getElementById('closeModal');
document.getElementById('year').textContent = new Date().getFullYear();

function renderMenu() {
  menuList.innerHTML = MENU.map(item => `
    <article class="menu-card" data-id="${item.id}" data-testid="menu-card-${item.id}">
      <div class="menu-card-top">
        <div style="display:flex;gap:14px;align-items:center;">
          <div class="menu-emoji">${item.emoji}</div>
          <div>
            <h4 class="menu-name">${item.name}</h4>
            <div class="menu-price">₹${item.price}</div>
          </div>
        </div>
      </div>
      <div class="menu-card-actions">
        <label class="check-wrap">
          <input type="checkbox" data-check="${item.id}" data-testid="check-${item.id}" />
          <span>Add</span>
        </label>
        <div class="qty-wrap">
          <button type="button" class="qty-btn" data-dec="${item.id}" aria-label="decrease">−</button>
          <input class="qty-input" type="number" min="1" value="1" data-qty="${item.id}" data-testid="qty-${item.id}" />
          <button type="button" class="qty-btn" data-inc="${item.id}" aria-label="increase">+</button>
        </div>
      </div>
    </article>
  `).join('');

  menuList.addEventListener('change', handleMenuChange);
  menuList.addEventListener('click', handleQtyClick);
  menuList.addEventListener('input', handleQtyInput);
}

function handleMenuChange(e) {
  if (e.target.matches('[data-check]')) {
    const card = e.target.closest('.menu-card');
    card.classList.toggle('is-selected', e.target.checked);
  }
}

function handleQtyClick(e) {
  const incId = e.target.getAttribute('data-inc');
  const decId = e.target.getAttribute('data-dec');
  const id = incId || decId;
  if (!id) return;
  const input = menuList.querySelector(`[data-qty="${id}"]`);
  let v = parseInt(input.value || '1', 10);
  if (Number.isNaN(v) || v < 1) v = 1;
  v = incId ? v + 1 : Math.max(1, v - 1);
  input.value = v;
}

function handleQtyInput(e) {
  if (e.target.matches('[data-qty]')) {
    let v = parseInt(e.target.value, 10);
    if (Number.isNaN(v) || v < 1) e.target.value = 1;
  }
}

function setError(field, msg) {
  const el = form.querySelector(`[data-err="${field}"]`);
  if (el) el.textContent = msg || '';
}

function validateCustomer(data) {
  let ok = true;
  setError('name');
  setError('mobile');
  setError('address');

  if (!data.name || data.name.trim().length < 2) {
    setError('name', 'Please enter your full name (min 2 characters).');
    ok = false;
  }
  if (!/^[6-9]\d{9}$/.test(data.mobile)) {
    setError('mobile', 'Enter a valid 10-digit Indian mobile number.');
    ok = false;
  }
  if (!data.address || data.address.trim().length < 6) {
    setError('address', 'Please enter a delivery address (min 6 characters).');
    ok = false;
  }
  return ok;
}

function collectOrder() {
  const items = [];
  MENU.forEach(item => {
    const checked = menuList.querySelector(`[data-check="${item.id}"]`).checked;
    if (!checked) return;
    const qty = Math.max(1, parseInt(menuList.querySelector(`[data-qty="${item.id}"]`).value, 10) || 1);
    items.push({ ...item, qty, subtotal: qty * item.price });
  });
  const grandTotal = items.reduce((sum, i) => sum + i.subtotal, 0);
  return { items, grandTotal };
}

function renderSummary(customer, order, thankYou = false) {
  if (order.items.length === 0) {
    summaryHint.textContent = 'Your order will appear here.';
    summaryBody.innerHTML = '<p class="summary-empty">No items selected yet. Pick something tasty from the menu!</p>';
    return;
  }
  summaryHint.textContent = "Here's what you're ordering.";

  const linesHtml = order.items.map(i => `
    <div class="summary-line" data-testid="summary-line-${i.id}">
      <span><b>${i.name}</b> × ${i.qty}</span>
      <span>₹${i.subtotal}</span>
    </div>
  `).join('');

  summaryBody.innerHTML = `
    <div class="summary-customer">
      <strong>${escapeHtml(customer.name || 'Guest')}</strong>
      <span style="color:var(--muted);font-size:13px">
        ${escapeHtml(customer.mobile || '')}${customer.mobile ? ' · ' : ''}${escapeHtml(customer.address || '')}
      </span>
    </div>
    ${linesHtml}
    <hr class="summary-divider" />
    <div class="summary-total" data-testid="summary-grand-total">
      <span>Grand Total</span>
      <span>₹${order.grandTotal}</span>
    </div>
    ${thankYou ? '<div class="summary-thanks">Thank You for Ordering!</div>' : ''}
  `;
}

function escapeHtml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function liveUpdate() {
  const customer = {
    name: form.name.value,
    mobile: form.mobile.value,
    address: form.address.value
  };
  renderSummary(customer, collectOrder(), false);
}
menuList.addEventListener('change', liveUpdate);
menuList.addEventListener('input', liveUpdate);
form.addEventListener('input', liveUpdate);

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const customer = {
    name: form.name.value.trim(),
    mobile: form.mobile.value.trim(),
    address: form.address.value.trim()
  };
  const order = collectOrder();

  const custOk = validateCustomer(customer);
  if (!custOk) return;

  if (order.items.length === 0) {
    summaryHint.textContent = 'Please pick at least one item from the menu.';
    summaryBody.innerHTML = '<p class="summary-empty" style="color:var(--danger)">No items selected. Tick at least one dish to order.</p>';
    return;
  }

  renderSummary(customer, order, true);
  openModal();
});

function openModal() {
  thankModal.classList.add('is-open');
  thankModal.setAttribute('aria-hidden', 'false');
}
function hideModal() {
  thankModal.classList.remove('is-open');
  thankModal.setAttribute('aria-hidden', 'true');
}
closeModal.addEventListener('click', () => {
  hideModal();
  form.reset();
  MENU.forEach(item => {
    menuList.querySelector(`[data-check="${item.id}"]`).checked = false;
    menuList.querySelector(`[data-qty="${item.id}"]`).value = 1;
    menuList.querySelector(`.menu-card[data-id="${item.id}"]`).classList.remove('is-selected');
  });
  liveUpdate();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
thankModal.addEventListener('click', (e) => {
  if (e.target === thankModal) hideModal();
});

renderMenu();
liveUpdate();