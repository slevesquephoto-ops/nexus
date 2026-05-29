'use client'

import { useTranslations } from 'next-intl'
import XpBar from '../ui/XpBar'

interface Parcours {
  id: string
  title: string
  order: number
  _count: { tracks: number }
  prerequisiteId?: string | null
  prerequisiteCompleted?: boolean
}

interface Track {
  id: string
  title: string
  language?: string
  orderInParcours: number
}

interface SidebarProps {
  parcoursList: Parcours[]
  parcoursLoaded: boolean
  parcoursTracksCache: Record<string, Track[]>
  openParcoursId: string | null
  selectedTrackId: string | null
  onParcoursClick: (id: string) => void
  onTrackClick: (id: string, title: string) => void
  user: { xp: number; level: number } | null
}

const LANG_BADGE: Record<string, string> = { en: 'EN', fr: 'FR' }

function TrackItem({ track, isActive, onClick }: { track: Track; isActive: boolean; onClick: (id: string, title: string) => void }) {
  return (
    <button
      onClick={() => onClick(track.id, track.title)}
      className={`w-full text-left py-2.5 text-base transition-all duration-200 tracking-wide flex items-center gap-2 pr-3 ${
        isActive
          ? 'bg-nx-surface-2 border-l-2 border-nx-yellow text-white font-semibold pl-[24px]'
          : 'text-nx-text-dim hover:text-nx-text hover:bg-nx-surface-2/60 pl-7'
      }`}
    >
      <span className="truncate flex-1">{track.title}</span>
      {track.language && LANG_BADGE[track.language] && (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-nx-surface border border-nx-border text-nx-gray shrink-0">{LANG_BADGE[track.language]}</span>
      )}
    </button>
  )
}

export default function Sidebar({
  parcoursList, parcoursLoaded, parcoursTracksCache,
  openParcoursId, selectedTrackId, onParcoursClick, onTrackClick, user,
}: SidebarProps) {
  const t = useTranslations('sidebar')
  const tMap = useTranslations('map')

  return (
    <aside className="w-[260px] shrink-0 h-full bg-nx-surface border-r border-nx-border flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto pt-4">
        <p className="text-[11px] text-nx-gray tracking-[0.2em] uppercase px-3 mb-3 mt-2">{t('navigation')}</p>

        {!parcoursLoaded && parcoursList.length === 0 && (
          <p className="text-sm text-nx-gray px-3 py-2">{t('loading')}</p>
        )}
        {parcoursLoaded && parcoursList.length === 0 && (
          <p className="text-sm text-nx-gray px-4 py-3 leading-relaxed">
            {t('noClass')}<br />
            <span className="text-xs text-nx-text-dim">{t('contactTeacher')}</span>
          </p>
        )}

        {parcoursList.map(parcours => {
          const isOpen   = openParcoursId === parcours.id
          const isLocked = parcours.prerequisiteId != null && parcours.prerequisiteCompleted === false
          const tracks   = parcoursTracksCache[parcours.id] ?? []

          return (
            <div key={parcours.id} className="mb-1">
              <button
                onClick={() => !isLocked && onParcoursClick(parcours.id)}
                disabled={isLocked}
                title={isLocked ? tMap('lockedHint') : undefined}
                className={`w-full flex items-center gap-2 py-3 text-base font-semibold transition-all duration-200 tracking-wide ${
                  isLocked
                    ? 'text-nx-text-muted px-3 opacity-50 cursor-not-allowed'
                    : isOpen
                    ? 'bg-nx-surface-2 border-l-2 border-nx-yellow text-white pl-[10px] pr-3'
                    : 'text-nx-text-dim hover:text-nx-text hover:bg-nx-surface-2/60 px-3'
                }`}
              >
                <span className="flex-1 text-left truncate">{parcours.title}</span>
                {isLocked
                  ? <span className="text-xs shrink-0">🔒</span>
                  : <span className="text-xs text-nx-text-muted shrink-0">{parcours._count.tracks}</span>
                }
              </button>

              <div className="h-px bg-nx-border mx-3 mb-1 rounded-full overflow-hidden">
                <div className="h-full bg-nx-yellow rounded-full" style={{ width: '0%' }} />
              </div>

              {isOpen && !isLocked && tracks.map(track => (
                <TrackItem key={track.id} track={track} isActive={selectedTrackId === track.id} onClick={onTrackClick} />
              ))}
            </div>
          )
        })}
      </div>

      {user && <XpBar xp={user.xp} level={user.level} />}
    </aside>
  )
}
