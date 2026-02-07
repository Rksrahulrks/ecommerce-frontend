const INR_RATE = 85;
const API_URL = "https://fakestoreapi.com/products";
const CACHE_KEY = "rrmall_products_cache_light_v1";
const CACHE_TTL_MS = 10 * 60 * 1000;
const CART_KEY = "rrmall_cart_v2";

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

/* MENU */
const hamburgerBtn = document.querySelector(".hamburger");
const mobileMenu = document.querySelector(".mobile-menu");
const menuOverlay = document.querySelector(".menu-overlay");
const closeMenuBtn = document.querySelector(".close-menu");
hamburgerBtn?.addEventListener("click", () => { mobileMenu.classList.add("open"); menuOverlay.classList.add("active"); });
closeMenuBtn?.addEventListener("click", () => { mobileMenu.classList.remove("open"); menuOverlay.classList.remove("active"); });
menuOverlay?.addEventListener("click", () => { mobileMenu.classList.remove("open"); menuOverlay.classList.remove("active"); });

/* CART */
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
function cartCount(){ return Object.values(cart).reduce((s,it)=>s+(it.qty||0),0); }
function cartSubtotalUsd(){ return Object.values(cart).reduce((s,it)=>s+(Number(it.unitPrice||it.price||0)*(it.qty||0)),0); }

function openCart(){ cartDrawer.classList.add("open"); cartOverlay.classList.add("active"); }
function closeCart(){ cartDrawer.classList.remove("open"); cartOverlay.classList.remove("active"); }
cartOpenBtns.forEach(b=>b.addEventListener("click", openCart));
closeCartBtn?.addEventListener("click", closeCart);
cartOverlay?.addEventListener("click", closeCart);

function syncCartBadge(){ cartCountEl.textContent = cartCount(); }

function renderCart(){
  const items = Object.values(cart);

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

cartItemsEl.addEventListener("click", (e)=>{
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

clearCartBtn?.addEventListener("click", ()=>{ cart={}; renderCart(); toast("Cart cleared"); });
checkoutBtn?.addEventListener("click", ()=>{ toast(cartCount() ? "Checkout coming soon 😈" : "Cart is empty"); });

/* PRODUCT ELEMENTS */
const pdImage = document.getElementById("pdImage");
const pdTitle = document.getElementById("pdTitle");
const pdDesc  = document.getElementById("pdDesc");
const pdUnitPrice = document.getElementById("pdUnitPrice");
const pdOldPrice = document.getElementById("pdOldPrice");
const pdCategory = document.getElementById("pdCategory");
const pdRating = document.getElementById("pdRating");

const pdTotalPrice = document.getElementById("pdTotalPrice");
const pdTotalSub = document.getElementById("pdTotalSub");

const sizeChips = document.getElementById("sizeChips");
const colorChips = document.getElementById("colorChips");
const sizeValue = document.getElementById("sizeValue");
const colorValue = document.getElementById("colorValue");

const qtyMinus = document.getElementById("qtyMinus");
const qtyPlus = document.getElementById("qtyPlus");
const qtyVal = document.getElementById("qtyVal");

const pdAddBtn = document.getElementById("pdAddBtn");
const pdBuyBtn = document.getElementById("pdBuyBtn");
const relGrid = document.getElementById("relGrid");

/* Zoom */
const zoomBox = document.getElementById("zoomBox");
const zoomLens = document.getElementById("zoomLens");

/* mini view buttons */
document.querySelectorAll(".pd-mini-btn").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    document.querySelectorAll(".pd-mini-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    pdImage.style.transform = "scale(1.02) rotate(0.3deg)";
    setTimeout(()=>pdImage.style.transform = "scale(1) rotate(0deg)", 220);
  });
});

/* STATE */
let currentProduct = null;
let selectedSize = "M";
let selectedColor = "Gold";
let qty = 1;

/* Variation add-ons (USD) */
const SIZE_UPCHARGE = { S: 0, M: 0.25, L: 0.5, XL: 0.75 };
const COLOR_UPCHARGE = { Gold: 0.35, Navy: 0.15, White: 0.0, Teal: 0.1 };
const DISABLED_SIZES = new Set(["XL"]);
const DISABLED_COLORS = new Set([]);

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

