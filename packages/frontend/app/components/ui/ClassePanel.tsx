'use client'

import { useEffect, useState } from 'react'
import { getAvatarFile } from '../../lib/avatars'
import ProfileOverlay from './ProfileOverlay'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

interface Member {
  id: string
  username: string
  xp: number
  level: number
  avatarId: string | null
  tasksCompleted: number
}

interface ClassePanelProps {
  currentUserId: string
  onClose: () => void
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-xl">🥇</span>
  if (rank === 2) return <span className="text-xl">🥈</span>
  if (rank === 3) return <span className="text-xl">🥉</span>
  return <span className="text-xs text-nx-gray font-bold w-5 text-center">#{rank}</span>
}

export default function ClassePanel({ currentUserId, onClose }: ClassePanelProps) {
  const [classe, setClasse] = useState<{ id: string; name: string } | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/api/users/class`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        setClasse(d.classe)
        setMembers(d.members ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <div
        className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="w-full max-w-md mx-4 bg-nx-surface border border-nx-border rounded-2xl overflow-hidden animate-fade-in-up"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-nx-border">
            <div>
              <h2 className="text-white font-bold text-lg">
                {loading ? '…' : (classe?.name ?? 'Ma classe')}
              </h2>
              {!loading && members.length > 0 && (
                <p className="text-nx-gray text-xs mt-0.5">
                  {members.length} élève{members.length !== 1 ? 's' : ''} · Classement XP
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-nx-text-dim hover:text-white transition-colors text-xl leading-none"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="max-h-[65vh] overflow-y-auto">
            {loading && (
              <p className="text-nx-gray text-sm text-center py-10">Chargement…</p>
            )}

            {!loading && !classe && (
              <div className="text-center py-10 space-y-2">
                <p className="text-white font-semibold">Aucune classe assignée</p>
                <p className="text-nx-gray text-sm">Rejoins une classe pour voir le leaderboard.</p>
              </div>
            )}

            {!loading && classe && members.map((member, idx) => {
              const rank = idx + 1
              const isMe = member.id === currentUserId

              return (
                <button
                  key={member.id}
                  onClick={() => setSelectedMember(member)}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 border-b border-nx-border/40 last:border-0 transition-colors hover:bg-nx-surface-2/60 text-left ${isMe ? 'bg-nx-yellow/5' : ''}`}
                >
                  {/* Rank */}
                  <div className="w-7 flex justify-center shrink-0">
                    <RankBadge rank={rank} />
                  </div>

                  {/* Avatar */}
                  <img
                    src={`/avatars/${getAvatarFile(member.avatarId)}`}
                    alt={member.username}
                    className={`w-10 h-10 rounded-full object-cover object-top border-2 shrink-0 ${isMe ? 'border-nx-yellow' : 'border-nx-border'}`}
                    style={{ mixBlendMode: 'screen' }}
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isMe ? 'text-nx-yellow' : 'text-white'}`}>
                      {member.username}
                      {isMe && <span className="text-xs font-normal ml-1.5 text-nx-yellow/60">toi</span>}
                    </p>
                    <p className="text-nx-gray text-xs mt-0.5">
                      Niv. {member.level} · {member.tasksCompleted} task{member.tasksCompleted !== 1 ? 's' : ''} ✓
                    </p>
                  </div>

                  {/* XP */}
                  <span className={`text-sm font-bold shrink-0 ${isMe ? 'text-nx-yellow' : 'text-white'}`}>
                    {member.xp} <span className="text-xs font-normal text-nx-gray">XP</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {selectedMember && (
        <ProfileOverlay
          user={selectedMember}
          tasksCompleted={selectedMember.tasksCompleted}
          showProfileLink={false}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </>
  )
}
