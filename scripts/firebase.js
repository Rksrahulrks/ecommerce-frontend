import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyB409WeL5gmnDMNq5WgTicThDUUWthlrTI",
  authDomain: "rr-mall.firebaseapp.com",
  projectId: "rr-mall",
  storageBucket: "rr-mall.firebasestorage.app",
  messagingSenderId: "55240547542",
  appId: "1:55240547542:web:7266507f7f1aa9c21f3d77",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
