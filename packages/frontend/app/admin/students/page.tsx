'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import PasswordModal from '../components/PasswordModal'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

interface Student {
  id: string
  username: string
  role: string
  xp: number
  level: number
  createdAt: string
}

export default function StudentsPage() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function loadStudents() {
    fetch(`${API_URL}/api/admin/users`, { credentials: 'include' })
      .then(r => {
        if (r.status === 401) { router.push('/login'); return null }
        if (r.status === 403) { router.push('/map'); return null }
        return r.json()
      })
      .then(d => { if (Array.isArray(d)) setStudents(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadStudents() }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
        body: JSON.stringify({ username: username.trim(), password, role: 'STUDENT' }),
      })
      const body = await res.json()
      if (!res.ok) { setCreateError(body.error ?? 'Erreur'); return }
      setTempPassword(password)
      setUsername('')
      setPassword('')
      setShowForm(false)
      loadStudents()
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: string) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id)
      setTimeout(() => setConfirmDeleteId(prev => prev === id ? null : prev), 3000)
      return
    }
    setDeletingId(id)
    setConfirmDeleteId(null)
    try {
      await fetch(`${API_URL}/api/admin/users/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      setStudents(prev => prev.filter(s => s.id !== id))
    } finally {
      setDeletingId(null)
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
    <>
      {tempPassword && (
        <PasswordModal password={tempPassword} onClose={() => setTempPassword(null)} />
      )}

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold">Étudiants</h1>
            <p className="text-nx-gray text-sm mt-1">
              {students.length} élève{students.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => { setShowForm(v => !v); setCreateError('') }}
            className="px-4 py-2 bg-nx-yellow text-nx-bg text-sm font-semibold rounded-lg hover:brightness-110 transition-all"
          >
            {showForm ? 'Annuler' : '+ Créer un compte'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-nx-surface border border-nx-border rounded-xl p-5 space-y-3">
            <p className="text-white text-sm font-medium">Nouveau compte étudiant</p>
            <input
              type="text"
              placeholder="Nom d'utilisateur"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-nx-dark border border-nx-border rounded-lg px-4 py-2.5 text-white placeholder-nx-gray text-sm focus:outline-none focus:border-nx-yellow/50"
            />
            <input
              type="text"
              placeholder="Mot de passe temporaire"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-nx-dark border border-nx-border rounded-lg px-4 py-2.5 text-white placeholder-nx-gray text-sm focus:outline-none focus:border-nx-yellow/50"
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

        {students.length === 0 && !showForm ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-4xl">👩‍🎓</p>
            <p className="text-white font-semibold">Aucun étudiant encore</p>
            <p className="text-nx-gray text-sm">Créez votre premier compte pour commencer.</p>
          </div>
        ) : students.length > 0 ? (
          <div className="bg-nx-surface border border-nx-border rounded-xl px-4 divide-y divide-nx-border/50">
            {students.map(s => (
              <div key={s.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-white text-sm font-medium">{s.username}</p>
                  <p className="text-nx-gray text-xs mt-0.5">
                    {s.xp} XP · Niveau {s.level}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(s.id)}
                  disabled={deletingId === s.id}
                  className={`px-3 py-1 text-xs rounded-lg border transition-colors disabled:opacity-50 ${
                    confirmDeleteId === s.id
                      ? 'text-red-300 border-red-400/70 bg-red-900/20'
                      : 'text-red-400 border-red-900/50 hover:border-red-400/50 hover:text-red-300'
                  }`}
                >
                  {deletingId === s.id ? '…' : confirmDeleteId === s.id ? 'Confirmer ?' : 'Supprimer'}
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </>
  )
}
