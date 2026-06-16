import mongoose, { Document, Schema } from 'mongoose';

export interface IGlobalConfig extends Document {
  key: string;
  totalBedrockSpend: number;
}

const GlobalConfigSchema: Schema = new Schema({
  key: { type: String, required: true, unique: true },
  totalBedrockSpend: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.GlobalConfig || mongoose.model<IGlobalConfig>('GlobalConfig', GlobalConfigSchema);
