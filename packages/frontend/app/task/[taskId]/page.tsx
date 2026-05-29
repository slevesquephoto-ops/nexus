'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import TheorySection from '../../components/task/TheorySection'
import CodeBlock from '../../components/task/CodeBlock'
import CommandTable from '../../components/task/CommandTable'
import QuestionsSection from '../../components/task/QuestionsSection'
import ImageSection from '../../components/task/ImageSection'
import MissionBlock from '../../components/task/MissionBlock'
import WarningBlock from '../../components/task/WarningBlock'
import HintBlock from '../../components/task/HintBlock'
import TerminalExercise from '../../components/task/TerminalExercise'
import ValidationBlock from '../../components/task/ValidationBlock'
import TeacherNote from '../../components/task/TeacherNote'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

type Section =
  | { type: 'theory'; content: string }
  | { type: 'code_block'; label?: string; content: string }
  | { type: 'command_table'; commands: { cmd: string; desc: string }[] }
  | { type: 'questions'; items: Question[] }
  | { type: 'image'; src: string; alt: string; caption?: string }
  | { type: 'mission'; title: string; content: string }
  | { type: 'warning'; title: string; content: string }
  | { type: 'hints'; hints: string[] }
  | { type: 'terminal_exercise'; title: string; instructions: string; expectedCommands?: string[] }
  | { type: 'validation'; title: string; question: string; acceptedAnswers: string[] }
  | { type: 'teacher_note'; content: string }

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

interface ModuleInfo {
  id: string
  title: string
  order: number
  track: { title: string }
}

interface CompletionResult {
  xpGained: number
  nextTaskId: string | null
}

