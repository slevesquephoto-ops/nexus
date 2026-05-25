'use client'

interface XpBarProps {
  xp: number
  level: number
}

function xpForLevel(level: number): number {
  return level * 200
}

export default function XpBar({ xp, level }: XpBarProps) {
  const needed = xpForLevel(level)
  const xpInLevel = xp % needed
  const pct = Math.min(100, (xpInLevel / needed) * 100)

  return (
    <div className="px-3 py-3 border-t border-nx-border">
      <div className="flex justify-between text-xs text-nx-gray mb-1">
        <span>Niv. {level}</span>
        <span>{xpInLevel} / {needed} XP</span>
      </div>
      <div className="h-1.5 bg-nx-dark rounded-full overflow-hidden">
        <div
          className="h-full bg-nx-yellow rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
