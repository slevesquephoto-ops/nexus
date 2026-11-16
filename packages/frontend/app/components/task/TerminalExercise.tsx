'use client'

interface Props {
  title: string
  instructions: string
  expectedCommands?: string[]
}

export default function TerminalExercise({ title, instructions, expectedCommands }: Props) {
  return (
    <div className="mx-6 my-4 rounded-xl overflow-hidden border border-green-500/30 shadow-[0_0_16px_rgba(74,222,128,0.06)]">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-green-500/10 border-b border-green-500/20">
        <span className="text-base">⌨️</span>
        <span className="text-[10px] font-bold tracking-widest uppercase text-green-400">
          {title || 'Exercice Terminal'}
        </span>
        <span className="ml-auto text-[10px] text-green-600 tracking-wide">→ dans ta VM</span>
      </div>
      <div className="bg-[#0d1220] px-5 py-4 space-y-3">
        <p className="text-sm text-nx-text leading-relaxed whitespace-pre-line">
          {instructions}
        </p>
        {expectedCommands && expectedCommands.length > 0 && (
          <div className="mt-3 pt-3 border-t border-green-900/30">
            <p className="text-[10px] text-green-600 uppercase tracking-widest mb-2">
              Commande(s) attendue(s)
            </p>
            <div className="space-y-1">
              {expectedCommands.map((cmd, i) => (
                <code key={i} className="block font-mono text-sm text-green-400 bg-green-950/30 px-3 py-1.5 rounded-lg">
                  {cmd}
                </code>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
