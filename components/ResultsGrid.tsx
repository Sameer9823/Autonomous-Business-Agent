'use client';

import { useState, useMemo } from 'react';
import ResultCard, { ResultCardData, WorkflowType } from './ResultCard';
import ResultModal from './ResultModal';

interface ResultsGridProps {
  results: ResultCardData[];
  isLive?: boolean;
}

const FILTER_OPTIONS: Array<{ value: WorkflowType | 'all'; label: string; icon: string }> = [
  { value: 'all',          label: 'ALL',          icon: '⚡' },
  { value: 'price_monitor',label: 'PRICE',        icon: '💹' },
  { value: 'lead_gen',     label: 'LEAD GEN',     icon: '🎯' },
  { value: 'contact_form', label: 'FORM',         icon: '📨' },
  { value: 'research',     label: 'RESEARCH',     icon: '🔬' },
];

export default function ResultsGrid({ results, isLive }: ResultsGridProps) {
  const [filter, setFilter] = useState<WorkflowType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ResultCardData | null>(null);

  const filtered = useMemo(() => {
    let list = [...results].reverse(); // newest first
    if (filter !== 'all') list = list.filter(r => r.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.workflowName.toLowerCase().includes(q) ||
        r.command.toLowerCase().includes(q) ||
        Object.values(r.fields).some(v => v.toLowerCase().includes(q))
      );
    }
    return list;
  }, [results, filter, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: results.length };
    results.forEach(r => { c[r.type] = (c[r.type] || 0) + 1; });
    return c;
  }, [results]);

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Filter tabs */}
        <div className="flex items-center gap-1 flex-wrap">
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-mono tracking-widest rounded-sm border transition-all duration-150 ${
                filter === opt.value
                  ? 'text-green-300 bg-green-900/30 border-green-600/50'
                  : 'text-green-800 border-green-900/30 hover:text-green-500 hover:border-green-700/40'
              }`}
            >
              <span>{opt.icon}</span>
              <span>{opt.label}</span>
              {counts[opt.value] ? (
                <span className={`ml-0.5 ${filter === opt.value ? 'text-green-500' : 'text-green-900'}`}>
                  ({counts[opt.value]})
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs sm:ml-auto">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-green-800 font-mono text-xs">⌕</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search results..."
            className="w-full bg-black border border-green-900/30 focus:border-green-700/50 text-green-400 placeholder:text-green-900 text-xs font-mono pl-7 pr-3 py-1.5 rounded-sm outline-none transition-colors"
          />
        </div>

        {/* Live indicator */}
        {isLive && (
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-green-600 border border-green-800/30 px-2 py-1.5 rounded-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            LIVE
          </div>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="text-4xl opacity-10">📡</div>
            <div className="text-green-700 text-sm font-mono">
              {results.length === 0 ? 'No agent results yet' : 'No results match filters'}
            </div>
            <div className="text-green-900 text-xs font-mono">
              {results.length === 0 ? 'Run an agent workflow from the Dashboard' : 'Try a different filter or search term'}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((card, i) => (
            <ResultCard
              key={card.id}
              data={card}
              index={i}
              onExpand={setSelected}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {selected && (
        <ResultModal data={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
