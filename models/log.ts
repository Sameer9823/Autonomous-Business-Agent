import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILogEntry {
  timestamp: Date;
  step: number;
  action: string;
  target: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  data?: Record<string, unknown>;
}

export interface IWorkflowLog extends Document {
  workflowId: string;
  workflowName: string;
  command: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  steps: ILogEntry[];
  results: Record<string, unknown>[];
  error?: string;
  agentProvider: string;
  totalSteps: number;
  completedSteps: number;
}

const LogEntrySchema = new Schema<ILogEntry>({
  timestamp: { type: Date, default: Date.now },
  step: { type: Number, required: true },
  action: { type: String, required: true },
  target: { type: String, required: true },
  status: { type: String, enum: ['pending', 'running', 'success', 'error'], default: 'pending' },
  message: { type: String, required: true },
  data: { type: Schema.Types.Mixed },
});

const WorkflowLogSchema = new Schema<IWorkflowLog>(
  {
    workflowId: { type: String, required: true, unique: true, index: true },
    workflowName: { type: String, required: true },
    command: { type: String, required: true },
    status: { type: String, enum: ['pending', 'running', 'completed', 'failed'], default: 'pending' },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    durationMs: { type: Number },
    steps: [LogEntrySchema],
    results: [{ type: Schema.Types.Mixed }],
    error: { type: String },
    agentProvider: { type: String, default: 'tinyfish' },
    totalSteps: { type: Number, default: 0 },
    completedSteps: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const WorkflowLog: Model<IWorkflowLog> =
  mongoose.models.WorkflowLog ||
  mongoose.model<IWorkflowLog>('WorkflowLog', WorkflowLogSchema);

export default WorkflowLog;
