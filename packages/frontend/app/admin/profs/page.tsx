'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

interface ClasseSummary {
  id: string
  name: string
  memberCount: number
  parcours: { id: string; title: string }[]
}

interface Teacher {
  id: string
  username: string
  createdAt: string
  classes: ClasseSummary[]
}

export default function ProfsPage() {
  const router = useRouter()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  function loadTeachers() {
    fetch(`${API_URL}/api/admin/teachers`, { credentials: 'include' })
      .then(r => {
        if (r.status === 401) { router.push('/login'); return null }
        if (r.status === 403) { router.push('/map'); return null }
        return r.json()
      })
      .then(d => { if (Array.isArray(d)) setTeachers(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadTeachers() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim() || !password.trim()) return
    setCreating(true)
    setCreateError('')
    try {
      const res = await fetch(`${API_URL}/api/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: username.trim(), password, role: 'TEACHER' }),
      })
      const body = await res.json()
      if (!res.ok) { setCreateError(body.error ?? 'Erreur'); return }
      setUsername('')
      setPassword('')
      setShowForm(false)
      loadTeachers()
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-nx-gray text-sm">Chargement…</span>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Professeurs</h1>
          <p className="text-nx-gray text-sm mt-1">
            {teachers.length} prof{teachers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setCreateError('') }}
          className="px-4 py-2 bg-nx-yellow text-nx-bg text-sm font-semibold rounded-lg hover:brightness-110 transition-all"
        >
          {showForm ? 'Annuler' : '+ Créer un prof'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-nx-surface border border-nx-border rounded-xl p-5 space-y-3">
          <p className="text-white text-sm font-medium">Nouveau compte professeur</p>
          <input
            type="text"
            placeholder="Nom d'utilisateur"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full bg-nx-surface-2 border border-nx-border rounded-lg px-4 py-2.5 text-nx-text placeholder:text-nx-text-muted text-sm focus:outline-none focus:border-nx-yellow/50 transition-colors"
          />
          <input
            type="text"
            placeholder="Mot de passe"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-nx-surface-2 border border-nx-border rounded-lg px-4 py-2.5 text-nx-text placeholder:text-nx-text-muted text-sm focus:outline-none focus:border-nx-yellow/50 transition-colors"
          />
          {createError && <p className="text-red-400 text-xs">{createError}</p>}
          <button
            type="submit"
            disabled={creating || !username.trim() || !password.trim()}
            className="w-full py-2.5 bg-nx-yellow text-nx-bg text-sm font-semibold rounded-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {creating ? 'Création…' : 'Créer le compte'}
          </button>
        </form>
      )}

      {teachers.length === 0 && !showForm ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-4xl">👨‍🏫</p>
          <p className="text-white font-semibold">Aucun professeur encore</p>
          <p className="text-nx-gray text-sm">Créez le premier compte professeur pour commencer.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {teachers.map(teacher => (
            <div key={teacher.id} className="bg-nx-surface border border-nx-border rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-nx-surface-2/30 transition-colors"
                onClick={() => setExpandedId(prev => prev === teacher.id ? null : teacher.id)}
              >
                <div>
                  <p className="text-white font-semibold">{teacher.username}</p>
                  <p className="text-nx-gray text-xs mt-0.5">
                    {teacher.classes.length} classe{teacher.classes.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <span className="text-nx-gray text-sm">{expandedId === teacher.id ? '▲' : '▼'}</span>
              </button>

              {expandedId === teacher.id && (
                <div className="border-t border-nx-border px-5 pb-4 pt-3">
                  {teacher.classes.length === 0 ? (
                    <p className="text-nx-gray text-sm">Aucune classe attribuée.</p>
                  ) : (
                    <div className="space-y-2">
                      {teacher.classes.map(c => (
                        <div key={c.id} className="flex items-start justify-between gap-3 py-2 border-b border-nx-border/40 last:border-0">
                          <div className="min-w-0">
                            <p className="text-white text-sm font-medium">{c.name}</p>
                            <p className="text-nx-gray text-xs mt-0.5">
                              {c.memberCount} élève{c.memberCount !== 1 ? 's' : ''}
                            </p>
                            {c.parcours.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {c.parcours.map(p => (
                                  <span
                                    key={p.id}
                                    className="px-2 py-0.5 bg-nx-dark border border-nx-border text-nx-gray text-xs rounded"
                                  >
                                    {p.title}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
