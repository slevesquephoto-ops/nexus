'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import TheorySection from '../task/TheorySection'
import CodeBlock from '../task/CodeBlock'
import CommandTable from '../task/CommandTable'
import QuestionsSection from '../task/QuestionsSection'
import ImageSection from '../task/ImageSection'
import AvatarUnlockModal from '../ui/AvatarUnlockModal'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

type SectionType =
  | { type: 'theory'; content: string }
  | { type: 'code_block'; label?: string; content: string }
  | { type: 'command_table'; commands: { cmd: string; desc: string }[] }
  | { type: 'questions'; items: Question[] }
  | { type: 'image'; src: string; alt: string; caption?: string }

type Question =
  | { id: string; type: 'qcm'; question: string; answers: { text: string; correct: boolean }[] }
  | { id: string; type: 'short_answer'; question: string; answer: string }

interface Task {
  id: string
  title: string
  type: 'TASK' | 'CHALLENGE'
  order: number
  xpReward: number
  content: SectionType[] | null
  completed: boolean
  score: number | null
}

interface ModuleData {
  id: string
  title: string
  description: string | null
  order: number
  xpReward: number
  track: { id: string; title: string }
  tasks: Task[]
}

interface User {
  id: string
  username: string
  xp: number
  level: number
  avatarId?: string | null
}

type TaskStatus = 'done' | 'active' | 'locked'

interface ModuleViewProps {
  moduleId: string
  onBack: () => void
  user: User | null
  isStaff?: boolean
}

function getTaskStatus(tasks: Task[], index: number, completions: Record<string, boolean>, isStaff = false): TaskStatus {
  const task = tasks[index]
  if (completions[task.id] ?? task.completed) return 'done'
  if (isStaff) return 'active'

  if (task.type === 'CHALLENGE') {
    const nonChallengeDone = tasks
      .filter(t => t.type !== 'CHALLENGE')
      .every(t => completions[t.id] ?? t.completed)
    return nonChallengeDone ? 'active' : 'locked'
  }

  const firstNonCompleted = tasks.findIndex(
    t => !(completions[t.id] ?? t.completed) && t.type !== 'CHALLENGE'
  )
  return index === firstNonCompleted ? 'active' : 'locked'
}

function statusIcon(status: TaskStatus, type: string) {
  if (type === 'CHALLENGE') return status === 'locked' ? '🔒' : '⚔️'
  if (status === 'done')   return <span className="text-nx-cyan font-bold">✓</span>
  if (status === 'active') return <span className="text-nx-yellow font-bold">▶</span>
  return <span className="text-nx-text-muted">🔒</span>
}

const cardStyles: Record<TaskStatus, string> = {
  done:   'border border-nx-cyan/40 bg-nx-surface',
  active: 'border border-nx-yellow/40 bg-nx-surface shadow-[0_0_20px_rgba(245,192,48,0.06)]',
  locked: 'border border-nx-border bg-nx-surface opacity-50 pointer-events-none',
}

