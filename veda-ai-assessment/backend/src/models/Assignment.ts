import mongoose, { Document, Schema } from 'mongoose';

export interface IAssignment extends Document {
  userId: string;
  title: string;
  fileUrl?: string;
  fileData?: {
    type: string;
    mimeType?: string;
    data: string;
  };
  dueDate: string;
  questionTypes: Array<string | { type: string; count: number; marks: number }>;
  totalQuestions: number;
  totalMarks: number;
  instructions?: string;
  tokenUsage?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

const AssignmentSchema: Schema = new Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  fileUrl: { type: String },
  fileData: {
    type: { type: String },
    mimeType: { type: String },
    data: { type: String },
  },
  dueDate: { type: String, required: true },
  questionTypes: { type: [Schema.Types.Mixed], required: true },
  totalQuestions: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  instructions: { type: String },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  tokenUsage: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.Assignment || mongoose.model<IAssignment>('Assignment', AssignmentSchema);
