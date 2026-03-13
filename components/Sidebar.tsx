'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Agent Console', icon: '⚡' },
  { href: '/logs', label: 'Execution Logs', icon: '📋' },
  { href: '/results', label: 'Results', icon: '📊' },
];

const workflowTemplates = [
  { label: 'Price Monitor', command: 'Find SaaS CRM competitors and extract pricing', icon: '💹' },
  { label: 'Lead Gen',      command: 'Find B2B SaaS companies and extract contact emails', icon: '🎯' },
  { label: 'Contact Form',  command: 'Submit a demo request on HubSpot website', icon: '📨' },
  { label: 'Research',      command: 'Research top project management tools in 2024', icon: '🔬' },
];

interface SidebarProps {
  /** Called when on the dashboard page — parent handles run directly */
  onTemplateSelect?: (command: string) => void;
}

export default function Sidebar({ onTemplateSelect }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [firing, setFiring] = useState<string | null>(null);

  const handleTemplate = (label: string, command: string) => {
    setFiring(label);
    setTimeout(() => setFiring(null), 600);

    if (pathname === '/dashboard' && onTemplateSelect) {
      // Already on dashboard — let parent fill + run immediately
      onTemplateSelect(command);
    } else {
      // Navigate to dashboard with command pre-loaded in URL
      router.push(`/dashboard?run=${encodeURIComponent(command)}`);
    }
  };

  return (
    <aside className="w-56 flex-shrink-0 border-r border-green-900/20 bg-surface-800 flex flex-col">
      {/* Navigation */}
      <div className="p-3 border-b border-green-900/20">
        <div className="text-[9px] font-mono text-green-800 tracking-widest mb-2 px-2">NAVIGATION</div>
        {navItems.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2.5 px-2 py-2 rounded-sm text-xs font-mono transition-all duration-150 mb-0.5 ${
              pathname === href
                ? 'text-green-300 bg-green-900/30 border border-green-700/30'
                : 'text-green-700 hover:text-green-400 hover:bg-green-900/15'
            }`}
          >
            <span>{icon}</span>
            <span>{label}</span>
          </Link>
        ))}
      </div>

      {/* Quick Templates */}
      <div className="p-3 flex-1">
        <div className="text-[9px] font-mono text-green-800 tracking-widest mb-2 px-2">QUICK WORKFLOWS</div>
        {workflowTemplates.map(({ label, command, icon }) => {
          const isFiring = firing === label;
          return (
            <button
              key={label}
              onClick={() => handleTemplate(label, command)}
              className={`w-full text-left px-2 py-2 rounded-sm text-xs font-mono transition-all duration-150 mb-0.5 flex items-center gap-2 group
                ${isFiring
                  ? 'text-green-300 bg-green-900/30 border border-green-600/40'
                  : 'text-green-600 hover:text-green-300 hover:bg-green-900/20 border border-transparent hover:border-green-900/30'
                }`}
            >
              <span className={`transition-transform duration-150 ${isFiring ? 'translate-x-1' : 'group-hover:translate-x-0.5'}`}>
                {isFiring ? '▶' : '▸'}
              </span>
              <span className="flex-1">{label}</span>
              <span className={`text-sm opacity-0 group-hover:opacity-100 transition-opacity ${isFiring ? 'opacity-100' : ''}`}>
                {icon}
              </span>
            </button>
          );
        })}
      </div>

      {/* System info */}
      <div className="p-3 border-t border-green-900/20">
        <div className="text-[9px] font-mono text-green-900 space-y-1">
          <div className="flex justify-between">
            <span>PROVIDER</span>
            <span className="text-green-700">TinyFish</span>
          </div>
          <div className="flex justify-between">
            <span>AI MODEL</span>
            <span className="text-green-700">Gemini 1.5</span>
          </div>
          <div className="flex justify-between">
            <span>DB</span>
            <span className="text-green-700">MongoDB</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
