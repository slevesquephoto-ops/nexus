'use client'

import { useState } from 'react'

interface Props {
  hints: string[]
}

export default function HintBlock({ hints }: Props) {
  const [revealed, setRevealed] = useState(0)
  const [open, setOpen] = useState(false)

  if (!hints?.length) return null

  return (
    <div className="mx-6 my-4 rounded-xl border border-nx-cyan/20">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-nx-cyan/5 transition-colors rounded-xl"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">💡</span>
          <span className="text-xs font-bold tracking-widest uppercase text-nx-cyan">
            Indices
          </span>
          <span className="text-xs text-nx-text-dim">
            ({revealed}/{hints.length} révélé{revealed > 1 ? 's' : ''})
          </span>
        </div>
        <span className="text-nx-text-dim text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-nx-cyan/10 pt-3">
          {hints.slice(0, revealed).map((hint, i) => (
            <div key={i} className="flex gap-3 text-sm text-nx-text leading-relaxed">
              <span className="text-nx-cyan font-mono shrink-0">{i + 1}.</span>
              <span>{hint}</span>
            </div>
          ))}

          {revealed < hints.length && (
            <button
              onClick={() => setRevealed(r => r + 1)}
              className="mt-1 text-xs text-nx-cyan/70 hover:text-nx-cyan border border-nx-cyan/20 hover:border-nx-cyan/40 rounded-lg px-3 py-1.5 transition-colors"
            >
              Révéler l'indice suivant →
            </button>
          )}

          {revealed === 0 && (
            <button
              onClick={() => setRevealed(1)}
              className="text-xs text-nx-cyan/70 hover:text-nx-cyan border border-nx-cyan/20 hover:border-nx-cyan/40 rounded-lg px-3 py-1.5 transition-colors"
            >
              Révéler le premier indice →
            </button>
          )}
        </div>
      )}
    </div>
  )
}
