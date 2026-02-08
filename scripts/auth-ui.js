// scripts/auth-ui.js
import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js"; // :contentReference[oaicite:8]{index=8}

function safeName(user){
  return user?.displayName || (user?.email ? user.email.split("@")[0] : "User");
}

function setText(id, text){
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
function show(id, yes){
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = yes ? "" : "none";
}

async function doLogout(){
  await signOut(auth);
  window.location.href = "auth.html";
}

document.getElementById("navLogoutBtn")?.addEventListener("click", doLogout);
document.getElementById("mobLogoutBtn")?.addEventListener("click", doLogout);

onAuthStateChanged(auth, (user) => {
  const loggedIn = !!user;

  // Desktop
  show("navLoginLink", !loggedIn);
  show("navUserChip", loggedIn);
  show("navLogoutBtn", loggedIn);

  // Mobile
  show("mobLoginLink", !loggedIn);
  show("mobUserChip", loggedIn);
  show("mobLogoutBtn", loggedIn);

  if (loggedIn) {
    setText("navUserChip", `Hi, ${safeName(user)}`);
    setText("mobUserChip", `Hi, ${safeName(user)}`);
  }
});
