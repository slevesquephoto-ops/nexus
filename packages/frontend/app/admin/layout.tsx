'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

interface User { id: string; username: string; role: string }

const NAV = [
  { label: 'Classes',   href: '/admin/classes',  active: true },
  { label: 'Étudiants', href: '/admin/students', active: true },
  { label: 'Contenu',   href: null,              active: false },
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
        <span className="text-nx-gray text-sm">Chargement…</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-nx-bg flex flex-col">
      <header className="sticky top-0 z-10 bg-nx-bg/90 backdrop-blur-sm border-b border-nx-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-nx-yellow font-bold text-sm tracking-wide">NEXUS</span>
          <span className="text-nx-border">|</span>
          <span className="text-nx-gray text-sm">Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-nx-gray text-sm">{user.username}</span>
          <Link href="/map" className="text-nx-gray hover:text-white text-sm transition-colors">
            ← Carte
          </Link>
        </div>
      </header>

      <div className="flex flex-1">
        <nav className="w-44 shrink-0 border-r border-nx-border pt-6 px-3">
          {NAV.map(item => {
            const isCurrentPath = item.href && pathname.startsWith(item.href)
            if (!item.active || !item.href) {
              return (
                <div key={item.label} className="px-3 py-2 text-sm text-nx-border rounded-lg mb-1 cursor-not-allowed">
                  {item.label}
                </div>
              )
            }
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`block px-3 py-2 text-sm rounded-lg mb-1 transition-colors ${
                  isCurrentPath
                    ? 'bg-nx-surface text-white border border-nx-border'
                    : 'text-nx-gray hover:text-white hover:bg-nx-surface/50'
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
