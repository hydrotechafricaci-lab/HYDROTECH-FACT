import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBF6LktQR2e0bNADnH6Vxx3x6KAwb7r0bs",
  authDomain: "hydrotech-fact.firebaseapp.com",
  projectId: "hydrotech-fact",
  messagingSenderId: "808276202453",
  appId: "1:808276202453:web:310cabd46a0886348d635c",
  measurementId: "G-BBTD9YHKSE"
};

export let app;
export let auth;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

// Gestion Login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const btn = document.getElementById('loginBtn');
    const errorEl = document.getElementById('loginError');

    // Mettre l'état de chargement
    if (btn) btn.classList.add('loading');
    if (errorEl) errorEl.classList.remove('show');

    if (!auth) {
      alert("Erreur: Firebase n'est pas initialisé. Veuillez vérifier vos clés de configuration dans app.js.");
      if (btn) btn.classList.remove('loading');
      return;
    }

    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        sessionStorage.setItem('ht_logged_in', 'true');
        window.location.href = "index.html";
      })
      .catch((error) => {
        console.error("Erreur Firebase:", error.code, error.message);
        if (btn) btn.classList.remove('loading');
        if (errorEl) {
          const svgHtml = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
          errorEl.innerHTML = `${svgHtml} ${error.message}`;
          errorEl.classList.add('show');
        } else {
          alert("Erreur Firebase: " + error.message);
        }
      });
  });
}

// Gestion Logout
window.logout = () => {
  if (auth) {
    signOut(auth).then(() => {
      sessionStorage.removeItem('ht_logged_in');
      window.location.href = "login.html";
    });
  } else {
    sessionStorage.removeItem('ht_logged_in');
    window.location.href = "login.html";
  }
};

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    window.logout();
  });
}

// Protéger les pages
if (auth) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      sessionStorage.setItem('ht_logged_in', 'true');
    } else {
      sessionStorage.removeItem('ht_logged_in');
      if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('releve.html')) {
        window.location.href = "login.html";
      }
    }
  });
} else {
  if (sessionStorage.getItem('ht_logged_in') !== 'true' && !window.location.pathname.includes('login.html') && !window.location.pathname.includes('releve.html')) {
    window.location.href = "login.html";
  }
}
