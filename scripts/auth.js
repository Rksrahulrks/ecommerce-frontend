// ===== RR MALL AUTH (localStorage demo) =====
const USERS_KEY = "rrmall_users_v1";      // { emailLower: {name,email,passHash} }
const SESSION_KEY = "rrmall_session_v1";  // { email, name, ts }

function toast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => t.classList.remove("show"), 1400);
}

// ===== MENU =====
const hamburgerBtn = document.querySelector(".hamburger");
const mobileMenu = document.querySelector(".mobile-menu");
const menuOverlay = document.querySelector(".menu-overlay");
const closeMenuBtn = document.querySelector(".close-menu");
hamburgerBtn?.addEventListener("click", () => { mobileMenu.classList.add("open"); menuOverlay.classList.add("active"); });
closeMenuBtn?.addEventListener("click", () => { mobileMenu.classList.remove("open"); menuOverlay.classList.remove("active"); });
menuOverlay?.addEventListener("click", () => { mobileMenu.classList.remove("open"); menuOverlay.classList.remove("active"); });

// ===== TABS =====
const tabLogin = document.getElementById("tabLogin");
const tabSignup = document.getElementById("tabSignup");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const goSignup = document.getElementById("goSignup");
const goLogin = document.getElementById("goLogin");

function showLogin(){
  tabLogin.classList.add("active");
  tabSignup.classList.remove("active");
  tabLogin.setAttribute("aria-selected", "true");
  tabSignup.setAttribute("aria-selected", "false");
  loginForm.classList.remove("hidden");
  signupForm.classList.add("hidden");
  document.title = "RR MALL • Login";
}
function showSignup(){
  tabSignup.classList.add("active");
  tabLogin.classList.remove("active");
  tabSignup.setAttribute("aria-selected", "true");
  tabLogin.setAttribute("aria-selected", "false");
  signupForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
  document.title = "RR MALL • Sign up";
}
tabLogin.addEventListener("click", showLogin);
tabSignup.addEventListener("click", showSignup);
goSignup.addEventListener("click", showSignup);
goLogin.addEventListener("click", showLogin);

// ===== PASSWORD EYE TOGGLE =====
document.querySelectorAll(".eye").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    const id = btn.dataset.eye;
    const input = document.getElementById(id);
    if(!input) return;
    input.type = input.type === "password" ? "text" : "password";
  });
});

// ===== UTILS =====
function loadUsers(){
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || "{}"); }
  catch { return {}; }
}
function saveUsers(users){
  try { localStorage.setItem(USERS_KEY, JSON.stringify(users)); } catch {}
}
function saveSession(session, remember){
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    // If remember=false, session still stored; you can change to sessionStorage if you want.
    // For simplicity we keep localStorage so login stays.
  } catch {}
}

// NOTE: This is not real secure hashing (demo only). For real use Firebase/Auth backend.
function simpleHash(str){
  let h = 0;
  for (let i=0;i<str.length;i++) h = (h<<5) - h + str.charCodeAt(i);
  return String(h >>> 0);
}

function isValidEmail(email){
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || "").trim());
}
function strongPassword(pw){
  // min 8, 1 uppercase, 1 lowercase, 1 number
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(pw);
}

// ===== LIVE PASSWORD STRENGTH =====
const suPass = document.getElementById("suPass");
const pwBar = document.getElementById("pwBar");
const pwLabel = document.getElementById("pwLabel");

function passwordScore(pw){
  let score = 0;
  if(pw.length >= 8) score++;
  if(/[A-Z]/.test(pw)) score++;
  if(/[a-z]/.test(pw)) score++;
  if(/\d/.test(pw)) score++;
  if(/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0..5
}
function renderStrength(){
  const pw = suPass.value || "";
  const s = passwordScore(pw);
  const pct = Math.min(100, Math.round((s/5)*100));
  pwBar.style.width = pct + "%";

  let label = "—";
  if (pw.length === 0) label = "—";
  else if (pct <= 40) label = "Weak";
  else if (pct <= 70) label = "Good";
  else label = "Strong";

  pwLabel.textContent = `Strength: ${label}`;
}
suPass.addEventListener("input", renderStrength);
renderStrength();

// ===== ERROR HELPERS =====
function setErr(id, msg){
  const el = document.getElementById(id);
  if(el) el.textContent = msg || "";
}
function clearLoginErrors(){
  setErr("loginEmailErr","");
  setErr("loginPassErr","");
}
function clearSignupErrors(){
  setErr("suNameErr","");
  setErr("suEmailErr","");
  setErr("suPassErr","");
  setErr("suPass2Err","");
}

// ===== LOGIN =====
const loginEmail = document.getElementById("loginEmail");
const loginPass = document.getElementById("loginPass");
const rememberMe = document.getElementById("rememberMe");
const forgotLink = document.getElementById("forgotLink");

forgotLink.addEventListener("click", (e)=>{
  e.preventDefault();
  toast("Demo mode 😄 Password recovery next step.");
});

loginForm.addEventListener("submit", (e)=>{
  e.preventDefault();
  clearLoginErrors();

  const email = (loginEmail.value || "").trim();
  const pw = loginPass.value || "";

  let ok = true;
  if(!isValidEmail(email)){ setErr("loginEmailErr", "Enter a valid email"); ok = false; }
  if(!pw){ setErr("loginPassErr", "Password required"); ok = false; }
  if(!ok) return;

  const users = loadUsers();
  const key = email.toLowerCase();
  const u = users[key];

  if(!u){
    setErr("loginEmailErr", "Account not found. Please sign up.");
    return;
  }

  if(u.passHash !== simpleHash(pw)){
    setErr("loginPassErr", "Wrong password");
    return;
  }

  saveSession({ email: u.email, name: u.name, ts: Date.now() }, rememberMe.checked);
  toast("Login successful ✅");
  setTimeout(()=> window.location.href = "index.html", 700);
});

// ===== SIGNUP =====
const suName = document.getElementById("suName");
const suEmail = document.getElementById("suEmail");
const suPass2 = document.getElementById("suPass2");

signupForm.addEventListener("submit", (e)=>{
  e.preventDefault();
  clearSignupErrors();

  const name = (suName.value || "").trim();
  const email = (suEmail.value || "").trim();
  const pw = suPass.value || "";
  const pw2 = suPass2.value || "";

  let ok = true;

  if(name.length < 2){ setErr("suNameErr", "Enter your full name"); ok = false; }
  if(!isValidEmail(email)){ setErr("suEmailErr", "Enter a valid email"); ok = false; }
  if(!strongPassword(pw)){
    setErr("suPassErr", "Min 8 chars + Upper + Lower + Number required");
    ok = false;
  }
  if(pw2 !== pw){ setErr("suPass2Err", "Passwords do not match"); ok = false; }

  if(!ok) return;

  const users = loadUsers();
  const key = email.toLowerCase();

  if(users[key]){
    setErr("suEmailErr", "Email already registered. Please login.");
    return;
  }

  users[key] = {
    name,
    email,
    passHash: simpleHash(pw),
    createdAt: Date.now()
  };
  saveUsers(users);

  toast("Account created ✅ Now login");
  showLogin();
  loginEmail.value = email;
  loginPass.value = "";
  loginPass.focus();
});
