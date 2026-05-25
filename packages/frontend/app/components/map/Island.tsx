'use client'

export const ISLAND_W = 120

interface IslandProps {
  title: string
  status: 'done' | 'active' | 'locked'
  taskCount: number
  xpReward: number
  xFrac: number
  yTop: number
  firstTaskId: string | null
  onClick: (taskId: string) => void
  islandRef: (el: HTMLDivElement | null) => void
}

const platformStyles = {
  done:   'bg-[#0a2820] border-nx-cyan shadow-[0_0_14px_rgba(0,212,200,0.3)]',
  active: 'bg-[#261c00] border-nx-yellow shadow-[0_0_18px_rgba(245,192,48,0.35)]',
  locked: 'bg-[#0c1020] border-nx-border',
}

const nameStyles = {
  done:   'text-nx-cyan',
  active: 'text-nx-yellow',
  locked: 'text-[#2a3a5a]',
}

export default function Island({
  title,
  status,
  taskCount,
  xpReward,
  xFrac,
  yTop,
  firstTaskId,
  onClick,
  islandRef,
}: IslandProps) {
  const clickable = status !== 'locked' && firstTaskId !== null

  return (
    <div
      ref={islandRef}
      className={`absolute flex flex-col items-center transition-transform ${
        clickable ? 'cursor-pointer hover:scale-105' : 'cursor-default'
      }`}
      style={{
        width: ISLAND_W,
        left: `calc(${xFrac * 100}% - ${ISLAND_W / 2}px)`,
        top: yTop,
      }}
      onClick={() => { if (clickable && firstTaskId) onClick(firstTaskId) }}
    >
      {status === 'active' && <div className="island-pulse-ring" />}

      <div
        className={`text-4xl select-none relative z-10 leading-none mb-1 ${
          status === 'locked' ? 'grayscale brightness-50' : ''
        }`}
      >
        🐧
      </div>

      <div className={`w-full rounded-xl px-3 py-2 text-center border relative z-10 ${platformStyles[status]}`}>
        <p className={`text-xs font-semibold truncate ${nameStyles[status]}`}>{title}</p>
        <p className="text-[10px] text-nx-gray mt-0.5">{taskCount} tasks · {xpReward} XP</p>
      </div>

      {status === 'done' && (
        <div className="text-[10px] text-nx-cyan mt-1">✓ Complété</div>
      )}
    </div>
  )
}
