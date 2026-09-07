import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, getDocs, serverTimestamp, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


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
export let db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
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

// Gestion Logout (exposé globalement pour les onclick des HTML)
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

// Protéger les pages et synchroniser sessionStorage
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
  // Mode dégradé sans Firebase Auth fonctionnel : on vérifie juste sessionStorage
  if (sessionStorage.getItem('ht_logged_in') !== 'true' && !window.location.pathname.includes('login.html') && !window.location.pathname.includes('releve.html')) {
    window.location.href = "login.html";
  }
}

// Fonction de calcul de facture d'eau
export function calculateWaterInvoice(ancien, nouveau, unpaidPrev = 0) {
  const consumption = nouveau - ancien;
  const consumptionCost = consumption * 250;
  const totalAmount = consumptionCost + unpaidPrev;
  
  return {
    consumption,
    totalAmount
  };
}

// Événement d'enregistrement du relevé avec logs de DEBUG complets
const btnSaveReleve = document.getElementById('btnSaveReleve');
if (btnSaveReleve) {
  btnSaveReleve.addEventListener('click', async function() {
      const btn = document.getElementById('btnSaveReleve');
      btn.disabled = true;
      btn.innerText = "Enregistrement...";
      
      try {
          const ancien = parseFloat(document.getElementById('valeurAncienInput').value) || 0;
          const nouveau = parseFloat(document.getElementById('valeurReleveInput').value) || 0;
          
          console.log("1. Valeurs lues:", ancien, nouveau);

          if (nouveau <= ancien) { 
            alert("Erreur index"); 
            return; 
          }
          
          console.log("2. Avant calcul");
          if (typeof calculateWaterInvoice !== 'function') { 
            throw new Error("calculateWaterInvoice n'existe pas"); 
          }
          const unpaidPrev = parseFloat(document.getElementById('displayUnpaidPrev').innerText.replace(/[^0-9.-]/g, '')) || 0;
          const result = calculateWaterInvoice(ancien, nouveau, unpaidPrev);
          console.log("3. Après calcul:", result);
          
          const { consumption, totalAmount } = result;

          // Extraction des données client
          const clientNomEl = document.querySelector('.text-2xl.font-bold') || document.getElementById('displayClientName');
          const clientNom = clientNomEl ? clientNomEl.innerText : "Abonné";
          const clientIdEl = document.querySelector('.text-sm.opacity-80') || document.getElementById('displayMeterId');
          const clientId = clientIdEl ? (clientIdEl.innerText.includes(': ') ? clientIdEl.innerText.split(': ')[1] : clientIdEl.innerText) : "000";

          const rawDate = document.getElementById('valeurDateInput') ? document.getElementById('valeurDateInput').value : "";
          const formattedDate = rawDate ? new Date(rawDate).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR');

          // Sauvegarde dans Firestore (collection "releves")
          await addDoc(collection(db, "releves"), {
            clientId: clientId,
            clientNom: clientNom,
            date: formattedDate,
            ancienIndex: ancien,
            nouvelIndex: nouveau,
            consommation: consumption,
            montant: totalAmount,
            dateHeure: new Date().toISOString()
          });

          // Rechargement du tableau d'historique si défini
          if (typeof window.loadRecentReadings === 'function') {
            window.loadRecentReadings();
          }

          console.log("4. Avant Toast");
          document.getElementById('successToast').style.display = 'block';
          setTimeout(() => { document.getElementById('successToast').style.display = 'none'; }, 4000);

          const { jsPDF } = window.jspdf;
          const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
          });

          // CONFIGURATION GLOBALE
          doc.setFont("helvetica");

          // LOGO (Droplet vector shape: triangle + circle)
          doc.setFillColor(0, 102, 204); // Bleu #0066CC
          doc.ellipse(105, 20, 4, 4, "F");
          doc.triangle(101, 20, 109, 20, 105, 13, "F");

          doc.setFont("helvetica", "bold");
          doc.setFontSize(7);
          doc.setTextColor(13, 45, 107); // Navy color
          doc.text("HYDROTECH", 105, 28, { align: "center" });
          doc.setFontSize(5);
          doc.text("AFRICA", 105, 30.5, { align: "center" });

          // EN-TETE
          doc.setFontSize(15);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(0, 102, 204); // Bleu
          doc.text("HYDROTECH AFRICA", 105, 38, { align: "center" });

          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(102, 102, 102); // Gris foncé
          doc.text("FACTURE D'EAU POTABLE", 105, 44, { align: "center" });

          // Extraction des données client
          const clientNomEl = document.querySelector('.text-2xl.font-bold') || document.getElementById('displayClientName');
          const clientNom = clientNomEl ? clientNomEl.innerText : "Abonné";
          const clientIdEl = document.querySelector('.text-sm.opacity-80') || document.getElementById('displayMeterId');
          const clientId = clientIdEl ? (clientIdEl.innerText.includes(': ') ? clientIdEl.innerText.split(': ')[1] : clientIdEl.innerText) : "000";

          // BLOC CLIENT (Gauche)
          doc.setFillColor(248, 250, 252); // Très léger gris-bleu
          doc.setDrawColor(226, 232, 240); // Bordure gris
          doc.setLineWidth(0.3);
          doc.rect(15, 50, 85, 38, "FD");

          doc.setFontSize(8.5);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(100, 110, 120);
          doc.text("INFORMATIONS CLIENT", 20, 56);

          doc.setDrawColor(226, 232, 240);
          doc.line(15, 59, 100, 59);

          doc.setFontSize(9);
          doc.setTextColor(50, 50, 50);

          doc.setFont("helvetica", "bold");
          doc.text("Client:", 20, 66);
          doc.setFont("helvetica", "normal");
          doc.text(clientNom, 38, 66);

          doc.setFont("helvetica", "bold");
          doc.text("ID Client:", 20, 74);
          doc.setFont("helvetica", "normal");
          doc.text(clientId, 38, 74);

          doc.setFont("helvetica", "bold");
          doc.text("Localité:", 20, 82);
          doc.setFont("helvetica", "normal");
          doc.text("ZIASSO", 38, 82);

          // BLOC FACTURE (Droite)
          doc.setFillColor(255, 255, 255);
          doc.rect(110, 50, 85, 38, "FD");
          // Bandeau bleu supérieur du bloc facture
          doc.setFillColor(0, 102, 204);
          doc.rect(110, 50, 85, 1.5, "F");

          doc.setFontSize(8.5);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(100, 110, 120);
          doc.text("DÉTAILS FACTURE", 115, 56);

          const invoiceNum = "FA-" + new Date().getFullYear() + "-" + clientId;
          const dateStr = new Date().toLocaleDateString('fr-FR');
          
          const dateEcheance = new Date();
          dateEcheance.setDate(dateEcheance.getDate() + 14);
          const echeanceStr = dateEcheance.toLocaleDateString('fr-FR');

          doc.setFontSize(9);
          doc.setTextColor(50, 50, 50);

          doc.setFont("helvetica", "bold");
          doc.text("N° Facture:", 115, 64);
          doc.setFont("helvetica", "normal");
          doc.text(invoiceNum, 138, 64);

          doc.setFont("helvetica", "bold");
          doc.text("Date:", 115, 71);
          doc.setFont("helvetica", "normal");
          doc.text(dateStr, 138, 71);

          doc.setFont("helvetica", "bold");
          doc.text("Échéance:", 115, 78);
          doc.setFont("helvetica", "normal");
          doc.text(echeanceStr, 138, 78);

          doc.setDrawColor(226, 232, 240);
          doc.line(110, 81, 195, 81);

          doc.setFont("helvetica", "bold");
          doc.setTextColor(0, 102, 204);
          doc.text("TOTAL À PAYER", 115, 86);
          doc.text(totalAmount.toLocaleString('fr-FR') + " FCFA", 190, 86, { align: "right" });

          // HISTORIQUE DE CONSOMMATION (6 DERNIERS MOIS)
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(226, 232, 240);
          doc.rect(15, 93, 180, 34, "FD");

          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(100, 110, 120);
          doc.text("HISTORIQUE DE CONSOMMATION (6 DERNIERS MOIS)", 20, 98);

          // Calcul des 6 derniers mois
          const monthsFR = ["JANV", "FÉVR", "MARS", "AVRIL", "MAI", "JUIN", "JUIL", "AOÛT", "SEPT", "OCT", "NOV", "DÉC"];
          const currentMonthIdx = new Date().getMonth();
          const last6Months = [];
          for (let i = 5; i >= 0; i--) {
            const idx = (currentMonthIdx - i + 12) % 12;
            last6Months.push(monthsFR[idx]);
          }

          // Dessin des barres d'historique
          const currentBarH = Math.min(22, Math.max(3, consumption * 0.8));
          doc.setFillColor(210, 225, 245); // Bleu clair
          doc.rect(25, 120 - 12, 10, 12, "F");
          doc.rect(55, 120 - 15, 10, 15, "F");
          doc.rect(85, 120 - 10, 10, 10, "F");
          doc.rect(115, 120 - 18, 10, 18, "F");
          doc.rect(145, 120 - 2, 10, 2, "F");

          doc.setFillColor(0, 102, 204); // Bleu principal pour le mois en cours
          doc.rect(175, 120 - currentBarH, 10, currentBarH, "F");

          // Libellés mois
          doc.setFontSize(7.5);
          doc.setTextColor(120, 130, 140);
          doc.setFont("helvetica", "normal");
          doc.text(last6Months[0], 30, 124, { align: "center" });
          doc.text(last6Months[1], 60, 124, { align: "center" });
          doc.text(last6Months[2], 90, 124, { align: "center" });
          doc.text(last6Months[3], 120, 124, { align: "center" });
          doc.text(last6Months[4], 150, 124, { align: "center" });
          
          doc.setFont("helvetica", "bold");
          doc.setTextColor(0, 102, 204);
          doc.text(last6Months[5], 180, 124, { align: "center" });

          // TABLEAU (Avec bordures)
          const tableY = 132;
          
          // Entête du tableau (Fond bleu #0066CC, Texte blanc)
          doc.setFillColor(0, 102, 204);
          doc.rect(15, tableY, 180, 9, "F");

          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(255, 255, 255);
          doc.text("DÉSIGNATION", 20, tableY + 6);
          doc.text("QTÉ M³", 122.5, tableY + 6, { align: "center" });
          doc.text("PU FCFA", 150, tableY + 6, { align: "center" });
          doc.text("TOTAL FCFA", 180, tableY + 6, { align: "center" });

          // Ligne 1: Consommation Eau
          doc.setFont("helvetica", "normal");
          doc.setTextColor(50, 50, 50);
          doc.text("Consommation d'eau potable (Période " + last6Months[4] + "-" + last6Months[5] + ")", 20, tableY + 15);
          doc.text(consumption.toString(), 122.5, tableY + 15, { align: "center" });
          doc.text("500", 150, tableY + 15, { align: "center" });
          doc.text((consumption * 500).toString(), 180, tableY + 15, { align: "center" });

          // Ligne 2: Maintenance ou Arriéré
          if (unpaidPrev > 0) {
            doc.text("Arriéré Impayé Précédent", 20, tableY + 25);
            doc.text("1", 122.5, tableY + 25, { align: "center" });
            doc.text(unpaidPrev.toString(), 150, tableY + 25, { align: "center" });
            doc.text(unpaidPrev.toString(), 180, tableY + 25, { align: "center" });
          } else {
            doc.text("Maintenance compteur & Réseau", 20, tableY + 25);
            doc.text("1", 122.5, tableY + 25, { align: "center" });
            doc.text("500", 150, tableY + 25, { align: "center" });
            doc.text("500", 180, tableY + 25, { align: "center" });
          }

          // Bordures extérieures et intérieures du tableau
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.3);
          
          // Lignes horizontales
          doc.line(15, tableY, 195, tableY); // Top header
          doc.line(15, tableY + 9, 195, tableY + 9); // Bottom header
          doc.line(15, tableY + 20, 195, tableY + 20); // Bottom row 1
          doc.line(15, tableY + 29, 195, tableY + 29); // Bottom row 2

          // Lignes verticales
          doc.line(15, tableY, 15, tableY + 29); // Gauche
          doc.line(110, tableY, 110, tableY + 29); // Séparateur Désignation/Qté
          doc.line(135, tableY, 135, tableY + 29); // Séparateur Qté/PU
          doc.line(165, tableY, 165, tableY + 29); // Séparateur PU/Total
          doc.line(195, tableY, 195, tableY + 29); // Droite

          // SOUS-TOTAL / TAXES
          const subtotalY = tableY + 29;
          doc.setFontSize(8.5);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(100, 110, 120);
          doc.text("Sous-total", 160, subtotalY + 6, { align: "right" });
          doc.setTextColor(50, 50, 50);
          doc.text(totalAmount.toString() + " FCFA", 190, subtotalY + 6, { align: "right" });

          doc.setTextColor(100, 110, 120);
          doc.text("Taxes (Exonéré)", 160, subtotalY + 12, { align: "right" });
          doc.setTextColor(50, 50, 50);
          doc.text("0 FCFA", 190, subtotalY + 12, { align: "right" });

          // BANDEAU TOTAL NET (Fond bleu clair, badge rouge impayé, total)
          const totalNetY = subtotalY + 17;
          doc.setFillColor(230, 240, 250); // Fond bleu clair
          doc.rect(15, totalNetY, 180, 11, "F");

          // Badge rouge IMPAYÉ
          doc.setFillColor(220, 53, 69);
          doc.rect(20, totalNetY + 3, 16, 5, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(7.5);
          doc.setTextColor(255, 255, 255);
          doc.text("IMPAYÉ", 28, totalNetY + 6.5, { align: "center" });

          // Texte à côté du badge
          doc.setFont("helvetica", "italic");
          doc.setFontSize(7.5);
          doc.setTextColor(120, 120, 120);
          doc.text("Veuillez régulariser avant le " + echeanceStr, 39, totalNetY + 6.5);

          // Total à droite
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(13, 45, 107);
          doc.text("TOTAL NET", 145, totalNetY + 7);
          doc.setFontSize(12);
          doc.text(totalAmount.toLocaleString('fr-FR') + " FCFA", 190, totalNetY + 7.5, { align: "right" });

          // PIED DE PAGE
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.3);
          doc.line(15, 260, 195, 260);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(100, 110, 120);
          doc.text("📍 Abidjan, Côte d'Ivoire - Zone Industrielle", 20, 266);
          doc.text("📞 Contact: +225 00 00 00 00", 105, 266, { align: "center" });
          doc.text("🌐 www.hydrotech-africa.com", 190, 266, { align: "right" });

          doc.setFontSize(7.5);
          doc.setTextColor(140, 150, 160);
          doc.text("© 2026 HydroTech Africa. Tous droits réservés. Le non-paiement de cette facture dans les délais", 105, 273, { align: "center" });
          doc.text("impartis peut entraîner une suspension temporaire du service. Conditions Générales | Confidentialité | Contact", 105, 277, { align: "center" });

          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(0, 102, 204);
          doc.text("GÉRER L'EAU POUR L'AVENIR", 105, 284, { align: "center" });

          // SAUVEGARDE DU FICHIER
          doc.save("Facture_" + clientId + ".pdf");

          // VIDER LE CHAMP POUR LE CLIENT SUIVANT
          document.getElementById('valeurReleveInput').value = '';
          
      } catch (err) {
          alert("ERREUR: " + err.message);
          console.error("ERREUR COMPLETE:", err);
      } finally {
          btn.disabled = false;
          btn.innerText = "Enregistrer le Relevé";
      }
  });
}

