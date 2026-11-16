'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAvatarFile } from '../../lib/avatars'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

interface ProfileOverlayProps {
  user: { username: string; xp: number; level: number; avatarId?: string | null }
  onClose: () => void
  tasksCompleted?: number
  showProfileLink?: boolean
}

function xpForLevel(level: number) { return level * 200 }

export default function ProfileOverlay({ user, onClose, tasksCompleted: tasksCompletedProp, showProfileLink = true }: ProfileOverlayProps) {
  const router = useRouter()
  const [tasksCompleted, setTasksCompleted] = useState<number | null>(tasksCompletedProp ?? null)

  useEffect(() => {
    if (tasksCompletedProp !== undefined) return
    fetch(`${API_URL}/api/users/me/stats`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => setTasksCompleted(data.tasksCompleted ?? 0))
      .catch(() => {})
  }, [tasksCompletedProp])

  const needed  = xpForLevel(user.level)
  const xpInLvl = user.xp % needed
  const pct     = Math.min(100, (xpInLvl / needed) * 100)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-80 bg-nx-surface border border-nx-border rounded-2xl p-6 animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-end mb-2">
          <button
            onClick={onClose}
            className="text-nx-text-dim hover:text-white transition-colors text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col items-center mb-4">
          <img
            src={`/avatars/${getAvatarFile(user.avatarId)}`}
            alt={user.username}
            className="w-32 h-32 rounded-full object-cover object-top border-4 border-nx-yellow mb-3"
            style={{ mixBlendMode: 'screen' }}
          />
          <p className="text-white text-xl font-bold">{user.username}</p>
          <p className="text-nx-cyan text-sm mt-0.5">Niveau {user.level}</p>
        </div>

        <div className="space-y-1 mb-4">
          <div className="flex justify-between text-xs text-nx-text-dim">
            <span>Niv. {user.level}</span>
            <span>{xpInLvl} / {needed} XP</span>
          </div>
          <div className="h-2 bg-nx-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-nx-yellow rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
          <div>
            <p className="text-nx-yellow font-bold text-lg">{tasksCompleted ?? '…'}</p>
            <p className="text-nx-text-muted text-xs">Tasks ✓</p>
          </div>
          <div>
            <p className="text-nx-yellow font-bold text-lg">{user.xp}</p>
            <p className="text-nx-text-muted text-xs">XP total</p>
          </div>
          <div>
            <p className="text-nx-yellow font-bold text-lg">{user.level}</p>
            <p className="text-nx-text-muted text-xs">Niveau</p>
          </div>
        </div>

        {showProfileLink && (
          <button
            onClick={() => { router.push('/profile'); onClose() }}
            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-nx-border text-nx-text-dim hover:border-nx-yellow hover:text-nx-yellow transition-all duration-200 text-sm font-semibold"
          >
            Voir mon profil →
          </button>
        )}
      </div>
    </div>
  )
}
