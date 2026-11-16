'use client'

interface Props {
  title: string
  content: string
}

export default function WarningBlock({ title, content }: Props) {
  return (
    <div className="mx-6 my-4 rounded-xl overflow-hidden border border-orange-500/40 shadow-[0_0_16px_rgba(249,115,22,0.08)]">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-orange-500/10 border-b border-orange-500/20">
        <span className="text-base">⚠️</span>
        <span className="text-[10px] font-bold tracking-widest uppercase text-orange-400">
          {title || 'Attention'}
        </span>
      </div>
      <div className="bg-orange-950/20 px-5 py-4">
        <p className="text-sm text-orange-200/80 leading-relaxed whitespace-pre-line">
          {content}
        </p>
      </div>
    </div>
  )
}
