import type { NextApiRequest, NextApiResponse } from 'next';
// Note: In production, use a shared store (Redis). Here we import from start.ts via a shared module.
// For demo purposes, we use a global store.

declare global {
  // eslint-disable-next-line no-var
  var workflowStore: Map<string, {
    status: 'running' | 'completed' | 'failed';
    logs: { timestamp: Date; level: string; message: string; step?: number; data?: unknown }[];
    result?: unknown;
    startedAt: Date;
    command: string;
  }> | undefined;
}

// Use global store shared with start.ts
const store = global.workflowStore || (global.workflowStore = new Map());

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { workflowId } = req.query;

  if (!workflowId || typeof workflowId !== 'string') {
    return res.status(400).json({ error: 'workflowId is required' });
  }

  const workflow = store.get(workflowId);

  if (!workflow) {
    // Try MongoDB for historical workflows
    try {
      const { connectToDatabase } = await import('@/lib/mongodb');
      const WorkflowLog = (await import('@/models/log')).default;
      await connectToDatabase();
      const log = await WorkflowLog.findOne({ workflowId });

      if (log) {
        return res.status(200).json({
          workflowId,
          status: log.status,
          workflowName: log.workflowName,
          command: log.command,
          completedSteps: log.completedSteps,
          totalSteps: log.totalSteps,
          durationMs: log.durationMs,
          startedAt: log.startedAt,
          completedAt: log.completedAt,
          source: 'database',
        });
      }
    } catch {
      // Ignore DB errors
    }

    return res.status(404).json({ error: 'Workflow not found' });
  }

  return res.status(200).json({
    workflowId,
    status: workflow.status,
    command: workflow.command,
    startedAt: workflow.startedAt,
    logsCount: workflow.logs.length,
    result: workflow.status !== 'running' ? workflow.result : undefined,
    source: 'memory',
  });
}

export { store as workflowStore };
