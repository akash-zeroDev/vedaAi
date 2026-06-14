import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAnalyzedQuestion {
  questionText: string;
  calculatedScore: number;
  category: 'Easy' | 'Medium' | 'Hard';
  aiJustification: string;
}

export interface IOverallStats {
  averageScore: number;
  easyCount: number;
  mediumCount: number;
  hardCount: number;
}

export interface IAnalysis extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  overallStats?: IOverallStats;
  analyzedQuestions?: IAnalyzedQuestion[];
  tokenUsage?: number;
  createdAt: Date;
  updatedAt: Date;
}

const AnalyzedQuestionSchema = new Schema<IAnalyzedQuestion>({
  questionText: { type: String, required: true },
  calculatedScore: { type: Number, required: true },
  category: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  aiJustification: { type: String, required: true },
});

const OverallStatsSchema = new Schema<IOverallStats>({
  averageScore: { type: Number, required: true },
  easyCount: { type: Number, required: true },
  mediumCount: { type: Number, required: true },
  hardCount: { type: Number, required: true },
});

const AnalysisSchema = new Schema<IAnalysis>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
    },
    overallStats: { type: OverallStatsSchema },
    analyzedQuestions: [AnalyzedQuestionSchema],
    tokenUsage: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Analysis: Model<IAnalysis> = mongoose.models.Analysis || mongoose.model<IAnalysis>('Analysis', AnalysisSchema);

export default Analysis;
