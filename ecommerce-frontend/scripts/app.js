// 🍔 Hamburger Menu
const hamburger = document.querySelector(".hamburger");
const mobileMenu = document.querySelector(".mobile-menu");
const icon = document.querySelector(".hamburger .icon");

hamburger.addEventListener("click", () => {
  mobileMenu.classList.toggle("open");
  icon.textContent = mobileMenu.classList.contains("open") ? "✖" : "☰";
});

// 🔍 Search Popup
const searchIcon = document.querySelector(".search-icon");
const searchPopup = document.querySelector(".search-popup");
const closeSearch = document.querySelector(".close-search");

searchIcon.addEventListener("click", () => {
  searchPopup.classList.add("open");
});

closeSearch.addEventListener("click", () => {
  searchPopup.classList.remove("open");
});

// 🛒 Cart Count Logic
let cartCount = 0;
const cartCountEl = document.querySelector(".cart-count");
const addCartBtn = document.querySelector(".add-cart-btn");

addCartBtn.addEventListener("click", () => {
  cartCount++;
  cartCountEl.textContent = cartCount;
});
