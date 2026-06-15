import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IAssignment extends Document {
  title: string;
  fileUrl?: string;
  fileData?: {
    type: string;
    mimeType?: string;
    data: string;
  };
  dueDate: string;
  questionTypes: Array<any>;
  totalQuestions: number;
  totalMarks: number;
  instructions?: string;
  tokenUsage?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema: Schema = new Schema({
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

const Assignment: Model<IAssignment> = mongoose.models.Assignment || mongoose.model<IAssignment>('Assignment', AssignmentSchema);

export default Assignment;
