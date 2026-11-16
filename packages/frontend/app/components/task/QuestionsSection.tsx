'use client'

import React from 'react'

function renderInline(text: unknown, plain = false): React.ReactNode[] {
  const str = String(text ?? '')
  const parts = str.split(/(\*\*[^*]+\*\*|`[^`]+`)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>
    if (part.startsWith('`') && part.endsWith('`'))
      return plain
        ? <span key={i}>{part.slice(1, -1)}</span>
        : <code key={i} className="bg-nx-surface text-nx-cyan px-1 rounded text-sm font-mono">{part.slice(1, -1)}</code>
    return <span key={i}>{part}</span>
  })
}

interface QcmAnswer { text: string; correct: boolean }
interface QcmQuestion { id: string; type: 'qcm'; question: string; answers: QcmAnswer[] }
interface ShortQuestion { id: string; type: 'short_answer'; question: string; answer?: string; acceptedAnswers?: string[]; caseSensitive?: boolean; trimWhitespace?: boolean }
type Question = QcmQuestion | ShortQuestion

interface Props {
  items: Question[]
  answers: Record<string, string>
  submitted: Record<string, boolean>
  onAnswer: (qId: string, val: string) => void
  onSubmit: (qId: string, correct: boolean) => void
}

function QcmItem({ q, answers, submitted, onAnswer, onSubmit }: {
  q: QcmQuestion
  answers: Record<string, string>
  submitted: Record<string, boolean>
  onAnswer: (qId: string, val: string) => void
  onSubmit: (qId: string, correct: boolean) => void
}) {
  const isDone = q.id in submitted

  return (
    <div className="space-y-2">
      <p className="text-sm text-white font-medium">{renderInline(q.question)}</p>
      <div className="space-y-1.5">
        {q.answers.map((a, i) => {
          const isSelected = answers[q.id] === a.text
          const showCorrect = isDone && a.correct
          const showWrong = isDone && isSelected && !a.correct

          return (
            <button
              key={i}
              disabled={isDone}
              onClick={() => {
                onAnswer(q.id, a.text)
                onSubmit(q.id, a.correct)
              }}
              className={`w-full text-left px-4 py-3 rounded-lg border text-sm font-mono font-medium tracking-wide transition-all duration-200 ${
                showCorrect  ? 'border-nx-cyan bg-nx-cyan/10 text-nx-cyan shadow-[0_0_12px_rgba(0,212,200,0.1)]' :
                showWrong    ? 'border-red-500 bg-red-500/10 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.1)]' :
                isSelected && !isDone ? 'border-nx-yellow bg-nx-yellow/10 text-nx-yellow' :
                'border-nx-border text-nx-text-dim hover:border-nx-text-dim hover:text-nx-text'
              } ${isDone ? 'cursor-default' : 'cursor-pointer'}`}
            >
              {renderInline(a.text, true)}
            </button>
          )
        })}
      </div>
      {isDone && (
        <p className={`text-xs mt-1 ${submitted[q.id] ? 'text-nx-cyan' : 'text-red-400'}`}>
          {submitted[q.id] ? '✓ Correct !' : <>{`✗ Réponse correcte : `}{renderInline(q.answers.find(a => a.correct)?.text ?? '')}</>}
        </p>
      )}
    </div>
  )
}

function ShortItem({ q, answers, submitted, onAnswer, onSubmit }: {
  q: ShortQuestion
  answers: Record<string, string>
  submitted: Record<string, boolean>
  onAnswer: (qId: string, val: string) => void
  onSubmit: (qId: string, correct: boolean) => void
}) {
  const isDone = q.id in submitted
  const current = answers[q.id] ?? ''

  function handleSubmit() {
    if (!current.trim() || isDone) return
    const normalize = (s: string) => (q.trimWhitespace !== false ? s.trim() : s)
    const compare = (a: string, b: string) => q.caseSensitive ? a === b : a.toLowerCase() === b.toLowerCase()
    const answers = q.acceptedAnswers ?? (q.answer ? [q.answer] : [])
    const correct = answers.some(a => compare(normalize(current), normalize(a)))
    onSubmit(q.id, correct)
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-white font-medium">{renderInline(q.question)}</p>
      <div className="flex gap-2">
        <input
          value={current}
          onChange={e => onAnswer(q.id, e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          disabled={isDone}
          placeholder="Ta réponse…"
          className={`flex-1 bg-nx-bg border rounded-lg px-4 py-2 text-sm text-white placeholder-nx-gray/50 focus:outline-none transition-colors disabled:opacity-60 ${
            isDone
              ? submitted[q.id] ? 'border-nx-cyan' : 'border-red-500'
              : 'border-nx-border focus:border-nx-yellow'
          }`}
        />
        {!isDone && (
          <button
            onClick={handleSubmit}
            disabled={!current.trim()}
            className="px-4 py-2 bg-nx-surface border border-nx-border rounded-lg text-sm text-white hover:border-nx-yellow transition-colors disabled:opacity-40"
          >
            Vérifier
          </button>
        )}
      </div>
      {isDone && (
        <p className={`text-xs ${submitted[q.id] ? 'text-nx-cyan' : 'text-red-400'}`}>
          {submitted[q.id] ? '✓ Correct !' : `✗ Réponse attendue : ${(q.acceptedAnswers ?? (q.answer ? [q.answer] : []))[0] ?? ''}`}
        </p>
      )}
    </div>
  )
}

export default function QuestionsSection({ items, answers, submitted, onAnswer, onSubmit }: Props) {
  return (
    <div className="mx-6 my-4 bg-nx-surface border border-nx-border rounded-xl p-5 space-y-6">
      <p className="text-xs text-nx-gray uppercase tracking-widest font-medium">Exercices</p>
      {items.map(q =>
        q.type === 'qcm'
          ? <QcmItem key={q.id} q={q} answers={answers} submitted={submitted} onAnswer={onAnswer} onSubmit={onSubmit} />
          : <ShortItem key={q.id} q={q} answers={answers} submitted={submitted} onAnswer={onAnswer} onSubmit={onSubmit} />
      )}
    </div>
  )
}
