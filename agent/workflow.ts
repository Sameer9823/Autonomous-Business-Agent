/**
 * workflow.ts
 * Orchestrates the full agent execution pipeline:
 * Gemini Plan → TinyFish Execution → MongoDB Logging → Results
 */

import { planWorkflow, AgentPlan } from './planner';
import { startSession, executeStep, closeSession, StepResult } from './executor';
import { connectToDatabase } from '@/lib/mongodb';
import WorkflowLog from '@/models/log';

export interface WorkflowOptions {
  command: string;
  workflowId: string;
  userId: string;
  onLog?: (entry: LogEntry) => void;
}

export interface LogEntry {
  timestamp: Date;
  level: 'info' | 'success' | 'error' | 'warning' | 'system';
  step?: number;
  message: string;
  data?: Record<string, unknown>;
}

export interface WorkflowResult {
  workflowId: string;
  workflowName: string;
  status: 'completed' | 'failed';
  totalSteps: number;
  completedSteps: number;
  durationMs: number;
  results: StepResult[];
  plan: AgentPlan;
  provider: string;
}

export async function runWorkflow(options: WorkflowOptions): Promise<WorkflowResult> {
  const { command, workflowId, userId, onLog } = options;
  const startTime = Date.now();
  const logs: LogEntry[] = [];

  const emit = (entry: LogEntry) => {
    logs.push(entry);
    onLog?.(entry);
  };

  emit({ timestamp: new Date(), level: 'system', message: `🚀 AutoBizOps Agent initialized — Workflow ID: ${workflowId}` });
  emit({ timestamp: new Date(), level: 'info', message: `📋 Processing command: "${command}"` });

  // Step 1: Connect to MongoDB
  try {
    await connectToDatabase();
    emit({ timestamp: new Date(), level: 'success', message: '🗄️  MongoDB connection established' });
  } catch (error) {
    emit({ timestamp: new Date(), level: 'warning', message: '⚠️  MongoDB unavailable — running in memory mode' });
  }

  // Step 2: Create initial log record
  let workflowDoc;
  try {
    workflowDoc = await WorkflowLog.create({
      workflowId,
      userId,                    // ← save owner
      workflowName: 'Processing...',
      command,
      status: 'running',
      startedAt: new Date(),
      steps: [],
      results: [],
      agentProvider: 'tinyfish',
      totalSteps: 0,
      completedSteps: 0,
    });
  } catch {
    // MongoDB might be unavailable in demo
  }

  // Step 3: Gemini AI Planning
  emit({ timestamp: new Date(), level: 'info', message: '🧠 Gemini AI analyzing command...' });

  let plan: AgentPlan;
  try {
    plan = await planWorkflow(command);
    emit({ timestamp: new Date(), level: 'success', message: `✅ Plan generated: "${plan.workflow_name}" — ${plan.steps.length} steps` });
    emit({ timestamp: new Date(), level: 'info', message: `🎯 Objective: ${plan.objective}` });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Planning failed';
    emit({ timestamp: new Date(), level: 'error', message: `❌ Planning failed: ${msg}` });
    throw error;
  }

  // Step 4: Start browser session
  emit({ timestamp: new Date(), level: 'info', message: '🌐 Starting TinyFish web agent session...' });
  const session = await startSession(command);
  emit({
    timestamp: new Date(),
    level: 'success',
    message: `✅ Session started — Provider: ${session.provider.toUpperCase()} — ID: ${session.sessionId.substring(0, 16)}...`,
  });

  // Update MongoDB with plan info
  try {
    await WorkflowLog.updateOne(
      { workflowId },
      { workflowName: plan.workflow_name, totalSteps: plan.steps.length }
    );
  } catch { /* ignore */ }

  // Step 5: Execute each step
  const stepResults: StepResult[] = [];
  let completedSteps = 0;

  for (const step of plan.steps) {
    emit({
      timestamp: new Date(),
      level: 'info',
      step: step.step_number,
      message: `⚡ [${step.step_number}/${plan.steps.length}] ${step.action.toUpperCase()} → ${step.description}`,
    });

    const result = await executeStep(
      session,
      step,
      (msg) => emit({ timestamp: new Date(), level: 'info', step: step.step_number, message: msg })
    );

    stepResults.push(result);

    if (result.status === 'success') {
      completedSteps++;
      emit({
        timestamp: new Date(),
        level: 'success',
        step: step.step_number,
        message: `✅ Step ${step.step_number} complete — ${result.message}`,
        data: result.data,
      });
    } else {
      emit({
        timestamp: new Date(),
        level: 'error',
        step: step.step_number,
        message: `❌ Step ${step.step_number} failed — ${result.message}`,
      });
    }

    // Save step progress to MongoDB
    try {
      await WorkflowLog.updateOne(
        { workflowId },
        {
          completedSteps,
          $push: {
            steps: {
              timestamp: result.timestamp,
              step: result.step,
              action: result.action,
              target: result.target,
              status: result.status === 'success' ? 'success' : 'error',
              message: result.message,
              data: result.data,
            },
          },
        }
      );
    } catch { /* ignore */ }
  }

  // Step 6: Close session
  await closeSession(session);
  emit({ timestamp: new Date(), level: 'system', message: '🔒 Browser session closed' });

  const durationMs = Date.now() - startTime;
  const status = completedSteps === plan.steps.length ? 'completed' : 'failed';

  // Step 7: Final results
  emit({
    timestamp: new Date(),
    level: 'success',
    message: `🎉 Workflow "${plan.workflow_name}" ${status.toUpperCase()} — ${completedSteps}/${plan.steps.length} steps — ${(durationMs / 1000).toFixed(1)}s`,
  });

  // Save final status to MongoDB
  try {
    await WorkflowLog.updateOne(
      { workflowId },
      {
        status,
        completedAt: new Date(),
        durationMs,
        results: stepResults.filter(r => r.data).map(r => r.data!),
      }
    );
  } catch { /* ignore */ }

  return {
    workflowId,
    workflowName: plan.workflow_name,
    status,
    totalSteps: plan.steps.length,
    completedSteps,
    durationMs,
    results: stepResults,
    plan,
    provider: session.provider,
  };
}
