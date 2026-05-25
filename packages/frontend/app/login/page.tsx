'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Erreur de connexion');
        return;
      }

      router.push('/map');
    } catch {
      setError('Impossible de contacter le serveur');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-nx-bg flex flex-col items-center justify-center px-4">

      <div className="mb-10 text-5xl font-bold tracking-widest select-none">
        <span className="text-nx-yellow">N</span>
        <span className="text-nx-cyan">E</span>
        <span className="text-white">XUS</span>
      </div>

      <div className="w-full max-w-sm bg-nx-surface border border-nx-border rounded-2xl p-8">
        <h1 className="text-center text-white text-lg font-semibold mb-6 tracking-wide">
          Connexion
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="space-y-1.5">
            <label className="block text-sm text-nx-gray">
              Nom d&apos;utilisateur
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              disabled={loading}
              autoComplete="username"
              placeholder="username"
              className="w-full bg-nx-bg border border-nx-border rounded-lg px-4 py-2.5 text-white placeholder-nx-gray/50 focus:outline-none focus:border-nx-yellow transition-colors disabled:opacity-60"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm text-nx-gray">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full bg-nx-bg border border-nx-border rounded-lg px-4 py-2.5 text-white placeholder-nx-gray/50 focus:outline-none focus:border-nx-yellow transition-colors disabled:opacity-60"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center py-1">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-nx-yellow text-nx-bg font-semibold rounded-lg py-2.5 mt-2 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>

        </form>
      </div>
    </main>
  );
}
