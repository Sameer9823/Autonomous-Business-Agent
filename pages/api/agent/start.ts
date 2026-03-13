import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { v4 as uuidv4 } from 'uuid';
import { runWorkflow, LogEntry } from '@/agent/workflow';

// In-memory store keyed by workflowId
const activeWorkflows = new Map<string, {
  status: 'running' | 'completed' | 'failed';
  logs: LogEntry[];
  result?: unknown;
  startedAt: Date;
  command: string;
  userId: string;
}>();

// Expose on global so logs.ts can read from it
(global as unknown as Record<string, unknown>).workflowStore = activeWorkflows;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Require authenticated session ──────────────────────────────────────────
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user) {
    return res.status(401).json({ error: 'You must be logged in to run agent workflows' });
  }

  const userId = (session.user as { id?: string }).id || session.user.email || 'unknown';

  const { command } = req.body;
  if (!command || typeof command !== 'string') {
    return res.status(400).json({ error: 'Command is required' });
  }
  if (command.trim().length < 5) {
    return res.status(400).json({ error: 'Command must be at least 5 characters' });
  }

  const workflowId = uuidv4();

  activeWorkflows.set(workflowId, {
    status: 'running',
    logs: [],
    startedAt: new Date(),
    command: command.trim(),
    userId,
  });

  const workflow = activeWorkflows.get(workflowId)!;

  // Fire and forget — client polls for status
  setImmediate(async () => {
    try {
      const result = await runWorkflow({
        command: command.trim(),
        workflowId,
        userId,                          // ← pass userId into workflow runner
        onLog: (entry: LogEntry) => {
          workflow.logs.push(entry);
        },
      });

      workflow.status = result.status;
      workflow.result = result;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Workflow execution failed';
      workflow.status = 'failed';
      workflow.logs.push({
        timestamp: new Date(),
        level: 'error',
        message: `❌ Fatal error: ${errMsg}`,
      });
    }
  });

  return res.status(200).json({
    workflowId,
    status: 'running',
    message: 'Agent workflow started',
    startedAt: new Date().toISOString(),
  });
}

export { activeWorkflows };
