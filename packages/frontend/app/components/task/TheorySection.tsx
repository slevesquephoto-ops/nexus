'use client'

import React from 'react'

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} className="bg-nx-surface text-nx-cyan px-1 rounded text-sm font-mono">{part.slice(1, -1)}</code>
    return <span key={i}>{part}</span>
  })
}

export default function TheorySection({ content }: { content: string }) {
  const paragraphs = content.trim().split(/\n\n+/)
  return (
    <div className="px-8 py-6 space-y-4">
      {paragraphs.map((p, i) => (
        <p key={i} className="text-nx-text leading-loose text-base whitespace-pre-line">
          {renderInline(p)}
        </p>
      ))}
    </div>
  )
}
