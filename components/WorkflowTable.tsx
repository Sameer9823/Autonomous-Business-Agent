'use client';

import StatusBadge from './StatusBadge';

interface StepResult {
  step: number;
  action: string;
  target: string;
  status: 'success' | 'error' | 'skipped';
  message: string;
  durationMs: number;
  data?: Record<string, unknown>;
}

interface WorkflowTableProps {
  results: StepResult[];
  workflowName?: string;
  totalSteps?: number;
  completedSteps?: number;
  durationMs?: number;
}

const actionIcons: Record<string, string> = {
  navigate: '🌐',
  search: '🔍',
  click: '👆',
  extract: '📤',
  fill_form: '📝',
  submit: '✉️',
  save: '💾',
  wait: '⏳',
};

function truncate(str: string, len: number) {
  if (!str) return '-';
  return str.length > len ? str.substring(0, len) + '…' : str;
}

export default function WorkflowTable({ results, workflowName, totalSteps, completedSteps, durationMs }: WorkflowTableProps) {
  if (!results || results.length === 0) {
    return (
      <div className="glow-border rounded-sm bg-surface-800 p-8 text-center">
        <div className="text-green-900 text-xs font-mono space-y-1">
          <div className="text-xl opacity-20 mb-2">📋</div>
          <div>No results yet</div>
          <div className="text-[10px] opacity-50">Run an agent workflow to see results</div>
        </div>
      </div>
    );
  }

  return (
    <div className="glow-border rounded-sm bg-surface-800 overflow-hidden">
      {/* Table header */}
      {workflowName && (
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-green-900/20 bg-surface-700">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-green-800 tracking-widest">WORKFLOW RESULTS</span>
            <span className="text-xs font-mono text-green-500">{workflowName}</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-mono text-green-800">
            {completedSteps !== undefined && totalSteps && (
              <span>{completedSteps}/{totalSteps} steps</span>
            )}
            {durationMs && <span>{(durationMs / 1000).toFixed(1)}s</span>}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-green-900/20 text-green-800 text-[10px] tracking-widest">
              <th className="text-left px-4 py-2">#</th>
              <th className="text-left px-4 py-2">ACTION</th>
              <th className="text-left px-4 py-2">TARGET</th>
              <th className="text-left px-4 py-2">DESCRIPTION</th>
              <th className="text-left px-4 py-2">STATUS</th>
              <th className="text-right px-4 py-2">TIME</th>
            </tr>
          </thead>
          <tbody>
            {results.map((row, idx) => (
              <tr
                key={idx}
                className="border-b border-green-900/10 hover:bg-green-900/5 transition-colors"
              >
                <td className="px-4 py-2.5 text-green-800">{String(row.step).padStart(2, '0')}</td>
                <td className="px-4 py-2.5">
                  <span className="flex items-center gap-1.5 text-green-500">
                    <span>{actionIcons[row.action] || '⚡'}</span>
                    <span className="uppercase">{row.action}</span>
                  </span>
                </td>
                <td className="px-4 py-2.5 text-green-700">{truncate(row.target, 30)}</td>
                <td className="px-4 py-2.5 text-green-400">{truncate(row.message, 45)}</td>
                <td className="px-4 py-2.5">
                  <StatusBadge
                    status={row.status === 'success' ? 'completed' : row.status === 'error' ? 'failed' : 'pending'}
                    size="sm"
                  />
                </td>
                <td className="px-4 py-2.5 text-right text-green-800">
                  {row.durationMs > 0 ? `${row.durationMs}ms` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