export default function ModuleView({ moduleId, onBack, user, isStaff = false }: ModuleViewProps) {
  const router = useRouter()

  const [mod, setMod]         = useState<ModuleData | null>(null)
  const [loading, setLoading] = useState(true)

  const [completions, setCompletions] = useState<Record<string, boolean>>({})
  const [openTasks, setOpenTasks]     = useState<Set<string>>(new Set())
  const [answers, setAnswers]         = useState<Record<string, Record<string, string>>>({})
  const [submitted, setSubmitted]     = useState<Record<string, Record<string, boolean>>>({})
  const [banners, setBanners]         = useState<Record<string, { xpGained: number }>>({})
  const [completing, setCompleting]   = useState<Record<string, boolean>>({})
  const [newUnlockedAvatar, setNewUnlockedAvatar] = useState<{ avatarId: string; title: string; description: string; file: string } | null>(null)

  const loadModule = useCallback(async () => {
    setLoading(true)
    setCompletions({})
    setOpenTasks(new Set())
    setAnswers({})
    setSubmitted({})
    setBanners({})
    try {
      const res = await fetch(`${API_URL}/api/modules/${moduleId}/full`, { credentials: 'include' })
      if (res.status === 401) { router.push('/login'); return }
      if (!res.ok) { setLoading(false); return }
      const modData: ModuleData = await res.json()
      setMod(modData)

      const initCompletions: Record<string, boolean> = {}
      modData.tasks.forEach(t => { initCompletions[t.id] = t.completed })
      setCompletions(initCompletions)

      const firstActive = modData.tasks.find(t => t.type !== 'CHALLENGE' && !t.completed)
      if (firstActive) {
        setOpenTasks(new Set([firstActive.id]))
      } else {
        const challenge = modData.tasks.find(t => t.type === 'CHALLENGE')
        if (challenge) setOpenTasks(new Set([challenge.id]))
      }
    } catch {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }, [moduleId, router])

  useEffect(() => { loadModule() }, [loadModule])

  function toggleTask(taskId: string, status: TaskStatus) {
    if (status === 'locked') return
    setOpenTasks(prev => {
      const next = new Set(prev)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      return next
    })
  }

  async function completeTask(task: Task) {
    if (completing[task.id]) return
    setCompleting(prev => ({ ...prev, [task.id]: true }))
    try {
      const res = await fetch(`${API_URL}/api/tasks/${task.id}/complete`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (res.status === 401) { router.push('/login'); return }
      if (!res.ok) return
      const data = await res.json()

      setCompletions(prev => ({ ...prev, [task.id]: true }))
      setBanners(prev => ({ ...prev, [task.id]: { xpGained: data.xpGained } }))
      if (data.newAvatar) setNewUnlockedAvatar(data.newAvatar)

      if (data.nextTaskId) {
        setTimeout(() => {
          setOpenTasks(prev => new Set([...prev, data.nextTaskId]))
        }, 1500)
      }
    } finally {
      setCompleting(prev => ({ ...prev, [task.id]: false }))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-nx-text-dim text-sm tracking-wide">Chargement…</span>
      </div>
    )
  }

  if (!mod) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-nx-danger text-sm">Module introuvable.</span>
      </div>
    )
  }

  const normalTasks = mod.tasks.filter(t => t.type !== 'CHALLENGE')
  const doneCount   = normalTasks.filter(t => completions[t.id] ?? t.completed).length
  const totalNormal = normalTasks.length
  const progressPct = totalNormal > 0 ? Math.round((doneCount / totalNormal) * 100) : 0
  const totalXp     = normalTasks.reduce((s, t) => s + t.xpReward, 0)

  return (
    <>
    <div className="min-h-full">
      {/* Sticky header — top-0 colle au haut du conteneur overflow-y-auto parent */}
      <div className="sticky top-0 z-10 bg-nx-surface border-b border-nx-border px-8 py-6">
        <div className="flex items-center gap-3 text-sm tracking-wide mb-2">
          <button onClick={onBack} className="text-nx-cyan hover:text-white transition-colors cursor-pointer font-semibold">
            ← Carte
          </button>
          <span className="text-nx-text-dim">/</span>
          <span className="text-nx-text-dim">{mod.track.title}</span>
          <span className="text-nx-text-dim">/</span>
          <span className="text-white font-semibold">{mod.title}</span>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-nx-text-dim text-base">{doneCount} / {totalNormal} tasks ✓</span>
          <span className="text-nx-yellow text-base font-semibold ml-auto">{totalXp} XP</span>
        </div>
        <div className="h-1 bg-nx-border rounded-full mt-3 overflow-hidden">
          <div
            className="h-full bg-nx-yellow rounded-full transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Task accordion */}
      <div className="max-w-2xl mx-auto w-full px-4 py-6 space-y-3">
        {mod.tasks.map((task, i) => {
          const status      = getTaskStatus(mod.tasks, i, completions, isStaff)
          const isOpen      = openTasks.has(task.id)
          const isChallenge = task.type === 'CHALLENGE'

          const taskAnswers   = answers[task.id] ?? {}
          const taskSubmitted = submitted[task.id] ?? {}

          const sections  = task.content ?? []
          const totalQs   = sections.reduce<number>((acc, s) => s.type === 'questions' ? acc + s.items.length : acc, 0)
          const doneQs    = Object.keys(taskSubmitted).length
          const allQsDone = totalQs === 0 || doneQs >= totalQs
          const alreadyDone  = completions[task.id] ?? task.completed
          const showValidate = !isChallenge && status === 'active' && allQsDone && !alreadyDone && !banners[task.id]

          return (
            <div key={task.id} className={`rounded-xl overflow-hidden transition-all duration-200 ${cardStyles[status]}`}>
              <button
                className="w-full flex items-center gap-3 px-5 py-4 text-left"
                onClick={() => toggleTask(task.id, status)}
                disabled={status === 'locked'}
              >
                <span className="shrink-0 text-base w-5 text-center">
                  {statusIcon(status, task.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm tracking-wide ${
                    status === 'locked' ? 'text-nx-text-muted' : 'text-nx-text'
                  }`}>
                    {isChallenge && (
                      <span className="text-nx-yellow text-xs uppercase tracking-widest mr-2">Challenge</span>
                    )}
                    {task.title}
                  </p>
                  <p className={`text-xs mt-0.5 ${
                    status === 'done'   ? 'text-nx-cyan/70'   :
                    status === 'active' ? 'text-nx-yellow/70' :
                                          'text-nx-text-muted'
                  }`}>
                    {task.xpReward} XP
                    {alreadyDone && task.score != null && ` · Score : ${task.score}`}
                  </p>
                </div>
                <span className={`text-xs transition-transform duration-200 shrink-0 ${
                  isOpen ? 'rotate-180' : ''
                } ${status === 'locked' ? 'opacity-0' : 'text-nx-text-muted'}`}>▼</span>
              </button>

              {isOpen && (
                <div className="border-t border-nx-border/50">
                  {isChallenge && (
                    <div className="px-6 py-8 flex flex-col items-center gap-3 text-center">
                      <span className="text-4xl">⏳</span>
                      <p className="text-nx-text font-semibold">{task.title}</p>
                      <p className="text-nx-text-dim text-sm max-w-sm">
                        En attente de correction par ton enseignant.
                      </p>
                      {alreadyDone && (
                        <div className="mt-2 px-4 py-2 rounded-lg border border-nx-cyan/40 bg-nx-cyan/5 text-nx-cyan text-sm font-semibold">
                          ✓ Corrigé{task.score != null && ` — Score : ${task.score}`}
                        </div>
                      )}
                    </div>
                  )}

                  {!isChallenge && sections.length === 0 && (
                    <p className="px-6 py-4 text-nx-text-dim text-sm">Aucun contenu.</p>
                  )}

                  {!isChallenge && sections.map((section, j) => {
                    switch (section.type) {
                      case 'theory':
                        return <TheorySection key={j} content={section.content} />
                      case 'code_block':
                        return <CodeBlock key={j} label={section.label} content={section.content} />
                      case 'command_table':
                        return <CommandTable key={j} commands={section.commands} />
                      case 'questions':
                        return (
                          <QuestionsSection
                            key={j}
                            items={section.items}
                            answers={taskAnswers}
                            submitted={taskSubmitted}
                            onAnswer={(qId, val) => setAnswers(prev => ({
                              ...prev,
                              [task.id]: { ...(prev[task.id] ?? {}), [qId]: val },
                            }))}
                            onSubmit={(qId, correct) => setSubmitted(prev => ({
                              ...prev,
                              [task.id]: { ...(prev[task.id] ?? {}), [qId]: correct },
                            }))}
                          />
                        )
                      case 'image':
                        return <ImageSection key={j} src={section.src} alt={section.alt} caption={section.caption} />
                    }
                  })}

                  {showValidate && (
                    <div className="px-6 pb-5 pt-2">
                      <button
                        onClick={() => completeTask(task)}
                        disabled={!!completing[task.id]}
                        className="w-full py-3 bg-nx-yellow text-nx-bg font-bold tracking-widest uppercase rounded-xl hover:bg-yellow-400 hover:shadow-glow-yellow active:scale-[0.98] transition-all duration-200 disabled:opacity-60"
                      >
                        {completing[task.id] ? 'Validation…' : 'Valider ✓'}
                      </button>
                    </div>
                  )}

                  {banners[task.id] && (
                    <div className="mx-6 mb-5 p-4 rounded-xl border border-nx-cyan/40 bg-nx-cyan-dim/30 animate-slide-in-bottom text-center space-y-2">
                      <p className="text-nx-cyan font-bold text-base">
                        {banners[task.id].xpGained > 0
                          ? `✓ Task complétée — +${banners[task.id].xpGained} XP !`
                          : '✓ Déjà complétée'}
                      </p>
                      <p className="text-nx-text-dim text-xs">La prochaine task s'ouvre automatiquement…</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {normalTasks.length > 0 && doneCount === totalNormal && (
          <div className="rounded-xl border border-nx-yellow/40 bg-nx-surface p-6 text-center space-y-2">
            <p className="text-nx-yellow font-bold text-lg">🎉 Module terminé !</p>
            <button
              onClick={onBack}
              className="text-sm text-nx-text-dim hover:text-nx-text transition-colors"
            >
              ← Retour à la carte
            </button>
          </div>
        )}
      </div>
    </div>

    {newUnlockedAvatar && (
      <AvatarUnlockModal
        avatar={newUnlockedAvatar}
        onClose={() => setNewUnlockedAvatar(null)}
      />
    )}
    </>
  )
}
