'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    setMenuOpen(false);
    await signOut({ callbackUrl: '/login' });
  };

  const initials = session?.user?.name
    ? session.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-green-900/30 bg-surface-900/80 backdrop-blur-md">
      <div className="flex items-center justify-between px-6 h-14">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 bg-green-500/20 rounded rotate-45 group-hover:rotate-90 transition-transform duration-300" />
            <div className="absolute inset-1 bg-green-400/80 rounded-sm rotate-12 group-hover:rotate-45 transition-transform duration-300" />
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-green-900 font-mono">AB</span>
          </div>
          <div>
            <div className="font-display font-semibold text-sm text-green-300 leading-none">AutoBizOps</div>
            <div className="text-[9px] font-mono text-green-700 tracking-widest leading-none mt-0.5">AGENT v1.0</div>
          </div>
        </Link>

        {/* Center nav */}
        <div className="flex items-center gap-1">
          {[
            { href: '/',          label: 'HOME'      },
            { href: '/dashboard', label: 'DASHBOARD' },
            { href: '/logs',      label: 'LOGS'      },
            { href: '/results',   label: 'RESULTS'   },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 text-xs font-mono tracking-wider transition-all duration-200 rounded-sm ${
                pathname === href
                  ? 'text-green-400 bg-green-900/30 border border-green-700/40'
                  : 'text-green-700 hover:text-green-400 hover:bg-green-900/20'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono text-green-700">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span>ONLINE</span>
          </div>
          <a
            href="https://tinyfish.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-green-800 hover:text-green-500 transition-colors border border-green-900/40 hover:border-green-600/40 px-2 py-1 rounded-sm"
          >
            TinyFish API ↗
          </a>

          {/* Auth */}
          {status === 'loading' ? (
            <div className="w-7 h-7 rounded-sm border border-green-900/40 bg-green-900/10 animate-pulse" />
          ) : session ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="flex items-center gap-2 px-2 py-1 rounded-sm border border-green-900/40 hover:border-green-700/40 bg-green-900/10 hover:bg-green-900/20 transition-all group"
              >
                <div className="w-6 h-6 rounded-sm bg-green-500/30 border border-green-600/40 flex items-center justify-center">
                  <span className="text-[9px] font-bold font-mono text-green-300">{initials}</span>
                </div>
                <span className="text-xs font-mono text-green-600 hidden sm:block max-w-[100px] truncate">
                  {session.user?.name || session.user?.email}
                </span>
                <span className="text-green-800 text-[10px]">{menuOpen ? '▲' : '▼'}</span>
              </button>

              {menuOpen && (
                <>
                  <div className="absolute right-0 top-full mt-1.5 w-52 bg-surface-800 border border-green-900/30 rounded-sm shadow-xl shadow-black/50 z-50">
                    <div className="px-4 py-3 border-b border-green-900/20">
                      <div className="text-xs font-mono text-green-400 truncate">{session.user?.name}</div>
                      <div className="text-[10px] font-mono text-green-800 truncate mt-0.5">{session.user?.email}</div>
                    </div>
                    <div className="py-1">
                      {[
                        { href: '/dashboard', icon: '▶', label: 'Dashboard' },
                        { href: '/results',   icon: '◈', label: 'My Results' },
                        { href: '/logs',      icon: '≡', label: 'Logs'       },
                      ].map(({ href, icon, label }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-mono text-green-700 hover:text-green-400 hover:bg-green-900/20 transition-all"
                        >
                          <span>{icon}</span> {label}
                        </Link>
                      ))}
                    </div>
                    <div className="border-t border-green-900/20 py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-mono text-red-700 hover:text-red-400 hover:bg-red-900/10 transition-all"
                      >
                        <span>⏻</span> Logout
                      </button>
                    </div>
                  </div>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-xs font-mono px-3 py-1.5 border border-green-900/40 text-green-700 hover:text-green-400 hover:border-green-600/40 rounded-sm transition-all"
              >
                LOGIN
              </Link>
              <Link
                href="/register"
                className="text-xs font-mono px-3 py-1.5 bg-green-500/20 border border-green-600/40 text-green-400 hover:bg-green-500/30 rounded-sm transition-all"
              >
                REGISTER
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
