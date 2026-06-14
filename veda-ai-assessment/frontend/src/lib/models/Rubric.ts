import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILevel {
  score: number;
  label: string;
  description: string;
}

export interface ICriteria {
  title: string;
  weight: number;
  levels: ILevel[];
}

export interface IRubric extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  criteria?: ICriteria[];
  tokenUsage?: number;
  createdAt: Date;
  updatedAt: Date;
}

const LevelSchema = new Schema<ILevel>({
  score: { type: Number, required: true },
  label: { type: String, required: true },
  description: { type: String, required: true }
});

const CriteriaSchema = new Schema<ICriteria>({
  title: { type: String, required: true },
  weight: { type: Number, required: true },
  levels: { type: [LevelSchema], required: true }
});

const RubricSchema = new Schema<IRubric>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'], 
    default: 'PENDING' 
  },
  criteria: { type: [CriteriaSchema], default: [] },
  tokenUsage: { type: Number, default: 0 }
}, {
  timestamps: true
});

const Rubric: Model<IRubric> = mongoose.models.Rubric || mongoose.model<IRubric>('Rubric', RubricSchema);

export default Rubric;
