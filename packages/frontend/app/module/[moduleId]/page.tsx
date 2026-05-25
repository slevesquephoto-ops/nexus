'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import TopBar from '../../components/ui/TopBar'
import ModuleView from '../../components/map/ModuleView'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

interface User {
  id: string
  username: string
  xp: number
  level: number
  avatarId?: string | null
}

export default function ModulePage() {
  const { moduleId } = useParams<{ moduleId: string }>()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/api/users/me`, { credentials: 'include' })
      .then(r => {
        if (r.status === 401) { router.push('/login'); return null }
        return r.json()
      })
      .then(data => { if (data) setUser(data.user) })
      .catch(() => router.push('/login'))
  }, [router])

  return (
    <div className="h-screen flex flex-col bg-nx-bg overflow-hidden">
      <TopBar user={user} />
      <main className="flex-1 overflow-y-auto">
        <ModuleView moduleId={moduleId} onBack={() => router.push('/map')} user={user} />
      </main>
    </div>
  )
}
