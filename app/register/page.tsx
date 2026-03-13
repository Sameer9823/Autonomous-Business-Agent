'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        return;
      }

      // Auto-login after register
      const loginRes = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (loginRes?.error) {
        router.push('/login');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-900 grid-bg flex items-center justify-center px-4">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 bg-green-500/20 rounded rotate-45" />
            <div className="absolute inset-1 bg-green-400/80 rounded-sm rotate-12" />
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-green-900 font-mono">AB</span>
          </div>
          <div>
            <div className="font-display font-semibold text-green-300 text-lg leading-none">AutoBizOps</div>
            <div className="text-[9px] font-mono text-green-700 tracking-widest mt-0.5">AGENT v1.0</div>
          </div>
        </div>

        {/* Card */}
        <div className="glow-border rounded-sm bg-surface-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-green-900/20 bg-surface-700">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-mono text-green-700 tracking-widest">CREATE AGENT ACCOUNT</span>
            </div>
          </div>

          <div className="p-6">
            <div className="font-mono text-xs text-green-700 mb-6 space-y-1">
              <div><span className="text-green-500">$</span> autobizops --auth register</div>
              <div className="text-green-900">Creating new agent credentials...</div>
            </div>

            {error && (
              <div className="mb-4 px-3 py-2.5 bg-red-900/20 border border-red-800/40 rounded-sm">
                <p className="text-xs font-mono text-red-400">❌ {error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-green-700 tracking-widest mb-1.5">FULL NAME</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="John Smith"
                  className="w-full bg-black border border-green-900/40 rounded-sm px-3 py-2.5 text-sm font-mono text-green-300 placeholder-green-900 focus:outline-none focus:border-green-600/60 focus:ring-1 focus:ring-green-600/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-green-700 tracking-widest mb-1.5">EMAIL ADDRESS</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="agent@company.com"
                  className="w-full bg-black border border-green-900/40 rounded-sm px-3 py-2.5 text-sm font-mono text-green-300 placeholder-green-900 focus:outline-none focus:border-green-600/60 focus:ring-1 focus:ring-green-600/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-green-700 tracking-widest mb-1.5">PASSWORD</label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Min. 6 characters"
                  className="w-full bg-black border border-green-900/40 rounded-sm px-3 py-2.5 text-sm font-mono text-green-300 placeholder-green-900 focus:outline-none focus:border-green-600/60 focus:ring-1 focus:ring-green-600/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-green-700 tracking-widest mb-1.5">CONFIRM PASSWORD</label>
                <input
                  type="password"
                  required
                  value={form.confirm}
                  onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full bg-black border border-green-900/40 rounded-sm px-3 py-2.5 text-sm font-mono text-green-300 placeholder-green-900 focus:outline-none focus:border-green-600/60 focus:ring-1 focus:ring-green-600/20 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 bg-green-500/20 hover:bg-green-500/30 border border-green-600/40 hover:border-green-500/60 text-green-400 font-mono text-sm tracking-wider rounded-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 border border-green-500 border-t-transparent rounded-full animate-spin" />
                    CREATING ACCOUNT...
                  </>
                ) : (
                  '▶ CREATE ACCOUNT'
                )}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-green-900/20 text-center">
              <span className="text-[11px] font-mono text-green-800">Already have an account? </span>
              <Link href="/login" className="text-[11px] font-mono text-green-600 hover:text-green-400 transition-colors">
                Login here →
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] font-mono text-green-900 mt-4">
          AutoBizOps · TinyFish Web Agent Hackathon
        </p>
      </div>
    </div>
  );
}
