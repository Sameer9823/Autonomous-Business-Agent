'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

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
            { href: '/', label: 'HOME' },
            { href: '/dashboard', label: 'DASHBOARD' },
            { href: '/logs', label: 'LOGS' },
            { href: '/results', label: 'RESULTS' },
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
        </div>
      </div>
    </nav>
  );
}
