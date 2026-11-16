# NEXUS — Plateforme d'apprentissage gamifiée

---

## Table des matières

1. [Qu'est-ce que NEXUS ?](#1-quest-ce-que-nexus-)
2. [Ce que NEXUS contient techniquement](#2-ce-que-nexus-contient-techniquement)
3. [Déploiement en staging — Ubuntu Server sur VMware](#3-déploiement-en-staging--ubuntu-server-sur-vmware)
   - 3.1 [Créer la VM Ubuntu Server dans VMware](#31-créer-la-vm-ubuntu-server-dans-vmware)
   - 3.2 [Configurer le réseau de la VM](#32-configurer-le-réseau-de-la-vm)
   - 3.3 [Préparer Ubuntu Server](#33-préparer-ubuntu-server)
   - 3.4 [Installer Docker et Docker Compose](#34-installer-docker-et-docker-compose)
   - 3.5 [Transférer le projet sur la VM](#35-transférer-le-projet-sur-la-vm)
   - 3.6 [Configurer les variables d'environnement](#36-configurer-les-variables-denvironnement)
   - 3.7 [Lancer NEXUS](#37-lancer-nexus)
   - 3.8 [Initialiser la base de données](#38-initialiser-la-base-de-données)
   - 3.9 [Vérifier que tout fonctionne](#39-vérifier-que-tout-fonctionne)
4. [Opérations courantes](#4-opérations-courantes)
5. [Dépannage](#5-dépannage)

---

## 1. Qu'est-ce que NEXUS ?

**NEXUS** est une plateforme d'apprentissage gamifiée conçue spécifiquement pour les cours du **DEP (Diplôme d'Études Professionnelles) en informatique** au Québec.

### Pour les enseignants (titulaires ou remplaçants)

NEXUS vous permet de **suivre la progression de vos élèves en temps réel** sans corriger manuellement chaque exercice. La plateforme distribue du contenu pédagogique structuré (textes, quiz, exercices pratiques) que les élèves complètent à leur rythme. Vous intervenez uniquement pour les **défis** (challenges) — des exercices pratiques que vous devez valider manuellement dans le panneau d'administration.

Ce que vous pouvez faire dans NEXUS :
- Créer et gérer des **classes** (groupes d'élèves)
- Assigner un ou plusieurs **parcours** à une classe (ex. : Linux Fundamentals, Windows)
- Voir la progression de chaque élève (points XP, ilôts complétés, défis soumis)
- Corriger les défis soumis par les élèves et leur attribuer une note
- Réinitialiser un défi pour permettre à un élève de le soumettre à nouveau
- Gérer les mots de passe des élèves
- Consulter le tableau de classement de la classe

### Pour les élèves

NEXUS ressemble à un jeu de progression. Chaque **parcours** est une carte avec des **ilôts** (modules) à débloquer en séquence. À l'intérieur de chaque ilôt, il y a des tâches à compléter :

- **Tâches normales** : lire du contenu, répondre à des quiz à choix multiples, exercices de type vrai/faux. Elles sont corrigées automatiquement.
- **Défis** (challenges) : exercices pratiques notés par l'enseignant. L'élève soumet sa réponse et attend la validation du prof.

En complétant des ilôts, l'élève gagne des **points XP**, monte de **niveau**, et débloque des **avatars** exclusifs. Un tableau de classement permet de voir sa position dans la classe.

### Langues supportées

NEXUS est bilingue : **français** et **anglais**. Le même parcours peut exister dans les deux langues (ex. : Linux Fundamentals FR / Linux Fundamentals EN). L'élève voit la version correspondant à la langue de son navigateur ou choisie dans la classe.

---

## 2. Ce que NEXUS contient techniquement

### Vue d'ensemble

NEXUS est une application web **full-stack** composée de trois parties qui tournent toutes dans des conteneurs Docker. Vous n'avez pas besoin de comprendre chaque technologie pour faire fonctionner le projet — Docker s'occupe de tout.

### Composants

| Composant | Technologie | Rôle |
|-----------|------------|------|
| **Frontend** | Next.js 14 (React) + TypeScript + Tailwind CSS | Interface web visible dans le navigateur |
| **Backend** | Express.js (Node.js) | Serveur API — logique métier, authentification, calculs XP |
| **Base de données** | PostgreSQL 16 | Stockage permanent (utilisateurs, progression, classes) |
| **ORM** | Prisma 7 | Couche d'accès à la base de données (entre le backend et PostgreSQL) |
| **Contenu** | Fichiers YAML | Définition des cours, modules, et exercices |
| **Authentification** | JWT (JSON Web Token) dans cookies httpOnly | Sessions sécurisées |
| **Orchestration** | Docker Compose | Lance et relie tous les conteneurs ensemble |

### Liste complète des éléments du projet

```
nexus/
│
├── packages/
│   │
│   ├── frontend/               ← Interface utilisateur (React / Next.js 14)
│   │   ├── app/                ← Pages de l'application (App Router Next.js)
│   │   │   ├── admin/          ← Panneau d'administration (classes, élèves, profs)
│   │   │   ├── components/     ← Composants réutilisables (carte, sidebar, tâches)
│   │   │   ├── login/          ← Page de connexion
│   │   │   ├── map/            ← Carte des ilôts (progression visuelle)
│   │   │   ├── module/[id]/    ← Pages de modules (accordéons de tâches)
│   │   │   ├── task/[id]/      ← Pages de tâches individuelles
│   │   │   └── profile/        ← Profil élève (XP, avatars, niveau)
│   │   ├── public/             ← Images statiques
│   │   │   ├── avatars/        ← 10 avatars débloquables (PNG)
│   │   │   ├── mascots/        ← Mascotte Tux (10 variantes)
│   │   │   └── content-images/ ← Images des leçons
│   │   ├── messages/           ← Traductions (fr.json, en.json)
│   │   ├── tailwind.config.ts  ← Palette de couleurs NEXUS
│   │   └── next.config.mjs     ← Configuration Next.js
│   │
│   ├── backend/                ← Serveur API (Express.js / Node.js)
│   │   ├── src/
│   │   │   ├── routes/         ← Endpoints de l'API REST
│   │   │   │   ├── auth.js     ← Connexion / déconnexion
│   │   │   │   ├── tasks.js    ← Complétion de tâches, XP, avatars
│   │   │   │   ├── parcours.js ← Chargement des parcours et progression
│   │   │   │   ├── modules.js  ← Modules et leur contenu
│   │   │   │   ├── admin.js    ← Gestion classes, notes défis, reset
│   │   │   │   └── users.js    ← Profil utilisateur
│   │   │   ├── lib/
│   │   │   │   ├── content-loader.js ← Lit les YAML et les importe en DB
│   │   │   │   ├── prisma.js         ← Client base de données
│   │   │   │   ├── avatars.js        ← Logique de récompenses d'avatars
│   │   │   │   └── levels.js         ← Calcul XP et niveaux
│   │   │   └── middleware/
│   │   │       └── auth.js     ← Vérification du JWT
│   │   ├── prisma/
│   │   │   ├── schema.prisma   ← Structure de la base de données
│   │   │   └── migrations/     ← Historique des changements de DB (11 migrations)
│   │   ├── prisma.config.ts    ← Configuration Prisma 7
│   │   ├── seed.js             ← Création des utilisateurs de test
│   │   └── index.js            ← Point d'entrée du serveur
│   │
│   └── content/                ← Contenu pédagogique (fichiers YAML)
│       └── parcours/
│           ├── linux/          ← Parcours Linux Fundamentals
│           │   └── tracks/
│           │       ├── linux-fund-fr/   ← Version française (5 modules)
│           │       └── linux-fund-en/   ← Version anglaise (5 modules)
│           ├── nexus-guide/    ← Guide d'introduction à NEXUS
│           │   └── tracks/
│           │       ├── getting-started-fr/
│           │       └── getting-started-en/
│           └── windows/        ← Parcours Windows (en développement)
│
├── docker-compose.yml          ← Définition des 3 services Docker
├── .env                        ← Variables d'environnement (secrets — NE PAS COMMITTER)
├── .env.example                ← Modèle de fichier .env
└── CLAUDE.md                   ← Instructions pour l'assistant IA
```

### Structure d'un fichier YAML de module

Les cours sont entièrement définis dans des fichiers YAML. Chaque fichier représente un module (ilôt) et contient une liste de tâches. Exemple simplifié :

```yaml
id: linux-fund-1-en
trackId: linux-en
title: "Linux Fundamentals 1 — First Contact"
language: en
tasks:
  - id: linux-fund-1-en-t1
    type: task          # tâche normale (corrigée automatiquement)
    title: "What is Linux?"
    content: "Linux is an open-source operating system..."
    xp: 10
    questions:
      - id: t1-q1
        type: qcm
        question: "Who created Linux?"
        choices: ["Linus Torvalds", "Bill Gates", "Steve Jobs"]
        correct: 0

  - id: linux-fund-1-en-challenge
    type: challenge     # défi (corrigé par le prof)
    title: "Challenge — First Commands"
    content: "Open a terminal and run the following commands..."
    xp: 50
```

### Modèles de la base de données

La base de données PostgreSQL contient les tables suivantes :

| Table | Contenu |
|-------|---------|
| `User` | Tous les utilisateurs (élèves, profs, admin) avec rôle, niveau, XP |
| `Parcours` | Les parcours (Linux, Windows, etc.) |
| `Track` | Les pistes de chaque parcours (FR, EN) |
| `Module` | Les ilôts/modules de chaque piste |
| `Task` | Les tâches individuelles (TASK ou CHALLENGE) |
| `TaskProgress` | La progression de chaque élève sur chaque tâche |
| `Classe` | Les groupes-classes créés par les profs |
| `ClasseMember` | Association élève ↔ classe |
| `ClasseParcours` | Association classe ↔ parcours assigné |
| `ClasseParcoursTrack` | Association classe ↔ piste spécifique (FR ou EN) |
| `AvatarReward` | Règles de déclenchement des avatars |
| `UserAvatarReward` | Avatars débloqués par chaque élève |
| `XpLog` | Historique de tous les gains XP |

---

## 3. Déploiement en staging — Ubuntu Server sur VMware

> **Ce guide est rédigé pour quelqu'un sans expérience Linux.** Chaque étape est détaillée.  
> Les commandes à taper sont affichées dans des blocs comme celui-ci : `commande`  
> Appuyez sur **Entrée** après chaque commande.

---

### 3.1 Créer la VM Ubuntu Server dans VMware

#### Téléchargement de l'ISO Ubuntu Server

1. Ouvrez votre navigateur web.
2. Allez sur [https://ubuntu.com/download/server](https://ubuntu.com/download/server)
3. Téléchargez **Ubuntu Server 22.04 LTS** (fichier `.iso`, environ 1.5 Go).

#### Création de la machine virtuelle

1. Ouvrez **VMware Workstation Pro**.
2. Cliquez sur **File → New Virtual Machine** (ou **Nouvelle machine virtuelle**).
3. Choisissez **Typical (recommended)** → cliquez **Next**.
4. Sélectionnez **Installer disc image file (iso)** → cliquez **Browse** → sélectionnez le fichier `.iso` téléchargé → cliquez **Next**.
5. Remplissez les informations :
   - **Full name** : `nexus`
   - **User name** : `nexus`
   - **Password** : choisissez un mot de passe et **notez-le** (vous en aurez besoin)
6. Cliquez **Next**.
7. Nommez la VM : `NEXUS-Staging` → cliquez **Next**.
8. Taille du disque : mettez **40 Go** minimum → sélectionnez **Store virtual disk as a single file** → cliquez **Next**.
9. Cliquez **Customize Hardware** :
   - **Memory** : 4096 Mo (4 Go) minimum, 8192 Mo (8 Go) recommandé
   - **Processors** : 2 cœurs minimum
   - Cliquez **Close**
10. Cliquez **Finish**.

#### Installation d'Ubuntu Server

VMware démarre automatiquement l'installation. Suivez les étapes :

1. Sélectionnez **Try or Install Ubuntu Server** → Entrée.
2. Choisissez la langue : **English** (recommandé pour les messages d'erreur) → Entrée.
3. À l'écran "Installer update available" → choisissez **Continue without updating**.
4. Clavier : si vous avez un clavier québécois, choisissez **French (Canada)** → Done.
5. Type d'installation : choisissez **Ubuntu Server** (par défaut) → Done.
6. Configuration réseau : laissez par défaut (DHCP automatique) → Done.
7. Proxy : laissez vide → Done.
8. Mirror archive : laissez par défaut → Done.
9. Partitionnement disque : choisissez **Use an entire disk** → Done → Continue.
10. **Profile setup** :
    - Your name : `nexus`
    - Server name : `nexus-staging`
    - Username : `nexus`
    - Password : (choisissez un mot de passe fort — notez-le !)
11. **SSH Setup** : cochez **Install OpenSSH server** → Done.
12. Snaps à installer : ne rien cocher → Done.
13. L'installation commence (5-15 minutes). Attendez **"Installation complete!"**.
14. Cliquez **Reboot Now** → Entrée quand demandé.

Après le redémarrage, vous verrez un écran de connexion texte. Connectez-vous avec :
- Login : `nexus`
- Password : votre mot de passe (les caractères ne s'affichent pas — c'est normal)

---

### 3.2 Configurer le réseau de la VM

Pour accéder à NEXUS depuis votre Windows, la VM doit être sur le même réseau.

#### Trouver l'adresse IP de la VM

Dans le terminal de la VM, tapez :

```bash
ip addr show
```

Cherchez une ligne comme `inet 192.168.x.x/24` (pas `127.0.0.1`). **Notez cette adresse IP** — c'est l'adresse de votre serveur staging.

Exemple de sortie :
```
2: ens33: <BROADCAST,MULTICAST,UP>
    inet 192.168.1.105/24 brd 192.168.1.255
```
→ L'IP est **192.168.1.105**.

#### Optionnel : rendre l'IP fixe (recommandé)

Par défaut, l'IP peut changer à chaque redémarrage. Pour la fixer :

```bash
sudo nano /etc/netplan/00-installer-config.yaml
```

Remplacez le contenu par (adaptez l'IP selon votre réseau) :

```yaml
network:
  version: 2
  ethernets:
    ens33:
      dhcp4: false
      addresses:
        - 192.168.1.105/24
      gateway4: 192.168.1.1
      nameservers:
        addresses: [8.8.8.8, 8.8.4.4]
```

> **Attention** : vérifiez que l'interface s'appelle bien `ens33` (la sortie de `ip addr show` vous le dit).

Sauvegardez avec **Ctrl+O**, Entrée, puis **Ctrl+X**. Appliquez :

```bash
sudo netplan apply
```

#### Configuration VMware Workstation

Dans VMware, pour que la VM ait accès à votre réseau local Windows :

1. Allez dans **VM → Settings → Network Adapter**.
2. Choisissez **Bridged: Connected directly to the physical network**.
3. Cliquez **OK**.
4. Redémarrez la VM : `sudo reboot`

Vérifiez que Windows peut communiquer avec la VM. Dans un **terminal Windows** (PowerShell) :

```powershell
ping 192.168.1.105
```

Vous devriez voir des réponses. Si non, vérifiez le pare-feu Windows ou repassez en mode **NAT** dans VMware.

---

### 3.3 Préparer Ubuntu Server

#### Se connecter en SSH depuis Windows (optionnel mais pratique)

Plutôt que de taper dans la fenêtre VMware, vous pouvez utiliser un terminal Windows pour vous connecter à la VM :

Ouvrez **PowerShell** ou **Windows Terminal** sur votre Windows et tapez :

```powershell
ssh nexus@192.168.1.105
```

Tapez `yes` si demandé, puis votre mot de passe.

> Avantage : vous pouvez copier-coller des commandes longues facilement.

#### Mettre à jour le système

Une fois connecté (en SSH ou directement dans VMware), mettez à jour Ubuntu :

```bash
sudo apt update && sudo apt upgrade -y
```

> `sudo` signifie "exécuter en tant qu'administrateur". On vous demandera votre mot de passe.  
> Cette commande peut prendre 2-5 minutes.

#### Installer les outils de base

```bash
sudo apt install -y curl git wget nano unzip
```

---

### 3.4 Installer Docker et Docker Compose

Docker est le moteur qui fait tourner NEXUS. Tout passe par lui — vous n'avez pas besoin d'installer Node.js, PostgreSQL, etc. séparément.

#### Installer Docker Engine

Exécutez ces commandes **une par une** :

```bash
sudo apt install -y ca-certificates curl gnupg
```

```bash
sudo install -m 0755 -d /etc/apt/keyrings
```

```bash
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
```

```bash
sudo chmod a+r /etc/apt/keyrings/docker.gpg
```

```bash
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

```bash
sudo apt update
```

```bash
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

#### Permettre à votre utilisateur d'utiliser Docker (sans sudo)

```bash
sudo usermod -aG docker $USER
```

**Fermez et rouvrez votre session SSH** (ou tapez `newgrp docker`) pour que ce changement soit pris en compte.

#### Vérifier l'installation

```bash
docker --version
docker compose version
```

Vous devriez voir quelque chose comme :
```
Docker version 25.0.3, build 4debf41
Docker Compose version v2.24.5
```

---

### 3.5 Transférer le projet sur la VM

Vous avez deux options pour copier le projet NEXUS sur la VM.

#### Option A — Via Git (si le projet est sur GitHub)

```bash
cd ~
git clone https://github.com/VOTRE-ORG/nexus.git
cd nexus
```

> Remplacez `VOTRE-ORG/nexus` par le vrai chemin du dépôt GitHub.

#### Option B — Via SCP depuis Windows (copie directe)

Sur votre **Windows** (dans PowerShell), compressez d'abord le projet :

```powershell
# Allez dans le dossier parent du projet
cd "C:\Users\Steeve\Claude Code Projects"

# Créez une archive ZIP (exclut node_modules et .next pour aller plus vite)
```

Utilisez un outil comme **WinSCP** ou **FileZilla** pour transférer les fichiers :

1. Téléchargez et installez [WinSCP](https://winscp.net/eng/download.php).
2. Ouvrez WinSCP.
3. Remplissez :
   - Protocol : **SFTP**
   - Host name : `192.168.1.105` (l'IP de votre VM)
   - User name : `nexus`
   - Password : votre mot de passe VM
4. Cliquez **Login**.
5. Dans le panneau de gauche, naviguez jusqu'au dossier `nexus` sur Windows.
6. Dans le panneau de droite, naviguez dans `/home/nexus/`.
7. **Faites glisser** le dossier `nexus` de gauche à droite.

> **Attention** : excluez les dossiers `node_modules` et `.next` lors du transfert — ils sont lourds et seront régénérés par Docker.

#### Vérifier que le projet est arrivé

```bash
ls ~/nexus
```

Vous devriez voir : `packages  docker-compose.yml  .env.example  CLAUDE.md  ...`

---

### 3.6 Configurer les variables d'environnement

Le fichier `.env` contient les secrets (mots de passe, clés secrètes). Il ne doit **jamais** être partagé ou commis dans Git.

```bash
cd ~/nexus
cp .env.example .env
nano .env
```

L'éditeur `nano` s'ouvre. Modifiez les valeurs :

```env
# Mot de passe de la base de données PostgreSQL
DB_PASSWORD=<mot de passe long et unique>

# Clé secrète pour les tokens JWT (authentification)
# Générez une chaîne longue et aléatoire : openssl rand -base64 48
JWT_SECRET=<résultat de openssl rand -base64 48>

# Mode d'environnement
NODE_ENV=production

# URL de l'API — remplacez par l'IP de votre VM
NEXT_PUBLIC_API_URL=http://192.168.1.105:4000

# Origines autorisées pour le CORS
ALLOWED_ORIGINS=http://192.168.1.105,http://192.168.1.105:3000
```

> Pour générer un JWT_SECRET aléatoire, vous pouvez utiliser :
> ```bash
> openssl rand -base64 32
> ```
> Copiez le résultat et collez-le comme valeur de `JWT_SECRET`.

Sauvegardez : **Ctrl+O** → Entrée → **Ctrl+X**.

---

### 3.7 Lancer NEXUS

#### Premier démarrage (construction des images)

```bash
cd ~/nexus
docker compose up -d --build
```

> `-d` = en arrière-plan (detached)  
> `--build` = reconstruire les images Docker  
> **Cette commande peut prendre 5-15 minutes** lors du premier lancement (téléchargement des images, compilation du frontend).

Suivez les logs pour voir la progression :

```bash
docker compose logs -f
```

Appuyez sur **Ctrl+C** pour arrêter de suivre les logs (les conteneurs continuent de tourner).

#### Vérifier que les 3 services sont démarrés

```bash
docker compose ps
```

Vous devriez voir :

```
NAME              STATUS          PORTS
nexus-db-1        Up              0.0.0.0:5432->5432/tcp
nexus-backend-1   Up              0.0.0.0:4000->4000/tcp
nexus-frontend-1  Up              0.0.0.0:3000->3000/tcp
```

Si un service est en statut `Exited`, consultez ses logs :

```bash
docker compose logs backend
docker compose logs frontend
docker compose logs db
```

---

### 3.8 Initialiser la base de données

#### Appliquer les migrations Prisma

Les migrations créent toutes les tables dans la base de données :

```bash
docker compose exec backend npx prisma migrate deploy
```

> `migrate deploy` applique toutes les migrations existantes sans poser de questions. Utilisez toujours `deploy` (pas `dev`) en staging/production.

#### Créer les utilisateurs de test (seed)

```bash
docker compose exec backend node seed.js
```

Cette commande crée plusieurs comptes par défaut :

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Admin | admin@nexus.local | (voir seed.js) |
| Prof | prof@nexus.local | (voir seed.js) |
| Élève | eleve1@nexus.local | (voir seed.js) |

> Pour voir les identifiants exacts, lisez le fichier `packages/backend/seed.js`.

#### Charger le contenu pédagogique

Le contenu YAML est chargé **automatiquement** au démarrage du backend. Vérifiez dans les logs :

```bash
docker compose logs backend | grep content-loader
```

Vous devriez voir :
```
[content-loader] Done — 16 modules, 158 tasks imported
```

---

### 3.9 Vérifier que tout fonctionne

#### Depuis un navigateur sur Windows

Ouvrez votre navigateur et accédez à :

- **Frontend (application)** : `http://192.168.1.105:3000`
- **Backend (API)** : `http://192.168.1.105:4000/api/health`

Vous devriez voir la page de connexion NEXUS sur le port 3000.

#### Test de connexion

1. Allez sur `http://192.168.1.105:3000`
2. Connectez-vous avec un compte créé par le seed.
3. Vérifiez que la carte des parcours s'affiche correctement.

---

## 4. Opérations courantes

### Démarrer / arrêter NEXUS

```bash
# Démarrer
cd ~/nexus
docker compose up -d

# Arrêter
docker compose down

# Redémarrer un service spécifique
docker compose restart backend
```

### Mettre à jour le code (après un git pull)

```bash
cd ~/nexus
git pull origin develop

# Si des fichiers backend ont changé :
docker compose up -d --build backend

# Si des fichiers frontend ont changé :
docker compose up -d --build frontend

# Si des migrations Prisma ont été ajoutées :
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma generate
```

### Voir les logs en temps réel

```bash
# Tous les services
docker compose logs -f

# Un service spécifique
docker compose logs -f backend
docker compose logs -f frontend
```

### Réinitialiser complètement (⚠️ efface toutes les données)

```bash
docker compose down -v
docker compose up -d --build
docker compose exec backend npx prisma migrate deploy
docker compose exec backend node seed.js
```

> **Attention** : `down -v` supprime les volumes Docker, y compris la base de données. Toutes les données (élèves, progression, classes) seront perdues.

### Sauvegarder la base de données

```bash
docker compose exec db pg_dump -U nexus nexus > backup_$(date +%Y%m%d).sql
```

### Restaurer une sauvegarde

```bash
cat backup_20260531.sql | docker compose exec -T db psql -U nexus nexus
```

### Accéder directement à la base de données

```bash
docker compose exec db psql -U nexus nexus
```

Commandes PostgreSQL utiles :
- `\dt` — liste les tables
- `SELECT * FROM "User" LIMIT 10;` — voir les 10 premiers utilisateurs
- `\q` — quitter

---

## 5. Dépannage

### Le frontend affiche "Cannot connect to API"

Vérifiez que `NEXT_PUBLIC_API_URL` dans `.env` correspond bien à l'IP de votre VM (pas `localhost`). Puis reconstruisez le frontend :

```bash
docker compose up -d --build frontend
```

> **Important** : `NEXT_PUBLIC_API_URL` est intégré au build du frontend. Tout changement nécessite un rebuild.

### Le backend ne démarre pas

```bash
docker compose logs backend
```

Causes fréquentes :
- La base de données n'est pas encore prête → attendez 10-15 secondes et relancez : `docker compose restart backend`
- Une variable `.env` manque → vérifiez que `.env` existe et contient toutes les valeurs requises

### Erreur "database does not exist" ou "migration failed"

```bash
docker compose exec backend npx prisma migrate deploy
```

Si l'erreur persiste :

```bash
docker compose down -v
docker compose up -d
docker compose exec backend npx prisma migrate deploy
docker compose exec backend node seed.js
```

### Port déjà utilisé (erreur "address already in use")

Si un autre service utilise le port 3000, 4000 ou 5432 :

```bash
sudo lsof -i :3000
sudo lsof -i :4000
```

Arrêtez le processus en conflit avec `sudo kill -9 PID` (remplacez `PID` par le numéro affiché).

### La VM est inaccessible depuis Windows

1. Vérifiez que la VM est en mode **Bridged** dans VMware (pas NAT).
2. Vérifiez l'IP de la VM : `ip addr show`
3. Testez depuis Windows : `ping 192.168.1.105`
4. Si le ping échoue, vérifiez le pare-feu Windows (peut bloquer les réponses ICMP).

### Modifier un fichier YAML de contenu

Les fichiers YAML sont montés en volume dans Docker. Après modification :

```bash
# Redémarrer le backend suffit (il recharge le contenu au démarrage)
docker compose restart backend
docker compose logs backend | grep content-loader
```

### Ouvrir les ports dans le pare-feu Ubuntu (si nécessaire)

```bash
sudo ufw allow 3000/tcp
sudo ufw allow 4000/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

---

## Informations techniques de référence rapide

| Élément | Valeur |
|---------|--------|
| Frontend URL | `http://IP_VM:3000` |
| Backend API URL | `http://IP_VM:4000` |
| Base de données | PostgreSQL — port 5432 |
| Utilisateur DB | `nexus` |
| Nom de la DB | `nexus` |
| Fichier de configuration | `~/nexus/.env` |
| Logs en direct | `docker compose logs -f` |
| Redémarrage complet | `docker compose restart` |

---

*Document rédigé pour le projet NEXUS — DEP Informatique, Québec.*  
*Dernière mise à jour : mai 2026.*
