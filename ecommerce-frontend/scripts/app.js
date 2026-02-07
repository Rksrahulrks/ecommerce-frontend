// ===== Helpers =====
const INR_RATE = 85; // USD to INR approx
const money = (usd) => `₹ ${Math.round(usd * INR_RATE)}`;

function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => t.classList.remove("show"), 1200);
}

// ===== Slide Menu (LEFT -> RIGHT) =====
const hamburgerBtn = document.querySelector(".hamburger");
const mobileMenu = document.querySelector(".mobile-menu");
const menuOverlay = document.querySelector(".menu-overlay");
const closeMenuBtn = document.querySelector(".close-menu");

function openMenu() {
  mobileMenu.classList.add("open");
  menuOverlay.classList.add("active");
}
function closeMenu() {
  mobileMenu.classList.remove("open");
  menuOverlay.classList.remove("active");
}
hamburgerBtn?.addEventListener("click", openMenu);
closeMenuBtn?.addEventListener("click", closeMenu);
menuOverlay?.addEventListener("click", closeMenu);

// ===== Search Popup =====
const searchIcon = document.querySelector(".search-icon");
const searchPopup = document.querySelector(".search-popup");
const closeSearch = document.querySelector(".close-search");
searchIcon?.addEventListener("click", () => searchPopup.classList.add("open"));
closeSearch?.addEventListener("click", () => searchPopup.classList.remove("open"));

// ===== Hero typing + search =====
const typingEl = document.querySelector(".typing");
const lines = [
  "Best deals • Fast delivery • Easy returns",
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
    if (ci >= text.length) {
      deleting = true;
      setTimeout(typeLoop, 1200);
      return;
    }
  } else {
    ci--;
    typingEl.textContent = text.slice(0, ci);
    if (ci <= 0) {
      deleting = false;
      li = (li + 1) % lines.length;
    }
  }
  setTimeout(typeLoop, deleting ? 35 : 55);
}
typeLoop();

const heroSearchInput = document.getElementById("heroSearchInput");
const heroSearchBtn = document.getElementById("heroSearchBtn");

// ===== Product + Cart State =====
const productGrid = document.getElementById("productGrid");
const skeletonGrid = document.getElementById("skeletonGrid");

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

let products = [];           // full products list
let filteredProducts = [];   // for searching
let cart = loadCart();       // { [id]: {id,title,price,image,qty} }

function loadCart() {
  try {
    const raw = localStorage.getItem("rrmall_cart");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function saveCart() {
  localStorage.setItem("rrmall_cart", JSON.stringify(cart));
}
function cartCount() {
  return Object.values(cart).reduce((sum, it) => sum + it.qty, 0);
}
function cartSubtotalUsd() {
  return Object.values(cart).reduce((sum, it) => sum + (it.price * it.qty), 0);
}

function openCart() {
  cartDrawer.classList.add("open");
  cartOverlay.classList.add("active");
  cartDrawer.setAttribute("aria-hidden", "false");
}
function closeCart() {
  cartDrawer.classList.remove("open");
  cartOverlay.classList.remove("active");
  cartDrawer.setAttribute("aria-hidden", "true");
}

cartOpenBtns.forEach(btn => btn.addEventListener("click", openCart));
closeCartBtn?.addEventListener("click", closeCart);
cartOverlay?.addEventListener("click", closeCart);

// ===== Render Cart =====
function renderCart() {
  const items = Object.values(cart);

  // Empty state
  if (items.length === 0) {
    cartItemsEl.innerHTML = `
      <div style="padding:14px; text-align:center; opacity:.8;">
        Your cart is empty 🛒
      </div>
    `;
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

  // Totals
  const subUsd = cartSubtotalUsd();
  const count = cartCount();

  // Delivery rule (example): free over ₹499
  const subInr = Math.round(subUsd * INR_RATE);
  const deliveryInr = (subInr >= 499 || subInr === 0) ? 0 : 49;
  const totalInr = subInr + deliveryInr;

  cartSubtotalEl.textContent = `₹ ${subInr}`;
  cartDeliveryEl.textContent = `₹ ${deliveryInr}`;
  cartTotalEl.textContent = `₹ ${totalInr}`;

  // Badges
  cartCountEl.textContent = count;
  mobileCartCount.textContent = count;

  saveCart();
}

// Cart item actions (event delegation)
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

// Clear / Checkout
clearCartBtn?.addEventListener("click", () => {
  cart = {};
  renderCart();
  toast("Cart cleared");
});
checkoutBtn?.addEventListener("click", () => {
  if (cartCount() === 0) return toast("Cart is empty");
  toast("Checkout coming soon 😈");
});

// ===== Render Products =====
function showSkeletons() {
  if (!skeletonGrid) return;
  skeletonGrid.innerHTML = "";
  for (let i = 0; i < 8; i++) {
    skeletonGrid.innerHTML += `<div class="skeleton-card"></div>`;
  }
}
function hideSkeletons() {
  if (!skeletonGrid) return;
  skeletonGrid.innerHTML = "";
}

function renderProducts(list) {
  filteredProducts = list;

  productGrid.innerHTML = list.map(p => `
    <div class="product-card">
      <img src="${p.image}" loading="lazy" alt="${p.title}">
      <h3>${p.title.slice(0, 38)}...</h3>
      <p>${money(p.price)}</p>
      <button class="add-btn" data-id="${p.id}">Add to Cart</button>
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

  if (!cart[id]) {
    cart[id] = { id, title: p.title.slice(0, 55), price: p.price, image: p.image, qty: 1 };
  } else {
    cart[id].qty += 1;
  }

  renderCart();
  toast("Added to cart ✅");
});

// ===== Fetch Products =====
async function loadProducts() {
  try {
    showSkeletons();
    const res = await fetch("https://fakestoreapi.com/products");
    const data = await res.json();
    products = data;
    hideSkeletons();
    renderProducts(products);
  } catch (err) {
    hideSkeletons();
    productGrid.innerHTML = `<p style="text-align:center;">Failed to load products.</p>`;
  }
}
loadProducts();
renderCart();

// ===== Hero search => filter products and scroll to shop =====
function doSearch() {
  const q = (heroSearchInput?.value || "").trim().toLowerCase();
  if (!q) {
    renderProducts(products);
    toast("Showing all products");
    document.querySelector("#shop")?.scrollIntoView({ behavior: "smooth" });
    return;
  }
  const list = products.filter(p =>
    p.title.toLowerCase().includes(q) ||
    (p.category && p.category.toLowerCase().includes(q))
  );
  renderProducts(list);
  toast(`Found ${list.length} items`);
  document.querySelector("#shop")?.scrollIntoView({ behavior: "smooth" });
}
heroSearchBtn?.addEventListener("click", doSearch);
heroSearchInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") doSearch();
});

// ===== Parallax effect =====
window.addEventListener("scroll", () => {
  document.querySelectorAll(".hero-bg").forEach(bg => {
    bg.style.transform = `translateY(${window.scrollY * 0.18}px)`;
  });
});
