'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

type Tab = 'progression' | 'challenges' | 'membres'

interface ModuleSummary { id: string; title: string; taskCount: number }
interface StudentProgress { moduleId: string; completedTasks: number; totalTasks: number; pct: number }
interface Student { id: string; username: string; xp: number; progress: StudentProgress[] }
interface ClasseDetail {
  classe: { id: string; name: string; inviteCode: string; parcours: { id: string; title: string } }
  modules: ModuleSummary[]
  students: Student[]
}
interface ChallengeStudent { userId: string; username: string; status: 'not_started' | 'passed' | 'failed'; score: number | null }
interface Challenge { id: string; title: string; moduleTitle: string; xpReward: number; students: ChallengeStudent[] }

function PctCell({ pct }: { pct: number }) {
  const color = pct === 100 ? 'bg-green-900/40 text-green-400' : pct > 0 ? 'bg-yellow-900/40 text-yellow-400' : 'bg-red-900/40 text-red-400'
  return (
    <td className="px-3 py-2.5 text-center">
      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${color}`}>{pct}%</span>
    </td>
  )
}

function StatusBadge({ status, score }: { status: ChallengeStudent['status']; score: number | null }) {
  if (status === 'passed') return <span className="text-green-400 text-xs font-medium">✓ réussi{score !== null ? ` (${score}/100)` : ''}</span>
  if (status === 'failed') return <span className="text-red-400 text-xs font-medium">✗ échoué{score !== null ? ` (${score}/100)` : ''}</span>
  return <span className="text-nx-gray text-xs">● non démarré</span>
}

export default function ClassProgressPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('progression')
  const [data, setData] = useState<ClasseDetail | null>(null)
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState(false)

  // XP modal state
  const [xpModal, setXpModal] = useState<{ userId: string; username: string } | null>(null)
  const [xpAmount, setXpAmount] = useState('')
  const [xpReason, setXpReason] = useState('')
  const [xpSubmitting, setXpSubmitting] = useState(false)
  const [xpFeedback, setXpFeedback] = useState('')
  const [xpError, setXpError] = useState('')

  // Grade modal state
  const [gradeModal, setGradeModal] = useState<{ taskId: string; taskTitle: string; userId: string; username: string } | null>(null)
  const [gradeScore, setGradeScore] = useState('100')
  const [gradePassed, setGradePassed] = useState(true)
  const [gradeSubmitting, setGradeSubmitting] = useState(false)
  const [gradeError, setGradeError] = useState('')

  // Add member state
  const [addUsername, setAddUsername] = useState('')
  const [addingUser, setAddingUser] = useState(false)
  const [addError, setAddError] = useState('')
  const [removingId, setRemovingId] = useState<string | null>(null)

  const loadData = useCallback(() => {
    Promise.all([
      fetch(`${API_URL}/api/admin/classes/${id}`, { credentials: 'include' }),
      fetch(`${API_URL}/api/admin/classes/${id}/challenges`, { credentials: 'include' }),
    ])
      .then(async ([r1, r2]) => {
        if (r1.status === 401 || r2.status === 401) { router.push('/login'); return }
        if (r1.status === 403 || r2.status === 403) { router.push('/map'); return }
        const [d1, d2] = await Promise.all([r1.ok ? r1.json() : null, r2.ok ? r2.json() : null])
        if (d1) setData(d1)
        if (d2) setChallenges(d2.challenges ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id, router])

  useEffect(() => { loadData() }, [loadData])

  function copyCode() {
    if (!data) return
    navigator.clipboard.writeText(data.classe.inviteCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 1500)
  }

  function exportCSV() {
    if (!data) return
    const { classe, modules, students } = data
    const headers = ['username', 'xp', ...modules.map(m => m.title)]
    const rows = students.map(s => [s.username, s.xp, ...s.progress.map(p => `${p.pct}%`)])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${classe.name.replace(/\s+/g, '_')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function openXpModal(userId: string, username: string) {
    setXpModal({ userId, username })
    setXpAmount('')
    setXpReason('')
    setXpFeedback('')
    setXpError('')
  }

  async function handleXpSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!xpModal) return
    const amount = parseInt(xpAmount)
    if (!amount || amount <= 0 || !xpReason.trim()) return
    setXpSubmitting(true)
    setXpError('')
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${xpModal.userId}/xp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amount, reason: xpReason.trim() }),
      })
      const body = await res.json()
      if (!res.ok) { setXpError(body.error ?? 'Erreur'); return }
      setXpFeedback(`✓ +${amount} XP attribué à ${xpModal.username}`)
      loadData()
      setTimeout(() => { setXpModal(null); setXpFeedback('') }, 1500)
    } finally {
      setXpSubmitting(false)
    }
  }

  function openGradeModal(taskId: string, taskTitle: string, userId: string, username: string) {
    setGradeModal({ taskId, taskTitle, userId, username })
    setGradeScore('100')
    setGradePassed(true)
    setGradeError('')
  }

  async function handleGradeSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!gradeModal) return
    const score = parseInt(gradeScore)
    if (isNaN(score) || score < 0 || score > 100) return
    setGradeSubmitting(true)
    setGradeError('')
    try {
      const res = await fetch(`${API_URL}/api/admin/tasks/${gradeModal.taskId}/grade`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: gradeModal.userId, score, passed: gradePassed }),
      })
      const body = await res.json()
      if (!res.ok) { setGradeError(body.error ?? 'Erreur'); return }
      setGradeModal(null)
      loadData()
    } finally {
      setGradeSubmitting(false)
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!addUsername.trim()) return
    setAddingUser(true)
    setAddError('')
    try {
      const res = await fetch(`${API_URL}/api/admin/classes/${id}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: addUsername.trim() }),
      })
      const body = await res.json()
      if (!res.ok) { setAddError(body.error ?? 'Erreur'); return }
      setAddUsername('')
      loadData()
    } finally {
      setAddingUser(false)
    }
  }

  async function handleRemove(userId: string) {
    setRemovingId(userId)
    try {
      await fetch(`${API_URL}/api/admin/classes/${id}/students/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      loadData()
    } finally {
      setRemovingId(null)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><span className="text-nx-gray text-sm">Chargement…</span></div>
  }
  if (!data) {
    return <div className="flex items-center justify-center h-64"><span className="text-red-400 text-sm">Classe introuvable.</span></div>
  }

  const { classe, modules, students } = data

  return (
    <>
      {/* XP Modal */}
      {xpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-nx-surface border border-nx-border rounded-2xl p-6 w-full max-w-sm mx-4 space-y-4">
            <h2 className="text-white font-bold">Attribuer XP — {xpModal.username}</h2>
            {xpFeedback ? (
              <p className="text-nx-cyan text-sm font-medium py-4 text-center">{xpFeedback}</p>
            ) : (
              <form onSubmit={handleXpSubmit} className="space-y-3">
                <div>
                  <label className="text-nx-gray text-xs block mb-1">Montant (XP)</label>
                  <input
                    type="number" min="1" value={xpAmount} onChange={e => setXpAmount(e.target.value)}
                    placeholder="ex. 30"
                    className="w-full bg-nx-dark border border-nx-border rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-nx-yellow/50"
                  />
                </div>
                <div>
                  <label className="text-nx-gray text-xs block mb-1">Raison</label>
                  <input
                    type="text" value={xpReason} onChange={e => setXpReason(e.target.value)}
                    placeholder="ex. Participation en classe"
                    className="w-full bg-nx-dark border border-nx-border rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-nx-yellow/50"
                  />
                </div>
                {xpError && <p className="text-red-400 text-xs">{xpError}</p>}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setXpModal(null)} className="flex-1 py-2.5 border border-nx-border text-nx-gray rounded-lg text-sm hover:text-white transition-colors">Annuler</button>
                  <button type="submit" disabled={xpSubmitting || !xpAmount || !xpReason.trim()} className="flex-1 py-2.5 bg-nx-yellow text-nx-bg font-semibold rounded-lg text-sm hover:brightness-110 disabled:opacity-50 transition-all">
                    {xpSubmitting ? '…' : 'Attribuer'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Grade Modal */}
      {gradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-nx-surface border border-nx-border rounded-2xl p-6 w-full max-w-sm mx-4 space-y-4">
            <div>
              <h2 className="text-white font-bold">Correction</h2>
              <p className="text-nx-gray text-sm mt-0.5">{gradeModal.taskTitle} · {gradeModal.username}</p>
            </div>
            <form onSubmit={handleGradeSubmit} className="space-y-3">
              <div>
                <label className="text-nx-gray text-xs block mb-1">Score / 100</label>
                <input
                  type="number" min="0" max="100" value={gradeScore} onChange={e => setGradeScore(e.target.value)}
                  className="w-full bg-nx-dark border border-nx-border rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-nx-yellow/50"
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox" checked={gradePassed} onChange={e => setGradePassed(e.target.checked)}
                  className="w-4 h-4 accent-nx-yellow"
                />
                <span className="text-white text-sm">Réussi <span className="text-nx-gray">(XP attribué)</span></span>
              </label>
              {gradeError && <p className="text-red-400 text-xs">{gradeError}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setGradeModal(null)} className="flex-1 py-2.5 border border-nx-border text-nx-gray rounded-lg text-sm hover:text-white transition-colors">Annuler</button>
                <button type="submit" disabled={gradeSubmitting} className="flex-1 py-2.5 bg-nx-yellow text-nx-bg font-semibold rounded-lg text-sm hover:brightness-110 disabled:opacity-50 transition-all">
                  {gradeSubmitting ? '…' : 'Valider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <Link href="/admin/classes" className="text-nx-gray hover:text-white text-sm transition-colors">← Classes</Link>
            <h1 className="text-white text-2xl font-bold mt-2">{classe.name}</h1>
            <p className="text-nx-gray text-sm mt-0.5">{classe.parcours.title}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-right">
              <p className="text-nx-gray text-xs">Code d&apos;invitation</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-white text-sm font-mono">{classe.inviteCode}</span>
                <button onClick={copyCode} className="px-2 py-1 bg-nx-surface border border-nx-border text-xs rounded-lg hover:border-nx-cyan/50 text-nx-gray hover:text-white transition-colors">
                  {copiedCode ? '✓' : 'Copier'}
                </button>
              </div>
            </div>
            {students.length > 0 && (
              <button onClick={exportCSV} className="px-3 py-1.5 bg-nx-surface border border-nx-border text-xs text-nx-gray hover:text-white rounded-lg hover:border-nx-yellow/50 transition-colors self-end">
                Exporter CSV
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-nx-border">
          {(['progression', 'challenges', 'membres'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-nx-yellow text-white'
                  : 'border-transparent text-nx-gray hover:text-white'
              }`}
            >
              {tab === 'progression' ? 'Progression' : tab === 'challenges' ? 'Challenges' : 'Membres'}
            </button>
          ))}
        </div>

        {/* Tab: Progression */}
        {activeTab === 'progression' && (
          students.length === 0 ? (
            <p className="text-nx-gray text-sm">Aucun élève dans cette classe.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-nx-border">
                    <th className="text-left px-3 py-2.5 text-nx-gray font-medium whitespace-nowrap">Élève</th>
                    <th className="text-center px-3 py-2.5 text-nx-gray font-medium whitespace-nowrap">XP</th>
                    {modules.map(m => (
                      <th key={m.id} className="text-center px-3 py-2.5 text-nx-gray font-medium whitespace-nowrap" title={m.title}>
                        <span className="block truncate max-w-[100px] mx-auto">{m.title}</span>
                        <span className="text-nx-border text-xs font-normal">{m.taskCount} tasks</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student.id} className="border-b border-nx-border/50 hover:bg-nx-surface/40">
                      <td className="px-3 py-2.5 text-white font-medium whitespace-nowrap">{student.username}</td>
                      <td className="px-3 py-2.5 text-center"><span className="text-nx-yellow text-xs font-semibold">{student.xp}</span></td>
                      {student.progress.map(p => <PctCell key={p.moduleId} pct={p.pct} />)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Tab: Challenges */}
        {activeTab === 'challenges' && (
          challenges.length === 0 ? (
            <p className="text-nx-gray text-sm">Aucun challenge dans ce parcours.</p>
          ) : (
            <div className="space-y-6">
              {challenges.map(challenge => (
                <div key={challenge.id} className="bg-nx-surface border border-nx-border rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-nx-border flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold text-sm">{challenge.title}</p>
                      <p className="text-nx-gray text-xs mt-0.5">{challenge.moduleTitle}</p>
                    </div>
                    <span className="text-nx-yellow text-xs font-semibold shrink-0">{challenge.xpReward} XP</span>
                  </div>
                  {challenge.students.length === 0 ? (
                    <p className="text-nx-gray text-sm px-4 py-3">Aucun élève.</p>
                  ) : (
                    <div className="divide-y divide-nx-border/50">
                      {challenge.students.map(s => (
                        <div key={s.userId} className="flex items-center justify-between px-4 py-3">
                          <div className="flex items-center gap-4">
                            <p className="text-white text-sm w-28 truncate">{s.username}</p>
                            <StatusBadge status={s.status} score={s.score} />
                          </div>
                          {(s.status === 'not_started' || s.status === 'failed') && (
                            <button
                              onClick={() => openGradeModal(challenge.id, challenge.title, s.userId, s.username)}
                              className="px-3 py-1 text-xs border border-nx-yellow/50 text-nx-yellow rounded-lg hover:bg-nx-yellow/10 transition-colors"
                            >
                              Corriger
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {/* Tab: Membres */}
        {activeTab === 'membres' && (
          <div className="space-y-4">
            <form onSubmit={handleAdd} className="flex gap-2">
              <input
                type="text" placeholder="Ajouter par nom d'utilisateur…" value={addUsername}
                onChange={e => setAddUsername(e.target.value)}
                className="flex-1 bg-nx-dark border border-nx-border rounded-lg px-4 py-2.5 text-white placeholder-nx-gray text-sm focus:outline-none focus:border-nx-yellow/50"
              />
              <button type="submit" disabled={addingUser || !addUsername.trim()} className="px-4 py-2.5 bg-nx-surface border border-nx-yellow/50 text-nx-yellow text-sm font-semibold rounded-lg hover:bg-nx-yellow/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap">
                {addingUser ? '…' : 'Ajouter'}
              </button>
            </form>
            {addError && <p className="text-red-400 text-xs">{addError}</p>}

            {students.length === 0 ? (
              <p className="text-nx-gray text-sm">Aucun élève dans cette classe.</p>
            ) : (
              <div className="bg-nx-surface border border-nx-border rounded-xl px-4 divide-y divide-nx-border/50">
                {students.map(student => (
                  <div key={student.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-white text-sm font-medium">{student.username}</p>
                      <p className="text-nx-gray text-xs mt-0.5">{student.xp} XP</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openXpModal(student.id, student.username)}
                        className="px-3 py-1 text-xs border border-nx-yellow/30 text-nx-yellow rounded-lg hover:bg-nx-yellow/10 transition-colors"
                      >
                        + XP
                      </button>
                      <button
                        onClick={() => handleRemove(student.id)}
                        disabled={removingId === student.id}
                        className="px-3 py-1 text-xs text-red-400 hover:text-red-300 border border-red-900/50 hover:border-red-400/50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {removingId === student.id ? '…' : 'Retirer'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
