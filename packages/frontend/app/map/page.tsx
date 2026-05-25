'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import TopBar from '../components/ui/TopBar'
import Sidebar from '../components/sidebar/Sidebar'
import IslandMap from '../components/map/IslandMap'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

interface User { id: string; username: string; xp: number; level: number; avatarId?: string | null }
interface Parcours { id: string; title: string; order: number; _count: { tracks: number } }
interface Track { id: string; title: string; orderInParcours: number }
interface Module {
  id: string
  title: string
  description: string | null
  order: number
  xpReward: number
  _count: { tasks: number }
  tasks: { id: string }[]
}

export default function MapPage() {
  const router = useRouter()
  const [user, setUser]                             = useState<User | null>(null)
  const [parcoursList, setParcoursList]             = useState<Parcours[]>([])
  const [parcoursTracksCache, setParcoursTracksCache] = useState<Record<string, Track[]>>({})
  const [openParcoursId, setOpenParcoursId]         = useState<string | null>(null)
  const [selectedTrackId, setSelectedTrackId]       = useState<string | null>(null)
  const [selectedTrackTitle, setSelectedTrackTitle] = useState('')
  const [modules, setModules]                       = useState<Module[]>([])

  // Auth check + load user
  useEffect(() => {
    fetch(`${API_URL}/api/users/me`, { credentials: 'include' })
      .then(r => {
        if (r.status === 401) { router.push('/login'); return null }
        return r.json()
      })
      .then(data => { if (data) setUser(data.user) })
      .catch(() => router.push('/login'))
  }, [router])

  // Load parcours list, auto-open first
  useEffect(() => {
    fetch(`${API_URL}/api/parcours`, { credentials: 'include' })
      .then(r => r.json())
      .then((list: Parcours[]) => {
        setParcoursList(list)
        if (list.length > 0) setOpenParcoursId(list[0].id)
      })
      .catch(() => {})
  }, [])

  // Load tracks for an opened parcours (once, cached)
  useEffect(() => {
    if (!openParcoursId || parcoursTracksCache[openParcoursId]) return

    fetch(`${API_URL}/api/parcours/${openParcoursId}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        const tracks: Track[] = data.tracks ?? []
        setParcoursTracksCache(prev => ({ ...prev, [openParcoursId]: tracks }))
        // Auto-select first track on first load
        if (tracks.length > 0 && !selectedTrackId) {
          setSelectedTrackId(tracks[0].id)
          setSelectedTrackTitle(tracks[0].title)
        }
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openParcoursId])

  // Load modules for selected track — wait for user so we can pass userId for real statuses
  useEffect(() => {
    if (!selectedTrackId || !user?.id) return

    fetch(`${API_URL}/api/tracks/${selectedTrackId}?userId=${user.id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => setModules(data.modules ?? []))
      .catch(() => {})
  }, [selectedTrackId, user?.id])

  function handleParcoursClick(id: string) {
    setOpenParcoursId(prev => (prev === id ? null : id))
  }

  function handleTrackClick(id: string, title: string) {
    setSelectedTrackId(id)
    setSelectedTrackTitle(title)
  }

  return (
    <div className="h-screen flex flex-col bg-nx-bg overflow-hidden">
      <TopBar user={user} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          parcoursList={parcoursList}
          parcoursTracksCache={parcoursTracksCache}
          openParcoursId={openParcoursId}
          selectedTrackId={selectedTrackId}
          onParcoursClick={handleParcoursClick}
          onTrackClick={handleTrackClick}
          user={user}
        />

        <main className="flex-1 overflow-y-auto" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(245,192,48,0.05) 0%, transparent 60%), #080b14' }}>
          {selectedTrackId ? (
            <IslandMap modules={modules} trackTitle={selectedTrackTitle} />
          ) : (
            <div className="flex items-center justify-center h-full text-nx-gray text-sm">
              Sélectionne un track pour commencer
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
