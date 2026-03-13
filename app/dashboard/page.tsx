'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import CommandInput from '@/components/CommandInput';
import AgentConsole, { ConsoleEntry } from '@/components/AgentConsole';
import WorkflowTable from '@/components/WorkflowTable';
import StatusBadge from '@/components/StatusBadge';

type AgentStatus = 'idle' | 'running' | 'completed' | 'failed';

interface StepResult {
  step: number;
  action: string;
  target: string;
  status: 'success' | 'error' | 'skipped';
  message: string;
  durationMs: number;
  data?: Record<string, unknown>;
}

interface WorkflowResult {
  workflowId: string;
  workflowName: string;
  status: string;
  totalSteps: number;
  completedSteps: number;
  durationMs: number;
  results: StepResult[];
  provider: string;
}

// ── Inner component that uses useSearchParams ──
function DashboardContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<AgentStatus>('idle');
  const [logs, setLogs] = useState<ConsoleEntry[]>([]);
  const [workflowId, setWorkflowId] = useState<string | undefined>();
  const [workflowResult, setWorkflowResult] = useState<WorkflowResult | null>(null);
  const [command, setCommand] = useState('');
  const [logOffset, setLogOffset] = useState(0);
  const [currentCommand, setCurrentCommand] = useState('');
  const logOffsetRef = useRef(0);

  // ── On mount: check for ?run= query param and auto-execute ──
  useEffect(() => {
    const runCmd = searchParams?.get('run');
    if (runCmd) {
      const decoded = decodeURIComponent(runCmd);
      setCommand(decoded);
      setTimeout(() => handleRunAgent(decoded), 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep ref in sync so pollLogs closure always has current value
  useEffect(() => { logOffsetRef.current = logOffset; }, [logOffset]);

  // ── Poll for logs while running ──
  const pollLogs = useCallback(async (wfId: string) => {
    try {
      const res = await fetch(`/api/agent/logs?workflowId=${wfId}&since=${logOffsetRef.current}`);
      const data = await res.json();

      if (data.logs && data.logs.length > 0) {
        setLogs(prev => [
          ...prev,
          ...data.logs.map((l: { timestamp: string; level: string; message: string; step?: number }) => ({
            timestamp: new Date(l.timestamp),
            level: l.level as ConsoleEntry['level'],
            message: l.message,
            step: l.step,
          })),
        ]);
        logOffsetRef.current += data.logs.length;
        setLogOffset(logOffsetRef.current);
      }

      if (data.status === 'completed' || data.status === 'failed') {
        setStatus(data.status as AgentStatus);
        if (data.result) setWorkflowResult(data.result as WorkflowResult);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (!workflowId || status !== 'running') return;
    const interval = setInterval(async () => {
      const done = await pollLogs(workflowId);
      if (done) clearInterval(interval);
    }, 600);
    return () => clearInterval(interval);
  }, [workflowId, status, pollLogs]);

  // ── Core run handler ──
  const handleRunAgent = async (cmd: string) => {
    if (!cmd.trim() || cmd.trim().length < 5) return;
    setStatus('running');
    setLogs([]);
    logOffsetRef.current = 0;
    setLogOffset(0);
    setWorkflowResult(null);
    setCurrentCommand(cmd);
    setCommand(cmd);

    setLogs([{
      timestamp: new Date(),
      level: 'system',
      message: '🚀 Sending command to AutoBizOps Agent...',
    }]);

    try {
      const res = await fetch('/api/agent/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start agent');

      setWorkflowId(data.workflowId);
      setLogs(prev => [...prev, {
        timestamp: new Date(),
        level: 'success',
        message: `✅ Agent started — Workflow ID: ${data.workflowId}`,
      }]);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      setStatus('failed');
      setLogs(prev => [...prev, {
        timestamp: new Date(),
        level: 'error',
        message: `❌ Failed to start agent: ${msg}`,
      }]);
    }
  };

  // ── Sidebar template click: fill input AND run immediately ──
  const handleTemplateSelect = (cmd: string) => {
    if (status === 'running') return;
    setCommand(cmd);
    handleRunAgent(cmd);
  };

  const handleReset = () => {
    setStatus('idle');
    setLogs([]);
    setWorkflowResult(null);
    setWorkflowId(undefined);
    logOffsetRef.current = 0;
    setLogOffset(0);
    setCurrentCommand('');
    setCommand('');
  };

  return (
    <div className="min-h-screen bg-surface-900 grid-bg flex flex-col">
      <Navbar />

      <div className="flex flex-1 pt-14">
        <Sidebar onTemplateSelect={handleTemplateSelect} />

        <main className="flex-1 p-5 overflow-hidden flex flex-col gap-4">
          {/* Page header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display font-semibold text-green-300 text-lg">Agent Console</h1>
              <p className="text-green-800 text-xs font-mono mt-0.5">
                {currentCommand ? `→ "${currentCommand}"` : 'Enter a command or click a Quick Workflow to start'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={status} size="md" />
              {(status === 'completed' || status === 'failed') && (
                <button
                  onClick={handleReset}
                  className="text-xs font-mono px-3 py-1.5 border border-green-900/40 text-green-700 hover:text-green-400 hover:border-green-600/40 rounded-sm transition-all"
                >
                  ↺ RESET
                </button>
              )}
            </div>
          </div>

          {/* Stats row */}
          {workflowResult && (
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'WORKFLOW', value: workflowResult.workflowName },
                { label: 'STEPS',    value: `${workflowResult.completedSteps}/${workflowResult.totalSteps}` },
                { label: 'DURATION', value: `${(workflowResult.durationMs / 1000).toFixed(1)}s` },
                { label: 'PROVIDER', value: workflowResult.provider.toUpperCase() },
              ].map(({ label, value }) => (
                <div key={label} className="glow-border rounded-sm bg-surface-800 px-4 py-3">
                  <div className="text-[9px] font-mono text-green-900 tracking-widest">{label}</div>
                  <div className="text-sm font-mono text-green-400 mt-1 truncate">{value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Command input */}
          <CommandInput
            onSubmit={handleRunAgent}
            isRunning={status === 'running'}
            value={command}
            onChange={setCommand}
          />

          {/* Console + Results */}
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            <div className="flex-1 min-h-0">
              <AgentConsole
                logs={logs}
                isRunning={status === 'running'}
                workflowId={workflowId}
              />
            </div>

            {workflowResult && workflowResult.results.length > 0 && (
              <WorkflowTable
                results={workflowResult.results}
                workflowName={workflowResult.workflowName}
                totalSteps={workflowResult.totalSteps}
                completedSteps={workflowResult.completedSteps}
                durationMs={workflowResult.durationMs}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// ── Outer component wraps with Suspense (required for useSearchParams in Next.js) ──
export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center gap-3 text-green-700 font-mono text-sm">
          <span className="w-4 h-4 border border-green-500 border-t-transparent rounded-full animate-spin" />
          Loading dashboard...
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}