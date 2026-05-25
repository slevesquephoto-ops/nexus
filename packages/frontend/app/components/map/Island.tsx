'use client'

export const ISLAND_W = 190

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
  orderNumber: number
  mascot?: string | null
}

const platformStyles = {
  done:   'bg-nx-surface border border-nx-cyan/40 shadow-[0_0_16px_rgba(0,212,200,0.12)]',
  active: 'bg-nx-surface border border-nx-yellow/40 shadow-[0_0_16px_rgba(245,192,48,0.12)]',
  locked: 'bg-nx-surface border border-nx-border',
}

const nameStyles = {
  done:   'text-nx-text text-sm font-bold',
  active: 'text-nx-text text-sm font-bold',
  locked: 'text-nx-text-muted text-sm font-bold',
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
  orderNumber,
  mascot,
}: IslandProps) {
  const clickable = status !== 'locked' && firstTaskId !== null

  return (
    <div
      ref={islandRef}
      className={`absolute flex flex-col items-center transition-transform duration-200 ${
        clickable ? 'cursor-pointer hover:scale-105' : 'cursor-default'
      }`}
      style={{
        width: ISLAND_W,
        left: `calc(${xFrac * 100}% - ${ISLAND_W / 2}px)`,
        top: yTop,
      }}
      onClick={() => { if (clickable && firstTaskId) onClick(firstTaskId) }}
    >
      {/* Ghost module number */}
      <div
        className="absolute font-extrabold select-none pointer-events-none leading-none"
        style={{
          fontSize: 160,
          opacity: status === 'locked' ? 0.04 : 0.07,
          color: status === 'done' ? '#00d4c8' : status === 'active' ? '#f5c030' : '#e8eaf0',
          top: '50%',
          transform: 'translateY(-50%)',
          ...(xFrac < 0.5
            ? { right: -60, left: 'auto' }
            : { left: -60, right: 'auto' }),
        }}
      >
        {orderNumber}
      </div>

      {status === 'active' && <div className="island-pulse-ring" />}

      {mascot ? (
        <img
          src={`/mascots/${mascot}.png`}
          alt={title}
          className={`w-28 h-28 object-contain drop-shadow-2xl select-none relative z-10 mb-1.5 ${
            status === 'locked' ? 'grayscale brightness-50 opacity-50' : ''
          }`}
          style={{ mixBlendMode: 'screen' }}
        />
      ) : (
        <div
          className={`text-5xl select-none relative z-10 leading-none mb-1.5 ${
            status === 'locked' ? 'grayscale brightness-40 opacity-50' : ''
          }`}
        >
          🐧
        </div>
      )}

      <div className={`w-full rounded-xl px-4 py-2 text-center relative z-10 ${platformStyles[status]}`}>
        <p className={`tracking-wide leading-snug ${nameStyles[status]}`}>{title}</p>
        <p className={`text-xs mt-0.5 tracking-widest ${
          status === 'done'   ? 'text-nx-cyan/60'     :
          status === 'active' ? 'text-nx-yellow/60'   :
                                'text-nx-text-dim'
        }`}>{taskCount} tasks · {xpReward} XP</p>
      </div>

      {status === 'done' && (
        <div className="text-[10px] text-nx-cyan mt-1.5 tracking-widest uppercase font-semibold">✓ Complété</div>
      )}
    </div>
  )
}
