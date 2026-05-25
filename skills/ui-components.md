# UI Components — NEXUS Frontend

## Palette de couleurs (CSS variables à définir dans globals.css)
```css
:root {
  --nx-bg:      #080b14;
  --nx-surface: #0a0e1a;
  --nx-border:  #1c2a4a;
  --nx-yellow:  #f5c030;
  --nx-cyan:    #00d4c8;
  --nx-gray:    #4a6080;
  --nx-dark:    #2a3a5a;
  --nx-text:    #e8eaf0;
}
```

## Composant IslandMap — Logique SVG

Les îlots sont positionnés avec des coordonnées en % de largeur canvas.
Les chemins SVG sont calculés après le rendu DOM (JavaScript).

```typescript
// Structure de données d'un îlot
interface IslandData {
  id: string
  xFrac: number        // position horizontale (0 à 1)
  yTop: number         // position verticale en px
  status: 'done' | 'active' | 'locked'
  title: string
  progress: string     // ex: "3 / 5 tasks"
  badge: string        // ex: "✓ Complété"
}

// Connexion entre deux îlots
interface Connection {
  from: string         // id de l'îlot source
  to: string           // id de l'îlot destination
  color: string        // couleur du chemin
  dash: string         // ex: "7 4"
}
```

```typescript
// Calcul des chemins SVG après rendu
function drawPaths(islands: IslandData[], connections: Connection[]) {
  const canvas = document.getElementById('island-canvas')
  const W = canvas.offsetWidth
  const ISLAND_W = 120
  const PLAT_ANCHOR_Y = 26  // centre de la plateforme depuis le top de l'île
  const MASCOT_H = 38       // hauteur mascotte

  // Calculer les points d'ancrage de chaque île
  const anchors: Record<string, { x: number; y: number }> = {}
  islands.forEach(island => {
    const left = W * island.xFrac - ISLAND_W / 2
    anchors[island.id] = {
      x: left + ISLAND_W / 2,
      y: island.yTop + MASCOT_H + PLAT_ANCHOR_Y
    }
  })

  // Tracer les courbes de Bézier
  connections.forEach(conn => {
    const a = anchors[conn.from]
    const b = anchors[conn.to]
    const path = `M ${a.x},${a.y} C ${a.x},${a.y + (b.y-a.y)*0.45} ${b.x},${b.y - (b.y-a.y)*0.45} ${b.x},${b.y}`
    // Créer l'élément SVG path avec stroke, dasharray, marker-end
  })
}
```

## États visuels des îlots

### Done (complété) — cyan
```css
.island-done .platform-top {
  background: #0a2820;
  border: 1.5px solid #00d4c8;
  box-shadow: 0 0 14px rgba(0,212,200,0.3);
}
.island-done .island-name { color: #00d4c8; }
```

### Active (en cours) — jaune + pulse animé
```css
.island-active .platform-top {
  background: #261c00;
  border: 1.5px solid #f5c030;
  box-shadow: 0 0 18px rgba(245,192,48,0.35);
}
.island-active .island-name { color: #f5c030; }

@keyframes pulse {
  0%   { transform: translateX(-50%) scale(0.5); opacity: 0.7; }
  100% { transform: translateX(-50%) scale(2); opacity: 0; }
}
```

### Locked (verrouillé) — grisé
```css
.island-locked .platform-top {
  background: #0c1020;
  border: 1.5px solid #1c2a4a;
}
.island-locked .mascot { filter: grayscale(1) brightness(0.3); }
.island-locked .island-name { color: #2a3a5a; }
```

## Composant Sidebar — Structure accordion

```typescript
// Parcours expandable → Tracks
interface SidebarData {
  parcours: {
    id: string
    title: string
    icon: string
    progress: string        // "2 / 5 tracks"
    progressPct: number     // 0-100
    isOpen: boolean
    tracks: {
      id: string
      title: string
      status: 'done' | 'active' | 'locked'
      sub: string           // "Complété" | "3 / 5 modules" | "Verrouillé"
    }[]
  }[]
}
```

## XpBar — Composant progression niveau
```typescript
interface XpBarProps {
  currentXp: number
  level: number
  xpForNextLevel: number   // calculé selon la courbe de progression
}

// Formule de niveau suggérée
function xpForLevel(level: number): number {
  return level * 200   // Level 1→2: 200 XP, 2→3: 400 XP, etc.
}
```

## TopBar — Navigation principale
Éléments de gauche à droite :
1. Logo NEXUS (jaune + em cyan)
2. Navigation : Ma carte | Profil | Badges | Classement
3. Droite : XP total + avatar (emoji pingouin ou image)

## TaskRenderer — Rendu des sections
```typescript
// Dispatcher par type de section
function renderSection(section: Section) {
  switch (section.type) {
    case 'theory':        return <TheorySection content={section.content} />
    case 'code_block':    return <CodeBlock label={section.label} content={section.content} />
    case 'command_table': return <CommandTable commands={section.commands} />
    case 'questions':     return <QuestionsSection items={section.items} taskId={taskId} />
  }
}
```

## CodeBlock — Terminal stylisé
```tsx
// Apparence terminal avec header rouge/jaune/vert
<div className="rounded-lg overflow-hidden border border-nx-border">
  <div className="bg-[#1a1f2e] px-4 py-2 flex items-center gap-2 text-sm text-nx-gray">
    <span className="w-3 h-3 rounded-full bg-red-500/60" />
    <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
    <span className="w-3 h-3 rounded-full bg-green-500/60" />
    <span className="ml-2">{label}</span>
  </div>
  <pre className="bg-[#0d1220] p-4 font-mono text-sm text-green-400 overflow-x-auto">
    {content}
  </pre>
</div>
```