// Exposer globalement la fonction d'impression PDF
window.generatePDF = function (ancien, nouveau, conso, total, client, compId, loc) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Fetch client information from DOM if not explicitly passed as parameters
  const clientNomEl = document.querySelector('.text-2xl.font-bold') || document.getElementById('displayClientName');
  const clientNom = client || (clientNomEl ? clientNomEl.innerText : "Abonné");
  
  const clientIdEl = document.querySelector('.text-sm.opacity-80') || document.getElementById('displayMeterId');
  const clientId = compId || (clientIdEl ? (clientIdEl.innerText.includes(': ') ? clientIdEl.innerText.split(': ')[1] : clientIdEl.innerText) : "000");

  const clientLoc = loc || "ZIASSO";
  const consumption = conso;
  const totalAmount = total;
  
  // LOGO (Droplet vector shape: triangle + circle)
  doc.setFillColor(0, 102, 204); // Bleu #0066CC
  doc.ellipse(105, 20, 4, 4, "F");
  doc.triangle(101, 20, 109, 20, 105, 13, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(13, 45, 107); // Navy color
  doc.text("HYDROTECH", 105, 28, { align: "center" });
  doc.setFontSize(5);
  doc.text("AFRICA", 105, 30.5, { align: "center" });

  // EN-TETE
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 102, 204); // Bleu
  doc.text("HYDROTECH AFRICA", 105, 38, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(102, 102, 102); // Gris foncé
  doc.text("FACTURE D'EAU POTABLE", 105, 44, { align: "center" });

  // BLOC CLIENT (Gauche)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.rect(15, 50, 85, 38, "FD");

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 110, 120);
  doc.text("INFORMATIONS CLIENT", 20, 56);

  doc.line(15, 59, 100, 59);

  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);

  doc.setFont("helvetica", "bold");
  doc.text("Client:", 20, 66);
  doc.setFont("helvetica", "normal");
  doc.text(clientNom, 38, 66);

  doc.setFont("helvetica", "bold");
  doc.text("ID Client:", 20, 74);
  doc.setFont("helvetica", "normal");
  doc.text(clientId, 38, 74);

  doc.setFont("helvetica", "bold");
  doc.text("Localité:", 20, 82);
  doc.setFont("helvetica", "normal");
  doc.text(clientLoc, 38, 82);

  // BLOC FACTURE (Droite)
  doc.setFillColor(255, 255, 255);
  doc.rect(110, 50, 85, 38, "FD");
  doc.setFillColor(0, 102, 204);
  doc.rect(110, 50, 85, 1.5, "F");

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 110, 120);
  doc.text("DÉTAILS FACTURE", 115, 56);

  const invoiceNum = "FA-" + new Date().getFullYear() + "-" + clientId;
  const dateStr = new Date().toLocaleDateString('fr-FR');
  
  const dateEcheance = new Date();
  dateEcheance.setDate(dateEcheance.getDate() + 14);
  const echeanceStr = dateEcheance.toLocaleDateString('fr-FR');

  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);

  doc.setFont("helvetica", "bold");
  doc.text("N° Facture:", 115, 64);
  doc.setFont("helvetica", "normal");
  doc.text(invoiceNum, 138, 64);

  doc.setFont("helvetica", "bold");
  doc.text("Date:", 115, 71);
  doc.setFont("helvetica", "normal");
  doc.text(dateStr, 138, 71);

  doc.setFont("helvetica", "bold");
  doc.text("Échéance:", 115, 78);
  doc.setFont("helvetica", "normal");
  doc.text(echeanceStr, 138, 78);

  doc.setDrawColor(226, 232, 240);
  doc.line(110, 81, 195, 81);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 102, 204);
  doc.text("TOTAL À PAYER", 115, 86);
  doc.text(totalAmount.toLocaleString('fr-FR') + " FCFA", 190, 86, { align: "right" });

  // HISTORIQUE DE CONSOMMATION (6 DERNIERS MOIS)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.rect(15, 93, 180, 34, "FD");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 110, 120);
  doc.text("HISTORIQUE DE CONSOMMATION (6 DERNIERS MOIS)", 20, 98);

  const monthsFR = ["JANV", "FÉVR", "MARS", "AVRIL", "MAI", "JUIN", "JUIL", "AOÛT", "SEPT", "OCT", "NOV", "DÉC"];
  const currentMonthIdx = new Date().getMonth();
  const last6Months = [];
  for (let i = 5; i >= 0; i--) {
    const idx = (currentMonthIdx - i + 12) % 12;
    last6Months.push(monthsFR[idx]);
  }

  const currentBarH = Math.min(22, Math.max(3, consumption * 0.8));
  doc.setFillColor(210, 225, 245);
  doc.rect(25, 120 - 12, 10, 12, "F");
  doc.rect(55, 120 - 15, 10, 15, "F");
  doc.rect(85, 120 - 10, 10, 10, "F");
  doc.rect(115, 120 - 18, 10, 18, "F");
  doc.rect(145, 120 - 2, 10, 2, "F");

  doc.setFillColor(0, 102, 204);
  doc.rect(175, 120 - currentBarH, 10, currentBarH, "F");

  doc.setFontSize(7.5);
  doc.setTextColor(120, 130, 140);
  doc.setFont("helvetica", "normal");
  doc.text(last6Months[0], 30, 124, { align: "center" });
  doc.text(last6Months[1], 60, 124, { align: "center" });
  doc.text(last6Months[2], 90, 124, { align: "center" });
  doc.text(last6Months[3], 120, 124, { align: "center" });
  doc.text(last6Months[4], 150, 124, { align: "center" });
  
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 102, 204);
  doc.text(last6Months[5], 180, 124, { align: "center" });

  // TABLEAU
  const tableY = 132;
  doc.setFillColor(0, 102, 204);
  doc.rect(15, tableY, 180, 9, "F");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("DÉSIGNATION", 20, tableY + 6);
  doc.text("QTÉ M³", 122.5, tableY + 6, { align: "center" });
  doc.text("PU FCFA", 150, tableY + 6, { align: "center" });
  doc.text("TOTAL FCFA", 180, tableY + 6, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  doc.text("Consommation d'eau potable (Période " + last6Months[4] + "-" + last6Months[5] + ")", 20, tableY + 15);
  doc.text(consumption.toString(), 122.5, tableY + 15, { align: "center" });
  doc.text("250", 150, tableY + 15, { align: "center" });
  doc.text((consumption * 250).toString(), 180, tableY + 15, { align: "center" });

  const unpaidPrev = totalAmount - (consumption * 250);
  if (unpaidPrev > 0) {
    doc.text("Arriéré Impayé Précédent", 20, tableY + 25);
    doc.text("1", 122.5, tableY + 25, { align: "center" });
    doc.text(unpaidPrev.toString(), 150, tableY + 25, { align: "center" });
    doc.text(unpaidPrev.toString(), 180, tableY + 25, { align: "center" });
  } else {
    doc.text("Maintenance compteur & Réseau", 20, tableY + 25);
    doc.text("1", 122.5, tableY + 25, { align: "center" });
    doc.text("500", 150, tableY + 25, { align: "center" });
    doc.text("500", 180, tableY + 25, { align: "center" });
  }

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(15, tableY, 195, tableY);
  doc.line(15, tableY + 9, 195, tableY + 9);
  doc.line(15, tableY + 20, 195, tableY + 20);
  doc.line(15, tableY + 29, 195, tableY + 29);

  doc.line(15, tableY, 15, tableY + 29);
  doc.line(110, tableY, 110, tableY + 29);
  doc.line(135, tableY, 135, tableY + 29);
  doc.line(165, tableY, 165, tableY + 29);
  doc.line(195, tableY, 195, tableY + 29);

  // SOUS-TOTAL
  const subtotalY = tableY + 29;
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 110, 120);
  doc.text("Sous-total", 160, subtotalY + 6, { align: "right" });
  doc.setTextColor(50, 50, 50);
  doc.text(totalAmount.toString() + " FCFA", 190, subtotalY + 6, { align: "right" });

  doc.setTextColor(100, 110, 120);
  doc.text("Taxes (Exonéré)", 160, subtotalY + 12, { align: "right" });
  doc.setTextColor(50, 50, 50);
  doc.text("0 FCFA", 190, subtotalY + 12, { align: "right" });

  // BANDEAU TOTAL NET
  const totalNetY = subtotalY + 17;
  doc.setFillColor(230, 240, 250);
  doc.rect(15, totalNetY, 180, 11, "F");

  doc.setFillColor(220, 53, 69);
  doc.rect(20, totalNetY + 3, 16, 5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text("IMPAYÉ", 28, totalNetY + 6.5, { align: "center" });

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text("Veuillez régulariser avant le " + echeanceStr, 39, totalNetY + 6.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(13, 45, 107);
  doc.text("TOTAL NET", 145, totalNetY + 7);
  doc.setFontSize(12);
  doc.text(totalAmount.toLocaleString('fr-FR') + " FCFA", 190, totalNetY + 7.5, { align: "right" });

  // FOOTER
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(15, 260, 195, 260);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 110, 120);
  doc.text("📍 Abidjan, Côte d'Ivoire - Zone Industrielle", 20, 266);
  doc.text("📞 Contact: +225 00 00 00 00", 105, 266, { align: "center" });
  doc.text("🌐 www.hydrotech-africa.com", 190, 266, { align: "right" });

  doc.setFontSize(7.5);
  doc.setTextColor(140, 150, 160);
  doc.text("© 2026 HydroTech Africa. Tous droits réservés. Le non-paiement de cette facture dans les délais", 105, 273, { align: "center" });
  doc.text("impartis peut entraîner une suspension temporaire du service. Conditions Générales | Confidentialité | Contact", 105, 277, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0, 102, 204);
  doc.text("GÉRER L'EAU POUR L'AVENIR", 105, 284, { align: "center" });

  doc.save("Facture_" + clientId + ".pdf");
};

