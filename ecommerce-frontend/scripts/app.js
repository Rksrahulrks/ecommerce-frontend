const INR_RATE = 85;
const API_URL = "https://fakestoreapi.com/products";
const CACHE_KEY = "rrmall_products_cache_light_v1";
const CACHE_TTL_MS = 10 * 60 * 1000;
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
function stars(rate){
  const r = Math.max(0, Math.min(5, Number(rate || 0)));
  const full = Math.floor(r);
  const empty = 5 - full;
  return "★".repeat(full) + "✩".repeat(empty);
}

/* MENU */
const hamburgerBtn = document.querySelector(".hamburger");
const mobileMenu = document.querySelector(".mobile-menu");
const menuOverlay = document.querySelector(".menu-overlay");
const closeMenuBtn = document.querySelector(".close-menu");

hamburgerBtn?.addEventListener("click", () => { mobileMenu.classList.add("open"); menuOverlay.classList.add("active"); });
closeMenuBtn?.addEventListener("click", () => { mobileMenu.classList.remove("open"); menuOverlay.classList.remove("active"); });
menuOverlay?.addEventListener("click", () => { mobileMenu.classList.remove("open"); menuOverlay.classList.remove("active"); });

/* SEARCH POPUP */
const searchIcon = document.querySelector(".search-icon");
const searchPopup = document.querySelector(".search-popup");
const closeSearch = document.querySelector(".close-search");
searchIcon?.addEventListener("click", () => searchPopup.classList.add("open"));
closeSearch?.addEventListener("click", () => searchPopup.classList.remove("open"));

/* TYPING */
const typingEl = document.querySelector(".typing");
const lines = [
  "Premium brands • Smooth shopping • Fast delivery",
  "New arrivals daily • Limited offers live",
  "Big savings • Easy returns • Secure checkout"
];
let li = 0, ci = 0, deleting = false;
function typeLoop() {
  if (!typingEl) return;
  const text = lines[li];
  if (!deleting) {
    ci++;
    typingEl.textContent = text.slice(0, ci);
    if (ci >= text.length) { deleting = true; setTimeout(typeLoop, 900); return; }
  } else {
    ci--;
    typingEl.textContent = text.slice(0, ci);
    if (ci <= 0) { deleting = false; li = (li + 1) % lines.length; }
  }
  setTimeout(typeLoop, deleting ? 30 : 45);
}
typeLoop();

/* ELEMENTS */
const productGrid = document.getElementById("productGrid");
const skeletonGrid = document.getElementById("skeletonGrid");
const productStatus = document.getElementById("productStatus");

const cartCountEl = document.querySelector(".cart-count");
const mobileCartCount = document.getElementById("mobileCartCount");

const cartDrawer = document.querySelector(".cart-drawer");
const cartOverlay = document.querySelector(".cart-overlay");
const cartItemsEl = document.getElementById("cartItems");
const cartSubtotalEl = document.getElementById("cartSubtotal");
const cartDeliveryEl = document.getElementById("cartDelivery");
const cartTotalEl = document.getElementById("cartTotal");

const closeCartBtn = document.querySelector(".close-cart");
const clearCartBtn = document.getElementById("clearCartBtn");
const checkoutBtn = document.getElementById("checkoutBtn");
const cartOpenBtns = document.querySelectorAll(".cart-btn");

const heroSearchInput = document.getElementById("heroSearchInput");
const heroSearchBtn = document.getElementById("heroSearchBtn");
const topSearchInput = document.getElementById("topSearchInput");
const popupSearchInput = document.getElementById("popupSearchInput");

/* QUICK VIEW */
const qvOverlay = document.getElementById("qvOverlay");
const qvModal = document.getElementById("qvModal");
const qvClose = document.getElementById("qvClose");
const qvImg = document.getElementById("qvImg");
const qvCat = document.getElementById("qvCat");
const qvRating = document.getElementById("qvRating");
const qvTitle = document.getElementById("qvTitle");
const qvPrice = document.getElementById("qvPrice");
const qvOld = document.getElementById("qvOld");
const qvDesc = document.getElementById("qvDesc");
const qvAdd = document.getElementById("qvAdd");
const qvGo = document.getElementById("qvGo");

/* STATE */
let products = [];
let cart = loadCart();

/* CART CORE */
function loadCart(){
  try { return JSON.parse(localStorage.getItem(CART_KEY) || "{}"); }
  catch { return {}; }
}
function saveCart(){ try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch {} }
function cartCount(){ return Object.values(cart).reduce((s, it) => s + (it.qty || 0), 0); }
function cartSubtotalUsd(){
  return Object.values(cart).reduce((s, it) => s + (Number(it.unitPrice || it.price || 0) * (it.qty || 0)), 0);
}
function syncCartBadge(){
  const count = cartCount();
  if (cartCountEl) cartCountEl.textContent = count;
  if (mobileCartCount) mobileCartCount.textContent = count;
}
function openCart(){ cartDrawer.classList.add("open"); cartOverlay.classList.add("active"); }
function closeCart(){ cartDrawer.classList.remove("open"); cartOverlay.classList.remove("active"); }
cartOpenBtns.forEach(btn => btn.addEventListener("click", openCart));
closeCartBtn?.addEventListener("click", closeCart);
cartOverlay?.addEventListener("click", closeCart);

