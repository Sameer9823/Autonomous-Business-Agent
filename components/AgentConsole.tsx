'use client';

import { useEffect, useRef } from 'react';

export interface ConsoleEntry {
  timestamp: Date;
  level: 'info' | 'success' | 'error' | 'warning' | 'system';
  step?: number;
  message: string;
  data?: unknown;
}

interface AgentConsoleProps {
  logs: ConsoleEntry[];
  isRunning: boolean;
  workflowId?: string;
}

const levelStyles: Record<string, string> = {
  system:  'text-blue-400',
  info:    'text-green-500',
  success: 'text-green-300',
  error:   'text-red-400',
  warning: 'text-yellow-400',
};

const levelPrefix: Record<string, string> = {
  system:  '[SYS]',
  info:    '[INF]',
  success: '[OK ]',
  error:   '[ERR]',
  warning: '[WRN]',
};

function formatTime(date: Date | string): string {
  const d = new Date(date);
  return d.toISOString().substring(11, 23);
}

export default function AgentConsole({ logs, isRunning, workflowId }: AgentConsoleProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="glow-border rounded-sm bg-surface-900 scan-overlay flex flex-col h-full min-h-[380px]">
      {/* Console header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-green-900/20">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500/50" />
            <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
            <div className="w-2 h-2 rounded-full bg-green-500/50" />
          </div>
          <span className="text-[10px] font-mono text-green-800 tracking-widest">AGENT EXECUTION LOG</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono text-green-900">
          {workflowId && <span>ID: {workflowId.substring(0, 8)}...</span>}
          <span className={`flex items-center gap-1 ${isRunning ? 'text-green-600' : 'text-green-900'}`}>
            {isRunning && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
            {isRunning ? 'ACTIVE' : `${logs.length} ENTRIES`}
          </span>
        </div>
      </div>

      {/* Console body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-0.5 font-mono text-xs">
        {logs.length === 0 && (
          <div className="flex items-center justify-center h-full text-green-900 text-xs font-mono">
            <div className="text-center space-y-1">
              <div className="text-2xl opacity-30">⚡</div>
              <div>Awaiting agent command...</div>
              <div className="text-[10px] opacity-50">Enter a command above to start the agent</div>
            </div>
          </div>
        )}

        {logs.map((entry, idx) => (
          <div
            key={idx}
            className="flex gap-2 leading-relaxed animate-fade-in hover:bg-green-900/5 px-1 rounded-sm"
          >
            <span className="text-green-900 shrink-0 select-none">{formatTime(entry.timestamp)}</span>
            <span className={`shrink-0 ${levelStyles[entry.level] || 'text-green-500'}`}>
              {levelPrefix[entry.level] || '[INF]'}
            </span>
            {entry.step && (
              <span className="text-green-800 shrink-0">[{String(entry.step).padStart(2, '0')}]</span>
            )}
            <span className={`${levelStyles[entry.level] || 'text-green-500'} break-all`}>
              {entry.message}
            </span>
          </div>
        ))}

        {isRunning && (
          <div className="flex gap-2 text-green-500 animate-pulse px-1">
            <span className="text-green-900 shrink-0">{formatTime(new Date())}</span>
            <span className="text-green-500">[INF]</span>
            <span className="terminal-cursor">Processing</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
