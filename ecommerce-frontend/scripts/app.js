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

searchIcon.addEventListener("click", () => searchPopup.classList.add("open"));
closeSearch.addEventListener("click", () => searchPopup.classList.remove("open"));

// 🛒 Cart Count Logic
let cartCount = 0;
const cartCountEl = document.querySelector(".cart-count");
const addCartBtn = document.querySelector(".add-cart-btn");

addCartBtn.addEventListener("click", () => {
  cartCount++;
  cartCountEl.textContent = cartCount;
});

// HERO BACKGROUND CROSSFADE
const hero = document.querySelector('.hero');

const heroImages = [
  'https://www.shutterstock.com/image-photo/vada-pav-600w-2644974525.jpg',
  'https://media.istockphoto.com/id/1329213718/photo/vada-pav.jpg?s=612x612&w=0&k=20&c=Yy3pm53KrPAnZXL9weCJDzXjxa2My34oVFx7RBCPmZ8=',
  'https://t3.ftcdn.net/jpg/15/58/30/60/240_F_1558306013_Ph71IR40e98WXOwg6VKHSrzk4xrUTUvF.jpg'
];

let currentIndex = 0;

// Create two divs for crossfade
const div1 = document.createElement('div');
const div2 = document.createElement('div');

[div1, div2].forEach(div => {
  div.style.position = 'absolute';
  div.style.top = 0;
  div.style.left = 0;
  div.style.width = '100%';
  div.style.height = '100%';
  div.style.backgroundSize = 'cover';
  div.style.backgroundPosition = 'center';
  div.style.transition = 'opacity 1.5s ease-in-out';
  div.style.zIndex = '-1';
  div.style.opacity = 0;
  hero.prepend(div);
});

// Initialize first image
div1.style.backgroundImage = `url(${heroImages[currentIndex]})`;
div1.style.opacity = 1;

setInterval(() => {
  const nextIndex = (currentIndex + 1) % heroImages.length;

  const fadeOutDiv = currentIndex % 2 === 0 ? div1 : div2;
  const fadeInDiv = currentIndex % 2 === 0 ? div2 : div1;

  fadeInDiv.style.backgroundImage = `url(${heroImages[nextIndex]})`;
  fadeInDiv.style.opacity = 1;    // fade in new image
  fadeOutDiv.style.opacity = 0;   // fade out old image

  currentIndex = nextIndex;
}, 6000);
