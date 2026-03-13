'use client';

import { useEffect, useRef } from 'react';
import { ResultCardData } from './ResultCard';

interface ResultModalProps {
  data: ResultCardData;
  onClose: () => void;
}

const actionIcons: Record<string, string> = {
  navigate: '🌐', search: '🔍', click: '👆', extract: '📤',
  fill_form: '📝', submit: '✉️', save: '💾', wait: '⏳',
};

const logColors: Record<string, string> = {
  system: 'text-blue-400', info: 'text-green-500',
  success: 'text-green-300', error: 'text-red-400', warning: 'text-yellow-400',
};

function formatTime(ts: string) {
  try { return new Date(ts).toISOString().substring(11, 23); } catch { return ''; }
}

function isUrl(val: string): boolean {
  return /^https?:\/\//i.test(val) || /^www\./i.test(val);
}
function toHref(val: string): string {
  return val.startsWith('http') ? val : `https://${val}`;
}
function isEmail(val: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
}
function hostLabel(url: string): string {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return url; }
}

/** Render a cell value — URLs become links, emails become mailto */
function SmartValue({ val, highlight = false }: { val: string; highlight?: boolean }) {
  if (!val || val === '—') return <span className="text-green-900">—</span>;
  if (isUrl(val)) return (
    <a href={toHref(val)} target="_blank" rel="noopener noreferrer"
      className="text-emerald-400 underline decoration-dotted underline-offset-2 hover:text-emerald-300 transition-colors break-all">
      {val} ↗
    </a>
  );
  if (isEmail(val)) return (
    <a href={`mailto:${val}`}
      className="text-cyan-400 underline decoration-dotted underline-offset-2 hover:text-cyan-300 transition-colors">
      {val}
    </a>
  );
  return (
    <span className={highlight ? 'text-emerald-400 font-medium' : 'text-green-600'}>
      {val}
    </span>
  );
}

