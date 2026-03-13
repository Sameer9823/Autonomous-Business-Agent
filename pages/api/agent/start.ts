import type { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';
import { runWorkflow, LogEntry } from '@/agent/workflow';

// In-memory store for active workflows (use Redis in production)
const activeWorkflows = new Map<string, {
  status: 'running' | 'completed' | 'failed';
  logs: LogEntry[];
  result?: unknown;
  startedAt: Date;
  command: string;
}>();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { command } = req.body;

  if (!command || typeof command !== 'string') {
    return res.status(400).json({ error: 'Command is required' });
  }

  if (command.trim().length < 5) {
    return res.status(400).json({ error: 'Command must be at least 5 characters' });
  }

  const workflowId = uuidv4();

  // Initialize workflow state
  activeWorkflows.set(workflowId, {
    status: 'running',
    logs: [],
    startedAt: new Date(),
    command: command.trim(),
  });

  // Run workflow asynchronously
  const workflow = activeWorkflows.get(workflowId)!;

  // Fire and forget — client polls for status
  setImmediate(async () => {
    try {
      const result = await runWorkflow({
        command: command.trim(),
        workflowId,
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

// Export for use in status/logs routes
export { activeWorkflows };
