import mongoose, { Document, Schema } from 'mongoose';

export interface IResult extends Document {
  assignmentId: mongoose.Types.ObjectId;
  content: Record<string, unknown>;
  generationId?: string;
  tokenUsage?: number;
}

const ResultSchema: Schema = new Schema({
  assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
  content: { type: Schema.Types.Mixed, required: true },
  generationId: { type: String },
  tokenUsage: { type: Number, default: 0 },
}, { timestamps: true });
ResultSchema.index({ assignmentId: 1 });
export default mongoose.models.Result || mongoose.model<IResult>('Result', ResultSchema);