/* Pricing */
function calcUnitPriceUsd(baseUsd){
  const sizeAdd = SIZE_UPCHARGE[selectedSize] ?? 0;
  const colorAdd = COLOR_UPCHARGE[selectedColor] ?? 0;
  return Number(baseUsd || 0) + sizeAdd + colorAdd;
}
function updatePricing(){
  if(!currentProduct) return;

  const base = Number(currentProduct.price || 0);
  const unit = calcUnitPriceUsd(base);
  const total = unit * qty;

  pdUnitPrice.textContent = money(unit);
  pdOldPrice.textContent = money(unit * 1.35);

  pdTotalPrice.textContent = money(total);
  pdTotalSub.textContent = `(${selectedSize} • ${selectedColor}) × ${qty}`;
}

/* Zoom lens */
function setLensBackground(){
  const url = pdImage.src;
  zoomLens.style.backgroundImage = `url('${url}')`;
  zoomLens.style.backgroundRepeat = "no-repeat";
}
function enableZoom(){
  zoomBox.classList.add("zooming");
  setLensBackground();
}
function disableZoom(){
  zoomBox.classList.remove("zooming");
}
function positionLens(e){
  const rect = zoomBox.getBoundingClientRect();
  const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
  const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;

  const lensW = zoomLens.offsetWidth;
  const lensH = zoomLens.offsetHeight;

  let left = x - lensW / 2;
  let top  = y - lensH / 2;

  left = Math.max(0, Math.min(rect.width - lensW, left));
  top  = Math.max(0, Math.min(rect.height - lensH, top));

  zoomLens.style.left = `${left}px`;
  zoomLens.style.top  = `${top}px`;

  const zoom = 2.2;
  const bgW = rect.width * zoom;
  const bgH = rect.height * zoom;
  const bgX = -(left * zoom) + lensW/2;
  const bgY = -(top  * zoom) + lensH/2;

  zoomLens.style.backgroundSize = `${bgW}px ${bgH}px`;
  zoomLens.style.backgroundPosition = `${bgX}px ${bgY}px`;
}

zoomBox.addEventListener("mouseenter", enableZoom);
zoomBox.addEventListener("mouseleave", disableZoom);
zoomBox.addEventListener("mousemove", (e)=>{ if(zoomBox.classList.contains("zooming")) positionLens(e); });

let mobileZoomOn = false;
zoomBox.addEventListener("click", ()=>{
  if (window.matchMedia("(max-width: 900px)").matches){
    mobileZoomOn = !mobileZoomOn;
    if (mobileZoomOn) { enableZoom(); toast("Zoom ON"); }
    else { disableZoom(); toast("Zoom OFF"); }
  }
});
zoomBox.addEventListener("touchmove", (e)=>{
  if (!zoomBox.classList.contains("zooming")) return;
  positionLens(e);
  e.preventDefault();
}, { passive:false });

/* Chips */
function makeChip(label, {active=false, disabled=false, dot=null} = {}){
  const btn = document.createElement("button");
  btn.className = "pd-chip" + (active ? " active" : "") + (disabled ? " disabled" : "");
  btn.type = "button";
  btn.dataset.val = label;

  if (dot){
    const d = document.createElement("span");
    d.className = "dot";
    d.style.background = dot;
    btn.appendChild(d);
  }
  const t = document.createElement("span");
  t.textContent = label;
  btn.appendChild(t);
  return btn;
}
function renderSizeChips(){
  sizeChips.innerHTML = "";
  ["S","M","L","XL"].forEach(sz=>{
    const disabled = DISABLED_SIZES.has(sz);
    const chip = makeChip(sz, { active: sz===selectedSize, disabled });
    chip.addEventListener("click", ()=>{
      if (disabled) return;
      selectedSize = sz;
      sizeValue.textContent = selectedSize;
      renderSizeChips();
      updatePricing();
    });
    sizeChips.appendChild(chip);
  });
}
function renderColorChips(){
  colorChips.innerHTML = "";
  const colors = [
    {name:"Gold", hex:"linear-gradient(135deg,#d6b36a,#f2deae)"},
    {name:"Navy", hex:"#0b1b3a"},
    {name:"White", hex:"#ffffff"},
    {name:"Teal", hex:"#14b8a6"},
  ];
  colors.forEach(c=>{
    const disabled = DISABLED_COLORS.has(c.name);
    const chip = makeChip(c.name, { active: c.name===selectedColor, disabled, dot: c.hex });
    chip.addEventListener("click", ()=>{
      if (disabled) return;
      selectedColor = c.name;
      colorValue.textContent = selectedColor;
      renderColorChips();
      updatePricing();
    });
    colorChips.appendChild(chip);
  });
}

