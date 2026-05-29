'use client'

import { useState } from 'react'

interface Props {
  id: string
  title: string
  question: string
  acceptedAnswers: string[]
  onComplete?: (id: string, answer: string) => void
}

export default function ValidationBlock({ id, title, question, acceptedAnswers, onComplete }: Props) {
  const [value, setValue] = useState('')
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null)

  // Empty acceptedAnswers = acknowledgment only (any input valid)
  const isAcknowledgment = acceptedAnswers.length === 0

  function handleCheck() {
    if (result !== null) return
    if (!isAcknowledgment && !value.trim()) return

    const correct = isAcknowledgment || acceptedAnswers.some(
      a => a.trim().toLowerCase() === value.trim().toLowerCase()
    )
    setResult(correct ? 'correct' : 'wrong')
    if (correct) onComplete?.(id, isAcknowledgment ? '✓' : value.trim())
  }

  return (
    <div className="mx-6 my-4 rounded-xl overflow-hidden border border-nx-cyan/30">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-nx-cyan/5 border-b border-nx-cyan/15">
        <span className="text-base">✅</span>
        <span className="text-[10px] font-bold tracking-widest uppercase text-nx-cyan">
          {title || 'Validation'}
        </span>
      </div>
      <div className="bg-nx-surface px-5 py-4 space-y-3">
        <p className="text-sm text-white font-medium">{question}</p>

        {isAcknowledgment ? (
          result === 'correct' ? (
            <p className="text-xs text-nx-cyan">✓ Confirmé</p>
          ) : (
            <button
              onClick={handleCheck}
              className="px-4 py-2 bg-nx-cyan/10 border border-nx-cyan/40 rounded-lg text-sm text-nx-cyan hover:bg-nx-cyan/20 transition-colors"
            >
              J&apos;ai vu ✓
            </button>
          )
        ) : (
          <>
            <div className="flex gap-2">
              <input
                value={value}
                onChange={e => setValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCheck()}
                disabled={result !== null}
                placeholder="Ta réponse…"
                className={`flex-1 bg-nx-bg border rounded-lg px-4 py-2 text-sm text-white placeholder-nx-gray/50 focus:outline-none transition-colors disabled:opacity-60 ${
                  result === 'correct' ? 'border-nx-cyan' :
                  result === 'wrong'   ? 'border-red-500' :
                  'border-nx-border focus:border-nx-cyan'
                }`}
              />
              {result === null && (
                <button
                  onClick={handleCheck}
                  disabled={!value.trim()}
                  className="px-4 py-2 bg-nx-surface border border-nx-border rounded-lg text-sm text-white hover:border-nx-cyan transition-colors disabled:opacity-40"
                >
                  Vérifier
                </button>
              )}
            </div>
            {result && (
              <p className={`text-xs ${result === 'correct' ? 'text-nx-cyan' : 'text-red-400'}`}>
                {result === 'correct'
                  ? '✓ Correct !'
                  : `✗ Réponse attendue : ${acceptedAnswers[0]}`}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
