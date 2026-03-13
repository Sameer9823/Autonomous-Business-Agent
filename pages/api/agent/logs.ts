import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { connectToDatabase } from '@/lib/mongodb';
import WorkflowLog from '@/models/log';

type WorkflowStore = Map<string, {
  status: 'running' | 'completed' | 'failed';
  logs: { timestamp: Date; level: string; message: string; step?: number; data?: unknown }[];
  result?: unknown;
  startedAt: Date;
  command: string;
  userId: string;
}>;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Require authenticated session ──────────────────────────────────────────
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const userId = (session.user as { id?: string }).id || session.user.email || 'unknown';
  const { workflowId, since, limit } = req.query;
  const store = (global as unknown as Record<string, WorkflowStore>).workflowStore;

  // ── Live in-memory workflow (currently running) ────────────────────────────
  if (workflowId && typeof workflowId === 'string' && store) {
    const workflow = store.get(workflowId);
    if (workflow) {
      // Only let the owner see their workflow
      if (workflow.userId !== userId) {
        return res.status(403).json({ error: 'Access denied — this workflow belongs to another user' });
      }

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

  // ── Historical logs from MongoDB (always filtered by userId) ──────────────
  try {
    await connectToDatabase();

    if (workflowId && typeof workflowId === 'string') {
      // Fetch single workflow — must belong to this user
      const doc = await WorkflowLog.findOne({ workflowId, userId });
      if (!doc) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      return res.status(200).json({
        workflowId:   doc.workflowId,
        workflowName: doc.workflowName,
        command:      doc.command,
        status:       doc.status,
        logs:         doc.steps,
        results:      doc.results,
        startedAt:    doc.startedAt,
        completedAt:  doc.completedAt,
        durationMs:   doc.durationMs,
        source:       'database',
      });
    }

    // List workflows — ONLY this user's workflows
    const pageLimit = Math.min(parseInt(limit as string || '20'), 50);
    const workflows = await WorkflowLog.find({ userId })          // ← key filter
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
    if (!workflowId) {
      return res.status(200).json({ workflows: [], total: 0, source: 'memory', note: errMsg });
    }
    return res.status(500).json({ error: errMsg });
  }
}
