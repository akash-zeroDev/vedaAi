import mongoose, { Document, Schema } from 'mongoose';

export interface IAssignment extends Document {
  fileUrl?: string;
  dueDate: Date;
  questionTypes: string[];
  totalQuestions: number;
  totalMarks: number;
  instructions?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

const AssignmentSchema: Schema = new Schema({
  fileUrl: { type: String },
  dueDate: { type: Date, required: true },
  questionTypes: { type: [String], required: true },
  totalQuestions: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  instructions: { type: String },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
}, { timestamps: true });

export default mongoose.models.Assignment || mongoose.model<IAssignment>('Assignment', AssignmentSchema);
