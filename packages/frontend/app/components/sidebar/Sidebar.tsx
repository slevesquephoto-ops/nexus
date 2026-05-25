'use client'

import XpBar from '../ui/XpBar'

interface Parcours {
  id: string
  title: string
  order: number
  _count: { tracks: number }
}

interface Track {
  id: string
  title: string
  orderInParcours: number
}

interface SidebarProps {
  parcoursList: Parcours[]
  parcoursTracksCache: Record<string, Track[]>
  openParcoursId: string | null
  selectedTrackId: string | null
  onParcoursClick: (id: string) => void
  onTrackClick: (id: string, title: string) => void
  user: { xp: number; level: number } | null
}

function TrackItem({
  track,
  isActive,
  onClick,
}: {
  track: Track
  isActive: boolean
  onClick: (id: string, title: string) => void
}) {
  return (
    <button
      onClick={() => onClick(track.id, track.title)}
      className={`w-full text-left py-2.5 text-base transition-all duration-200 tracking-wide ${
        isActive
          ? 'bg-nx-surface-2 border-l-2 border-nx-yellow text-white font-semibold pl-[24px] pr-3'
          : 'text-nx-text-dim hover:text-nx-text hover:bg-nx-surface-2/60 pl-7 pr-3'
      }`}
    >
      <span className="truncate block">{track.title}</span>
    </button>
  )
}

export default function Sidebar({
  parcoursList,
  parcoursTracksCache,
  openParcoursId,
  selectedTrackId,
  onParcoursClick,
  onTrackClick,
  user,
}: SidebarProps) {
  return (
    <aside className="w-[260px] shrink-0 h-full bg-nx-surface border-r border-nx-border flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto pt-4">
        <p className="text-[11px] text-nx-text-muted tracking-[0.2em] uppercase px-3 mb-3 mt-2">Navigation</p>

        {parcoursList.length === 0 && (
          <p className="text-sm text-nx-text-dim px-3 py-2">Chargement…</p>
        )}

        {parcoursList.map(parcours => {
          const isOpen = openParcoursId === parcours.id
          const tracks = parcoursTracksCache[parcours.id] ?? []

          return (
            <div key={parcours.id} className="mb-1">
              <button
                onClick={() => onParcoursClick(parcours.id)}
                className={`w-full flex items-center gap-2 py-3 text-base font-semibold transition-all duration-200 tracking-wide ${
                  isOpen
                    ? 'bg-nx-surface-2 border-l-2 border-nx-yellow text-white pl-[10px] pr-3'
                    : 'text-nx-text-dim hover:text-nx-text hover:bg-nx-surface-2/60 px-3'
                }`}
              >
                <span className="flex-1 text-left truncate">{parcours.title}</span>
                <span className="text-xs text-nx-text-muted shrink-0">{parcours._count.tracks}</span>
              </button>

              <div className="h-px bg-nx-border mx-3 mb-1 rounded-full overflow-hidden">
                <div className="h-full bg-nx-yellow rounded-full" style={{ width: '0%' }} />
              </div>

              {isOpen && tracks.map(track => (
                <TrackItem
                  key={track.id}
                  track={track}
                  isActive={selectedTrackId === track.id}
                  onClick={onTrackClick}
                />
              ))}
            </div>
          )
        })}
      </div>

      {user && <XpBar xp={user.xp} level={user.level} />}
    </aside>
  )
}
