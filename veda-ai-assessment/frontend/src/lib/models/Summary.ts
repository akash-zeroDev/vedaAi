import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISummary extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  fileName: string;
  fileUrl: string;
  summaryMarkdown: string | null;
  status: 'PENDING' | 'PARSING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  tokenUsage?: number;
  createdAt: Date;
  updatedAt: Date;
}

const SummarySchema = new Schema<ISummary>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  summaryMarkdown: { type: String, default: null },
  status: { 
    type: String, 
    enum: ['PENDING', 'PARSING', 'PROCESSING', 'COMPLETED', 'FAILED'], 
    default: 'PENDING' 
  },
  tokenUsage: { type: Number, default: 0 }
}, {
  timestamps: true
});

const Summary: Model<ISummary> = mongoose.models.Summary || mongoose.model<ISummary>('Summary', SummarySchema);

export default Summary;
