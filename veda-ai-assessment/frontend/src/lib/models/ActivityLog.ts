import mongoose, { Schema, Document, Model } from 'mongoose';

export type ToolName = 'Rubric Generator' | 'Difficulty Analyzer' | 'Lesson Summarizer';
export type ActivityStatus = 'COMPLETED' | 'PROCESSING' | 'FAILED';

export interface IActivityLog extends Document {
  userId: mongoose.Types.ObjectId;
  toolName: ToolName;
  assignmentTitle: string;
  status: ActivityStatus;
  href: string;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    toolName: {
      type: String,
      enum: ['Rubric Generator', 'Difficulty Analyzer', 'Lesson Summarizer'],
      required: true,
    },
    assignmentTitle: { type: String, required: true },
    status: {
      type: String,
      enum: ['COMPLETED', 'PROCESSING', 'FAILED'],
      required: true,
    },
    href: { type: String, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound index for fast user-scoped recent-activity queries
ActivityLogSchema.index({ userId: 1, createdAt: -1 });

const ActivityLog: Model<IActivityLog> =
  mongoose.models.ActivityLog ||
  mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);

export default ActivityLog;
