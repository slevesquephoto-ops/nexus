'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import TopBar from '../components/ui/TopBar'
import { getAvatarFile } from '../lib/avatars'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

interface User  { id: string; username: string; xp: number; level: number; avatarId?: string | null }
interface Stats { tasksCompleted: number; modulesCompleted: number; tracksCompleted: number; xp: number }
interface XpLog { id: string; amount: number; reason: string; createdAt: string }
interface Badge { id: string; title: string; description: string; imageUrl: string; earnedAt: string }
interface AvatarItem { id: string; name: string; file: string; isActive: boolean }

function xpForLevel(level: number) { return level * 200 }

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `il y a ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours}h`
  return `il y a ${Math.floor(hours / 24)}j`
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-nx-surface border border-nx-border rounded-xl p-4 text-center hover:border-nx-yellow/30 transition-colors duration-200">
      <p className="text-2xl font-bold text-nx-yellow">{value}</p>
      <p className="text-xs text-nx-text-dim mt-1 tracking-wide">{label}</p>
    </div>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const [user,    setUser]    = useState<User | null>(null)
  const [stats,   setStats]   = useState<Stats | null>(null)
  const [logs,    setLogs]    = useState<XpLog[]>([])
  const [badges,  setBadges]  = useState<Badge[]>([])
  const [avatars, setAvatars] = useState<AvatarItem[]>([])
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async () => {
    const opts = { credentials: 'include' as const }
    try {
      const [userData, statsData, logsData, badgesData, avatarsData] = await Promise.all([
        fetch(`${API_URL}/api/users/me`, opts).then(r => {
          if (r.status === 401) { router.push('/login'); return null }
          return r.json()
        }),
        fetch(`${API_URL}/api/users/me/stats`, opts).then(r => r.json()),
        fetch(`${API_URL}/api/users/me/xplogs`, opts).then(r => r.json()),
        fetch(`${API_URL}/api/users/me/badges`, opts).then(r => r.json()),
        fetch(`${API_URL}/api/users/me/avatars`, opts).then(r => r.json()),
      ])
      if (!userData) return
      setUser(userData.user)
      setStats(statsData)
      setLogs(Array.isArray(logsData) ? logsData : [])
      setBadges(Array.isArray(badgesData) ? badgesData : [])
      setAvatars(Array.isArray(avatarsData?.avatars) ? avatarsData.avatars : [])
    } catch {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { loadProfile() }, [loadProfile])

  async function selectAvatar(id: string) {
    await fetch(`${API_URL}/api/users/me/avatar`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatarId: id }),
    })
    await loadProfile()
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-nx-bg">
        <span className="text-nx-text-dim text-sm">Chargement…</span>
      </div>
    )
  }

  if (!user) return null

  const needed   = xpForLevel(user.level)
  const xpInLvl  = user.xp % needed
  const pct      = Math.min(100, (xpInLvl / needed) * 100)

  return (
    <div className="min-h-screen bg-nx-bg">
      <TopBar user={user} />

      <div className="max-w-lg mx-auto px-6 py-8 space-y-8">

        {/* Avatar + identité */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-28 h-28 rounded-full border-4 border-nx-yellow shadow-glow-yellow-sm overflow-hidden shrink-0">
            <img
              src={`/avatars/${getAvatarFile(user.avatarId)}`}
              alt="avatar"
              className="w-full h-full object-cover object-top rounded-full"
              style={{ mixBlendMode: 'screen' }}
            />
          </div>
          <div className="text-center">
            <p className="text-white text-xl font-bold">{user.username}</p>
            <p className="text-nx-text-dim text-sm mt-0.5">Niveau {user.level}</p>
          </div>

          {/* Grande XP bar */}
          <div className="w-full max-w-xs space-y-1.5 mt-1">
            <div className="flex justify-between text-xs text-nx-text-dim">
              <span>Niv. {user.level}</span>
              <span>{xpInLvl} / {needed} XP</span>
            </div>
            <div className="h-3 bg-nx-surface-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-nx-yellow rounded-full transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-center text-xs text-nx-text-dim">
              {needed - xpInLvl} XP avant Niv. {user.level + 1}
            </p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <section>
            <h2 className="text-white font-semibold mb-3">Statistiques</h2>
            <div className="grid grid-cols-2 gap-3">
              <StatCard value={stats.tasksCompleted}   label="tasks complétées" />
              <StatCard value={stats.modulesCompleted} label="modules complétés" />
              <StatCard value={stats.tracksCompleted}  label="tracks complétés" />
              <StatCard value={stats.xp}               label="XP total" />
            </div>
          </section>
        )}

        {/* Badges */}
        <section>
          <h2 className="text-white font-semibold mb-3">Mes badges</h2>
          {badges.length === 0 ? (
            <p className="text-nx-text-dim text-sm">Aucun badge encore.</p>
          ) : (
            <div className="space-y-2">
              {badges.map(badge => (
                <div
                  key={badge.id}
                  className="flex items-center gap-4 bg-nx-surface border border-nx-border rounded-xl p-4"
                >
                  <span className="text-3xl select-none shrink-0">{badge.imageUrl}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm">{badge.title}</p>
                    <p className="text-nx-text-dim text-xs mt-0.5">{badge.description}</p>
                    <p className="text-nx-cyan text-xs mt-1">{relativeTime(badge.earnedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Avatars */}
        <section>
          <h2 className="text-white font-semibold mb-3">Mes avatars</h2>
          <div className="grid grid-cols-3 gap-3">
            {avatars.map(avatar => (
              <button
                key={avatar.id}
                onClick={() => selectAvatar(avatar.id)}
                style={{ minHeight: '140px' }}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                  avatar.isActive
                    ? 'border-nx-cyan bg-nx-surface-2'
                    : 'border-nx-border bg-nx-surface hover:border-nx-yellow'
                }`}
              >
                <img
                  src={`/avatars/${avatar.file}`}
                  alt={avatar.name}
                  className="w-24 h-24 rounded-full object-cover object-top"
                />
                {avatar.isActive && (
                  <span className="absolute top-2 right-2.5 text-nx-cyan text-sm font-bold">✓</span>
                )}
                <span className="text-sm font-semibold text-nx-text-dim text-center leading-tight">{avatar.name}</span>
              </button>
            ))}
          </div>
          {avatars.length <= 1 && (
            <p className="text-nx-text-muted text-sm text-center mt-4">Complete modules to unlock new avatars! 🐧</p>
          )}
        </section>

        {/* Historique XP */}
        <section>
          <h2 className="text-white font-semibold mb-3">Historique XP</h2>
          {logs.length === 0 ? (
            <p className="text-nx-text-dim text-sm">Aucune activité encore.</p>
          ) : (
            <div className="bg-nx-surface border border-nx-border rounded-xl px-4 divide-y divide-nx-border/50">
              {logs.map(log => (
                <div key={log.id} className="flex items-center justify-between py-3">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-nx-text text-sm truncate">{log.reason}</p>
                    <p className="text-nx-text-dim text-xs mt-0.5">{relativeTime(log.createdAt)}</p>
                  </div>
                  <span className="text-nx-yellow text-sm font-semibold shrink-0">
                    +{log.amount} XP
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
