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
  status,
  onClick,
}: {
  track: Track
  status: 'active' | 'locked'
  onClick: (id: string, title: string) => void
}) {
  const styles = {
    active: 'text-nx-yellow',
    locked: 'text-nx-gray',
  }
  const dot = { active: '◉', locked: '○' }

  return (
    <button
      onClick={() => onClick(track.id, track.title)}
      className={`w-full text-left pl-6 pr-3 py-1.5 text-sm flex items-center gap-2 hover:bg-nx-bg/50 transition-colors ${styles[status]}`}
    >
      <span className="shrink-0 text-xs">{dot[status]}</span>
      <span className="truncate">{track.title}</span>
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
    <aside className="w-[190px] shrink-0 h-full bg-nx-surface border-r border-nx-border flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto py-2">
        {parcoursList.length === 0 && (
          <p className="text-xs text-nx-gray px-3 py-2">Chargement…</p>
        )}

        {parcoursList.map(parcours => {
          const isOpen = openParcoursId === parcours.id
          const tracks = parcoursTracksCache[parcours.id] ?? []

          return (
            <div key={parcours.id}>
              <button
                onClick={() => onParcoursClick(parcours.id)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-nx-bg/50 transition-colors"
              >
                <span className="text-nx-gray text-xs">{isOpen ? '▾' : '▸'}</span>
                <span className="flex-1 text-left font-medium truncate">{parcours.title}</span>
                <span className="text-xs text-nx-gray shrink-0">{parcours._count.tracks}</span>
              </button>

              <div className="h-px bg-nx-dark mx-3 mb-1 rounded-full overflow-hidden">
                <div className="h-full bg-nx-cyan rounded-full" style={{ width: '0%' }} />
              </div>

              {isOpen && tracks.map(track => (
                <TrackItem
                  key={track.id}
                  track={track}
                  status={selectedTrackId === track.id ? 'active' : 'locked'}
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
