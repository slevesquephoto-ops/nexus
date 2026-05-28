'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

interface User { id: string; username: string; role: string }

const NAV_BASE = [
  { label: 'Classes',   href: '/admin/classes',  active: true },
  { label: 'Étudiants', href: '/admin/students', active: true },
]
const NAV_ADMIN = [
  { label: 'Profs',     href: '/admin/profs',    active: true },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/api/users/me`, { credentials: 'include' })
      .then(r => {
        if (r.status === 401) { router.push('/login'); return null }
        return r.json()
      })
      .then(data => {
        if (!data) return
        if (data.user.role === 'STUDENT') { router.push('/map'); return }
        setUser(data.user)
      })
      .catch(() => router.push('/login'))
  }, [router])

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-nx-bg">
        <span className="text-nx-text-dim text-sm tracking-wide">Chargement…</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-nx-bg nx-grid-bg flex flex-col">
      {/* Topbar */}
      <header className="h-[52px] sticky top-0 z-10 bg-nx-surface/95 backdrop-blur-sm border-b border-nx-border px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="text-lg font-extrabold tracking-[0.15em] select-none uppercase">
            <span className="text-nx-yellow drop-shadow-[0_0_8px_rgba(245,192,48,0.5)]">N</span>
            <span className="text-nx-yellow drop-shadow-[0_0_8px_rgba(245,192,48,0.5)]">E</span>
            <span className="text-nx-yellow">XUS</span>
          </div>
          <span className="text-nx-border text-sm">|</span>
          <span className="text-nx-text-dim text-xs tracking-widest uppercase">Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-nx-text-dim text-sm font-semibold">{user.username}</span>
          <Link href="/map" className="text-xs text-nx-text-dim hover:text-nx-yellow transition-colors duration-200 tracking-widest uppercase border border-nx-border hover:border-nx-yellow/40 px-3 py-1 rounded-lg">
            ← Carte
          </Link>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <nav className="w-[220px] shrink-0 border-r border-nx-border pt-6 px-3 bg-nx-surface/30">
          <p className="text-[10px] text-nx-text-muted tracking-[0.2em] uppercase px-3 mb-3">Navigation</p>
          {[...NAV_BASE, ...(user.role === 'ADMIN' ? NAV_ADMIN : [])].map(item => {
            const isCurrentPath = item.href && pathname.startsWith(item.href)
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg mb-1 transition-all duration-200 tracking-wide ${
                  isCurrentPath
                    ? 'bg-nx-surface-2 text-nx-yellow border-l-2 border-nx-yellow pl-[10px]'
                    : 'text-nx-text-dim hover:text-nx-text hover:bg-nx-surface-2/60'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