// ==========================================
// SECTIONS & NAVIGATION LOGIC (INDEX.HTML)
// ==========================================

// Gestion de la navigation entre les onglets
const navItems = document.querySelectorAll('.nav-item');
if (navItems.length > 0) {
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      // Éviter d'intercepter releve.html qui s'ouvre dans une nouvelle page
      const href = item.getAttribute('href');
      if (href && href !== '#' && !href.startsWith('#')) {
        return;
      }
      e.preventDefault();
      
      let pageId = item.dataset.page;
      if (!pageId && href) {
        pageId = href.replace('#', '');
      }
      if (!pageId) return;

      // Retirer la classe active de tous les onglets
      document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      // Masquer toutes les sections de page et activer la section ciblée
      document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
      const targetPage = document.getElementById(pageId) || document.getElementById(`page-${pageId}`);
      if (targetPage) {
        targetPage.classList.add('active');
      }

      // Mettre à jour le titre affiché en haut
      const pageTitle = document.getElementById('pageTitle');
      if (pageTitle) {
        const labels = {
          dashboard: "Tableau de Bord",
          invoices: "Factures d'Eau",
          clients: "Base de Données Clients",
          payments: "Suivi des Paiements",
          reports: "Analytics & Rapports"
        };
        pageTitle.textContent = labels[pageId] || "Administration";
      }
    });
  });
}

