# Genoa

Membres : Kollen Matthieu & Boudy Pierre

Chaque fonctionnalité ajouté est suivi du nom de la personne qui s'en est chargé.
Hors précision, si les deux noms sont ajoutés Matthieu s'est chargé de la partie back et Pierre de la partie front.

## Fonctionnalités

### Authentification et Inscription

Création de compte utilisateur.  -- Matthieu
Système de connexion sécurisé via JSON Web Token (JWT). -- Matthieu
Sauvegarde du token JWT. -- Pierre
Protection des routes API et des écrans applicatifs via des Middlewares. -- Pierre (back)
Page d'attente en attente de validation admin. -- Pierre

### Gestion Utilisateurs (Administration)

Interface de gestion des comptes pour les administrateurs. -- Pierre
Système de rôles (Admin, Writer, Wait). -- Matthieu & Pierre
Validation et activation des nouveaux utilisateurs. -- Matthieu & Pierre
Script de création de base de données d'utilisateurs. -- Matthieu

### Gestion des Membres
Création, modification et suppression de membres. -- Matthieu & Pierre
Gestion des fiches individuelles (état civil, profession, biographie). -- Matthieu
Attribution automatique de références uniques (M1, M2...). -- Matthieu
Script de création de base de données de membre. -- Matthieu

### Gestion des Relations Familiales
Création de liens de parenté (parent-enfant) avec distinction biologique/adoptif.  -- Matthieu & Pierre
Gestion des relations de couple (mariage, divorce...). -- Matthieu & Pierre
Maintien de l'intégrité des données lors de la suppression de membres. Pierre (back)
Scripts de création de base de données de relations. -- Matthieu

### Visualisation de l'Arbre Généalogique
Liaison avec l'API de front. -- Pierre
Rendu graphique dynamique de la structure familiale, création des différente pages. Pierre
Calcul automatique du layout (moteur Dagre). -- Pierre
Navigation interactive. -- Pierre

### Gestion des Droits et Concurrence
Verrouillage des nœuds (Locking) : empêche la modification simultanée d'un même membre par deux utilisateurs. -- Matthieu
Attribution temporaire des droits d'édition sur un nœud. -- Matthieu
Gestion des permissions selon le rôle de l'utilisateur. -- Pierre

## Technologies

* **Backend :** Node.js, Express, MongoDB.
* **Frontend :** React Native (Expo), React Native SVG, Dagre.
* **Middleware :** Authentification JWT, Gestionnaire de fichiers .env.

## Installation

### Backend 
1. `npm install` dans le dossier back
2. Configuration du fichier `.env` (PORT, MONGO_URI, JWT_SECRET).
3. `node`/`nodemon server.js`

### Frontend
1. `npm install` dans le dossier front
2. Configuration de l'adresse IP de l'API dans le code.
3. `npx expo start`