/* Qty */
function setQty(newQty){
  qty = Math.max(1, Math.min(10, newQty));
  qtyVal.textContent = qty;
  updatePricing();
}
qtyMinus.addEventListener("click", ()=>setQty(qty - 1));
qtyPlus.addEventListener("click", ()=>setQty(qty + 1));

/* Add to cart with variants */
function addToCartWithSelection(p, openAfter=false){
  const base = Number(p.price || 0);
  const unit = calcUnitPriceUsd(base);
  const key = `${p.id}__${selectedSize}__${selectedColor}`;

  if (!cart[key]) {
    cart[key] = {
      key,
      id: String(p.id),
      title: (p.title || "").slice(0, 55),
      image: p.image || "",
      unitPrice: unit,
      qty: qty,
      size: selectedSize,
      color: selectedColor
    };
  } else {
    cart[key].qty = Math.min(10, cart[key].qty + qty);
    cart[key].unitPrice = unit;
  }

  renderCart();
  toast("Added to cart ✅");
  if (openAfter) openCart();
}

/* Fill product */
function fillProduct(p){
  currentProduct = p;

  pdImage.src = p.image || "";
  pdTitle.textContent = p.title || "";
  pdDesc.textContent = p.description || "";
  pdCategory.textContent = (p.category || "").toUpperCase();
  pdRating.textContent = `${stars(p.rating?.rate)} (${p.rating?.count || 0})`;

  selectedSize = "M";
  selectedColor = "Gold";
  qty = 1;

  sizeValue.textContent = selectedSize;
  colorValue.textContent = selectedColor;
  qtyVal.textContent = qty;

  renderSizeChips();
  renderColorChips();

  pdImage.addEventListener("load", setLensBackground);
  updatePricing();

  pdAddBtn.onclick = ()=>addToCartWithSelection(p, false);
  pdBuyBtn.onclick = ()=>addToCartWithSelection(p, true);
}

/* Related */
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
        <button class="add-btn" data-add="${p.id}">Add</button>
      </div>
    </div>
  `).join("");
}
relGrid?.addEventListener("click", (e)=>{
  const add = e.target.closest(".add-btn");
  if(add){
    const id = String(add.dataset.add);
    const p = window.__relAll?.find(x=>String(x.id)===id);
    if(p){
      const prev = qty;
      qty = 1; qtyVal.textContent = "1"; updatePricing();
      addToCartWithSelection(p, false);
      qty = prev; qtyVal.textContent = String(prev); updatePricing();
    }
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
    const rel = all.filter(x => x.category === current.category && String(x.id) !== String(current.id)).slice(0, 4);
    renderRelated(rel);
  } catch {
    if(relGrid) relGrid.innerHTML = "";
  }
}

/* INIT */
async function init(){
  renderCart();

  const id = getIdFromUrl();
  if(!id){
    setStatus("error", `Invalid product link ❌ <br><a href="index.html#shop">Go back</a>`);
    return;
  }

  setStatus("ok", "Loading product...");
  try{
    const cachedList = getCachedList();
    const cached = cachedList?.find(x=>String(x.id)===String(id));
    if(cached){
      fillProduct(cached);
      setStatus("", "");
      loadRelated(cached);
      return;
    }

    const p = await fetchProductById(id);
    fillProduct(p);
    setStatus("", "");
    loadRelated(p);
  } catch {
    setStatus("error", `Failed to load product ❌ <br><button id="retryBtn">Retry</button>`);
    setTimeout(()=>document.getElementById("retryBtn")?.addEventListener("click", init), 0);
  }
}
init();
