'use client'

interface TopBarProps {
  user: { username: string; xp: number; level: number } | null
}

export default function TopBar({ user }: TopBarProps) {
  return (
    <header className="h-14 bg-nx-surface border-b border-nx-border flex items-center px-4 gap-6 shrink-0 z-10">
      <div className="text-xl font-bold tracking-widest select-none">
        <span className="text-nx-yellow">N</span>
        <span className="text-nx-cyan">E</span>
        <span className="text-white">XUS</span>
      </div>

      <nav className="flex gap-4 ml-4">
        <a href="/map" className="text-sm text-white hover:text-nx-yellow transition-colors">
          Ma carte
        </a>
        <a href="/profile" className="text-sm text-nx-gray hover:text-white transition-colors">
          Profil
        </a>
        <a href="/badges" className="text-sm text-nx-gray hover:text-white transition-colors">
          Badges
        </a>
      </nav>

      <div className="ml-auto flex items-center gap-3">
        {user && (
          <>
            <span className="text-xs text-nx-gray">{user.xp} XP</span>
            <div className="flex items-center gap-2 bg-nx-bg rounded-full px-3 py-1 border border-nx-border">
              <span className="text-lg leading-none">🐧</span>
              <span className="text-sm text-white">{user.username}</span>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
