// ===== Helpers =====
const INR_RATE = 85;
const money = (usd) => `₹ ${Math.round(Number(usd || 0) * INR_RATE)}`;

function toast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => t.classList.remove("show"), 1200);
}

// ===== Slide Menu =====
const hamburgerBtn = document.querySelector(".hamburger");
const mobileMenu = document.querySelector(".mobile-menu");
const menuOverlay = document.querySelector(".menu-overlay");
const closeMenuBtn = document.querySelector(".close-menu");

function openMenu(){ mobileMenu.classList.add("open"); menuOverlay.classList.add("active"); }
function closeMenu(){ mobileMenu.classList.remove("open"); menuOverlay.classList.remove("active"); }

hamburgerBtn?.addEventListener("click", openMenu);
closeMenuBtn?.addEventListener("click", closeMenu);
menuOverlay?.addEventListener("click", closeMenu);

// ===== Search Popup =====
const searchIcon = document.querySelector(".search-icon");
const searchPopup = document.querySelector(".search-popup");
const closeSearch = document.querySelector(".close-search");
searchIcon?.addEventListener("click", () => searchPopup.classList.add("open"));
closeSearch?.addEventListener("click", () => searchPopup.classList.remove("open"));

// ===== Hero typing =====
const typingEl = document.querySelector(".typing");
const lines = [
  "Luxury deals • Premium brands • Fast delivery",
  "New arrivals everyday • Grab your favourites",
  "Mega Sale Live • Up to 50% OFF"
];
let li = 0, ci = 0, deleting = false;

function typeLoop() {
  if (!typingEl) return;
  const text = lines[li];

  if (!deleting) {
    ci++;
    typingEl.textContent = text.slice(0, ci);
    if (ci >= text.length) { deleting = true; setTimeout(typeLoop, 1100); return; }
  } else {
    ci--;
    typingEl.textContent = text.slice(0, ci);
    if (ci <= 0) { deleting = false; li = (li + 1) % lines.length; }
  }
  setTimeout(typeLoop, deleting ? 35 : 55);
}
typeLoop();

// ===== Elements =====
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

// ===== Cart State =====
let products = [];
let filteredProducts = [];
let cart = loadCart(); // { [id]: {id,title,price,image,qty} }

function loadCart() {
  try {
    const raw = localStorage.getItem("rrmall_cart");
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
function saveCart() {
  try { localStorage.setItem("rrmall_cart", JSON.stringify(cart)); } catch {}
}
function cartCount() {
  return Object.values(cart).reduce((sum, it) => sum + it.qty, 0);
}
function cartSubtotalUsd() {
  return Object.values(cart).reduce((sum, it) => sum + (it.price * it.qty), 0);
}

function openCart(){
  cartDrawer.classList.add("open");
  cartOverlay.classList.add("active");
  cartDrawer.setAttribute("aria-hidden", "false");
}
function closeCart(){
  cartDrawer.classList.remove("open");
  cartOverlay.classList.remove("active");
  cartDrawer.setAttribute("aria-hidden", "true");
}

cartOpenBtns.forEach(btn => btn.addEventListener("click", openCart));
closeCartBtn?.addEventListener("click", closeCart);
cartOverlay?.addEventListener("click", closeCart);

// ===== Render Cart =====
function renderCart(){
  const items = Object.values(cart);

  if (items.length === 0) {
    cartItemsEl.innerHTML = `<div style="padding:14px;text-align:center;opacity:.8;">Your cart is empty 🛒</div>`;
  } else {
    cartItemsEl.innerHTML = items.map(it => `
      <div class="cart-item" data-id="${it.id}">
        <img src="${it.image}" alt="">
        <div class="info">
          <div class="title">${it.title}</div>
          <div class="price">${money(it.price)}</div>

          <div class="qty-row">
            <button class="qty-btn" data-action="dec">-</button>
            <b>${it.qty}</b>
            <button class="qty-btn" data-action="inc">+</button>
            <button class="remove-btn" data-action="remove">Remove</button>
          </div>
        </div>
      </div>
    `).join("");
  }

  const subUsd = cartSubtotalUsd();
  const count = cartCount();

  const subInr = Math.round(subUsd * INR_RATE);
  const deliveryInr = (subInr >= 499 || subInr === 0) ? 0 : 49;
  const totalInr = subInr + deliveryInr;

  cartSubtotalEl.textContent = `₹ ${subInr}`;
  cartDeliveryEl.textContent = `₹ ${deliveryInr}`;
  cartTotalEl.textContent = `₹ ${totalInr}`;

  cartCountEl.textContent = count;
  mobileCartCount.textContent = count;

  saveCart();
}

cartItemsEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const wrap = e.target.closest(".cart-item");
  if (!wrap) return;

  const id = wrap.dataset.id;
  if (!cart[id]) return;

  const action = btn.dataset.action;
  if (action === "inc") cart[id].qty += 1;
  if (action === "dec") cart[id].qty = Math.max(1, cart[id].qty - 1);
  if (action === "remove") delete cart[id];

  renderCart();
});

clearCartBtn?.addEventListener("click", () => {
  cart = {};
  renderCart();
  toast("Cart cleared");
});
checkoutBtn?.addEventListener("click", () => {
  if (cartCount() === 0) return toast("Cart is empty");
  toast("Checkout coming soon 😈");
});

