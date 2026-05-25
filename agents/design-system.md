# Agent Design System — NEXUS

## Mission
Garantir une identité visuelle cohérente, futuriste et premium
sur TOUTES les pages de NEXUS — étudiant ET enseignant.
Consulter ce fichier avant de créer ou modifier n'importe quel
composant UI, page, ou layout.

---

## Palette officielle — IMMUABLE

```css
/* Fonds */
--nx-bg:        #080b14;   /* fond principal — noir profond */
--nx-surface:   #0d1120;   /* cartes, modales, sidebar */
--nx-surface-2: #111827;   /* fond secondaire, hover */

/* Bordures */
--nx-border:    #1e2d4a;   /* bordure standard */
--nx-border-glow-yellow: rgba(245, 192, 48, 0.3);
--nx-border-glow-cyan:   rgba(0, 212, 200, 0.3);

/* Couleurs primaires */
--nx-yellow:    #f5c030;   /* actif, CTA, identité */
--nx-yellow-dim:#7a6010;   /* jaune atténué */
--nx-cyan:      #00d4c8;   /* complété, succès, liens */
--nx-cyan-dim:  #004a44;   /* cyan atténué */

/* Texte */
--nx-text:      #e8eaf0;   /* texte principal */
--nx-text-dim:  #6b7a9e;   /* texte secondaire */
--nx-text-muted:#2a3a5a;   /* texte désactivé */

/* États */
--nx-danger:    #ef4444;   /* erreur, supprimer */
--nx-warning:   #f59e0b;   /* attention */
--nx-success:   #10b981;   /* succès alternatif */
```

**INTERDIT :**
- Utiliser du bleu-gris (`#1e3a5f`, `#2563eb`, etc.) comme couleur de fond
- Utiliser du blanc pur comme fond ou couleur de carte
- Dévier de la palette ci-dessus sans raison documentée

---

## Typographie

```css
/* Police système — dans cet ordre */
font-family: 'Rajdhani', 'Segoe UI', system-ui, sans-serif;

/* Hiérarchie */
--text-xs:   0.75rem;   /* labels, badges */
--text-sm:   0.875rem;  /* corps secondaire */
--text-base: 1rem;      /* corps principal */
--text-lg:   1.125rem;  /* sous-titres */
--text-xl:   1.25rem;   /* titres section */
--text-2xl:  1.5rem;    /* titres page */
--text-3xl:  1.875rem;  /* grands titres */
--text-4xl:  2.25rem;   /* héros */

/* Poids */
font-weight: 400; /* corps */
font-weight: 600; /* emphase */
font-weight: 700; /* titres */
font-weight: 800; /* grands titres, logo */

/* Letter-spacing — toujours présent sur les titres */
letter-spacing: 0.05em;  /* titres normaux */
letter-spacing: 0.1em;   /* titres uppercase */
letter-spacing: 0.2em;   /* labels, badges */
```

---

## Grille et espacement

```
Sidebar : 220px fixe
Topbar  : 52px fixe
Contenu : padding 24px standard, 32px sur grand écran
Cartes  : padding 20px, border-radius 10px
Gap standard entre éléments : 12px, 16px, 24px
```

---

## Effets visuels — obligatoires pour le style premium

### 1. Grille de fond (toutes les pages)
```css
.nx-grid-bg {
  background-image:
    linear-gradient(rgba(0, 212, 200, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 212, 200, 0.03) 1px, transparent 1px);
  background-size: 44px 44px;
}
```

### 2. Bordures lumineuses sur les cartes actives
```css
/* Carte active/hover */
border: 1px solid rgba(245, 192, 48, 0.4);
box-shadow: 0 0 20px rgba(245, 192, 48, 0.08),
            inset 0 0 20px rgba(245, 192, 48, 0.02);

/* Carte complétée */
border: 1px solid rgba(0, 212, 200, 0.4);
box-shadow: 0 0 20px rgba(0, 212, 200, 0.08);
```

### 3. Ligne lumineuse (scan line) — optionnel en décoration
```css
background: linear-gradient(90deg,
  transparent 0%,
  rgba(0, 212, 200, 0.4) 50%,
  transparent 100%);
height: 1px;
```

### 4. Dégradés de fond subtils
```css
/* Page principale */
background:
  radial-gradient(ellipse at 20% 20%,
    rgba(0, 212, 200, 0.04) 0%, transparent 50%),
  radial-gradient(ellipse at 80% 80%,
    rgba(245, 192, 48, 0.03) 0%, transparent 50%),
  #080b14;
```

### 5. Texte avec gradient (titres hero uniquement)
```css
background: linear-gradient(135deg, #f5c030 0%, #00d4c8 100%);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
```

---

## Composants — Standards

### Bouton primaire (CTA)
```tsx
<button className="
  px-6 py-2.5 rounded-lg font-semibold text-sm tracking-widest
  uppercase bg-nx-yellow text-nx-bg
  hover:bg-yellow-400 hover:shadow-[0_0_20px_rgba(245,192,48,0.4)]
  transition-all duration-200
">
```

### Bouton secondaire
```tsx
<button className="
  px-6 py-2.5 rounded-lg font-semibold text-sm tracking-widest
  uppercase border border-nx-border text-nx-text-dim
  hover:border-nx-yellow hover:text-nx-yellow
  transition-all duration-200
">
```