// ==========================================
// GESTION DES CLIENTS (COLLECTION "CLIENTS")
// ==========================================

let clientList = []; // Contiendra à la fois les clients Firestore et les clients Excel importés locaux
let localExcelClients = []; // Contiendra uniquement les clients chargés depuis Excel en attente de sync

const btnImportExcel = document.getElementById('btnImportExcel');
const excelFileInput = document.getElementById('excelFileInput');
const btnSyncFirebase = document.getElementById('btnSyncFirebase');
const clientSearchInput = document.getElementById('clientSearchInput');
const clientsTableBody = document.getElementById('clientsTableBody');

// Fonction pour mettre à jour les compteurs du récapitulatif
function updateClientRecapCounters(filteredList) {
  const lblTotalCount = document.getElementById('lblTotalCount');
  const lblPendingCount = document.getElementById('lblPendingCount');
  const lblFirebaseCount = document.getElementById('lblFirebaseCount');

  if (lblTotalCount) lblTotalCount.textContent = filteredList.length;
  if (lblPendingCount) {
    const pending = filteredList.filter(c => c.status === 'local').length;
    lblPendingCount.textContent = pending;
  }
  if (lblFirebaseCount) {
    const fb = filteredList.filter(c => c.status === 'firebase').length;
    lblFirebaseCount.textContent = fb;
  }
}

