// ===== RR MALL HOME (Grid + API + Cart Drawer + Quick View) =====
const INR_RATE = 85;
const API_URL = "https://fakestoreapi.com/products";
const CACHE_KEY = "rrmall_products_cache_v2";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const CART_KEY = "rrmall_cart_v2";

const money = (usd) => `₹ ${Math.round(Number(usd || 0) * INR_RATE)}`;
const stars = (rate) => {
  const r = Math.max(0, Math.min(5, Number(rate || 0)));
  const full = Math.floor(r);
  const empty = 5 - full;
  return "★".repeat(full) + "✩".repeat(empty);
};

function toast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => t.classList.remove("show"), 1200);
}

function debounce(fn, wait = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

/* ===== MENU (left -> right) ===== */
const hamburgerBtn = document.querySelector(".hamburger");
const mobileMenu = document.querySelector(".mobile-menu");
const menuOverlay = document.querySelector(".menu-overlay");
const closeMenuBtn = document.querySelector(".close-menu");

function openMenu() { mobileMenu?.classList.add("open"); menuOverlay?.classList.add("active"); }
function closeMenu() { mobileMenu?.classList.remove("open"); menuOverlay?.classList.remove("active"); }

hamburgerBtn?.addEventListener("click", openMenu);
closeMenuBtn?.addEventListener("click", closeMenu);
menuOverlay?.addEventListener("click", closeMenu);

/* ===== SEARCH POPUP ===== */
const searchIcon = document.querySelector(".search-icon");
const searchPopup = document.querySelector(".search-popup");
const closeSearchBtn = document.querySelector(".close-search");
const topSearchInput = document.getElementById("topSearchInput");
const popupSearchInput = document.getElementById("popupSearchInput");
const heroSearchInput = document.getElementById("heroSearchInput");
const heroSearchBtn = document.getElementById("heroSearchBtn");

function openSearch() { searchPopup?.classList.add("open"); popupSearchInput?.focus(); }
function closeSearch() { searchPopup?.classList.remove("open"); }

searchIcon?.addEventListener("click", openSearch);
closeSearchBtn?.addEventListener("click", closeSearch);

let searchQuery = "";

/* ===== HERO typing ===== */
const typingEl = document.querySelector(".typing");
const lines = [
  "Premium deals. Smooth experience.",
  "Fast delivery. Easy returns.",
  "Real API products. Real cart system."
];
let li = 0, ci = 0, del = false;
function typeLoop(){
  if(!typingEl) return;
  const text = lines[li];
  typingEl.textContent = text.slice(0, ci);

  if(!del){
    ci++;
    if(ci > text.length + 10){ del = true; }
  } else {
    ci--;
    if(ci <= 0){ del = false; li = (li + 1) % lines.length; }
  }
  setTimeout(typeLoop, del ? 35 : 55);
}
typeLoop();

/* ===== PRODUCTS ===== */
const productGrid = document.getElementById("productGrid");
const skeletonGrid = document.getElementById("skeletonGrid");
const productStatus = document.getElementById("productStatus");

let allProducts = [];

function setStatus(type, html){
  if(!productStatus) return;
  productStatus.innerHTML = type ? `<div class="${type}">${html}</div>` : "";
}

function showSkeleton(count = 12){
  if(!skeletonGrid) return;
  skeletonGrid.innerHTML = Array.from({length:count}).map(()=>`<div class="skeleton-card"></div>`).join("");
  skeletonGrid.style.display = "grid";
}
function hideSkeleton(){
  if(!skeletonGrid) return;
  skeletonGrid.style.display = "none";
}

function getCached(){
  try{
    const raw = localStorage.getItem(CACHE_KEY);
    if(!raw) return null;
    const parsed = JSON.parse(raw);
    if(!parsed?.data || !parsed?.ts) return null;
    if(Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed.data;
  } catch { return null; }
}

function setCache(data){
  try{
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch {}
}

async function fetchProducts(){
  const cached = getCached();
  if(cached) return cached;

  const res = await fetch(API_URL);
  if(!res.ok) throw new Error("API error");
  const data = await res.json();
  setCache(data);
  return data;
}

function renderProducts(list){
  if(!productGrid) return;
  productGrid.innerHTML = list.map(p => {
    const rate = p.rating?.rate || 0;
    const count = p.rating?.count || 0;
    return `
      <article class="product-card" data-id="${p.id}">
        <div class="product-image">
          <span class="badge">Premium</span>
          <img loading="lazy" src="${p.image}" alt="${p.title}">
          <button class="quick-view" type="button" data-action="qv">Quick View</button>
        </div>

        <div class="product-info">
          <h3 title="${p.title}">${p.title}</h3>
          <div class="rating">${stars(rate)} <span>(${count})</span></div>

          <div class="price-box">
            <span class="new-price">${money(p.price)}</span>
            <span class="old-price">${money(p.price * 1.35)}</span>
          </div>

          <button class="add-btn" type="button" data-action="add">Add to Cart</button>
          <a class="sr-link" href="product.html?id=${p.id}" aria-label="Open details"></a>
        </div>
      </article>
    `;
  }).join("");
}

function applySearch(q){
  searchQuery = (q || "").trim().toLowerCase();
  const filtered = allProducts.filter(p => {
    const t = (p.title || "").toLowerCase();
    const c = (p.category || "").toLowerCase();
    return t.includes(searchQuery) || c.includes(searchQuery);
  });
  renderProducts(filtered);
  setStatus("ok", `Showing <b>${filtered.length}</b> products${searchQuery ? ` for "<b>${searchQuery}</b>"` : ""}`);
}

/* ===== CART (Drawer) ===== */
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

let cart = loadCart();

function loadCart(){ try{ return JSON.parse(localStorage.getItem(CART_KEY) || "{}"); } catch { return {}; } }
function saveCart(){ try{ localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch {} }
function cartCount(){ return Object.values(cart).reduce((s,it)=>s+(it.qty||0),0); }
function cartSubtotalUsd(){ return Object.values(cart).reduce((s,it)=>s+(Number(it.unitPrice||it.price||0)*(it.qty||0)),0); }

function openCart(){ cartDrawer?.classList.add("open"); cartOverlay?.classList.add("active"); }
function closeCart(){ cartDrawer?.classList.remove("open"); cartOverlay?.classList.remove("active"); }

cartOpenBtns.forEach(b=>b.addEventListener("click", openCart));
closeCartBtn?.addEventListener("click", closeCart);
cartOverlay?.addEventListener("click", closeCart);

function syncCartBadge(){
  const c = cartCount();
  if (cartCountEl) cartCountEl.textContent = c;
  if (mobileCartCount) mobileCartCount.textContent = c;
}

function renderCart(){
  const items = Object.values(cart);

  if(cartItemsEl){
    cartItemsEl.innerHTML = items.length ? items.map(it => `
      <div class="cart-item" data-key="${it.key}">
        <img src="${it.image}" alt="">
        <div class="info">
          <div class="title">
            ${it.title}
            ${it.size || it.color ? `<div style="font-size:11px;opacity:.75;font-weight:900;margin-top:2px;">${it.size || ""} ${it.color ? "• "+it.color : ""}</div>` : ""}
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
  }

  const subUsd = cartSubtotalUsd();
  const subInr = Math.round(subUsd * INR_RATE);
  const deliveryInr = (subInr >= 499 || subInr === 0) ? 0 : 49;
  const totalInr = subInr + deliveryInr;

  if(cartSubtotalEl) cartSubtotalEl.textContent = `₹ ${subInr}`;
  if(cartDeliveryEl) cartDeliveryEl.textContent = `₹ ${deliveryInr}`;
  if(cartTotalEl) cartTotalEl.textContent = `₹ ${totalInr}`;

  saveCart();
  syncCartBadge();
}

cartItemsEl?.addEventListener("click", (e)=>{
  const btn = e.target.closest("button");
  if(!btn) return;
  const row = e.target.closest(".cart-item");
  if(!row) return;

  const key = row.dataset.key;
  if(!cart[key]) return;

  const action = btn.dataset.action;
  if(action==="inc") cart[key].qty = Math.min(10, cart[key].qty + 1);
  if(action==="dec") cart[key].qty = Math.max(1, cart[key].qty - 1);
  if(action==="remove") delete cart[key];

  renderCart();
});

clearCartBtn?.addEventListener("click", ()=>{
  cart = {};
  renderCart();
  toast("Cart cleared ✅");
});

checkoutBtn?.addEventListener("click", ()=>{
  toast(cartCount() ? "Checkout coming soon 😈" : "Cart is empty");
});

function addToCartFromProduct(p){
  const key = `p_${p.id}`; // no variants in grid
  if(cart[key]) cart[key].qty = Math.min(10, cart[key].qty + 1);
  else cart[key] = { key, id: p.id, title: p.title, image: p.image, unitPrice: Number(p.price||0), qty: 1 };

  renderCart();
  toast("Added to cart ✅");
}

/* ===== QUICK VIEW MODAL ===== */
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

let qvProduct = null;

function openQV(p){
  qvProduct = p;
  if(qvImg) qvImg.src = p.image;
  if(qvCat) qvCat.textContent = p.category || "product";
  if(qvRating) qvRating.textContent = `${stars(p.rating?.rate)} (${p.rating?.count || 0})`;
  if(qvTitle) qvTitle.textContent = p.title;
  if(qvPrice) qvPrice.textContent = money(p.price);
  if(qvOld) qvOld.textContent = money(p.price * 1.35);
  if(qvDesc) qvDesc.textContent = p.description || "";
  if(qvGo) qvGo.href = `product.html?id=${p.id}`;

  qvOverlay?.classList.add("active");
  qvModal?.classList.add("open");
  qvOverlay?.setAttribute("aria-hidden","false");
  qvModal?.setAttribute("aria-hidden","false");
}

function closeQV(){
  qvOverlay?.classList.remove("active");
  qvModal?.classList.remove("open");
  qvOverlay?.setAttribute("aria-hidden","true");
  qvModal?.setAttribute("aria-hidden","true");
}

qvClose?.addEventListener("click", closeQV);
qvOverlay?.addEventListener("click", closeQV);
qvAdd?.addEventListener("click", ()=>{ if(qvProduct) addToCartFromProduct(qvProduct); });

/* ===== Grid events (Add + Quick View + open detail) ===== */
productGrid?.addEventListener("click", (e)=>{
  const card = e.target.closest(".product-card");
  if(!card) return;
  const id = Number(card.dataset.id);
  const p = allProducts.find(x => Number(x.id) === id);
  if(!p) return;

  const btn = e.target.closest("button");
  if(btn?.dataset.action === "add"){
    addToCartFromProduct(p);
    return;
  }
  if(btn?.dataset.action === "qv"){
    openQV(p);
    return;
  }

  // card click opens detail
  if(!e.target.closest("a") && !e.target.closest("button")){
    window.location.href = `product.html?id=${id}`;
  }
});

/* ===== Search wiring ===== */
const onSearch = debounce((val)=>applySearch(val), 200);

[topSearchInput, popupSearchInput, heroSearchInput].forEach(inp=>{
  inp?.addEventListener("input", (e)=>{
    const v = e.target.value || "";
    if(topSearchInput && inp !== topSearchInput) topSearchInput.value = v;
    if(popupSearchInput && inp !== popupSearchInput) popupSearchInput.value = v;
    if(heroSearchInput && inp !== heroSearchInput) heroSearchInput.value = v;
    onSearch(v);
  });
});

heroSearchBtn?.addEventListener("click", ()=>{
  applySearch(heroSearchInput?.value || "");
  window.location.hash = "#shop";
});

/* ===== INIT ===== */
(async function init(){
  document.getElementById("year").textContent = new Date().getFullYear();

  showSkeleton(12);
  setStatus("", "");

  try{
    allProducts = await fetchProducts();
    hideSkeleton();
    renderProducts(allProducts);
    setStatus("ok", `Showing <b>${allProducts.length}</b> products`);
  } catch (err) {
    hideSkeleton();
    setStatus("error", `Failed to load products. <button id="retryBtn" type="button">Retry</button>`);
    document.getElementById("retryBtn")?.addEventListener("click", ()=>location.reload());
  }

  renderCart();
})();
