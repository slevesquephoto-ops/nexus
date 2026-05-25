'use client'

import { useState } from 'react'

export default function PasswordModal({ password, onClose }: { password: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-nx-surface border border-nx-border rounded-2xl p-6 w-full max-w-sm mx-4 space-y-4">
        <h2 className="text-white font-bold text-lg">Compte créé !</h2>
        <p className="text-nx-gray text-sm">
          Mot de passe temporaire — copiez-le maintenant, il ne sera plus affiché.
        </p>
        <div className="flex items-center gap-2 bg-nx-dark border border-nx-border rounded-lg px-4 py-3">
          <span className="flex-1 text-white font-mono text-sm tracking-wide">{password}</span>
          <button
            onClick={copy}
            className="text-xs text-nx-gray hover:text-white transition-colors shrink-0"
          >
            {copied ? '✓ Copié' : 'Copier'}
          </button>
        </div>
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-nx-yellow text-nx-bg font-semibold rounded-lg text-sm hover:brightness-110 transition-all"
        >
          J&apos;ai copié, fermer
        </button>
      </div>
    </div>
  )
}
