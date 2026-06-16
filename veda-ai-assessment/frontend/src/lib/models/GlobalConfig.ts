import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IGlobalConfig extends Document {
  key: string;
  totalBedrockSpend: number;
}

const GlobalConfigSchema = new Schema<IGlobalConfig>({
  key: { type: String, required: true, unique: true },
  totalBedrockSpend: { type: Number, default: 0 },
}, { timestamps: true });

const GlobalConfig: Model<IGlobalConfig> = mongoose.models.GlobalConfig || mongoose.model<IGlobalConfig>('GlobalConfig', GlobalConfigSchema);

export default GlobalConfig;
