import React from 'react';

type Status = 'pending' | 'running' | 'completed' | 'failed' | 'idle';

interface StatusBadgeProps {
  status: Status;
  showDot?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<Status, { label: string; color: string; dot: string }> = {
  idle:      { label: 'IDLE',      color: 'text-gray-400 bg-gray-900 border-gray-700',           dot: 'bg-gray-500' },
  pending:   { label: 'PENDING',   color: 'text-yellow-400 bg-yellow-900/20 border-yellow-700/40', dot: 'bg-yellow-400' },
  running:   { label: 'RUNNING',   color: 'text-green-400 bg-green-900/20 border-green-500/40',   dot: 'bg-green-400' },
  completed: { label: 'COMPLETED', color: 'text-brand-400 bg-brand-900/20 border-brand-500/40',   dot: 'bg-brand-400' },
  failed:    { label: 'FAILED',    color: 'text-red-400 bg-red-900/20 border-red-700/40',         dot: 'bg-red-500' },
};

const sizeClasses = {
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5',
};

export default function StatusBadge({ status, showDot = true, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.idle;
  const isRunning = status === 'running';

  return (
    <span className={`inline-flex items-center gap-1.5 font-mono font-medium border rounded-sm ${config.color} ${sizeClasses[size]}`}>
      {showDot && (
        <span className={`inline-block w-1.5 h-1.5 rounded-full ${config.dot} ${isRunning ? 'animate-pulse' : ''}`} />
      )}
      {config.label}
    </span>
  );
}
