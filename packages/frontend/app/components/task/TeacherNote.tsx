'use client'

interface Props {
  content: string
}

export default function TeacherNote({ content }: Props) {
  return (
    <div className="mx-6 my-4 rounded-xl overflow-hidden border border-indigo-500/30 shadow-[0_0_14px_rgba(129,140,248,0.06)]">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500/10 border-b border-indigo-500/20">
        <span className="text-base">👁</span>
        <span className="text-[10px] font-bold tracking-widest uppercase text-indigo-400">
          Note enseignant
        </span>
        <span className="ml-auto text-[10px] text-indigo-600 tracking-wide italic">
          visible seulement par vous
        </span>
      </div>
      <div className="bg-indigo-950/20 px-5 py-4">
        <p className="text-sm text-indigo-200/80 leading-relaxed whitespace-pre-line">
          {content}
        </p>
      </div>
    </div>
  )
}
