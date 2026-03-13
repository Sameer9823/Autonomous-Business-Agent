'use client';

import { useState } from 'react';

export type WorkflowType = 'price_monitor' | 'lead_gen' | 'contact_form' | 'research' | 'unknown';

export interface ResultCardData {
  id: string;
  workflowId: string;
  type: WorkflowType;
  workflowName: string;
  command: string;
  status: 'completed' | 'failed' | 'running';
  timestamp: string;
  durationMs?: number;
  fields: Record<string, string>;
  steps?: Array<{ step: number; action: string; description: string; status: string }>;
  logs?: Array<{ message: string; level: string; timestamp: string }>;
  extracts?: Array<{
    competitor_name?: string;
    competitor_domain?: string;
    company_name?: string;
    company_domain?: string;
    plans_found?: number;
    source?: string;
    data?: Array<Record<string, string>>;
  }>;
}

interface ResultCardProps {
  data: ResultCardData;
  index: number;
  onExpand: (data: ResultCardData) => void;
}

const typeConfig: Record<WorkflowType, {
  icon: string; label: string; color: string;
  borderColor: string; glowColor: string; accentBg: string; accentHex: string;
}> = {
  price_monitor: { icon: '💹', label: 'PRICE MONITOR', color: 'text-emerald-400', borderColor: 'border-emerald-500/40', glowColor: 'hover:shadow-emerald-500/20', accentBg: 'bg-emerald-400', accentHex: '#34d399' },
  lead_gen:      { icon: '🎯', label: 'LEAD GEN',      color: 'text-cyan-400',    borderColor: 'border-cyan-500/40',    glowColor: 'hover:shadow-cyan-500/20',    accentBg: 'bg-cyan-400',    accentHex: '#22d3ee' },
  contact_form:  { icon: '📨', label: 'FORM SUBMIT',   color: 'text-violet-400',  borderColor: 'border-violet-500/40',  glowColor: 'hover:shadow-violet-500/20',  accentBg: 'bg-violet-400',  accentHex: '#a78bfa' },
  research:      { icon: '🔬', label: 'RESEARCH',      color: 'text-amber-400',   borderColor: 'border-amber-500/40',   glowColor: 'hover:shadow-amber-500/20',   accentBg: 'bg-amber-400',   accentHex: '#fbbf24' },
  unknown:       { icon: '⚡', label: 'WORKFLOW',      color: 'text-green-400',   borderColor: 'border-green-500/40',   glowColor: 'hover:shadow-green-500/20',   accentBg: 'bg-green-400',   accentHex: '#4ade80' },
};

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/** Detect if a string value looks like a URL */
function isUrl(val: string): boolean {
  return /^https?:\/\//i.test(val) || /^www\./i.test(val);
}

/** Ensure URL has protocol */
function toHref(val: string): string {
  return val.startsWith('http') ? val : `https://${val}`;
}

/** Get the primary source URL for a card (pricing page, contact page, etc.) */
function getPrimaryLink(data: ResultCardData): string | null {
  // From extracts — most authoritative
  if (data.extracts && data.extracts.length > 0) {
    const src = data.extracts[0].source;
    if (src) return src;
    const dom = data.extracts[0].competitor_domain || data.extracts[0].company_domain;
    if (dom) return `https://${dom}/pricing`;
  }
  // From fields
  for (const val of Object.values(data.fields)) {
    if (isUrl(val)) return toHref(val);
  }
  return null;
}

