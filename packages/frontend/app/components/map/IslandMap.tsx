'use client'

import { useEffect, useRef, useState } from 'react'
import Island, { ISLAND_W } from './Island'

const ISLAND_SPACING = 280
const PADDING_TOP    = 80
const X_FRACS        = [0.25, 0.75]
const PLAT_ANCHOR_Y  = 60

interface Module {
  id: string
  title: string
  description: string | null
  order: number
  xpReward: number
  totalXp?: number
  mascot?: string | null
  _count: { tasks: number }
  tasks: { id: string }[]
  status?: 'done' | 'active' | 'locked'
  completedTaskCount?: number
}

interface IslandMapProps {
  modules: Module[]
  trackTitle: string
  onSelectModule: (moduleId: string) => void
}

type PathStyle = 'done' | 'active' | 'locked'
interface PathData { d: string; style: PathStyle }

export default function IslandMap({ modules, trackTitle, onSelectModule }: IslandMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const islandRefs = useRef<(HTMLDivElement | null)[]>([])
  const [paths, setPaths] = useState<PathData[]>([])

  if (islandRefs.current.length !== modules.length) {
    islandRefs.current = new Array(modules.length).fill(null)
  }

  useEffect(() => {
    if (!modules.length) return
    const activeIdx = modules.findIndex((m, i) =>
      (m.status ?? (i === 0 ? 'active' : 'locked')) === 'active'
    )
    if (activeIdx < 0) return
    setTimeout(() => {
      islandRefs.current[activeIdx]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 150)
  }, [modules])

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
      const srcStatus = modules[i].status ?? (i === 0 ? 'active' : 'locked')
      const style: PathStyle =
        srcStatus === 'done'   ? 'done'   :
        srcStatus === 'active' ? 'active' : 'locked'
      newPaths.push({
        d: `M ${a.x},${a.y} C ${a.x},${a.y + dy * 0.45} ${b.x},${b.y - dy * 0.45} ${b.x},${b.y}`,
        style,
      })
    }
    setPaths(newPaths)
  }, [modules])

  const totalXp        = modules.reduce((s, m) => s + (m.totalXp ?? m.xpReward), 0)
  const totalTasks     = modules.reduce((s, m) => s + m._count.tasks, 0)
  const doneCount      = modules.filter(m => m.status === 'done').length
  const progressPct    = modules.length > 0 ? Math.round((doneCount / modules.length) * 100) : 0
  const canvasH        = modules.length * ISLAND_SPACING + PADDING_TOP + 140

  return (
    <div className="min-h-full pb-10">
      {/* Track header */}
      <div className="sticky top-0 z-10 bg-nx-surface border-b border-nx-border px-6 py-3">
        <div className="flex items-center gap-3 flex-wrap mb-2">
          <h2 className="text-nx-yellow font-bold tracking-widest uppercase text-lg">{trackTitle}</h2>
          <span className="text-nx-border">·</span>
          <span className="text-nx-text-dim text-sm">{modules.length} modules</span>
          <span className="text-nx-border">·</span>
          <span className="text-nx-text-dim text-sm">{totalTasks} tasks</span>
          <span className="text-nx-yellow text-sm font-semibold ml-auto">{totalXp} XP total</span>
        </div>
        {/* Progress bar */}
        <div className="h-0.5 bg-nx-border rounded-full overflow-hidden">
          <div
            className="h-full bg-nx-yellow rounded-full transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative mx-auto overflow-x-hidden"
        style={{ maxWidth: 640, height: canvasH }}
      >
        <svg
          className="absolute inset-0 w-full pointer-events-none"
          style={{ height: canvasH }}
        >
          <defs>
            <linearGradient id="path-done" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00d4c8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#00d4c8" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="path-active" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f5c030" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#f5c030" stopOpacity="0.3" />
            </linearGradient>
            <filter id="glow-cyan">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glow-yellow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {paths.map((p, i) => (
            <path
              key={i}
              d={p.d}
              fill="none"
              stroke={
                p.style === 'done'   ? 'url(#path-done)'   :
                p.style === 'active' ? 'url(#path-active)' : '#1e2d4a'
              }
              strokeWidth={p.style === 'locked' ? 1.5 : 2}
              strokeDasharray={p.style === 'locked' ? '6 5' : undefined}
              strokeLinecap="round"
              filter={
                p.style === 'done'   ? 'url(#glow-cyan)'   :
                p.style === 'active' ? 'url(#glow-yellow)' : undefined
              }
            />
          ))}
        </svg>

        {modules.map((mod, i) => (
          <Island
            key={mod.id}
            title={mod.title}
            status={mod.status ?? (i === 0 ? 'active' : 'locked')}
            taskCount={mod._count.tasks}
            xpReward={mod.totalXp ?? mod.xpReward}
            xFrac={X_FRACS[i % 2]}
            yTop={PADDING_TOP + i * ISLAND_SPACING}
            moduleId={mod.id}
            onClick={onSelectModule}
            islandRef={(el) => { islandRefs.current[i] = el }}
            orderNumber={i + 1}
            mascot={mod.mascot}
          />
        ))}
      </div>
    </div>
  )
}
