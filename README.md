# 💧 HydroTech Africa — Système de Facturation d'Eau

> **HydroTech Africa** est une application web de gestion de facturation pour points d'eau (adductions d'eau potable), développée en HTML / CSS / JavaScript pur avec Firebase comme backend cloud. Elle permet de gérer les abonnés, saisir les relevés de compteurs, calculer automatiquement les factures et générer des PDFs professionnels.

---

## 📋 Table des matières

- [Aperçu](#-aperçu)
- [Fonctionnalités](#-fonctionnalités)
- [Structure du projet](#-structure-du-projet)
- [Stack technique](#-stack-technique)
- [Installation & lancement](#-installation--lancement)
- [Configuration Firebase](#-configuration-firebase)
- [Pages de l'application](#-pages-de-lapplication)
- [Tarification de l'eau](#-tarification-de-leau)
- [Génération de PDF](#-génération-de-pdf)
- [Authentification](#-authentification)
- [Auteur](#-auteur)

---

## 🌍 Aperçu

HydroTech Africa est conçu pour les gestionnaires de réseaux d'eau en milieu rural ou semi-urbain (notamment en Côte d'Ivoire). Il permet de :

- Suivre les abonnés et leurs compteurs
- Saisir les relevés mensuels d'index
- Calculer automatiquement la consommation et le montant dû
- Générer et télécharger des **factures PDF** professionnelles
- Visualiser les statistiques clés depuis un tableau de bord

---

## ✨ Fonctionnalités

| Fonctionnalité | Description |
|---|---|
| 🔐 Authentification | Connexion sécurisée via Firebase Auth (email / mot de passe) |
| 📊 Tableau de bord | Indicateurs clés : nombre d'abonnés, factures émises, total encaissé |
| 👤 Gestion des clients | Enregistrement et consultation des abonnés |
| 📝 Saisie de relevé | Formulaire de saisie de l'ancien et du nouvel index compteur |
| 🧮 Calcul automatique | Calcul de la consommation (m³) et du montant en FCFA |
| 📄 Génération PDF | Facture A4 complète générée côté client avec jsPDF |
| 💰 Gestion des arriérés | Prise en compte des impayés du mois précédent |
| 📈 Historique | Visualisation des 6 derniers mois de consommation sur la facture |
| 📁 Export CSV/Excel | Export de la base clients au format `.csv` / `.xlsx` (SheetJS) |
| 📱 Responsive | Interface adaptée aux écrans desktop et tablette |

---

## 📁 Structure du projet

```
HYDROTECH-FACT/
│
├── index.html          # Application principale (dashboard + factures + paiements)
├── login.html          # Page de connexion
├── dashboard.html      # Tableau de bord simplifié (portail d'accueil post-login)
├── clients.html        # Base de données des abonnés
├── nouveau-client.html # Formulaire d'inscription d'un nouveau client
├── releve.html         # Saisie de relevé de compteur
├── facture.html        # Visualisation / impression de facture
│
├── app.js              # Logique principale : Firebase, calculs, génération PDF
├── style.css           # Design système global (variables, composants, layout)
│
├── bg-water.png        # Image de fond pour la page de connexion
├── clients.csv         # Données clients exportées
│
├── package.json        # Dépendances Node.js (xlsx)
└── README.md           # Documentation du projet
```

---

## 🛠 Stack technique

| Couche | Technologie |
|---|---|
| **Frontend** | HTML5, CSS3 Vanilla, JavaScript ES6+ (modules) |
| **Design** | Google Fonts (Inter, Outfit), CSS Custom Properties |
| **Backend / BDD** | Firebase Firestore (NoSQL cloud) |
| **Authentification** | Firebase Authentication |
| **Génération PDF** | [jsPDF 2.5.1](https://github.com/parallax/jsPDF) (CDN) |
| **Export Excel** | [SheetJS / xlsx ^0.18.5](https://sheetjs.com/) (npm) |
| **Hébergement** | Navigateur local (fichiers statiques) |

---

## 🚀 Installation & lancement

### Prérequis

- Un navigateur moderne (Chrome, Firefox, Edge)
- Node.js (optionnel, uniquement pour l'export Excel)
- Un projet Firebase configuré (voir section suivante)

### Étapes

```bash
# 1. Cloner le dépôt
git clone https://github.com/hydrotechafricaci-lab/HYDROTECH-FACT.git
cd HYDROTECH-FACT

# 2. Installer les dépendances (optionnel — pour l'export xlsx)
npm install

# 3. Ouvrir l'application
# Ouvrir login.html dans un navigateur
# OU utiliser un serveur local :
npx serve .
```

> ⚠️ **Note** : L'application utilise des modules ES6 (`import`). Elle doit être servie via un serveur HTTP (pas directement ouverte en `file://`). Utilisez un serveur local comme `npx serve .`, VS Code Live Server, ou équivalent.

---

## 🔥 Configuration Firebase

Le fichier [`app.js`](./app.js) contient la configuration Firebase du projet :

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "hydrotech-fact.firebaseapp.com",
  projectId: "hydrotech-fact",
  messagingSenderId: "...",
  appId: "..."
};
```

Pour utiliser votre propre instance Firebase :

1. Créer un projet sur [Firebase Console](https://console.firebase.google.com/)
2. Activer **Authentication** (Email/Password)
3. Activer **Firestore Database**
4. Remplacer les valeurs de `firebaseConfig` dans `app.js`
5. Créer un utilisateur admin dans Firebase Authentication

### Collections Firestore utilisées

| Collection | Description |
|---|---|
| `releves` | Relevés de compteurs enregistrés |
| `clients` *(si applicable)* | Base des abonnés |

---

## 📄 Pages de l'application

### `login.html` — Connexion
- Formulaire email / mot de passe
- Authentification via Firebase Auth
- Redirection vers `index.html` après connexion réussie
- Design glassmorphism avec image de fond water-themed

### `dashboard.html` — Tableau de bord
- Indicateurs clés : abonnés, factures, encaissements
- Navigation rapide vers les autres modules
- Bouton de déconnexion

### `index.html` — Application principale
- Sidebar de navigation (Dashboard, Factures, Clients, Paiements, Rapports)
- Gestion multi-vues sans rechargement de page
- Création de nouvelles factures

### `nouveau-client.html` — Inscription client
- Formulaire complet d'enregistrement d'un abonné
- Sauvegarde dans Firebase Firestore
- Validation des champs

### `releve.html` — Saisie de relevé
- Chargement des informations du client (nom, ID compteur)
- Saisie de l'ancien et du nouvel index
- Calcul automatique de la consommation et du montant
- Gestion des arriérés impayés
- Génération et téléchargement de la facture PDF

### `clients.html` — Base de données clients
- Liste des abonnés enregistrés
- Recherche et filtrage
- Export CSV / Excel

---

## 💵 Tarification de l'eau

Le calcul de facturation applique la formule suivante :

```
Consommation (m³) = Nouvel index − Ancien index
Montant eau       = Consommation × 250 FCFA/m³
Total facture     = Montant eau + Arriérés impayés
```

> La tarification unitaire est de **250 FCFA par m³** (paramètre modifiable dans `app.js` → fonction `calculateWaterInvoice`).

---

## 🖨 Génération de PDF

Les factures sont générées **côté client** (sans serveur) via **jsPDF**. Chaque facture inclut :

- En-tête HydroTech Africa avec logo vectoriel (goutte d'eau)
- Bloc client (nom, ID, localité)
- Bloc facture (numéro, date, date d'échéance à 14 jours)
- Tableau de consommation avec historique des 6 derniers mois (graphique à barres)
- Sous-total, taxes (exonéré), total net en FCFA
- Bandeau **IMPAYÉ** avec date limite de règlement
- Pied de page (adresse, téléphone, site web)

**Nom du fichier généré** : `Facture_[ID_CLIENT].pdf`

---

## 🔐 Authentification

La protection des pages est assurée par une double vérification :

1. **Firebase `onAuthStateChanged`** : vérifie la session active côté Firebase
2. **`sessionStorage.getItem('ht_logged_in')`** : vérification rapide côté navigateur (mode dégradé si Firebase est indisponible)

Toutes les pages (sauf `login.html` et `releve.html`) redirigent vers la page de connexion si l'utilisateur n'est pas authentifié.

---

## 👨‍💻 Auteur

- Diby Maryline, Miagiste
- Manuella Karen, Développeur full stack

**HydroTech Africa CI-Lab**
- 📍 Abidjan, Côte d'Ivoire — Zone Industrielle
- 🌐 [www.hydrotech-africa.com](https://www.hydrotech-africa.com)
- 📞 Contact : +225 07 10 83 62 83
---

## 📜 Licence

© 2026 HydroTech Africa. Tous droits réservés.

---

*Gérer l'eau pour l'avenir. 💧*
