'use client'

import { usePathname } from 'next/navigation'

interface TopBarProps {
  user: { username: string; xp: number; level: number; avatarId?: string | null } | null
}

export default function TopBar({ user }: TopBarProps) {
  const pathname = usePathname()
  return (
    <header className="h-[80px] bg-nx-surface border-b border-nx-border flex items-center px-6 gap-6 shrink-0 z-10 sticky top-0">
      <div className="text-4xl font-extrabold tracking-[0.18em] select-none uppercase">
        <span className="text-nx-yellow drop-shadow-[0_0_8px_rgba(245,192,48,0.5)]">N</span>
        <span className="text-nx-yellow drop-shadow-[0_0_8px_rgba(245,192,48,0.5)]">E</span>
        <span className="text-nx-yellow">XUS</span>
      </div>

      <span className="text-nx-border">|</span>
      <span className="text-nx-text-dim text-sm tracking-widest uppercase">Ma carte</span>

      <nav className="flex gap-1 ml-4">
        <a href="/map" className={`px-4 py-2 text-lg font-semibold tracking-wide transition-colors duration-200 rounded-lg hover:bg-nx-surface-2 ${pathname === '/map' ? 'text-white' : 'text-nx-text-dim hover:text-nx-text'}`}>
          Carte
        </a>
        <a href="/profile" className={`px-4 py-2 text-lg font-semibold tracking-wide transition-colors duration-200 rounded-lg hover:bg-nx-surface-2 ${pathname === '/profile' ? 'text-white' : 'text-nx-text-dim hover:text-nx-text'}`}>
          Profil
        </a>
      </nav>

      <div className="ml-auto flex items-center gap-4">
        {user && (
          <>
            <span className="text-lg text-nx-text-dim tracking-widest">
              <span className="text-nx-yellow font-bold">{user.xp}</span> XP
            </span>
            <div className="flex items-center gap-3 bg-nx-bg rounded-full px-5 py-2 border border-nx-border hover:border-nx-yellow/40 transition-colors duration-200">
              <img
                src={`/avatars/avatar-${user.avatarId || 'debutant'}.png`}
                alt={user.username}
                className="w-[52px] h-[52px] rounded-full object-cover object-top border-2 border-nx-yellow"
                style={{ mixBlendMode: 'screen' }}
              />
              <span className="text-lg font-semibold text-nx-text">{user.username}</span>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
