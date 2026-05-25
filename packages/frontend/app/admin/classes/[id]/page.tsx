'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

interface ModuleSummary { id: string; title: string; taskCount: number }
interface StudentProgress { moduleId: string; completedTasks: number; totalTasks: number; pct: number }
interface Student { id: string; username: string; xp: number; progress: StudentProgress[] }
interface ClasseDetail {
  classe: { id: string; name: string; inviteCode: string; parcours: { id: string; title: string } }
  modules: ModuleSummary[]
  students: Student[]
}

function PctCell({ pct }: { pct: number }) {
  const color =
    pct === 100 ? 'bg-green-900/40 text-green-400' :
    pct > 0     ? 'bg-yellow-900/40 text-yellow-400' :
                  'bg-red-900/40 text-red-400'
  return (
    <td className="px-3 py-2.5 text-center">
      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${color}`}>
        {pct}%
      </span>
    </td>
  )
}

export default function ClassProgressPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<ClasseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch(`${API_URL}/api/admin/classes/${id}`, { credentials: 'include' })
      .then(r => {
        if (r.status === 401) { router.push('/login'); return null }
        if (r.status === 403) { router.push('/map'); return null }
        if (!r.ok) return null
        return r.json()
      })
      .then(d => { if (d) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id, router])

  function copyCode() {
    if (!data) return
    navigator.clipboard.writeText(data.classe.inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-nx-gray text-sm">Chargement…</span>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-red-400 text-sm">Classe introuvable.</span>
      </div>
    )
  }

  const { classe, modules, students } = data

  return (
    <div className="px-6 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/admin/classes" className="text-nx-gray hover:text-white text-sm transition-colors">
            ← Classes
          </Link>
          <h1 className="text-white text-2xl font-bold mt-2">{classe.name}</h1>
          <p className="text-nx-gray text-sm mt-0.5">{classe.parcours.title}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-nx-gray text-xs">Code d&apos;invitation</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-white text-sm font-mono">{classe.inviteCode}</span>
            <button
              onClick={copyCode}
              className="px-2 py-1 bg-nx-surface border border-nx-border text-xs rounded-lg hover:border-nx-cyan/50 text-nx-gray hover:text-white transition-colors"
            >
              {copied ? '✓' : 'Copier'}
            </button>
          </div>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-4xl">👩‍🎓</p>
          <p className="text-white font-semibold">Aucun élève dans cette classe</p>
          <p className="text-nx-gray text-sm">Partagez le code d&apos;invitation pour que les élèves rejoignent.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-nx-border">
                <th className="text-left px-3 py-2.5 text-nx-gray font-medium whitespace-nowrap">Élève</th>
                <th className="text-center px-3 py-2.5 text-nx-gray font-medium whitespace-nowrap">XP</th>
                {modules.map(m => (
                  <th
                    key={m.id}
                    className="text-center px-3 py-2.5 text-nx-gray font-medium whitespace-nowrap max-w-[120px]"
                    title={m.title}
                  >
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
                  <td className="px-3 py-2.5 text-center">
                    <span className="text-nx-yellow text-xs font-semibold">{student.xp}</span>
                  </td>
                  {student.progress.map(p => (
                    <PctCell key={p.moduleId} pct={p.pct} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
