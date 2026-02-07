const INR_RATE = 85;
const API_URL = "https://fakestoreapi.com/products";
const CACHE_KEY = "rrmall_products_cache_light_v1";
const CACHE_TTL_MS = 10 * 60 * 1000;
const CART_KEY = "rrmall_cart";

const money = (usd) => `₹ ${Math.round(Number(usd || 0) * INR_RATE)}`;
function stars(rate){
  const r = Math.max(0, Math.min(5, Number(rate || 0)));
  const full = Math.floor(r);
  const empty = 5 - full;
  return "★".repeat(full) + "✩".repeat(empty);
}
function toast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => t.classList.remove("show"), 1200);
}
function setStatus(type, html) {
  const el = document.getElementById("pdStatus");
  if (!el) return;
  el.innerHTML = type ? `<div class="${type}">${html}</div>` : "";
}

// MENU
const hamburgerBtn = document.querySelector(".hamburger");
const mobileMenu = document.querySelector(".mobile-menu");
const menuOverlay = document.querySelector(".menu-overlay");
const closeMenuBtn = document.querySelector(".close-menu");
hamburgerBtn?.addEventListener("click", () => { mobileMenu.classList.add("open"); menuOverlay.classList.add("active"); });
closeMenuBtn?.addEventListener("click", () => { mobileMenu.classList.remove("open"); menuOverlay.classList.remove("active"); });
menuOverlay?.addEventListener("click", () => { mobileMenu.classList.remove("open"); menuOverlay.classList.remove("active"); });

// CART
const cartCountEl = document.querySelector(".cart-count");
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
function cartCount(){ return Object.values(cart).reduce((s,it)=>s+it.qty,0); }
function cartSubtotalUsd(){ return Object.values(cart).reduce((s,it)=>s+it.price*it.qty,0); }

function openCart(){ cartDrawer.classList.add("open"); cartOverlay.classList.add("active"); }
function closeCart(){ cartDrawer.classList.remove("open"); cartOverlay.classList.remove("active"); }
cartOpenBtns.forEach(b=>b.addEventListener("click", openCart));
closeCartBtn?.addEventListener("click", closeCart);
cartOverlay?.addEventListener("click", closeCart);

function renderCart(){
  const items = Object.values(cart);

  cartItemsEl.innerHTML = items.length ? items.map(it => `
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
  `).join("") : `<div style="padding:14px;text-align:center;opacity:.8;">Your cart is empty 🛒</div>`;

  const subUsd = cartSubtotalUsd();
  const subInr = Math.round(subUsd * INR_RATE);
  const deliveryInr = (subInr >= 499 || subInr === 0) ? 0 : 49;
  const totalInr = subInr + deliveryInr;

  cartSubtotalEl.textContent = `₹ ${subInr}`;
  cartDeliveryEl.textContent = `₹ ${deliveryInr}`;
  cartTotalEl.textContent = `₹ ${totalInr}`;

  cartCountEl.textContent = cartCount();
  saveCart();
}

cartItemsEl.addEventListener("click", (e)=>{
  const btn = e.target.closest("button");
  if(!btn) return;
  const row = e.target.closest(".cart-item");
  if(!row) return;
  const id = row.dataset.id;
  if(!cart[id]) return;

  const action = btn.dataset.action;
  if(action==="inc") cart[id].qty += 1;
  if(action==="dec") cart[id].qty = Math.max(1, cart[id].qty - 1);
  if(action==="remove") delete cart[id];
  renderCart();
});

clearCartBtn?.addEventListener("click", ()=>{ cart={}; renderCart(); toast("Cart cleared"); });
checkoutBtn?.addEventListener("click", ()=>{ toast(cartCount() ? "Checkout coming soon 😈" : "Cart is empty"); });

// PRODUCT DETAIL ELEMENTS
const pdImage = document.getElementById("pdImage");
const pdTitle = document.getElementById("pdTitle");
const pdDesc  = document.getElementById("pdDesc");
const pdPrice = document.getElementById("pdPrice");
const pdOldPrice = document.getElementById("pdOldPrice");
const pdCategory = document.getElementById("pdCategory");
const pdRating = document.getElementById("pdRating");
const pdAddBtn = document.getElementById("pdAddBtn");
const pdBuyBtn = document.getElementById("pdBuyBtn");
const relGrid = document.getElementById("relGrid");

function getIdFromUrl(){ return new URLSearchParams(location.search).get("id"); }

