'use client'

interface Props {
  title: string
  content: string
}

export default function MissionBlock({ title, content }: Props) {
  return (
    <div className="mx-6 my-4 rounded-xl overflow-hidden border border-nx-yellow/30 shadow-[0_0_20px_rgba(245,192,48,0.08)]">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-nx-yellow/10 border-b border-nx-yellow/20">
        <span className="text-base">📡</span>
        <span className="text-[10px] font-bold tracking-widest uppercase text-nx-yellow">
          {title || 'Briefing de mission'}
        </span>
      </div>
      <div className="bg-[#0d1117] px-5 py-4">
        <p className="text-sm text-nx-text leading-relaxed whitespace-pre-line font-mono">
          {content}
        </p>
      </div>
    </div>
  )
}
