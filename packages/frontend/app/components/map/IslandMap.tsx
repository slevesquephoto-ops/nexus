'use client'

import { useEffect, useRef, useState } from 'react'
import Island, { ISLAND_W } from './Island'

const ISLAND_SPACING = 180
const PADDING_TOP = 60
const X_FRACS = [0.25, 0.75]
const PLAT_ANCHOR_Y = 52  // offset from island top to platform centre

interface Module {
  id: string
  title: string
  description: string | null
  order: number
  xpReward: number
  _count: { tasks: number }
}

interface IslandMapProps {
  modules: Module[]
  trackTitle: string
}

interface PathData { d: string; active: boolean }

export default function IslandMap({ modules, trackTitle }: IslandMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const islandRefs = useRef<(HTMLDivElement | null)[]>([])
  const [paths, setPaths] = useState<PathData[]>([])

  // Resize ref array to match current modules (safe in render body)
  if (islandRefs.current.length !== modules.length) {
    islandRefs.current = new Array(modules.length).fill(null)
  }

  useEffect(() => {
    if (!containerRef.current || modules.length < 2) {
      setPaths([])
      return
    }

    const containerRect = containerRef.current.getBoundingClientRect()
    const anchors = islandRefs.current.map(el => {
      if (!el) return null
      const rect = el.getBoundingClientRect()
      return {
        x: rect.left - containerRect.left + ISLAND_W / 2,
        y: rect.top  - containerRect.top  + PLAT_ANCHOR_Y,
      }
    })

    const newPaths: PathData[] = []
    for (let i = 0; i < anchors.length - 1; i++) {
      const a = anchors[i], b = anchors[i + 1]
      if (!a || !b) continue
      const dy = b.y - a.y
      newPaths.push({
        d: `M ${a.x},${a.y} C ${a.x},${a.y + dy * 0.45} ${b.x},${b.y - dy * 0.45} ${b.x},${b.y}`,
        active: i === 0,
      })
    }
    setPaths(newPaths)
  }, [modules])

  const totalXp    = modules.reduce((s, m) => s + m.xpReward, 0)
  const totalTasks = modules.reduce((s, m) => s + m._count.tasks, 0)
  const canvasH    = modules.length * ISLAND_SPACING + PADDING_TOP + 120

  return (
    <div className="min-h-full pb-10">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-nx-bg/90 backdrop-blur-sm border-b border-nx-border px-6 py-3 flex items-center gap-3 flex-wrap">
        <h2 className="text-white font-semibold">{trackTitle}</h2>
        <span className="text-nx-border">·</span>
        <span className="text-nx-gray text-sm">{modules.length} modules</span>
        <span className="text-nx-border">·</span>
        <span className="text-nx-gray text-sm">{totalTasks} tasks</span>
        <span className="text-nx-yellow text-sm ml-auto">{totalXp} XP total</span>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="relative mx-auto"
        style={{ maxWidth: 600, height: canvasH }}
      >
        {/* SVG overlay */}
        <svg
          className="absolute inset-0 w-full pointer-events-none"
          style={{ height: canvasH }}
        >
          {paths.map((p, i) => (
            <path
              key={i}
              d={p.d}
              fill="none"
              stroke={p.active ? '#f5c030' : '#1c2a4a'}
              strokeWidth={2}
              strokeDasharray={p.active ? undefined : '7 4'}
              strokeLinecap="round"
            />
          ))}
        </svg>

        {/* Islands */}
        {modules.map((mod, i) => (
          <Island
            key={mod.id}
            title={mod.title}
            status={i === 0 ? 'active' : 'locked'}
            taskCount={mod._count.tasks}
            xpReward={mod.xpReward}
            xFrac={X_FRACS[i % 2]}
            yTop={PADDING_TOP + i * ISLAND_SPACING}
            islandRef={(el) => { islandRefs.current[i] = el }}
          />
        ))}
      </div>
    </div>
  )
}
