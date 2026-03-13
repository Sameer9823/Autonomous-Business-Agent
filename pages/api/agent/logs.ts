import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import WorkflowLog from '@/models/log';

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { workflowId, since, limit } = req.query;
  const store = global.workflowStore;

  // Get live workflow logs from memory
  if (workflowId && typeof workflowId === 'string' && store) {
    const workflow = store.get(workflowId);
    if (workflow) {
      const sinceIndex = since ? parseInt(since as string) : 0;
      const logs = workflow.logs.slice(sinceIndex);

      return res.status(200).json({
        workflowId,
        status: workflow.status,
        logs,
        totalLogs: workflow.logs.length,
        result: workflow.status !== 'running' ? workflow.result : undefined,
      });
    }
  }

  // Get historical logs from MongoDB
  try {
    await connectToDatabase();

    if (workflowId && typeof workflowId === 'string') {
      const doc = await WorkflowLog.findOne({ workflowId });
      if (!doc) return res.status(404).json({ error: 'Workflow not found' });

      return res.status(200).json({
        workflowId: doc.workflowId,
        workflowName: doc.workflowName,
        command: doc.command,
        status: doc.status,
        logs: doc.steps,
        results: doc.results,
        startedAt: doc.startedAt,
        completedAt: doc.completedAt,
        durationMs: doc.durationMs,
        source: 'database',
      });
    }

    // List all recent workflows — include steps+results so Results page can extract real data
    const pageLimit = Math.min(parseInt(limit as string || '20'), 50);
    const workflows = await WorkflowLog.find({})
      .sort({ createdAt: -1 })
      .limit(pageLimit)
      .select('workflowId workflowName command status startedAt completedAt durationMs completedSteps totalSteps agentProvider steps results')
      .lean();

    return res.status(200).json({
      workflows,
      total: workflows.length,
      source: 'database',
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Database error';
    
    // Return empty if no DB
    if (!workflowId) {
      return res.status(200).json({ workflows: [], total: 0, source: 'memory', note: errMsg });
    }
    
    return res.status(500).json({ error: errMsg });
  }
}