function renderCart(){
  const items = Object.values(cart);

  cartItemsEl.innerHTML = items.length ? items.map(it => `
    <div class="cart-item" data-key="${it.key}">
      <img src="${it.image}" alt="">
      <div class="info">
        <div class="title">
          ${it.title}
          ${it.size || it.color ? `<div style="font-size:11px;opacity:.75;font-weight:900;margin-top:2px;">${it.size || ""} ${it.color ? "• " + it.color : ""}</div>` : ""}
        </div>
        <div class="price">${money(it.unitPrice || it.price)} × ${it.qty}</div>
        <div class="qty-row">
          <button class="qty-btn" data-action="dec">-</button>
          <b>${it.qty}</b>
          <button class="qty-btn" data-action="inc">+</button>
          <button class="remove-btn" data-action="remove">Remove</button>
        </div>
      </div>
    </div>
  `).join("") : `<div style="padding:14px;text-align:center;opacity:.8;">Your cart is empty 🛒</div>`;

  const subUsd = cartSubtotalUsd();
  const subInr = Math.round(subUsd * INR_RATE);
  const deliveryInr = (subInr >= 499 || subInr === 0) ? 0 : 49;
  const totalInr = subInr + deliveryInr;

  cartSubtotalEl.textContent = `₹ ${subInr}`;
  cartDeliveryEl.textContent = `₹ ${deliveryInr}`;
  cartTotalEl.textContent = `₹ ${totalInr}`;

  saveCart();
  syncCartBadge();
}

cartItemsEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const row = e.target.closest(".cart-item");
  if (!row) return;

  const key = row.dataset.key;
  if (!cart[key]) return;

  const action = btn.dataset.action;
  if (action === "inc") cart[key].qty = Math.min(10, cart[key].qty + 1);
  if (action === "dec") cart[key].qty = Math.max(1, cart[key].qty - 1);
  if (action === "remove") delete cart[key];

  renderCart();
});

clearCartBtn?.addEventListener("click", () => { cart = {}; renderCart(); toast("Cart cleared"); });
checkoutBtn?.addEventListener("click", () => toast(cartCount() ? "Checkout coming soon 😈" : "Cart is empty"));

/* STATUS + SKELETON */
function setStatus(type, html){
  productStatus.innerHTML = type ? `<div class="${type}">${html}</div>` : "";
}
function showSkeletons(count=8){
  skeletonGrid.innerHTML = "";
  for(let i=0;i<count;i++) skeletonGrid.innerHTML += `<div class="skeleton-card"></div>`;
}
function hideSkeletons(){ skeletonGrid.innerHTML = ""; }

/* ADD TO CART (LIST) */
function addToCartFromList(p, qty=1){
  qty = Math.max(1, Math.min(10, Number(qty || 1)));
  const key = `${p.id}__DEFAULT`;
  const unitPrice = Number(p.price || 0);

  if (!cart[key]) {
    cart[key] = {
      key,
      id: String(p.id),
      title: (p.title || "").slice(0, 55),
      image: p.image || "",
      unitPrice,
      qty
    };
  } else {
    cart[key].qty = Math.min(10, cart[key].qty + qty);
  }

  renderCart();
  toast("Added to cart ✅");
}

/* QUICK VIEW */
function openQV(p){
  qvImg.src = p.image;
  qvCat.textContent = (p.category || "").toUpperCase();
  qvRating.textContent = `${stars(p.ratingRate)} (${p.ratingCount || 0})`;
  qvTitle.textContent = p.title;
  qvPrice.textContent = money(p.price);
  qvOld.textContent = money(p.price * 1.35);
  qvDesc.textContent = p.description || "";
  qvGo.href = `product.html?id=${p.id}`;

  qvAdd.onclick = () => addToCartFromList(p, 1);

  qvOverlay.classList.add("active");
  qvModal.classList.add("open");
}
function closeQV(){
  qvOverlay.classList.remove("active");
  qvModal.classList.remove("open");
}
qvClose?.addEventListener("click", closeQV);
qvOverlay?.addEventListener("click", closeQV);
window.addEventListener("keydown", (e)=>{ if(e.key==="Escape") closeQV(); });