// Fonction pour charger les clients depuis Firestore et synchroniser la liste
async function loadClientsInline() {
  if (!clientsTableBody) return;

  try {
    const querySnapshot = await getDocs(collection(db, "clients"));
    const firebaseClients = [];
    querySnapshot.forEach(doc => {
      const data = doc.data();
      firebaseClients.push({
        id: doc.id,
        nom: data.nom || "",
        prenom: data.prenom || "",
        telephone: data.telephone || "---",
        adresse: data.adresse || data.localite || "ZIASSO",
        type_client: data.type_client || "Résidentiel",
        status: "firebase"
      });
    });

    // Combiner les clients de Firebase avec les clients locaux importés
    clientList = [...firebaseClients, ...localExcelClients];
    renderClientsTable();
  } catch (error) {
    console.error("Erreur de chargement des clients:", error);
    clientsTableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 24px; color: #dc2626;">
          Erreur de chargement: ${error.message}
        </td>
      </tr>
    `;
  }
}

// Fonction de rendu du tableau avec filtrage
function renderClientsTable() {
  if (!clientsTableBody) return;

  const searchTerm = clientSearchInput ? clientSearchInput.value.toLowerCase().trim() : "";
  const filteredList = clientList.filter(c => {
    return c.nom.toLowerCase().includes(searchTerm) ||
           c.prenom.toLowerCase().includes(searchTerm) ||
           c.telephone.toLowerCase().includes(searchTerm) ||
           c.adresse.toLowerCase().includes(searchTerm) ||
           c.type_client.toLowerCase().includes(searchTerm);
  });

  updateClientRecapCounters(filteredList);

  if (filteredList.length === 0) {
    clientsTableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 24px; color: var(--text-muted);">
          Aucun abonné trouvé.
        </td>
      </tr>
    `;
    return;
  }

  // Trier par Nom puis Prénom
  filteredList.sort((a, b) => a.nom.localeCompare(b.nom) || a.prenom.localeCompare(b.prenom));

  clientsTableBody.innerHTML = '';
  filteredList.forEach(client => {
    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid var(--border)';

    const badgeColor = client.status === 'firebase' ? '#16a34a' : '#ea580c';
    const badgeText = client.status === 'firebase' ? 'Synchronisé' : 'En attente';

    tr.innerHTML = `
      <td style="padding: 12px 10px; font-weight: 600; color: var(--navy);">${client.nom}</td>
      <td style="padding: 12px 10px;">${client.prenom}</td>
      <td style="padding: 12px 10px;">${client.telephone}</td>
      <td style="padding: 12px 10px;">${client.adresse}</td>
      <td style="padding: 12px 10px;">${client.type_client}</td>
      <td style="padding: 12px 10px; text-align: center;">
        <span style="display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; background: ${badgeColor}15; color: ${badgeColor}; border: 1px solid ${badgeColor}30;">
          ${badgeText}
        </span>
      </td>
      <td style="padding: 12px 10px; text-align: center;">
        <button class="btn-delete" style="background: #dc2626; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: 0.2s;">
          Supprimer
        </button>
      </td>
    `;

    // Supprimer un client
    tr.querySelector('.btn-delete').addEventListener('click', async () => {
      if (confirm(`Voulez-vous supprimer le client ${client.nom} ${client.prenom} ?`)) {
        if (client.status === 'local') {
          // Supprimer localement
          localExcelClients = localExcelClients.filter(c => c.id !== client.id);
          clientList = clientList.filter(c => c.id !== client.id);
          renderClientsTable();
          if (localExcelClients.length === 0 && btnSyncFirebase) {
            btnSyncFirebase.disabled = true;
          }
        } else {
          // Supprimer sur Firebase
          try {
            await deleteDoc(doc(db, "clients", client.id));
            alert("Client supprimé avec succès de Firebase !");
            loadClientsInline();
          } catch (error) {
            console.error("Erreur de suppression:", error);
            alert("Impossible de supprimer: " + error.message);
          }
        }
      }
    });

    clientsTableBody.appendChild(tr);
  });
}

