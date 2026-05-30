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

interface ClasseInfo {
  id: string
  name: string
  members: Member[]
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
  const [classes, setClasses]               = useState<ClasseInfo[]>([])
  const [selectedId, setSelectedId]         = useState<string | null>(null)
  const [loading, setLoading]               = useState(true)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [showJoin, setShowJoin]             = useState(false)
  const [joinCode, setJoinCode]             = useState('')
  const [joining, setJoining]               = useState(false)
  const [joinError, setJoinError]           = useState('')

  function loadClasses() {
    setLoading(true)
    fetch(`${API_URL}/api/users/class`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        const list: ClasseInfo[] = d.classes ?? []
        setClasses(list)
        if (list.length > 0 && !selectedId) setSelectedId(list[0].id)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadClasses() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!joinCode.trim() || joining) return
    setJoining(true)
    setJoinError('')
    try {
      const res = await fetch(`${API_URL}/api/admin/classes/join-by-code`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: joinCode.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setJoinError(data.error ?? 'Code invalide'); return }
      setJoinCode('')
      setShowJoin(false)
      setSelectedId(data.classe.id)
      loadClasses()
    } finally {
      setJoining(false)
    }
  }

  const currentClasse = classes.find(c => c.id === selectedId) ?? null

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
                {loading ? '…' : classes.length === 0 ? 'Classe' : (currentClasse?.name ?? 'Classe')}
              </h2>
              {!loading && currentClasse && (
                <p className="text-nx-gray text-xs mt-0.5">
                  {currentClasse.members.length} élève{currentClasse.members.length !== 1 ? 's' : ''} · Classement XP
                </p>
              )}
            </div>
            <button onClick={onClose} className="text-nx-text-dim hover:text-white transition-colors text-xl leading-none">✕</button>
          </div>

          {/* Class selector (multiple classes) */}
          {!loading && classes.length > 1 && (
            <div className="flex gap-1 px-4 pt-3 pb-0 overflow-x-auto">
              {classes.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedId === c.id
                      ? 'bg-nx-yellow text-nx-bg'
                      : 'bg-nx-surface-2 text-nx-gray hover:text-white border border-nx-border'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {/* Body */}
          <div className="max-h-[55vh] overflow-y-auto">
            {loading && (
              <p className="text-nx-gray text-sm text-center py-10">Chargement…</p>
            )}

            {!loading && classes.length === 0 && !showJoin && (
              <div className="text-center py-10 space-y-3">
                <p className="text-4xl">🏫</p>
                <p className="text-white font-semibold">Aucune classe assignée</p>
                <p className="text-nx-gray text-sm">Saisis ton code d&apos;invitation pour rejoindre une classe.</p>
                <button
                  onClick={() => setShowJoin(true)}
                  className="mt-2 px-4 py-2 bg-nx-yellow text-nx-bg text-sm font-semibold rounded-lg hover:brightness-110 transition-all"
                >
                  Rejoindre une classe
                </button>
              </div>
            )}

            {!loading && currentClasse && currentClasse.members.map((member, idx) => {
              const rank = idx + 1
              const isMe = member.id === currentUserId
              return (
                <button
                  key={member.id}
                  onClick={() => setSelectedMember(member)}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 border-b border-nx-border/40 last:border-0 transition-colors hover:bg-nx-surface-2/60 text-left ${isMe ? 'bg-nx-yellow/5' : ''}`}
                >
                  <div className="w-7 flex justify-center shrink-0">
                    <RankBadge rank={rank} />
                  </div>
                  <img
                    src={`/avatars/${getAvatarFile(member.avatarId)}`}
                    alt={member.username}
                    className={`w-10 h-10 rounded-full object-cover object-top border-2 shrink-0 ${isMe ? 'border-nx-yellow' : 'border-nx-border'}`}
                    style={{ mixBlendMode: 'screen' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isMe ? 'text-nx-yellow' : 'text-white'}`}>
                      {member.username}
                      {isMe && <span className="text-xs font-normal ml-1.5 text-nx-yellow/60">toi</span>}
                    </p>
                    <p className="text-nx-gray text-xs mt-0.5">
                      Niv. {member.level} · {member.tasksCompleted} task{member.tasksCompleted !== 1 ? 's' : ''} ✓
                    </p>
                  </div>
                  <span className={`text-sm font-bold shrink-0 ${isMe ? 'text-nx-yellow' : 'text-white'}`}>
                    {member.xp} <span className="text-xs font-normal text-nx-gray">XP</span>
                  </span>
                </button>
              )
            })}
          </div>

          {/* Footer — join */}
          <div className="border-t border-nx-border px-5 py-3">
            {showJoin ? (
              <form onSubmit={handleJoin} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Code d'invitation (ex. ABC-123)"
                    className="flex-1 bg-nx-bg border border-nx-border rounded-lg px-3 py-2 text-sm text-white placeholder-nx-gray/50 font-mono uppercase tracking-wider focus:outline-none focus:border-nx-yellow/50 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!joinCode.trim() || joining}
                    className="px-4 py-2 bg-nx-yellow text-nx-bg text-sm font-semibold rounded-lg hover:brightness-110 disabled:opacity-50 transition-all shrink-0"
                  >
                    {joining ? '…' : 'Rejoindre'}
                  </button>
                  <button type="button" onClick={() => { setShowJoin(false); setJoinCode(''); setJoinError('') }}
                    className="text-nx-gray hover:text-white text-sm transition-colors shrink-0">
                    ✕
                  </button>
                </div>
                {joinError && <p className="text-red-400 text-xs">{joinError}</p>}
              </form>
            ) : (
              <button
                onClick={() => setShowJoin(true)}
                className="text-xs text-nx-gray hover:text-nx-yellow transition-colors"
              >
                + Rejoindre une classe avec un code
              </button>
            )}
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