### Bouton danger
```tsx
<button className="
  px-4 py-2 rounded-lg text-sm font-medium
  border border-red-900/50 text-red-400
  hover:bg-red-900/20 hover:border-red-500
  transition-all duration-200
">
```

### Carte standard
```tsx
<div className="
  bg-nx-surface border border-nx-border rounded-xl p-5
  hover:border-nx-border-glow-yellow
  transition-all duration-200
">
```

### Input
```tsx
<input className="
  w-full bg-nx-surface-2 border border-nx-border rounded-lg
  px-4 py-2.5 text-sm text-nx-text
  placeholder:text-nx-text-muted
  focus:outline-none focus:border-nx-yellow/50
  transition-colors duration-200
">
```

### Badge statut
```tsx
/* Complété */
<span className="text-xs px-2 py-0.5 rounded-full
  bg-cyan-900/30 text-nx-cyan border border-nx-cyan/30
  tracking-widest uppercase">
  ✓ Complété
</span>

/* Actif */
<span className="text-xs px-2 py-0.5 rounded-full
  bg-yellow-900/30 text-nx-yellow border border-nx-yellow/30
  tracking-widest uppercase">
  ▶ En cours
</span>

/* Verrouillé */
<span className="text-xs px-2 py-0.5 rounded-full
  bg-nx-surface border border-nx-border text-nx-text-muted
  tracking-widest uppercase">
  🔒 Verrouillé
</span>
```

---

## Layout global — TOUTES LES PAGES

### Structure obligatoire
```
┌─────────────────────────────────────────────┐
│  TOPBAR (52px, sticky, bg-nx-surface)        │
├──────────────┬──────────────────────────────┤
│              │                              │
│  SIDEBAR     │   CONTENU PRINCIPAL          │
│  (220px)     │   bg-nx-bg + grille          │
│  bg-nx-surface│  radial gradients           │
│  border-right│                              │
│              │                              │
└──────────────┴──────────────────────────────┘
```

### Topbar — contenu
- Gauche : Logo NEXUS (N jaune, E cyan, reste jaune) + séparateur + contexte (Admin / Ma carte)
- Centre : Navigation principale (tabs)
- Droite : XP + avatar

### Sidebar — MÊME composant pour étudiant ET admin
La sidebar doit être identique visuellement dans les deux contextes.
Seul le contenu change (parcours/tracks vs Classes/Étudiants).

---

## Carte visuelle (Map) — Style inspiré "How It Works"

### Îlots
Chaque îlot est positionné comme une "étape numérotée" :
- Grand numéro de module en arrière-plan (opacité 0.05-0.08)
  comme les chiffres géants dans la référence (1, 2, 3, 4)
- Pingouin au premier plan
- Plateforme avec bordure lumineuse selon l'état
- Titre sous la plateforme, non tronqué

### Chemins entre îlots
- Lignes lumineuses (pas de simples traits)
- Style : `stroke: url(#gradient-cyan-yellow)` avec SVG gradient
- Largeur 2px, dasharray animé optionnel

### Layout de la carte
Inspiration section "Roadmap" de la référence :
- Alternance gauche/droite (zigzag) confirmée
- Connecteur central vertical comme colonne vertébrale
- Chaque îlot "sort" du connecteur central

---

## Pages spécifiques

### /map (carte étudiant)
- Fond : bg-nx-bg + grille + radial gradients
- Îlots plus grands (130px de large minimum)
- Titres complets, jamais tronqués
- Indicateur de progression du track en haut (barre fine jaune)

### /task (page task)
- Fond : bg-nx-bg
- Header avec breadcrumb : Track > Module > Task
- Indicateur "Task X / N" visible
- Sections théorie avec typographie plus grande et aérée
- Terminal avec effet glow vert subtil

### /profile (profil étudiant)
- Fond : bg-nx-bg + radial gradient jaune centré
- Avatar plus grand (80px)
- Barre XP en jaune (pas bleue)
- Statistiques avec icônes et couleurs différenciées

### /admin/* (backoffice)
- MÊME fond et palette que les pages étudiant
- Sidebar identique visuellement
- Tableaux avec alternance de lignes subtile (bg-nx-surface-2/30)
- Codes d'invitation courts : format XXX-YYY (6 chars, généré côté backend)

---

## Ce qu'il NE faut PAS faire

- Fond bleu-gris dans l'admin
- Boutons génériques Bootstrap/Material
- Tableaux avec bordures épaisses grises
- Texte blanc pur (#ffffff) — utiliser --nx-text (#e8eaf0)
- Animations trop rapides (< 150ms) ou trop lentes (> 400ms)
- Border-radius > 12px sur les cartes principales
- Utiliser des emojis comme seule icône dans les boutons d'action
- Titres tronqués avec "..." sur la carte

---

## Checklist avant de livrer un composant

- [ ] Fond correct (#080b14 ou #0d1120) ?
- [ ] Grille de fond présente sur les pages principales ?
- [ ] Palette respectée (jaune/cyan/sombre uniquement) ?
- [ ] Hover states définis sur tous les éléments interactifs ?
- [ ] Transitions CSS présentes (duration-200) ?
- [ ] Texte jamais tronqué sans raison ?
- [ ] Sidebar identique admin/étudiant ?
- [ ] Boutons avec letter-spacing et uppercase ?