// ===== Premium Product Render =====
function renderProducts(list){
  filteredProducts = list;

  productGrid.innerHTML = list.map(p => `
    <div class="product-card" title="${(p.description || "").replaceAll('"','&quot;')}">
      <div class="product-image">
        <span class="badge">PREMIUM</span>
        <img src="${p.image}" loading="lazy" alt="${p.title}">
        <div class="quick-view">Quick View</div>
      </div>

      <div class="product-info">
        <h3>${p.title.slice(0, 42)}${p.title.length > 42 ? "..." : ""}</h3>

        <div class="rating">⭐⭐⭐⭐☆ <span>(120)</span></div>

        <div class="price-box">
          <span class="new-price">${money(p.price)}</span>
          <span class="old-price">${money(p.price * 1.35)}</span>
        </div>

        <button class="add-btn" data-id="${p.id}">Add to Cart</button>
      </div>
    </div>
  `).join("");
}

// Add to cart from grid
productGrid.addEventListener("click", (e) => {
  const btn = e.target.closest(".add-btn");
  if (!btn) return;

  const id = String(btn.dataset.id);
  const p = products.find(x => String(x.id) === id);
  if (!p) return;

  if (!cart[id]) cart[id] = { id, title: p.title.slice(0, 55), price: p.price, image: p.image, qty: 1 };
  else cart[id].qty += 1;

  renderCart();
  toast("Added to cart ✅");
});

// ===== Status + Skeleton =====
function setStatus(type, html) {
  if (!productStatus) return;
  productStatus.innerHTML = type ? `<div class="${type}">${html}</div>` : "";
}
function showSkeletons(count = 8) {
  if (!skeletonGrid) return;
  skeletonGrid.innerHTML = "";
  for (let i = 0; i < count; i++) skeletonGrid.innerHTML += `<div class="skeleton-card"></div>`;
}
function hideSkeletons() {
  if (!skeletonGrid) return;
  skeletonGrid.innerHTML = "";
}

// ===== API Fetch (cache + retry + timeout) =====
const API_URL = "https://fakestoreapi.com/products";
const CACHE_KEY = "rrmall_products_cache_v2";
const CACHE_TTL_MS = 10 * 60 * 1000;

function getCachedProducts(){
  try{
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.data || !parsed?.ts) return null;
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed.data;
  } catch { return null; }
}
function setCachedProducts(data){
  try{ localStorage.setItem(CACHE_KEY, JSON.stringify({ts:Date.now(), data})); } catch {}
}
function normalizeProducts(apiData){
  return apiData.map(p => ({
    id: String(p.id),
    title: p.title || "Untitled",
    price: Number(p.price || 0),
    image: p.image || "",
    description: p.description || "",
    category: p.category || ""
  }));
}
async function fetchWithTimeout(url, timeoutMs = 9000){
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try{
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

async function loadProducts({force=false} = {}){
  setStatus("", "");
  showSkeletons(8);

  if (!force) {
    const cached = getCachedProducts();
    if (cached) {
      products = cached;
      hideSkeletons();
      setStatus("ok", `Loaded from cache ✅ (${products.length} products)`);
      renderProducts(products);
      return;
    }
  }

  try{
    const apiData = await fetchWithTimeout(API_URL, 9000);
    const normalized = normalizeProducts(apiData);
    products = normalized;
    setCachedProducts(normalized);

    hideSkeletons();
    setStatus("ok", `Live products loaded ✅ (${products.length} products)`);
    renderProducts(products);
  } catch (err) {
    hideSkeletons();

    const fallback = getCachedProducts();
    if (fallback) {
      products = fallback;
      setStatus("error", `API slow/down ⚠️ Showing cached products. <br><button id="retryBtn">Retry</button>`);
      renderProducts(products);
    } else {
      productGrid.innerHTML = "";
      setStatus("error", `Failed to load products ❌ (${err?.name === "AbortError" ? "Timeout" : "Network/API error"})<br><button id="retryBtn">Retry</button>`);
    }

    setTimeout(() => {
      document.getElementById("retryBtn")?.addEventListener("click", () => loadProducts({force:true}));
    }, 0);
  }
}

// ===== Search (hero/top/popup) =====
function runSearch(query){
  const q = (query || "").trim().toLowerCase();
  if (!q) {
    renderProducts(products);
    toast("Showing all products");
    return;
  }
  const list = products.filter(p =>
    p.title.toLowerCase().includes(q) ||
    (p.category && p.category.toLowerCase().includes(q))
  );
  renderProducts(list);
  toast(`Found ${list.length} items`);
}

heroSearchBtn?.addEventListener("click", () => {
  runSearch(heroSearchInput?.value);
  document.querySelector("#shop")?.scrollIntoView({ behavior: "smooth" });
});
heroSearchInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") heroSearchBtn.click();
});

topSearchInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    runSearch(topSearchInput.value);
    document.querySelector("#shop")?.scrollIntoView({ behavior: "smooth" });
  }
});
popupSearchInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    runSearch(popupSearchInput.value);
    searchPopup.classList.remove("open");
    document.querySelector("#shop")?.scrollIntoView({ behavior: "smooth" });
  }
});

// ===== Parallax =====
window.addEventListener("scroll", () => {
  document.querySelectorAll(".hero-bg").forEach(bg => {
    bg.style.transform = `translateY(${window.scrollY * 0.18}px)`;
  });
});

// Run
renderCart();
loadProducts();
