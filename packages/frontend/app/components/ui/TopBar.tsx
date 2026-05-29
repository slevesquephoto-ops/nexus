'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { getAvatarFile } from '../../lib/avatars'
import ProfileOverlay from './ProfileOverlay'
import ClassePanel from './ClassePanel'
import LocaleToggle from './LocaleToggle'

interface TopBarProps {
  user: { id: string; username: string; xp: number; level: number; avatarId?: string | null; role?: string } | null
}

export default function TopBar({ user }: TopBarProps) {
  const pathname = usePathname()
  const t = useTranslations('nav')
  const [showProfile, setShowProfile] = useState(false)
  const [showClasse, setShowClasse] = useState(false)
  const isStaff = user?.role === 'TEACHER' || user?.role === 'ADMIN'
  const isStudent = user?.role === 'STUDENT'

  return (
    <>
      <header className="h-[80px] bg-nx-surface border-b border-nx-border flex items-center px-6 gap-6 shrink-0 z-10 sticky top-0">
        <div className="text-4xl font-extrabold tracking-[0.18em] select-none uppercase">
          <span className="text-nx-yellow drop-shadow-[0_0_8px_rgba(245,192,48,0.5)]">N</span>
          <span className="text-nx-yellow drop-shadow-[0_0_8px_rgba(245,192,48,0.5)]">E</span>
          <span className="text-nx-yellow">XUS</span>
        </div>

        <span className="text-nx-border">|</span>
        <span className="text-nx-text-dim text-sm tracking-widest uppercase">{t('myMap')}</span>

        <nav className="flex gap-1 ml-4">
          <a href="/map" className={`px-4 py-2 text-lg font-semibold tracking-wide transition-colors duration-200 rounded-lg hover:bg-nx-surface-2 ${pathname === '/map' ? 'text-white' : 'text-nx-text-dim hover:text-nx-text'}`}>
            {t('map')}
          </a>
          <a href="/profile" className={`px-4 py-2 text-lg font-semibold tracking-wide transition-colors duration-200 rounded-lg hover:bg-nx-surface-2 ${pathname === '/profile' ? 'text-white' : 'text-nx-text-dim hover:text-nx-text'}`}>
            {t('profile')}
          </a>
          {isStudent && (
            <button onClick={() => setShowClasse(true)} className="px-4 py-2 text-lg font-semibold tracking-wide transition-colors duration-200 rounded-lg hover:bg-nx-surface-2 text-nx-text-dim hover:text-nx-text">
              {t('classe')}
            </button>
          )}
          {isStaff && (
            <a href="/admin" className={`px-4 py-2 text-lg font-semibold tracking-wide transition-colors duration-200 rounded-lg hover:bg-nx-surface-2 ${pathname.startsWith('/admin') ? 'text-nx-yellow' : 'text-nx-text-dim hover:text-nx-yellow'}`}>
              {t('admin')}
            </a>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-4">
          <LocaleToggle />
          {user && (
            <>
              <span className="text-lg text-nx-text-dim tracking-widest">
                <span className="text-nx-yellow font-bold">{user.xp}</span> XP
              </span>
              <div
                onClick={() => setShowProfile(true)}
                className="flex items-center gap-3 bg-nx-bg rounded-full px-5 py-2 border border-nx-border hover:border-nx-yellow/40 transition-colors duration-200 cursor-pointer"
              >
                <img
                  src={`/avatars/${getAvatarFile(user.avatarId)}`}
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

      {showProfile && user && (
        <ProfileOverlay user={user} onClose={() => setShowProfile(false)} />
      )}
      {showClasse && user && (
        <ClassePanel currentUserId={user.id} onClose={() => setShowClasse(false)} />
      )}
    </>
  )
}