function getCachedList(){
  try{
    const raw = localStorage.getItem(CACHE_KEY);
    if(!raw) return null;
    const parsed = JSON.parse(raw);
    if(!parsed?.data || !parsed?.ts) return null;
    if(Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed.data;
  } catch { return null; }
}

async function fetchProductById(id){
  const res = await fetch(`${API_URL}/${id}`);
  if(!res.ok) throw new Error("API error");
  return await res.json();
}

async function fetchAll(){
  const res = await fetch(API_URL);
  if(!res.ok) throw new Error("API error");
  return await res.json();
}

function setZoomBgFromImg(imgEl){
  const shell = imgEl.closest(".pd-image-shell");
  if(!shell) return;
  shell.style.setProperty("--zoom-url", `url('${imgEl.src}')`);
}

function addToCart(p){
  const id = String(p.id);
  const title = (p.title || "").slice(0,55);
  const price = Number(p.price || 0);
  const image = p.image || "";

  if(!cart[id]) cart[id] = { id, title, price, image, qty: 1 };
  else cart[id].qty += 1;

  renderCart();
  toast("Added to cart ✅");
}

function fillProduct(p){
  pdImage.src = p.image || "";
  pdImage.alt = p.title || "Product";
  pdTitle.textContent = p.title || "";
  pdDesc.textContent = p.description || "";
  pdCategory.textContent = (p.category || "").toUpperCase();
  pdPrice.textContent = money(p.price);
  pdOldPrice.textContent = money(p.price * 1.35);
  pdRating.textContent = `${stars(p.rating?.rate)} (${p.rating?.count || 0})`;

  pdImage.addEventListener("load", ()=>setZoomBgFromImg(pdImage));
}

function renderRelated(list){
  if(!relGrid) return;
  relGrid.innerHTML = list.map(p => `
    <div class="product-card" data-rel="${p.id}">
      <div class="product-image">
        <span class="badge">RELATED</span>
        <img src="${p.image}" loading="lazy" alt="${p.title}">
        <div class="quick-view">View</div>
      </div>
      <div class="product-info">
        <h3>${(p.title||"").slice(0, 42)}${(p.title||"").length>42?"...":""}</h3>
        <div class="rating">${stars(p.rating?.rate)} <span>(${p.rating?.count || 0})</span></div>
        <div class="price-box">
          <span class="new-price">${money(p.price)}</span>
          <span class="old-price">${money(p.price * 1.35)}</span>
        </div>
        <button class="add-btn" data-add="${p.id}">Add to Cart</button>
      </div>
    </div>
  `).join("");
}

relGrid?.addEventListener("click", (e)=>{
  const add = e.target.closest(".add-btn");
  if(add){
    const id = String(add.dataset.add);
    const p = window.__relAll?.find(x=>String(x.id)===id);
    if(p) addToCart(p);
    return;
  }
  const card = e.target.closest(".product-card");
  const id = card?.dataset.rel;
  if(id) window.location.href = `product.html?id=${id}`;
});

async function loadRelated(current){
  try{
    let all = getCachedList();
    if(!all) all = await fetchAll();
    window.__relAll = all;

    const rel = all
      .filter(x => x.category === current.category && String(x.id) !== String(current.id))
      .slice(0, 4);

    renderRelated(rel);
  } catch {
    if(relGrid) relGrid.innerHTML = "";
  }
}

async function init(){
  renderCart();

  const id = getIdFromUrl();
  if(!id){
    setStatus("error", `Invalid product link ❌ <br><a href="index.html#shop">Go back</a>`);
    return;
  }

  setStatus("ok", "Loading product...");
  try{
    // 1) try cached list fast
    const cachedList = getCachedList();
    const cached = cachedList?.find(x=>String(x.id)===String(id));
    if(cached){
      fillProduct(cached);
      setStatus("", "");
      pdAddBtn.onclick = ()=>addToCart(cached);
      pdBuyBtn.onclick = ()=>{ addToCart(cached); openCart(); };
      loadRelated(cached);
      return;
    }

    // 2) fetch single
    const p = await fetchProductById(id);
    fillProduct(p);
    setStatus("", "");
    pdAddBtn.onclick = ()=>addToCart(p);
    pdBuyBtn.onclick = ()=>{ addToCart(p); openCart(); };
    loadRelated(p);

  } catch {
    setStatus("error", `Failed to load product ❌ <br><button id="retryBtn">Retry</button>`);
    setTimeout(()=>document.getElementById("retryBtn")?.addEventListener("click", init), 0);
  }
}

init();