export default function ResultModal({ data, onClose }: ResultModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const fields = Object.entries(data.fields);
  const extracts = data.extracts || [];
  const hasExtracts = extracts.some(e => e.data && e.data.length > 0);

  // Collect all unique source URLs from extracts
  const allSources = extracts
    .filter(e => e.source)
    .map(e => ({ name: e.competitor_name || e.company_name || hostLabel(e.source!), url: e.source! }));

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-black border border-green-700/40 rounded-sm shadow-2xl shadow-green-900/30 flex flex-col overflow-hidden">

        {/* Top scanline */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-green-500/80 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-green-900/30 bg-green-950/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
            </div>
            <span className="text-[10px] font-mono text-green-700 tracking-widest">WORKFLOW DETAIL</span>
            <span className="text-xs font-mono text-green-400 font-medium">{data.workflowName}</span>
          </div>
          <button
            onClick={onClose}
            className="text-green-800 hover:text-green-400 font-mono text-sm transition-colors w-6 h-6 flex items-center justify-center border border-green-900/40 hover:border-green-600/40 rounded-sm"
          >✕</button>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* Meta row */}
          <div className="grid grid-cols-3 gap-px border-b border-green-900/20 bg-green-900/10">
            {[
              { label: 'STATUS',    value: data.status.toUpperCase() },
              { label: 'DURATION',  value: data.durationMs ? `${(data.durationMs / 1000).toFixed(2)}s` : '—' },
              { label: 'TIMESTAMP', value: new Date(data.timestamp).toLocaleTimeString() },
            ].map(({ label, value }) => (
              <div key={label} className="px-5 py-3 bg-black/40">
                <div className="text-[9px] font-mono text-green-900 tracking-widest mb-1">{label}</div>
                <div className="text-sm font-mono text-green-400">{value}</div>
              </div>
            ))}
          </div>

          {/* Command */}
          <div className="px-5 py-3 border-b border-green-900/20">
            <div className="text-[9px] font-mono text-green-900 tracking-widest mb-1.5">COMMAND</div>
            <div className="flex items-center gap-2 bg-green-950/20 border border-green-900/20 rounded-sm px-3 py-2">
              <span className="text-green-700 font-mono text-sm shrink-0">$</span>
              <span className="text-green-300 font-mono text-sm">{data.command}</span>
            </div>
          </div>

          {/* Source links — clickable pills */}
          {allSources.length > 0 && (
            <div className="px-5 py-3 border-b border-green-900/20">
              <div className="text-[9px] font-mono text-green-900 tracking-widest mb-2">SOURCE URLS</div>
              <div className="flex flex-wrap gap-2">
                {allSources.map((src, i) => (
                  <a
                    key={i}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 px-3 py-1.5 rounded-sm hover:bg-emerald-900/30 hover:border-emerald-600/50 transition-all group/link"
                  >
                    <span className="text-emerald-700 group-hover/link:text-emerald-500 transition-colors">↗</span>
                    <span className="font-medium">{src.name}</span>
                    <span className="text-emerald-800 text-[9px]">{hostLabel(src.url)}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Summary fields — URLs and emails are clickable */}
          {fields.length > 0 && (
            <div className="px-5 py-4 border-b border-green-900/20">
              <div className="text-[9px] font-mono text-green-900 tracking-widest mb-3">SUMMARY</div>
              <div className="grid grid-cols-2 gap-2">
                {fields.map(([key, val]) => (
                  <div key={key} className="bg-green-950/20 border border-green-900/20 rounded-sm px-3 py-2">
                    <div className="text-[9px] font-mono text-green-800 uppercase tracking-widest mb-0.5">
                      {key.replace(/_/g, ' ')}
                    </div>
                    <div className="text-xs font-mono break-all font-medium">
                      {isUrl(val) ? (
                        <a href={toHref(val)} target="_blank" rel="noopener noreferrer"
                          className="text-emerald-400 underline decoration-dotted underline-offset-2 hover:text-emerald-300 transition-colors">
                          {val} ↗
                        </a>
                      ) : isEmail(val) ? (
                        <a href={`mailto:${val}`}
                          className="text-cyan-400 underline decoration-dotted underline-offset-2 hover:text-cyan-300 transition-colors">
                          {val}
                        </a>
                      ) : (
                        <span className="text-green-300">{val || '—'}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extracted data tables — with clickable source link in header */}
          {hasExtracts && (
            <div className="px-5 py-4 border-b border-green-900/20">
              <div className="text-[9px] font-mono text-green-900 tracking-widest mb-3">EXTRACTED DATA</div>
              <div className="space-y-4">
                {extracts.filter(e => e.data && e.data.length > 0).map((extract, ei) => {
                  const cols = extract.data && extract.data[0]
                    ? Object.keys(extract.data[0]).filter(k => k !== '_id')
                    : [];
                  const headerName = extract.competitor_name || extract.company_name || hostLabel(extract.source || '') || `Extract ${ei + 1}`;

                  return (
                    <div key={ei} className="border border-green-900/30 rounded-sm overflow-hidden">
                      {/* Table header with clickable source link */}
                      <div className="flex items-center justify-between px-3 py-2 bg-green-950/50 border-b border-green-900/30">
                        <span className="text-[10px] font-mono text-green-400 font-medium">{headerName}</span>
                        {extract.source && (
                          <a
                            href={extract.source}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[9px] font-mono text-emerald-600 hover:text-emerald-400 underline decoration-dotted underline-offset-2 transition-colors"
                          >
                            <span>{hostLabel(extract.source)}</span>
                            <span>↗</span>
                          </a>
                        )}
                      </div>

                      <table className="w-full">
                        <thead className="border-b border-green-900/20 bg-black/30">
                          <tr>
                            {cols.map(col => (
                              <th key={col} className="text-left text-[8px] font-mono text-green-800 uppercase tracking-widest px-3 py-1.5">
                                {col.replace(/_/g, ' ')}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(extract.data || []).map((row, ri) => (
                            <tr key={ri} className="border-b border-green-900/10 last:border-0 hover:bg-green-950/20 transition-colors">
                              {cols.map((col, ci) => (
                                <td key={col} className={`text-[10px] font-mono px-3 py-1.5 ${ci === 0 ? 'text-green-300 font-medium' : ''}`}>
                                  <SmartValue
                                    val={row[col] || '—'}
                                    highlight={col === 'price' || col === 'email'}
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Agent steps */}
          {data.steps && data.steps.length > 0 && (
            <div className="px-5 py-4 border-b border-green-900/20">
              <div className="text-[9px] font-mono text-green-900 tracking-widest mb-3">AGENT STEPS EXECUTED</div>
              <div className="space-y-1.5">
                {data.steps.map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-green-900 w-5 text-right shrink-0">{step.step}.</span>
                    <span className="shrink-0">{actionIcons[step.action] || '⚡'}</span>
                    <span className="text-[10px] font-mono text-green-500 uppercase shrink-0 w-14">{step.action}</span>
                    <span className="text-[10px] font-mono text-green-700 flex-1 truncate">{step.description}</span>
                    <span className={`ml-auto shrink-0 text-[9px] font-mono ${step.status === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                      {step.status === 'success' ? '✓' : '✗'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Console logs */}
          {data.logs && data.logs.length > 0 && (
            <div className="px-5 py-4">
              <div className="text-[9px] font-mono text-green-900 tracking-widest mb-3">EXECUTION CONSOLE</div>
              <div className="bg-black border border-green-900/20 rounded-sm p-3 max-h-48 overflow-y-auto space-y-0.5">
                {data.logs.map((log, i) => (
                  <div key={i} className="flex gap-2 text-[10px] font-mono leading-relaxed">
                    <span className="text-green-900 shrink-0">{formatTime(log.timestamp)}</span>
                    <span className={`shrink-0 ${logColors[log.level] || 'text-green-600'}`}>
                      [{log.level.substring(0, 3).toUpperCase()}]
                    </span>
                    <span className={`${logColors[log.level] || 'text-green-600'} break-all`}>{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-green-900/20 bg-black/60 shrink-0">
          <span className="text-[9px] font-mono text-green-900">ID: {data.workflowId}</span>
          <div className="flex items-center gap-3">
            {allSources.length === 1 && (
              <a
                href={allSources[0].url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono px-4 py-1.5 border border-emerald-800/40 text-emerald-500 hover:bg-emerald-900/20 hover:border-emerald-600/40 rounded-sm transition-all"
              >
                OPEN SOURCE ↗
              </a>
            )}
            <button
              onClick={onClose}
              className="text-xs font-mono px-4 py-1.5 border border-green-700/40 text-green-500 hover:bg-green-900/20 rounded-sm transition-all"
            >
              CLOSE
            </button>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-green-500/50 to-transparent" />
      </div>
    </div>
  );
}
