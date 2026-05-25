'use client'

interface Cmd { cmd: string; desc: string }

export default function CommandTable({ commands }: { commands: Cmd[] }) {
  return (
    <div className="mx-6 my-4">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-nx-border">
            <th className="text-left text-nx-gray font-medium py-2 pr-8 w-40">Commande</th>
            <th className="text-left text-nx-gray font-medium py-2">Description</th>
          </tr>
        </thead>
        <tbody>
          {commands.map((c, i) => (
            <tr key={i} className="border-b border-nx-border/50 hover:bg-nx-surface/30 transition-colors">
              <td className="py-2 pr-8">
                <code className="text-nx-yellow font-mono">{c.cmd}</code>
              </td>
              <td className="py-2 text-nx-text">{c.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