// 1. Bouton "Importer Excel"
if (btnImportExcel && excelFileInput) {
  btnImportExcel.addEventListener('click', () => {
    excelFileInput.click();
  });

  excelFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const originalContent = btnImportExcel.innerHTML;
    btnImportExcel.disabled = true;
    btnImportExcel.textContent = "Lecture...";

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          alert("Le fichier Excel est vide.");
          return;
        }

        localExcelClients = [];
        jsonData.forEach(row => {
          let nom = "";
          let prenom = "";
          let telephone = "";
          let adresse = "ZIASSO";
          let type_client = "Résidentiel";

          for (let key in row) {
            const lowerKey = key.toLowerCase().trim();
            if (lowerKey === "nom" || lowerKey.includes("lastname") || lowerKey.includes("family")) {
              nom = String(row[key] || "").trim();
            } else if (lowerKey === "prenom" || lowerKey === "prénom" || lowerKey.includes("firstname") || lowerKey.includes("first name")) {
              prenom = String(row[key] || "").trim();
            } else if (lowerKey.includes("tel") || lowerKey.includes("phone") || lowerKey.includes("téléphone") || lowerKey.includes("telephone")) {
              telephone = String(row[key] || "").trim();
            } else if (lowerKey.includes("adresse") || lowerKey.includes("localite") || lowerKey.includes("localité") || lowerKey.includes("ville")) {
              adresse = String(row[key] || "").trim();
            } else if (lowerKey.includes("type") || lowerKey.includes("client type") || lowerKey.includes("catégorie") || lowerKey.includes("categorie")) {
              type_client = String(row[key] || "").trim();
            }
          }

          if (nom || prenom) {
            localExcelClients.push({
              id: "local_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
              nom: nom || "[Sans Nom]",
              prenom: prenom,
              telephone: telephone || "---",
              adresse: adresse || "ZIASSO",
              type_client: type_client || "Résidentiel",
              status: "local"
            });
          }
        });

        if (localExcelClients.length > 0) {
          alert(`${localExcelClients.length} clients chargés depuis Excel en attente de synchronisation.`);
          btnSyncFirebase.disabled = false;
          loadClientsInline(); // Recharge et fusionne
        } else {
          alert("Aucun client trouvé dans le fichier. Assurez-vous d'avoir au moins une colonne contenant 'Nom' ou 'Prénom'.");
        }
      } catch (err) {
        console.error("Erreur de lecture Excel :", err);
        alert("Erreur de lecture : " + err.message);
      } finally {
        btnImportExcel.disabled = false;
        btnImportExcel.innerHTML = originalContent;
        excelFileInput.value = "";
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

// 2. Bouton "Synchroniser vers Firebase"
if (btnSyncFirebase) {
  btnSyncFirebase.addEventListener('click', async () => {
    const locals = localExcelClients;
    if (locals.length === 0) return;

    btnSyncFirebase.disabled = true;
    btnSyncFirebase.textContent = "Synchronisation...";

    try {
      const promises = locals.map(client => {
        return addDoc(collection(db, "clients"), {
          nom: client.nom,
          prenom: client.prenom,
          nom_client: `${client.nom} ${client.prenom}`.trim(),
          telephone: client.telephone,
          adresse: client.adresse,
          localite: client.adresse,
          type_client: client.type_client,
          compteur_id: client.telephone !== "---" ? client.telephone : ("HT-" + Math.random().toString(36).substring(2, 7).toUpperCase())
        });
      });

      await Promise.all(promises);
      alert(`${locals.length} clients enregistrés et synchronisés avec succès dans Firebase !`);
      localExcelClients = [];
      loadClientsInline(); // Recharge tout depuis Firebase
      btnSyncFirebase.disabled = true;
    } catch (err) {
      console.error("Erreur de synchronisation Firebase :", err);
      alert("Une erreur est survenue lors de la synchronisation : " + err.message);
      btnSyncFirebase.disabled = false;
      btnSyncFirebase.textContent = "Recommencer la synchronisation";
    }
  });
}

// 4. Barre de recherche
if (clientSearchInput) {
  clientSearchInput.addEventListener('input', renderClientsTable);
}

// Initialisation au chargement
if (clientsTableBody) {
  loadClientsInline();
}
