'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import StatusBadge from '@/components/StatusBadge';
import { useRouter } from 'next/navigation';

interface WorkflowSummary {
  workflowId: string;
  workflowName: string;
  command: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  completedSteps: number;
  totalSteps: number;
  agentProvider: string;
}

export default function LogsPage() {
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agent/logs');
      const data = await res.json();
      setWorkflows(data.workflows || []);
    } catch {
      setWorkflows([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetail = async (id: string) => {
    setSelected(id);
    try {
      const res = await fetch(`/api/agent/logs?workflowId=${id}`);
      const data = await res.json();
      setDetail(data as Record<string, unknown>);
    } catch {
      setDetail(null);
    }
  };

  const formatDate = (str: string) => {
    try {
      return new Date(str).toLocaleString();
    } catch {
      return str;
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="min-h-screen bg-surface-900 grid-bg flex flex-col">
      <Navbar />

      <div className="flex flex-1 pt-14">
        <Sidebar />

        <main className="flex-1 p-5 overflow-auto">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="font-display font-semibold text-green-300 text-lg">Execution Logs</h1>
              <p className="text-green-800 text-xs font-mono mt-0.5">History of all agent workflow runs from MongoDB</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-xs font-mono px-3 py-1.5 bg-green-500/20 border border-green-600/40 text-green-400 hover:bg-green-500/30 rounded-sm transition-all"
              >
                ▶ RUN NEW AGENT
              </button>
              <button
                onClick={fetchWorkflows}
                className="text-xs font-mono px-3 py-1.5 border border-green-900/40 text-green-700 hover:text-green-400 hover:border-green-600/40 rounded-sm transition-all"
              >
                ↺ REFRESH
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64 text-green-700 font-mono text-sm">
              <span className="w-4 h-4 border border-green-500 border-t-transparent rounded-full animate-spin mr-3" />
              Loading workflows from MongoDB...
            </div>
          ) : workflows.length === 0 ? (
            <div className="glow-border rounded-sm bg-surface-800 p-16 text-center">
              <div className="text-green-900 text-xs font-mono space-y-2">
                <div className="text-4xl opacity-10 mb-4">📋</div>
                <div className="text-green-600 text-sm">No workflow runs yet</div>
                <div className="text-green-900 text-xs">Run an agent workflow from the Dashboard to see logs here</div>
                <div className="text-[10px] text-green-900 mt-2 opacity-50">Note: Requires MongoDB connection for persistent storage</div>
              </div>
            </div>
          ) : (
            <div className="flex gap-4">
              {/* List */}
              <div className="flex-1 min-w-0">
                <div className="glow-border rounded-sm bg-surface-800 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-green-900/20 bg-surface-700">
                    <span className="text-[10px] font-mono text-green-800 tracking-widest">
                      WORKFLOW HISTORY — {workflows.length} RUNS
                    </span>
                  </div>
                  <div className="divide-y divide-green-900/10">
                    {workflows.map((wf) => (
                      <button
                        key={wf.workflowId}
                        onClick={() => fetchDetail(wf.workflowId)}
                        className={`w-full text-left px-4 py-3 hover:bg-green-900/10 transition-all ${
                          selected === wf.workflowId ? 'bg-green-900/15 border-l-2 border-green-500' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-mono text-green-400 font-medium">{wf.workflowName || 'Unnamed Workflow'}</span>
                          <StatusBadge status={wf.status === 'completed' ? 'completed' : wf.status === 'failed' ? 'failed' : wf.status as 'running' | 'pending'} size="sm" />
                        </div>
                        <div className="text-xs font-mono text-green-700 truncate mb-1">{wf.command}</div>
                        <div className="flex items-center gap-4 text-[10px] font-mono text-green-900">
                          <span>{formatDate(wf.startedAt)}</span>
                          <span>{wf.completedSteps}/{wf.totalSteps} steps</span>
                          <span>{formatDuration(wf.durationMs)}</span>
                          <span className="uppercase">{wf.agentProvider}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Detail panel */}
              {selected && detail && (
                <div className="w-96 flex-shrink-0">
                  <div className="glow-border rounded-sm bg-surface-800">
                    <div className="px-4 py-2.5 border-b border-green-900/20 bg-surface-700 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-green-800 tracking-widest">WORKFLOW DETAIL</span>
                      <button onClick={() => setSelected(null)} className="text-green-900 hover:text-green-600 text-xs font-mono">✕</button>
                    </div>
                    <div className="p-4 max-h-96 overflow-y-auto">
                      <pre className="text-[10px] font-mono text-green-700 whitespace-pre-wrap break-all leading-relaxed">
                        {JSON.stringify(detail, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}