import mongoose, { Document, Schema } from 'mongoose';

export interface IResult extends Document {
  assignmentId: mongoose.Types.ObjectId;
  content: Record<string, unknown>;
}

const ResultSchema: Schema = new Schema({
  assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
  content: { type: Schema.Types.Mixed, required: true },
}, { timestamps: true });

export default mongoose.models.Result || mongoose.model<IResult>('Result', ResultSchema);
