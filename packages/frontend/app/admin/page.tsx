'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

interface DashboardData {
  classCount: number
  studentCount: number
  recentActivity: { id: string; username: string; amount: number; reason: string; createdAt: string }[]
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `il y a ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours}h`
  return `il y a ${Math.floor(hours / 24)}j`
}

export default function AdminDashboard() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData>({ classCount: 0, studentCount: 0, recentActivity: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/api/admin/dashboard`, { credentials: 'include' })
      .then(r => {
        if (r.status === 401) { router.push('/login'); return null }
        if (r.status === 403) { router.push('/map'); return null }
        return r.json()
      })
      .then(d => {
        if (d) setData({ ...d, recentActivity: Array.isArray(d.recentActivity) ? d.recentActivity : [] })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-nx-gray text-sm">Chargement…</span>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-white text-2xl font-bold">Tableau de bord</h1>
        <p className="text-nx-gray text-sm mt-1">Vue d&apos;ensemble de vos classes</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-nx-surface border border-nx-border rounded-xl p-5 text-center">
          <p className="text-3xl font-bold text-nx-yellow">{data.classCount}</p>
          <p className="text-xs text-nx-gray mt-1">classe{data.classCount !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-nx-surface border border-nx-border rounded-xl p-5 text-center">
          <p className="text-3xl font-bold text-nx-cyan">{data.studentCount}</p>
          <p className="text-xs text-nx-gray mt-1">élève{data.studentCount !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Link
          href="/admin/classes"
          className="px-4 py-2 bg-nx-yellow text-nx-bg text-sm font-semibold rounded-lg hover:brightness-110 transition-all"
        >
          Gérer les classes →
        </Link>
        <Link
          href="/admin/classes"
          className="px-4 py-2 bg-nx-surface border border-nx-border text-white text-sm font-semibold rounded-lg hover:border-nx-yellow/50 transition-all"
        >
          + Nouvelle classe
        </Link>
      </div>

      <section>
        <h2 className="text-white font-semibold mb-3">Activité récente</h2>
        {data.recentActivity.length === 0 ? (
          <p className="text-nx-gray text-sm">Aucune activité encore.</p>
        ) : (
          <div className="bg-nx-surface border border-nx-border rounded-xl px-4 divide-y divide-nx-border/50">
            {data.recentActivity.map(entry => (
              <div key={entry.id} className="flex items-center justify-between py-3">
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-white text-sm font-medium">{entry.username}</p>
                  <p className="text-nx-gray text-xs mt-0.5 truncate">{entry.reason}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-nx-yellow text-sm font-semibold">+{entry.amount} XP</p>
                  <p className="text-nx-gray text-xs">{relativeTime(entry.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
