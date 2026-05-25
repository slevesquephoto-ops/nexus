'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import TheorySection from '../../components/task/TheorySection'
import CodeBlock from '../../components/task/CodeBlock'
import CommandTable from '../../components/task/CommandTable'
import QuestionsSection from '../../components/task/QuestionsSection'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

type Section =
  | { type: 'theory'; content: string }
  | { type: 'code_block'; label?: string; content: string }
  | { type: 'command_table'; commands: { cmd: string; desc: string }[] }
  | { type: 'questions'; items: Question[] }

type Question =
  | { id: string; type: 'qcm'; question: string; answers: { text: string; correct: boolean }[] }
  | { id: string; type: 'short_answer'; question: string; answer: string }

interface Task {
  id: string
  moduleId: string
  type: 'TASK' | 'CHALLENGE'
  title: string
  order: number
  xpReward: number
  content: Section[] | null
}

interface CompletionResult {
  xpGained: number
  nextTaskId: string | null
}

export default function TaskPage() {
  const { taskId } = useParams<{ taskId: string }>()
  const router = useRouter()

  const [task, setTask]               = useState<Task | null>(null)
  const [loading, setLoading]         = useState(true)
  const [answers, setAnswers]         = useState<Record<string, string>>({})
  const [submitted, setSubmitted]     = useState<Record<string, boolean>>({})
  const [completing, setCompleting]   = useState(false)
  const [result, setResult]           = useState<CompletionResult | null>(null)

  useEffect(() => {
    setLoading(true)
    setAnswers({})
    setSubmitted({})
    setResult(null)

    fetch(`${API_URL}/api/tasks/${taskId}`, { credentials: 'include' })
      .then(r => {
        if (r.status === 401) { router.push('/login'); return null }
        if (!r.ok) return null
        return r.json()
      })
      .then(data => { if (data) setTask(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [taskId, router])

  const totalQuestions = (task?.content ?? []).reduce<number>((acc, s) => {
    if (s.type === 'questions') return acc + s.items.length
    return acc
  }, 0)
  const answeredCount = Object.keys(submitted).length
  const allQuestionsAnswered = totalQuestions > 0 && answeredCount >= totalQuestions

  // Tasks with no questions (e.g. CHALLENGE): button always visible
  const hasQuestions = totalQuestions > 0
  const canValidate  = result === null && !completing && (hasQuestions ? allQuestionsAnswered : true)

  async function handleComplete() {
    if (!task || completing || result !== null) return
    setCompleting(true)
    try {
      const res = await fetch(`${API_URL}/api/tasks/${task.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      })
      if (res.status === 401) { router.push('/login'); return }
      if (!res.ok) return
      const data = await res.json()
      setResult({ xpGained: data.xpGained, nextTaskId: data.nextTaskId })
    } finally {
      setCompleting(false)
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-nx-bg">
        <span className="text-nx-gray text-sm">Chargement…</span>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="h-screen flex items-center justify-center bg-nx-bg">
        <span className="text-red-400 text-sm">Task introuvable.</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-nx-bg">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-nx-bg/90 backdrop-blur-sm border-b border-nx-border px-6 py-3 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="text-nx-gray hover:text-white transition-colors text-sm shrink-0"
        >
          ← Retour
        </button>
        <h1 className="flex-1 text-white font-semibold truncate">{task.title}</h1>
        <span className={`text-xs rounded-full px-2 py-0.5 border shrink-0 ${
          task.type === 'CHALLENGE'
            ? 'border-nx-cyan text-nx-cyan'
            : 'border-nx-border text-nx-gray'
        }`}>
          {task.type}
        </span>
        <span className="text-xs bg-nx-surface border border-nx-border rounded-full px-3 py-1 text-nx-yellow shrink-0">
          {task.xpReward} XP
        </span>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto py-6 space-y-2">
        {/* Challenge sans sections */}
        {task.type === 'CHALLENGE' && (task.content ?? []).length === 0 && (
          <div className="mx-6 my-8 text-center space-y-3">
            <p className="text-5xl">⚔️</p>
            <p className="text-white font-semibold">{task.title}</p>
            <p className="text-nx-gray text-sm">Relève ce défi pour débloquer la suite.</p>
          </div>
        )}

        {/* Sections */}
        {(task.content ?? []).map((section, i) => {
          switch (section.type) {
            case 'theory':
              return <TheorySection key={i} content={section.content} />
            case 'code_block':
              return <CodeBlock key={i} label={section.label} content={section.content} />
            case 'command_table':
              return <CommandTable key={i} commands={section.commands} />
            case 'questions':
              return (
                <QuestionsSection
                  key={i}
                  items={section.items}
                  answers={answers}
                  submitted={submitted}
                  onAnswer={(qId, val) => setAnswers(prev => ({ ...prev, [qId]: val }))}
                  onSubmit={(qId, correct) => setSubmitted(prev => ({ ...prev, [qId]: correct }))}
                />
              )
          }
        })}

        {/* Bouton Valider */}
        {canValidate && (
          <div className="mx-6 mt-6">
            <button
              onClick={handleComplete}
              className="w-full py-3 bg-nx-yellow text-nx-bg font-semibold rounded-xl hover:brightness-110 active:scale-[0.98] transition-all"
            >
              Valider ✓
            </button>
          </div>
        )}

        {/* Spinner pendant l'appel */}
        {completing && (
          <div className="mx-6 mt-6 text-center text-nx-gray text-sm">
            Validation en cours…
          </div>
        )}

        {/* Banner résultat */}
        {result && (
          <div className="mx-6 mt-4 p-5 rounded-xl border border-nx-cyan bg-nx-cyan/10 text-center space-y-3">
            <p className="text-nx-cyan font-semibold text-lg">
              {result.xpGained > 0
                ? `✓ +${result.xpGained} XP !`
                : '✓ Déjà complétée'}
            </p>

            {result.nextTaskId ? (
              <button
                onClick={() => router.push(`/task/${result.nextTaskId}`)}
                className="w-full py-2.5 bg-nx-yellow text-nx-bg font-semibold rounded-lg hover:brightness-110 active:scale-[0.98] transition-all"
              >
                Task suivante →
              </button>
            ) : (
              <p className="text-nx-gray text-sm">🎉 Module terminé !</p>
            )}

            <button
              onClick={() => router.push('/map')}
              className="block w-full text-sm text-nx-gray hover:text-white transition-colors pt-1"
            >
              ← Retour à la carte
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
