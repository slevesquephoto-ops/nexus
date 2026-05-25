'use client'

interface CodeBlockProps {
  label?: string
  content: string
}

export default function CodeBlock({ label, content }: CodeBlockProps) {
  return (
    <div className="mx-6 my-4 rounded-lg overflow-hidden border border-green-900/40 shadow-[0_0_12px_rgba(74,222,128,0.06)]">
      <div className="bg-[#1a1f2e] px-4 py-2 flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-red-500/60" />
        <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
        <span className="w-3 h-3 rounded-full bg-green-500/60" />
        {label && <span className="ml-2 text-xs text-nx-gray">{label}</span>}
      </div>
      <pre className="bg-[#0d1220] p-4 font-mono text-sm text-green-400 overflow-x-auto whitespace-pre">
        {content.trim()}
      </pre>
    </div>
  )
}