/* RENDER */
function renderProducts(list){
  productGrid.innerHTML = list.map(p => `
    <div class="product-card" data-id="${p.id}">
      <div class="product-image">
        <span class="badge">PREMIUM</span>
        <img src="${p.image}" loading="lazy" alt="${p.title}">
        <div class="quick-view">Quick View</div>
      </div>

      <div class="product-info">
        <h3>${p.title.slice(0, 42)}${p.title.length > 42 ? "..." : ""}</h3>
        <div class="rating">${stars(p.ratingRate)} <span>(${p.ratingCount || 0})</span></div>

        <div class="price-box">
          <span class="new-price">${money(p.price)}</span>
          <span class="old-price">${money(p.price * 1.35)}</span>
        </div>

        <button class="add-btn" data-add="${p.id}">Add to Cart</button>
      </div>
    </div>
  `).join("");
}

/* GRID CLICK */
productGrid.addEventListener("click", (e) => {
  const addBtn = e.target.closest(".add-btn");
  if (addBtn) {
    const id = String(addBtn.dataset.add);
    const p = products.find(x => String(x.id) === id);
    if (!p) return;
    addBtn.animate([{transform:"scale(1)"},{transform:"scale(1.06)"},{transform:"scale(1)"}], {duration:180});
    addToCartFromList(p, 1);
    return;
  }

  const qv = e.target.closest(".quick-view");
  if (qv) {
    const card = e.target.closest(".product-card");
    const id = card?.dataset.id;
    const p = products.find(x => String(x.id) === String(id));
    if (p) openQV(p);
    return;
  }

  const card = e.target.closest(".product-card");
  const id = card?.dataset.id;
  if (id) window.location.href = `product.html?id=${id}`;
});

/* CACHE + API */
function getCached(){
  try{
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.data || !parsed?.ts) return null;
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed.data;
  } catch { return null; }
}
function setCached(data){
  try{ localStorage.setItem(CACHE_KEY, JSON.stringify({ts:Date.now(), data})); } catch {}
}
function normalize(apiData){
  return apiData.map(p => ({
    id: String(p.id),
    title: p.title || "Untitled",
    price: Number(p.price || 0),
    image: p.image || "",
    description: p.description || "",
    category: p.category || "",
    ratingRate: Number(p.rating?.rate || 0),
    ratingCount: Number(p.rating?.count || 0),
  }));
}
async function fetchWithTimeout(url, timeoutMs=9000){
  const controller = new AbortController();
  const t = setTimeout(()=>controller.abort(), timeoutMs);
  try{
    const res = await fetch(url, {signal: controller.signal});
    if (!res.ok) throw new Error("API error");
    return await res.json();
  } finally { clearTimeout(t); }
}
async function loadProducts(force=false){
  setStatus("", "");
  showSkeletons(8);

  if (!force){
    const cached = getCached();
    if (cached){
      products = cached;
      hideSkeletons();
      setStatus("ok", `Loaded from cache ✅ (${products.length} products)`);
      renderProducts(products);
      return;
    }
  }

  try{
    const apiData = await fetchWithTimeout(API_URL, 9000);
    products = normalize(apiData);
    setCached(products);

    hideSkeletons();
    setStatus("ok", `Live products loaded ✅ (${products.length} products)`);
    renderProducts(products);
  } catch {
    hideSkeletons();
    setStatus("error", `Failed to load products ❌ <br><button id="retryBtn">Retry</button>`);
    document.getElementById("retryBtn")?.addEventListener("click", ()=>loadProducts(true));
  }
}

/* SEARCH */
function runSearch(query){
  const q = (query || "").trim().toLowerCase();
  if (!q){ renderProducts(products); toast("Showing all products"); return; }
  const list = products.filter(p =>
    p.title.toLowerCase().includes(q) ||
    (p.category || "").toLowerCase().includes(q)
  );
  renderProducts(list);
  toast(`Found ${list.length} items`);
}
heroSearchBtn?.addEventListener("click", ()=>{ runSearch(heroSearchInput.value); document.querySelector("#shop")?.scrollIntoView({behavior:"smooth"}); });
heroSearchInput?.addEventListener("keydown",(e)=>{ if(e.key==="Enter") heroSearchBtn.click(); });

topSearchInput?.addEventListener("keydown",(e)=>{ if(e.key==="Enter"){ runSearch(topSearchInput.value); document.querySelector("#shop")?.scrollIntoView({behavior:"smooth"}); }});
popupSearchInput?.addEventListener("keydown",(e)=>{ if(e.key==="Enter"){ runSearch(popupSearchInput.value); searchPopup.classList.remove("open"); document.querySelector("#shop")?.scrollIntoView({behavior:"smooth"}); }});

// Parallax
window.addEventListener("scroll", () => {
  document.querySelectorAll(".hero-bg").forEach(bg => {
    bg.style.transform = `translateY(${window.scrollY * 0.12}px)`;
  });
});

/* RUN */
renderCart();
syncCartBadge();
loadProducts();
