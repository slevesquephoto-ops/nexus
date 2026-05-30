'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import TopBar from '../components/ui/TopBar'
import Sidebar from '../components/sidebar/Sidebar'
import IslandMap from '../components/map/IslandMap'
import ModuleView from '../components/map/ModuleView'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

interface User { id: string; username: string; xp: number; level: number; avatarId?: string | null; role: string }
interface Parcours { id: string; title: string; order: number; _count: { tracks: number }; prerequisiteId?: string | null; prerequisiteCompleted?: boolean }
interface Track { id: string; title: string; language?: string; orderInParcours: number; completed?: boolean }
interface Module {
  id: string
  title: string
  description: string | null
  order: number
  xpReward: number
  totalXp?: number
  _count: { tasks: number }
  tasks: { id: string }[]
}
interface CurrentPos { parcoursId: string; trackId: string; moduleId: string }

export default function MapPage() {
  const router = useRouter()
  const [user, setUser]                               = useState<User | null>(null)
  const [currentPos, setCurrentPos]                   = useState<CurrentPos | null>(null)
  const [positionReady, setPositionReady]             = useState(false)
  const [parcoursList, setParcoursList]               = useState<Parcours[]>([])
  const [parcoursLoaded, setParcoursLoaded]           = useState(false)
  const [parcoursTracksCache, setParcoursTracksCache] = useState<Record<string, Track[]>>({})
  const [openParcoursId, setOpenParcoursId]           = useState<string | null>(null)
  const [selectedTrackId, setSelectedTrackId]         = useState<string | null>(null)
  const [selectedTrackTitle, setSelectedTrackTitle]   = useState('')
  const [modules, setModules]                         = useState<Module[]>([])
  const [activeModuleId, setActiveModuleId]           = useState<string | null>(null)
  const [moduleRefreshKey, setModuleRefreshKey]       = useState(0)

  // Auth check + user + current position (parallel) — set positionReady when both are done
  useEffect(() => {
    const opts = { credentials: 'include' as const }
    Promise.all([
      fetch(`${API_URL}/api/users/me`, opts).then(r => {
        if (r.status === 401) { router.push('/login'); return null }
        return r.json()
      }),
      fetch(`${API_URL}/api/users/me/current-position`, opts).then(r => r.json()).catch(() => null),
    ]).then(([userData, posData]) => {
      if (!userData) return
      setUser(userData.user)
      setCurrentPos(posData ?? null)
      setPositionReady(true)
    }).catch(() => router.push('/login'))
  }, [router])

  // Load parcours list — waits for positionReady so currentPos is guaranteed to be set
  useEffect(() => {
    if (!positionReady) return
    fetch(`${API_URL}/api/parcours`, { credentials: 'include' })
      .then(r => r.json())
      .then((list: Parcours[]) => {
        setParcoursList(list)
        setParcoursLoaded(true)
        if (list.length > 0) {
          const targetId = list.find(p => p.id === currentPos?.parcoursId)?.id ?? list[0].id
          setOpenParcoursId(targetId)
        }
      })
      .catch(() => { setParcoursLoaded(true) })
  // currentPos is read inside the callback — captured correctly when positionReady becomes true
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positionReady])

  // Load tracks for an opened parcours (once, cached)
  useEffect(() => {
    if (!openParcoursId || parcoursTracksCache[openParcoursId]) return

    fetch(`${API_URL}/api/parcours/${openParcoursId}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        const tracks: Track[] = data.tracks ?? []
        setParcoursTracksCache(prev => ({ ...prev, [openParcoursId]: tracks }))
        if (tracks.length > 0 && !selectedTrackId) {
          const target = tracks.find(t => t.id === currentPos?.trackId) ?? tracks[0]
          setSelectedTrackId(target.id)
          setSelectedTrackTitle(target.title)
        }
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openParcoursId])

  // Load modules for selected track
  useEffect(() => {
    if (!selectedTrackId || !user?.id) return

    fetch(`${API_URL}/api/tracks/${selectedTrackId}?userId=${user.id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => setModules(data.modules ?? []))
      .catch(() => {})
  }, [selectedTrackId, user?.id, moduleRefreshKey])

  function handleParcoursClick(id: string) {
    setOpenParcoursId(prev => (prev === id ? null : id))
  }

  function handleTrackClick(id: string, title: string) {
    setSelectedTrackId(id)
    setSelectedTrackTitle(title)
    setActiveModuleId(null)
  }

  function handleBack() {
    setActiveModuleId(null)
    setModuleRefreshKey(k => k + 1)
  }

  const isStaff = user?.role === 'TEACHER' || user?.role === 'ADMIN'

  const lockedParcours = selectedTrackId
    ? parcoursList.find(p => parcoursTracksCache[p.id]?.some(t => t.id === selectedTrackId))
    : null
  const isSelectedLocked = !isStaff && lockedParcours?.prerequisiteId != null && lockedParcours?.prerequisiteCompleted === false
  const prereqParcours = lockedParcours?.prerequisiteId
    ? parcoursList.find(p => p.id === lockedParcours.prerequisiteId)
    : null

  return (
    <div className="h-screen flex flex-col bg-nx-bg overflow-hidden">
      <TopBar user={user} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          parcoursList={parcoursList}
          parcoursLoaded={parcoursLoaded}
          parcoursTracksCache={parcoursTracksCache}
          openParcoursId={openParcoursId}
          selectedTrackId={selectedTrackId}
          onParcoursClick={handleParcoursClick}
          onTrackClick={handleTrackClick}
          user={user}
        />

        <main className="flex-1 overflow-y-auto" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(245,192,48,0.05) 0%, transparent 60%), #080b14' }}>
          {activeModuleId ? (
            <ModuleView
              moduleId={activeModuleId}
              onBack={handleBack}
              user={user}
              isStaff={isStaff}
            />
          ) : isSelectedLocked ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
              <span className="text-4xl">🔒</span>
              <p className="text-nx-text font-semibold text-lg">Parcours verrouillé</p>
              <p className="text-nx-text-dim text-sm max-w-sm">
                Complète <span className="text-nx-yellow font-semibold">{prereqParcours?.title ?? 'le parcours prérequis'}</span> pour déverrouiller ce contenu.
              </p>
              {prereqParcours && (
                <button
                  onClick={() => {
                    const prereqTracks = parcoursTracksCache[prereqParcours.id]
                    setOpenParcoursId(prereqParcours.id)
                    if (prereqTracks?.[0]) {
                      handleTrackClick(prereqTracks[0].id, prereqTracks[0].title)
                    }
                  }}
                  className="px-4 py-2 border border-nx-yellow/40 text-nx-yellow text-sm rounded-xl hover:bg-nx-yellow/10 transition-colors"
                >
                  Aller à {prereqParcours.title} →
                </button>
              )}
            </div>
          ) : selectedTrackId ? (
            <IslandMap
              modules={modules}
              trackTitle={selectedTrackTitle}
              onSelectModule={setActiveModuleId}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-nx-text-dim text-sm">
              Sélectionne un track pour commencer
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