export default function TaskPage() {
  const { taskId } = useParams<{ taskId: string }>()
  const router = useRouter()

  const [task, setTask]               = useState<Task | null>(null)
  const [module, setModule]           = useState<ModuleInfo | null>(null)
  const [loading, setLoading]         = useState(true)
  const [answers, setAnswers]         = useState<Record<string, string>>({})
  const [submitted, setSubmitted]     = useState<Record<string, boolean>>({})
  const [completing, setCompleting]   = useState(false)
  const [result, setResult]           = useState<CompletionResult | null>(null)
  const [userRole, setUserRole]       = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setAnswers({})
    setSubmitted({})
    setResult(null)
    setModule(null)

    fetch(`${API_URL}/api/users/me`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.user?.role) setUserRole(d.user.role) })
      .catch(() => {})

    fetch(`${API_URL}/api/tasks/${taskId}`, { credentials: 'include' })
      .then(r => {
        if (r.status === 401) { router.push('/login'); return null }
        if (!r.ok) return null
        return r.json()
      })
      .then(taskData => {
        if (!taskData) return
        setTask(taskData)
        // parallel breadcrumb fetch
        fetch(`${API_URL}/api/modules/${taskData.moduleId}`, { credentials: 'include' })
          .then(r => r.ok ? r.json() : null)
          .then(modData => { if (modData) setModule(modData) })
          .catch(() => {})
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [taskId, router])

  const totalQuestions = (task?.content ?? []).reduce<number>((acc, s) => {
    if (s.type === 'questions') return acc + s.items.length
    return acc
  }, 0)
  const answeredCount = Object.keys(submitted).length
  const allQuestionsAnswered = totalQuestions > 0 && answeredCount >= totalQuestions

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
        <span className="text-nx-text-dim text-sm tracking-wide">Chargement…</span>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="h-screen flex items-center justify-center bg-nx-bg">
        <span className="text-nx-danger text-sm">Task introuvable.</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-nx-bg">
      {/* Sticky header with breadcrumb */}
      <div className="sticky top-0 z-10 bg-nx-bg/95 backdrop-blur-sm border-b border-nx-border px-6 py-3">
        <div className="flex items-center gap-2 text-xs text-nx-text-muted mb-1 tracking-wide">
          {module && (
            <>
              <span>{module.track?.title}</span>
              <span className="text-nx-border">›</span>
              <span>{module.title}</span>
              <span className="text-nx-border">›</span>
            </>
          )}
          <span className="text-nx-text-dim">Task {task.order}</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-nx-text-dim hover:text-nx-text transition-colors text-sm shrink-0"
          >
            ←
          </button>
          <h1 className="flex-1 text-nx-text font-bold tracking-wide truncate">{task.title}</h1>
          <span className={`text-[10px] rounded-full px-2 py-0.5 border tracking-widest uppercase shrink-0 ${
            task.type === 'CHALLENGE'
              ? 'border-nx-cyan/40 text-nx-cyan bg-nx-cyan/5'
              : 'border-nx-border text-nx-text-muted'
          }`}>
            {task.type}
          </span>
          <span className="text-xs bg-nx-surface-2 border border-nx-border rounded-full px-3 py-1 text-nx-yellow font-semibold shrink-0">
            {task.xpReward} XP
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto py-6 space-y-2 animate-fade-in-up">
        {task.type === 'CHALLENGE' && (task.content ?? []).length === 0 && (
          <div className="mx-6 my-8 text-center space-y-3">
            <p className="text-5xl">⚔️</p>
            <p className="text-nx-text font-bold tracking-wide">{task.title}</p>
            <p className="text-nx-text-dim text-sm">Relève ce défi pour débloquer la suite.</p>
          </div>
        )}

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
            case 'image':
              return <ImageSection key={i} src={section.src} alt={section.alt} caption={section.caption} />
            case 'mission':
              return <MissionBlock key={i} title={section.title} content={section.content} />
            case 'warning':
              return <WarningBlock key={i} title={section.title} content={section.content} />
            case 'hints':
              return <HintBlock key={i} hints={section.hints} />
            case 'terminal_exercise':
              return <TerminalExercise key={i} title={section.title} instructions={section.instructions} expectedCommands={section.expectedCommands} />
            case 'validation':
              return <ValidationBlock key={i} title={section.title} question={section.question} acceptedAnswers={section.acceptedAnswers} />
            case 'teacher_note':
              return (userRole === 'TEACHER' || userRole === 'ADMIN')
                ? <TeacherNote key={i} content={section.content} />
                : null
          }
        })}

        {canValidate && (
          <div className="mx-6 mt-6">
            <button
              onClick={handleComplete}
              className="w-full py-3 bg-nx-yellow text-nx-bg font-bold tracking-widest uppercase rounded-xl hover:bg-yellow-400 hover:shadow-glow-yellow active:scale-[0.98] transition-all duration-200"
            >
              Valider ✓
            </button>
          </div>
        )}

        {completing && (
          <div className="mx-6 mt-6 text-center text-nx-text-dim text-sm tracking-wide">
            Validation en cours…
          </div>
        )}

        {result && (
          <div className="mx-6 mt-4 p-5 rounded-xl border border-nx-cyan/40 bg-nx-cyan/5 text-center space-y-3 animate-slide-in-bottom shadow-glow-cyan">
            <p className="text-nx-cyan font-bold text-lg tracking-wide">
              {result.xpGained > 0
                ? `✓ +${result.xpGained} XP !`
                : '✓ Déjà complétée'}
            </p>

            {result.nextTaskId ? (
              <button
                onClick={() => router.push(`/task/${result.nextTaskId}`)}
                className="w-full py-2.5 bg-nx-yellow text-nx-bg font-bold tracking-widest uppercase rounded-lg hover:bg-yellow-400 hover:shadow-glow-yellow active:scale-[0.98] transition-all duration-200"
              >
                Task suivante →
              </button>
            ) : (
              <p className="text-nx-text-dim text-sm">🎉 Module terminé !</p>
            )}

            <button
              onClick={() => router.push('/map')}
              className="block w-full text-sm text-nx-text-dim hover:text-nx-text transition-colors pt-1 tracking-wide"
            >
              ← Retour à la carte
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