export default function ResultCard({ data, index, onExpand }: ResultCardProps) {
  const [hovered, setHovered] = useState(false);
  const cfg = typeConfig[data.type] || typeConfig.unknown;
  const entries = Object.entries(data.fields).slice(0, 4);
  const showPlansTable = data.type === 'price_monitor' && hovered && data.extracts && data.extracts.length > 0;
  const primaryLink = getPrimaryLink(data);

  // Collect all source links from extracts
  const sourceLinks: { label: string; url: string }[] = (data.extracts || [])
    .filter(e => e.source)
    .map(e => ({
      label: e.competitor_name || e.company_name || e.competitor_domain || e.company_domain || new URL(e.source!).hostname.replace('www.', ''),
      url: e.source!,
    }));

  return (
    <div
      className={`
        group relative bg-black border ${cfg.borderColor} rounded-sm cursor-pointer
        transition-all duration-300 ease-out
        hover:shadow-lg ${cfg.glowColor} hover:-translate-y-1
        overflow-hidden
      `}
      style={{ animationDelay: `${index * 80}ms` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onExpand(data)}
    >
      {/* Scan line */}
      {hovered && (
        <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-green-400/60 to-transparent pointer-events-none z-10"
          style={{ top: '50%' }} />
      )}

      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-6 h-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-0 h-0 border-l-[24px] border-b-[24px] border-l-transparent opacity-30"
          style={{ borderBottomColor: cfg.accentHex }} />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between p-4 pb-3 border-b border-green-900/20">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xl shrink-0">{cfg.icon}</span>
          <div className="min-w-0">
            <div className={`text-[9px] font-mono tracking-[0.2em] ${cfg.color} mb-0.5`}>{cfg.label}</div>
            <div className="text-xs font-mono text-green-300 font-medium truncate max-w-[180px]">
              {data.workflowName}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <StatusDot status={data.status} />
          {data.durationMs && (
            <span className="text-[9px] font-mono text-green-900">{(data.durationMs / 1000).toFixed(1)}s</span>
          )}
        </div>
      </div>

      {/* Data fields — URLs become clickable links */}
      <div className="p-4 pb-3 space-y-2">
        {entries.map(([key, val]) => {
          const looksLikeUrl = isUrl(val);
          const href = looksLikeUrl ? toHref(val) : null;
          const isEmail = val.includes('@') && val.includes('.');

          return (
            <div key={key} className="flex items-start gap-2">
              <span className="text-[9px] font-mono text-green-800 uppercase tracking-widest w-20 shrink-0 pt-0.5">
                {key.replace(/_/g, ' ')}
              </span>
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className={`text-xs font-mono ${cfg.color} truncate flex-1 font-medium underline decoration-dotted underline-offset-2 hover:opacity-80 transition-opacity`}
                  title={val}
                >
                  {val}
                </a>
              ) : isEmail ? (
                <a
                  href={`mailto:${val}`}
                  onClick={e => e.stopPropagation()}
                  className={`text-xs font-mono ${cfg.color} truncate flex-1 font-medium underline decoration-dotted underline-offset-2 hover:opacity-80 transition-opacity`}
                  title={val}
                >
                  {val}
                </a>
              ) : (
                <span className={`text-xs font-mono ${cfg.color} truncate flex-1 font-medium`} title={val}>
                  {val || '—'}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Source links row — always visible when extracts have URLs */}
      {sourceLinks.length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {sourceLinks.map((link, i) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className={`inline-flex items-center gap-1 text-[9px] font-mono ${cfg.color} bg-green-950/40 border border-green-900/30 px-2 py-0.5 rounded-sm hover:bg-green-900/40 hover:border-green-700/50 transition-all`}
              title={link.url}
            >
              <span>↗</span>
              <span>{link.label}</span>
            </a>
          ))}
        </div>
      )}

      {/* Plans mini-table on hover */}
      {showPlansTable && data.extracts && (
        <div className="mx-4 mb-3 border border-green-900/30 rounded-sm overflow-hidden">
          {data.extracts.slice(0, 2).map((extract, ei) => (
            <div key={ei}>
              {extract.competitor_name && (
                <div className={`flex items-center justify-between px-2 py-1 ${cfg.color} bg-green-950/40 border-b border-green-900/20`}>
                  <span className="text-[9px] font-mono tracking-widest">{extract.competitor_name}</span>
                  {extract.source && (
                    <a
                      href={extract.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-[8px] font-mono opacity-60 hover:opacity-100 underline decoration-dotted"
                    >
                      {new URL(extract.source).hostname.replace('www.', '')} ↗
                    </a>
                  )}
                </div>
              )}
              <table className="w-full">
                <thead>
                  <tr className="border-b border-green-900/20">
                    <th className="text-left text-[8px] font-mono text-green-800 px-2 py-1">PLAN</th>
                    <th className="text-left text-[8px] font-mono text-green-800 px-2 py-1">PRICE</th>
                  </tr>
                </thead>
                <tbody>
                  {(extract.data || []).map((plan, pi) => (
                    <tr key={pi} className="border-b border-green-900/10 last:border-0">
                      <td className="text-[9px] font-mono text-green-400 px-2 py-0.5">{plan.plan_name}</td>
                      <td className={`text-[9px] font-mono ${cfg.color} px-2 py-0.5 font-medium`}>{plan.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Footer — primary link + expand button */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-green-900/15 bg-green-950/20">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-green-900">{timeAgo(data.timestamp)}</span>
          {primaryLink && (
            <a
              href={primaryLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className={`text-[9px] font-mono ${cfg.color} opacity-0 group-hover:opacity-70 hover:!opacity-100 transition-opacity underline decoration-dotted underline-offset-2`}
              title={primaryLink}
            >
              view source ↗
            </a>
          )}
        </div>
        <button
          className={`text-[9px] font-mono ${cfg.color} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1`}
          onClick={(e) => { e.stopPropagation(); onExpand(data); }}
        >
          EXPAND ↗
        </button>
      </div>

      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${cfg.accentBg} opacity-60 group-hover:opacity-100 transition-opacity`} />
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  if (status === 'completed') return (
    <span className="inline-flex items-center gap-1 text-[9px] font-mono text-green-400 bg-green-900/20 border border-green-700/30 px-1.5 py-0.5 rounded-sm">
      <span className="w-1 h-1 rounded-full bg-green-400" />DONE
    </span>
  );
  if (status === 'failed') return (
    <span className="inline-flex items-center gap-1 text-[9px] font-mono text-red-400 bg-red-900/20 border border-red-700/30 px-1.5 py-0.5 rounded-sm">
      <span className="w-1 h-1 rounded-full bg-red-400" />FAIL
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-mono text-yellow-400 bg-yellow-900/20 border border-yellow-700/30 px-1.5 py-0.5 rounded-sm">
      <span className="w-1 h-1 rounded-full bg-yellow-400 animate-pulse" />RUN
    </span>
  );
}
