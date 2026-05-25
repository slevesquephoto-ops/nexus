# Agent Frontend

## Responsabilités
- Interface étudiant (carte visuelle, tasks, profil)
- Interface enseignant (backoffice, progression classe)
- Composants UI réutilisables

## Stack
- Next.js 14 App Router + TypeScript
- Tailwind CSS (palette NEXUS configurée)
- framer-motion pour animations de carte
- lucide-react pour icônes
- js-cookie pour lecture du JWT côté client

## Pages prioritaires — Mois 1-2
```
/                        → redirect vers /login ou /map
/login                   → formulaire authentification
/map                     → vue Parcours avec sidebar accordion
/map/[trackId]           → carte visuelle du track (îlots + chemins SVG)
/task/[taskId]           → rendu task (théorie scrollable + questions inline)
/profile                 → XP, niveau, badges, avatar Tux
/admin                   → backoffice enseignant
/admin/classes           → gestion des classes
/admin/classes/[id]      → progression des étudiants d'une classe
```

## Composants prioritaires
```
components/
  map/
    IslandMap.tsx        ← carte SVG avec îlots positionnés dynamiquement
    Island.tsx           ← un îlot (mascotte + plateforme + label)
    PathConnector.tsx    ← chemins SVG calculés entre îlots
  sidebar/
    Sidebar.tsx          ← navigation Parcours → Tracks accordion
    ParcoursItem.tsx     ← parcours cliquable avec tracks imbriqués
    TrackItem.tsx        ← track avec état (done/active/locked)
  task/
    TaskRenderer.tsx     ← dispatcher sections par type
    TheorySection.tsx    ← rendu markdown théorie
    CodeBlock.tsx        ← bloc terminal stylisé
    CommandTable.tsx     ← tableau de commandes
    QuestionsSection.tsx ← questions inline avec validation
    QcmQuestion.tsx      ← choix multiples
    ShortAnswer.tsx      ← réponse courte
  ui/
    XpBar.tsx            ← barre progression niveau
    Badge.tsx            ← badge affiché sur profil
    TopBar.tsx           ← barre de navigation principale
```

## Palette Tailwind — à configurer dans tailwind.config.ts
```typescript
extend: {
  colors: {
    'nx-bg':     '#080b14',
    'nx-surface':'#0a0e1a',
    'nx-border': '#1c2a4a',
    'nx-yellow': '#f5c030',
    'nx-cyan':   '#00d4c8',
    'nx-gray':   '#4a6080',
    'nx-dark':   '#2a3a5a',
  }
}
```

## Logique carte visuelle (IslandMap)
- Les îlots sont positionnés avec des coordonnées en % de la largeur du canvas
- Les chemins SVG sont calculés par JavaScript APRÈS le rendu DOM
- Le calcul mesure la position réelle de chaque îlot puis trace des courbes de Bézier
- Progression verticale haut → bas avec zigzag gauche-droite
- États des îlots : done (cyan), active (jaune + pulse animé), locked (grisé)

## Logique déverrouillage
- Une task se déverrouille quand la précédente est complétée
- Un module se déverrouille quand tous les tasks du module précédent sont complétés
- Le Challenge final se déverrouille quand tous les modules du track sont complétés

## Règles importantes
- Après tout changement de route : supprimer .next/ et rebuilder
- Jamais de localStorage — JWT lu via cookie httpOnly côté serveur
- Tous les appels API passent par /api/* du backend (port 4000)
- Les layouts ne font PAS d'appels API — seulement vérification cookie présent
