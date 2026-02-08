// ===== CART PAGE JS (RR MALL) =====
const INR_RATE = 85;
const CART_KEY = "rrmall_cart_v2";

const money = (usd) => `₹ ${Math.round(Number(usd || 0) * INR_RATE)}`;

function toast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => t.classList.remove("show"), 1200);
}

// ===== MENU (same slide menu behavior) =====
const hamburgerBtn = document.querySelector(".hamburger");
const mobileMenu = document.querySelector(".mobile-menu");
const menuOverlay = document.querySelector(".menu-overlay");
const closeMenuBtn = document.querySelector(".close-menu");

hamburgerBtn?.addEventListener("click", () => { mobileMenu.classList.add("open"); menuOverlay.classList.add("active"); });
closeMenuBtn?.addEventListener("click", () => { mobileMenu.classList.remove("open"); menuOverlay.classList.remove("active"); });
menuOverlay?.addEventListener("click", () => { mobileMenu.classList.remove("open"); menuOverlay.classList.remove("active"); });

// ===== ELEMENTS =====
const cartCountEl = document.querySelector(".cart-count");

const cpList = document.getElementById("cpList");
const cpEmpty = document.getElementById("cpEmpty");

const cpItemsCount = document.getElementById("cpItemsCount");
const cpSubtotal = document.getElementById("cpSubtotal");
const cpDelivery = document.getElementById("cpDelivery");
const cpTotal = document.getElementById("cpTotal");

const cpClearBtn = document.getElementById("cpClearBtn");
const cpCheckoutBtn = document.getElementById("cpCheckoutBtn");

const cpCoupon = document.getElementById("cpCoupon");
const cpApplyCoupon = document.getElementById("cpApplyCoupon");
const cpCouponNote = document.getElementById("cpCouponNote");

// ===== STATE =====
let cart = loadCart();
let couponDiscountInr = 0;

// ===== CART CORE =====
function loadCart(){
  try { return JSON.parse(localStorage.getItem(CART_KEY) || "{}"); }
  catch { return {}; }
}
function saveCart(){
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch {}
}

function itemsCount(){
  return Object.values(cart).reduce((s, it) => s + (it.qty || 0), 0);
}

function subtotalUsd(){
  return Object.values(cart).reduce((s, it) => {
    const price = Number(it.unitPrice || it.price || 0);
    const qty = Number(it.qty || 0);
    return s + price * qty;
  }, 0);
}

function calcDeliveryInr(subInr){
  // same rule as drawer: free >= 499
  if (subInr === 0) return 0;
  return (subInr >= 499) ? 0 : 49;
}

function syncBadge(){
  if (cartCountEl) cartCountEl.textContent = itemsCount();
}

function render(){
  const items = Object.values(cart);

  // Empty state
  const empty = items.length === 0;
  cpEmpty.hidden = !empty;
  cpList.style.display = empty ? "none" : "grid";

  // List
  cpList.innerHTML = items.map(it => `
    <div class="cp-item" data-key="${it.key}">
      <div class="cp-img">
        <img src="${it.image}" alt="${it.title}">
      </div>

      <div class="cp-info">
        <div class="cp-top">
          <div class="cp-title">${it.title}</div>
          <button class="cp-remove" data-action="remove" aria-label="Remove">Remove</button>
        </div>

        <div class="cp-meta">
          ${it.size || it.color ? `<span class="cp-chip">${it.size || "—"} ${it.color ? "• "+it.color : ""}</span>` : `<span class="cp-chip">Default</span>`}
          <span class="cp-price">${money(it.unitPrice || it.price)} <span class="cp-muted">/item</span></span>
        </div>

        <div class="cp-bottom">
          <div class="cp-qty">
            <button class="cp-qty-btn" data-action="dec">−</button>
            <b class="cp-qty-val">${it.qty}</b>
            <button class="cp-qty-btn" data-action="inc">+</button>
            <span class="cp-limit">max 10</span>
          </div>

          <div class="cp-line-total">
            <span class="cp-muted">Total</span>
            <b>${money((it.unitPrice || it.price) * it.qty)}</b>
          </div>
        </div>
      </div>
    </div>
  `).join("");

  // Totals
  const subUsd = subtotalUsd();
  const subInr = Math.round(subUsd * INR_RATE);
  const deliveryInr = calcDeliveryInr(subInr);

  // Apply coupon discount but never more than subtotal
  const disc = Math.min(couponDiscountInr, subInr);
  const totalInr = Math.max(0, subInr - disc + deliveryInr);

  cpItemsCount.textContent = itemsCount();
  cpSubtotal.textContent = `₹ ${subInr}`;
  cpDelivery.textContent = `₹ ${deliveryInr}`;
  cpTotal.textContent = `₹ ${totalInr}`;

  // Checkout enable/disable
  cpCheckoutBtn.disabled = empty;
  cpCheckoutBtn.classList.toggle("disabled", empty);

  saveCart();
  syncBadge();
}

// ===== EVENTS =====
cpList.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const card = e.target.closest(".cp-item");
  if (!card) return;

  const key = card.dataset.key;
  if (!cart[key]) return;

  const action = btn.dataset.action;

  if (action === "inc") cart[key].qty = Math.min(10, cart[key].qty + 1);
  if (action === "dec") cart[key].qty = Math.max(1, cart[key].qty - 1);
  if (action === "remove") delete cart[key];

  render();
});

cpClearBtn.addEventListener("click", () => {
  cart = {};
  couponDiscountInr = 0;
  cpCouponNote.textContent = "";
  cpCoupon.value = "";
  render();
  toast("Cart cleared ✅");
});

cpApplyCoupon.addEventListener("click", () => {
  const code = (cpCoupon.value || "").trim().toUpperCase();

  // Simple premium demo coupon
  // RR10 => flat ₹10 off, RR50 => flat ₹50 off
  if (!code) {
    couponDiscountInr = 0;
    cpCouponNote.textContent = "";
    render();
    return;
  }

  if (code === "RR10") {
    couponDiscountInr = 10;
    cpCouponNote.textContent = "✅ Coupon applied: ₹10 OFF";
  } else if (code === "RR50") {
    couponDiscountInr = 50;
    cpCouponNote.textContent = "✅ Coupon applied: ₹50 OFF";
  } else {
    couponDiscountInr = 0;
    cpCouponNote.textContent = "❌ Invalid coupon";
    toast("Invalid coupon");
  }

  render();
});

cpCheckoutBtn.addEventListener("click", () => {
  if (itemsCount() === 0) return;
  toast("Checkout page next 😈 (we’ll build in next task)");
  // Future: window.location.href = "checkout.html";
});

// ===== INIT =====
render();
