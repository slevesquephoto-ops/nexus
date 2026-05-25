'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

interface Classe {
  id: string
  name: string
  inviteCode: string
  parcours: { id: string; title: string }
  memberCount: number
}

interface Parcours { id: string; title: string }

export default function ClassesPage() {
  const router = useRouter()
  const [classes, setClasses] = useState<Classe[]>([])
  const [parcoursList, setParcoursList] = useState<Parcours[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [parcoursId, setParcoursId] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/admin/classes`, { credentials: 'include' }).then(r => {
        if (r.status === 401) { router.push('/login'); return null }
        if (r.status === 403) { router.push('/map'); return null }
        return r.json()
      }),
      fetch(`${API_URL}/api/parcours`, { credentials: 'include' }).then(r => r.json()),
    ])
      .then(([classesData, parcoursData]) => {
        if (Array.isArray(classesData)) setClasses(classesData)
        if (Array.isArray(parcoursData)) setParcoursList(parcoursData)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [router])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !parcoursId) return
    setCreating(true)
    try {
      const res = await fetch(`${API_URL}/api/admin/classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim(), parcoursId }),
      })
      if (!res.ok) return
      const newClass = await res.json()
      setClasses(prev => [newClass, ...prev])
      setName('')
      setParcoursId('')
      setShowForm(false)
    } finally {
      setCreating(false)
    }
  }

  function copyCode(id: string, code: string) {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
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
          <h1 className="text-white text-2xl font-bold">Classes</h1>
          <p className="text-nx-gray text-sm mt-1">{classes.length} classe{classes.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="px-4 py-2 bg-nx-yellow text-nx-bg text-sm font-semibold rounded-lg hover:brightness-110 transition-all"
        >
          + Nouvelle classe
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-nx-surface border border-nx-border rounded-xl p-5 space-y-4">
          <h2 className="text-white font-semibold">Créer une classe</h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Nom de la classe"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-nx-surface-2 border border-nx-border rounded-lg px-4 py-2.5 text-nx-text placeholder:text-nx-text-muted text-sm focus:outline-none focus:border-nx-yellow/50 transition-colors"
            />
            <select
              value={parcoursId}
              onChange={e => setParcoursId(e.target.value)}
              className="w-full bg-nx-dark border border-nx-border rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-nx-yellow/50"
            >
              <option value="">Sélectionner un parcours…</option>
              {parcoursList.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={creating || !name.trim() || !parcoursId}
              className="px-4 py-2 bg-nx-yellow text-nx-bg text-sm font-semibold rounded-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {creating ? 'Création…' : 'Créer'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-nx-gray hover:text-white text-sm transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {classes.length === 0 && !showForm ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-4xl">🏫</p>
          <p className="text-white font-semibold">Aucune classe encore</p>
          <p className="text-nx-gray text-sm">Créez votre première classe pour commencer.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {classes.map(c => (
            <div key={c.id} className="bg-nx-surface border border-nx-border rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold">{c.name}</p>
                  <p className="text-nx-gray text-sm mt-0.5">{c.parcours.title}</p>
                  <p className="text-nx-gray text-xs mt-1">
                    {c.memberCount} élève{c.memberCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <Link
                  href={`/admin/classes/${c.id}`}
                  className="shrink-0 px-3 py-1.5 bg-nx-dark border border-nx-border text-white text-xs font-medium rounded-lg hover:border-nx-yellow/50 transition-colors"
                >
                  Progression →
                </Link>
              </div>

              <div className="mt-4 pt-4 border-t border-nx-border flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-nx-gray text-xs">Code d&apos;invitation</p>
                  <p className="text-white text-sm font-mono mt-0.5 truncate">{c.inviteCode}</p>
                </div>
                <button
                  onClick={() => copyCode(c.id, c.inviteCode)}
                  className="shrink-0 px-3 py-1.5 bg-nx-dark border border-nx-border text-xs rounded-lg transition-colors hover:border-nx-cyan/50 text-nx-gray hover:text-white"
                >
                  {copiedId === c.id ? '✓ Copié' : 'Copier'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
