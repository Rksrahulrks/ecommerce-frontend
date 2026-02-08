// scripts/auth-firebase.js
import { auth } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";

// Firebase docs: signup/login & auth state :contentReference[oaicite:3]{index=3}

/* ===== Toast ===== */
function toast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => t.classList.remove("show"), 1400);
}

/* ===== MENU (slide) ===== */
const hamburgerBtn = document.querySelector(".hamburger");
const mobileMenu = document.querySelector(".mobile-menu");
const menuOverlay = document.querySelector(".menu-overlay");
const closeMenuBtn = document.querySelector(".close-menu");
hamburgerBtn?.addEventListener("click", () => { mobileMenu.classList.add("open"); menuOverlay.classList.add("active"); });
closeMenuBtn?.addEventListener("click", () => { mobileMenu.classList.remove("open"); menuOverlay.classList.remove("active"); });
menuOverlay?.addEventListener("click", () => { mobileMenu.classList.remove("open"); menuOverlay.classList.remove("active"); });

/* ===== Tabs ===== */
const tabLogin = document.getElementById("tabLogin");
const tabSignup = document.getElementById("tabSignup");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const goSignup = document.getElementById("goSignup");
const goLogin = document.getElementById("goLogin");

function showLogin() {
  tabLogin.classList.add("active");
  tabSignup.classList.remove("active");
  tabLogin.setAttribute("aria-selected", "true");
  tabSignup.setAttribute("aria-selected", "false");
  loginForm.classList.remove("hidden");
  signupForm.classList.add("hidden");
  document.title = "RR MALL • Login";
}
function showSignup() {
  tabSignup.classList.add("active");
  tabLogin.classList.remove("active");
  tabSignup.setAttribute("aria-selected", "true");
  tabLogin.setAttribute("aria-selected", "false");
  signupForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
  document.title = "RR MALL • Sign up";
}
tabLogin?.addEventListener("click", showLogin);
tabSignup?.addEventListener("click", showSignup);
goSignup?.addEventListener("click", showSignup);
goLogin?.addEventListener("click", showLogin);

/* ===== Eye toggle ===== */
document.querySelectorAll(".eye").forEach(btn => {
  btn.addEventListener("click", () => {
    const id = btn.dataset.eye;
    const input = document.getElementById(id);
    if (!input) return;
    input.type = input.type === "password" ? "text" : "password";
  });
});

/* ===== Validators ===== */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || "").trim());
}
function strongPassword(pw) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(pw);
}

/* ===== Error UI ===== */
function setErr(id, msg) { const el = document.getElementById(id); if (el) el.textContent = msg || ""; }
function clearLoginErrors() { setErr("loginEmailErr",""); setErr("loginPassErr",""); }
function clearSignupErrors() { setErr("suNameErr",""); setErr("suEmailErr",""); setErr("suPassErr",""); setErr("suPass2Err",""); }

function friendlyFirebaseError(code) {
  // Most common auth codes
  switch (code) {
    case "auth/email-already-in-use": return "Email already registered. Please login.";
    case "auth/invalid-email": return "Invalid email address.";
    case "auth/weak-password": return "Weak password. Use at least 8 chars with Aa1.";
    case "auth/user-not-found": return "Account not found. Please sign up.";
    case "auth/wrong-password": return "Wrong password.";
    case "auth/invalid-credential": return "Invalid credentials.";
    case "auth/too-many-requests": return "Too many attempts. Try again later.";
    default: return "Something went wrong. Please try again.";
  }
}

/* ===== Password strength (UI) ===== */
const suPass = document.getElementById("suPass");
const pwBar = document.getElementById("pwBar");
const pwLabel = document.getElementById("pwLabel");

function passwordScore(pw){
  let s = 0;
  if(pw.length >= 8) s++;
  if(/[A-Z]/.test(pw)) s++;
  if(/[a-z]/.test(pw)) s++;
  if(/\d/.test(pw)) s++;
  if(/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
function renderStrength(){
  if (!suPass || !pwBar || !pwLabel) return;
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
suPass?.addEventListener("input", renderStrength);
renderStrength();

/* ===== Elements ===== */
const loginEmail = document.getElementById("loginEmail");
const loginPass = document.getElementById("loginPass");
const rememberMe = document.getElementById("rememberMe");
const forgotLink = document.getElementById("forgotLink");

const suName = document.getElementById("suName");
const suEmail = document.getElementById("suEmail");
const suPass2 = document.getElementById("suPass2");

/* ===== Persistence ===== */
await setPersistence(auth, browserLocalPersistence); // keeps user logged in across refresh :contentReference[oaicite:4]{index=4}

/* ===== Forgot password ===== */
forgotLink?.addEventListener("click", async (e) => {
  e.preventDefault();
  clearLoginErrors();

  const email = (loginEmail?.value || "").trim();
  if (!isValidEmail(email)) {
    setErr("loginEmailErr", "Enter email to reset password");
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    toast("Password reset email sent ✅");
  } catch (err) {
    toast(friendlyFirebaseError(err?.code));
  }
});

/* ===== Login ===== */
loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearLoginErrors();

  const email = (loginEmail.value || "").trim();
  const pw = loginPass.value || "";

  let ok = true;
  if (!isValidEmail(email)) { setErr("loginEmailErr", "Enter a valid email"); ok = false; }
  if (!pw) { setErr("loginPassErr", "Password required"); ok = false; }
  if (!ok) return;

  try {
    await signInWithEmailAndPassword(auth, email, pw); // :contentReference[oaicite:5]{index=5}
    toast("Login successful ✅");
    setTimeout(() => window.location.href = "index.html", 700);
  } catch (err) {
    const msg = friendlyFirebaseError(err?.code);
    if (err?.code === "auth/user-not-found") setErr("loginEmailErr", msg);
    else setErr("loginPassErr", msg);
  }
});

/* ===== Signup ===== */
signupForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearSignupErrors();

  const name = (suName.value || "").trim();
  const email = (suEmail.value || "").trim();
  const pw = suPass.value || "";
  const pw2 = suPass2.value || "";

  let ok = true;
  if (name.length < 2) { setErr("suNameErr", "Enter your full name"); ok = false; }
  if (!isValidEmail(email)) { setErr("suEmailErr", "Enter a valid email"); ok = false; }
  if (!strongPassword(pw)) { setErr("suPassErr", "Min 8 chars + Upper + Lower + Number"); ok = false; }
  if (pw2 !== pw) { setErr("suPass2Err", "Passwords do not match"); ok = false; }
  if (!ok) return;

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pw); // :contentReference[oaicite:6]{index=6}
    // Store displayName inside Firebase user profile
    await updateProfile(cred.user, { displayName: name }); // :contentReference[oaicite:7]{index=7}
    toast("Account created ✅");
    setTimeout(() => window.location.href = "index.html", 700);
  } catch (err) {
    const msg = friendlyFirebaseError(err?.code);
    if (err?.code === "auth/email-already-in-use") setErr("suEmailErr", msg);
    else if (err?.code === "auth/weak-password") setErr("suPassErr", msg);
    else setErr("suEmailErr", msg);
  }
});

/* ===== If already logged in, redirect ===== */
onAuthStateChanged(auth, (user) => {
  if (user && (document.title.includes("Login") || document.title.includes("Sign"))) {
    // already signed in, no need to stay on auth page
    // comment this if you want to allow user to switch accounts
    // window.location.href = "index.html";
  }
});
