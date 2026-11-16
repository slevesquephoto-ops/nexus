'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

interface TrackItem { id: string; title: string; language?: string }

interface ParcoursItem {
  id: string
  title: string
  restrictedTracks: TrackItem[] | null  // null = no restriction (all tracks visible)
}

interface Classe {
  id: string
  name: string
  inviteCode: string
  parcours: ParcoursItem[]
  memberCount: number
}

interface AvailableParcours { id: string; title: string }

interface TrackManagerState {
  classeId: string
  parcoursId: string
  allTracks: TrackItem[]
  loading: boolean
}

export default function ClassesPage() {
  const router = useRouter()
  const [classes, setClasses] = useState<Classe[]>([])
  const [parcoursList, setParcoursList] = useState<AvailableParcours[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [parcoursId, setParcoursId] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [addParcoursClassId, setAddParcoursClassId] = useState<string | null>(null)
  const [addParcoursId, setAddParcoursId] = useState('')
  const [addingParcours, setAddingParcours] = useState(false)
  const [trackManager, setTrackManager] = useState<TrackManagerState | null>(null)
  const [togglingTrack, setTogglingTrack] = useState<string | null>(null)
  const [addMemberClassId, setAddMemberClassId] = useState<string | null>(null)
  const [addMemberUsername, setAddMemberUsername] = useState('')
  const [addingMember, setAddingMember] = useState(false)
  const [addMemberError, setAddMemberError] = useState('')

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
    if (!name.trim()) return
    setCreating(true)
    try {
      const res = await fetch(`${API_URL}/api/admin/classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim(), ...(parcoursId ? { parcoursId } : {}) }),
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

  async function handleDeleteClass(id: string) {
    const res = await fetch(`${API_URL}/api/admin/classes/${id}`, { method: 'DELETE', credentials: 'include' })
    if (!res.ok) return
    setClasses(prev => prev.filter(c => c.id !== id))
    setConfirmDeleteId(null)
  }

  async function handleAddParcours(classeId: string) {
    if (!addParcoursId) return
    setAddingParcours(true)
    try {
      const res = await fetch(`${API_URL}/api/admin/classes/${classeId}/parcours`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ parcoursId: addParcoursId }),
      })
      if (!res.ok) return
      const body = await res.json()
      setClasses(prev => prev.map(c =>
        c.id === classeId
          ? { ...c, parcours: [...c.parcours, { id: body.parcours.id, title: body.parcours.title, restrictedTracks: null }] }
          : c
      ))
      setAddParcoursClassId(null)
      setAddParcoursId('')
    } finally {
      setAddingParcours(false)
    }
  }

  async function handleRemoveParcours(classeId: string, pid: string) {
    const res = await fetch(`${API_URL}/api/admin/classes/${classeId}/parcours/${pid}`, { method: 'DELETE', credentials: 'include' })
    if (!res.ok) return
    setClasses(prev => prev.map(c =>
      c.id === classeId ? { ...c, parcours: c.parcours.filter(p => p.id !== pid) } : c
    ))
    if (trackManager?.classeId === classeId && trackManager.parcoursId === pid) {
      setTrackManager(null)
    }
  }

  async function openTrackManager(classeId: string, parcoursId: string) {
    if (trackManager?.classeId === classeId && trackManager.parcoursId === parcoursId) {
      setTrackManager(null)
      return
    }
    setTrackManager({ classeId, parcoursId, allTracks: [], loading: true })
    const data = await fetch(`${API_URL}/api/parcours/${parcoursId}`, { credentials: 'include' })
      .then(r => r.json()).catch(() => null)
    const allTracks: TrackItem[] = (data?.tracks ?? []).map((t: TrackItem) => ({ id: t.id, title: t.title, language: t.language }))
    setTrackManager({ classeId, parcoursId, allTracks, loading: false })
  }

  async function toggleTrack(classeId: string, parcoursId: string, trackId: string, currentlyAllowed: boolean) {
    setTogglingTrack(trackId)
    const allTracks = trackManager?.allTracks ?? []

    // Compute new allowed set
    const currentAllowed = classes
      .find(c => c.id === classeId)?.parcours
      .find(p => p.id === parcoursId)?.restrictedTracks
      ?? allTracks  // null = all allowed

    const newAllowed = currentlyAllowed
      ? currentAllowed.filter(t => t.id !== trackId)
      : [...currentAllowed.filter(t => t.id !== trackId), { id: trackId, title: allTracks.find(t => t.id === trackId)?.title ?? '' }]

    const trackIds = newAllowed.map(t => t.id)

    try {
      const res = await fetch(`${API_URL}/api/admin/classes/${classeId}/parcours/${parcoursId}/tracks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ trackIds }),
      })
      if (!res.ok) return

      // null = no restriction (all tracks allowed)
      const next: TrackItem[] | null = newAllowed.length === 0 || newAllowed.length === allTracks.length ? null : newAllowed

      setClasses(prev => prev.map(c => {
        if (c.id !== classeId) return c
        return {
          ...c,
          parcours: c.parcours.map(p =>
            p.id !== parcoursId ? p : { ...p, restrictedTracks: next }
          ),
        }
      }))
    } finally {
      setTogglingTrack(null)
    }
  }

  async function handleAddMember(classeId: string) {
    if (!addMemberUsername.trim() || addingMember) return
    setAddingMember(true)
    setAddMemberError('')
    try {
      const res = await fetch(`${API_URL}/api/admin/classes/${classeId}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: addMemberUsername.trim() }),
      })
      const body = await res.json()
      if (!res.ok) { setAddMemberError(body.error ?? 'Erreur'); return }
      setClasses(prev => prev.map(c => c.id === classeId ? { ...c, memberCount: c.memberCount + 1 } : c))
      setAddMemberUsername('')
      setAddMemberClassId(null)
    } finally {
      setAddingMember(false)
    }
  }

  function copyCode(id: string, code: string) {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><span className="text-nx-gray text-sm">Chargement…</span></div>
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Classes</h1>
          <p className="text-nx-gray text-sm mt-1">{classes.length} classe{classes.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="px-4 py-2 bg-nx-yellow text-nx-bg text-sm font-semibold rounded-lg hover:brightness-110 transition-all">
          + Nouvelle classe
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-nx-surface border border-nx-border rounded-xl p-5 space-y-4">
          <h2 className="text-white font-semibold">Créer une classe</h2>
          <div className="space-y-3">
            <input
              type="text" placeholder="Nom de la classe" value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-nx-surface-2 border border-nx-border rounded-lg px-4 py-2.5 text-nx-text placeholder:text-nx-text-muted text-sm focus:outline-none focus:border-nx-yellow/50 transition-colors"
            />
            <select value={parcoursId} onChange={e => setParcoursId(e.target.value)}
              className="w-full bg-nx-dark border border-nx-border rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-nx-yellow/50">
              <option value="">Sélectionner un parcours (optionnel)…</option>
              {parcoursList.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={creating || !name.trim()}
              className="px-4 py-2 bg-nx-yellow text-nx-bg text-sm font-semibold rounded-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              {creating ? 'Création…' : 'Créer'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-nx-gray hover:text-white text-sm transition-colors">Annuler</button>
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
          {classes.map(c => {
            const availableParcours = parcoursList.filter(p => !c.parcours.some(cp => cp.id === p.id))
            const isAddingToThis = addParcoursClassId === c.id

            return (
              <div key={c.id} className="bg-nx-surface border border-nx-border rounded-xl p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold">{c.name}</p>
                    <p className="text-nx-gray text-xs mt-1">{c.memberCount} élève{c.memberCount !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/admin/classes/${c.id}`}
                      className="px-3 py-1.5 bg-nx-dark border border-nx-border text-white text-xs font-medium rounded-lg hover:border-nx-yellow/50 transition-colors">
                      Progression →
                    </Link>
                    {confirmDeleteId === c.id ? (
                      <button onClick={() => handleDeleteClass(c.id)}
                        className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-500 transition-colors">
                        Confirmer
                      </button>
                    ) : (
                      <button onClick={() => setConfirmDeleteId(c.id)}
                        className="px-3 py-1.5 bg-nx-dark border border-nx-border text-nx-gray text-xs rounded-lg hover:border-red-500/50 hover:text-red-400 transition-colors">
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>

                {/* Parcours + tracks */}
                <div className="space-y-2">
                  <p className="text-nx-gray text-xs font-medium tracking-wide uppercase">Parcours assignés</p>

                  {c.parcours.length === 0 ? (
                    <p className="text-nx-text-muted text-xs">Aucun parcours assigné.</p>
                  ) : (
                    <div className="space-y-2">
                      {c.parcours.map(p => {
                        const isManaging = trackManager?.classeId === c.id && trackManager.parcoursId === p.id
                        const hasRestrictions = p.restrictedTracks !== null

                        return (
                          <div key={p.id} className="border border-nx-border/60 rounded-lg overflow-hidden">
                            {/* Parcours row */}
                            <div className="flex items-center gap-2 px-3 py-2 bg-nx-dark/40">
                              <span className="text-white text-sm flex-1 truncate">{p.title}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${hasRestrictions ? 'bg-nx-yellow/10 text-nx-yellow border border-nx-yellow/30' : 'bg-nx-surface text-nx-gray border border-nx-border'}`}>
                                {hasRestrictions ? `${p.restrictedTracks!.length} track${p.restrictedTracks!.length !== 1 ? 's' : ''}` : 'Tous les tracks'}
                              </span>
                              <button
                                onClick={() => openTrackManager(c.id, p.id)}
                                className={`text-xs px-2 py-0.5 rounded border transition-colors shrink-0 ${isManaging ? 'border-nx-yellow/50 text-nx-yellow' : 'border-nx-border text-nx-gray hover:border-nx-yellow/40 hover:text-nx-yellow'}`}
                              >
                                {isManaging ? 'Fermer' : 'Gérer'}
                              </button>
                              <button onClick={() => handleRemoveParcours(c.id, p.id)}
                                className="text-nx-gray hover:text-red-400 transition-colors text-sm leading-none shrink-0" title="Retirer ce parcours">
                                ×
                              </button>
                            </div>

                            {/* Track manager */}
                            {isManaging && (
                              <div className="px-3 py-3 border-t border-nx-border/40 bg-nx-surface/30 space-y-2">
                                {trackManager.loading ? (
                                  <p className="text-nx-gray text-xs">Chargement des tracks…</p>
                                ) : trackManager.allTracks.length === 0 ? (
                                  <p className="text-nx-gray text-xs">Aucun track dans ce parcours.</p>
                                ) : (
                                  <>
                                    <p className="text-nx-gray text-xs mb-2">
                                      Coche les tracks visibles pour cette classe. Si tous cochés → pas de restriction.
                                    </p>
                                    <div className="space-y-1.5">
                                      {trackManager.allTracks.map(track => {
                                        const isAllowed = p.restrictedTracks === null || p.restrictedTracks.some(t => t.id === track.id)
                                        const isToggling = togglingTrack === track.id
                                        return (
                                          <label key={track.id} className={`flex items-center gap-3 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${isAllowed ? 'bg-nx-yellow/5' : 'hover:bg-nx-surface-2/40'}`}>
                                            <input
                                              type="checkbox"
                                              checked={isAllowed}
                                              disabled={isToggling}
                                              onChange={() => toggleTrack(c.id, p.id, track.id, isAllowed)}
                                              className="w-4 h-4 accent-nx-yellow shrink-0"
                                            />
                                            <span className={`text-sm flex-1 ${isAllowed ? 'text-white' : 'text-nx-gray'}`}>{track.title}</span>
                                            {track.language && (
                                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-nx-surface border border-nx-border text-nx-gray shrink-0">{track.language.toUpperCase()}</span>
                                            )}
                                            {isToggling && <span className="text-nx-gray text-xs">…</span>}
                                          </label>
                                        )
                                      })}
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Add parcours */}
                  {isAddingToThis ? (
                    <div className="flex gap-2 items-center">
                      <select value={addParcoursId} onChange={e => setAddParcoursId(e.target.value)}
                        className="flex-1 bg-nx-dark border border-nx-border rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-nx-yellow/50">
                        <option value="">Choisir un parcours…</option>
                        {availableParcours.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                      </select>
                      <button onClick={() => handleAddParcours(c.id)} disabled={!addParcoursId || addingParcours}
                        className="px-3 py-1.5 bg-nx-yellow text-nx-bg text-xs font-semibold rounded-lg hover:brightness-110 disabled:opacity-50 transition-all">
                        {addingParcours ? '…' : 'Ajouter'}
                      </button>
                      <button onClick={() => { setAddParcoursClassId(null); setAddParcoursId('') }} className="text-nx-gray hover:text-white text-xs transition-colors">Annuler</button>
                    </div>
                  ) : availableParcours.length > 0 ? (
                    <button onClick={() => { setAddParcoursClassId(c.id); setAddParcoursId('') }}
                      className="text-xs text-nx-yellow/80 hover:text-nx-yellow transition-colors">
                      + Ajouter un parcours
                    </button>
                  ) : null}
                </div>

                {/* Add member */}
                <div className="pt-3 border-t border-nx-border">
                  {addMemberClassId === c.id ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={addMemberUsername}
                          onChange={e => setAddMemberUsername(e.target.value)}
                          placeholder="Nom d'utilisateur…"
                          onKeyDown={e => e.key === 'Enter' && handleAddMember(c.id)}
                          className="flex-1 bg-nx-bg border border-nx-border rounded-lg px-3 py-1.5 text-sm text-white placeholder-nx-gray/50 focus:outline-none focus:border-nx-yellow/50 transition-colors"
                        />
                        <button
                          onClick={() => handleAddMember(c.id)}
                          disabled={!addMemberUsername.trim() || addingMember}
                          className="px-3 py-1.5 bg-nx-yellow text-nx-bg text-xs font-semibold rounded-lg hover:brightness-110 disabled:opacity-50 transition-all shrink-0"
                        >
                          {addingMember ? '…' : 'Ajouter'}
                        </button>
                        <button onClick={() => { setAddMemberClassId(null); setAddMemberUsername(''); setAddMemberError('') }}
                          className="text-nx-gray hover:text-white text-sm transition-colors shrink-0">
                          ✕
                        </button>
                      </div>
                      {addMemberError && <p className="text-red-400 text-xs">{addMemberError}</p>}
                    </div>
                  ) : (
                    <button
                      onClick={() => { setAddMemberClassId(c.id); setAddMemberUsername(''); setAddMemberError('') }}
                      className="text-xs text-nx-gray hover:text-nx-yellow transition-colors"
                    >
                      + Ajouter un élève
                    </button>
                  )}
                </div>

                {/* Invite code */}
                <div className="pt-3 border-t border-nx-border flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-nx-gray text-xs">Code d&apos;invitation</p>
                    <p className="text-white text-sm font-mono mt-0.5 truncate">{c.inviteCode}</p>
                  </div>
                  <button onClick={() => copyCode(c.id, c.inviteCode)}
                    className="shrink-0 px-3 py-1.5 bg-nx-dark border border-nx-border text-xs rounded-lg transition-colors hover:border-nx-cyan/50 text-nx-gray hover:text-white">
                    {copiedId === c.id ? '✓ Copié' : 'Copier'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
