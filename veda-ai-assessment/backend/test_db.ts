import mongoose from 'mongoose';
import Result from './src/models/Result';
import { config } from 'dotenv';
config({ path: '.env' });

async function run() {
  await mongoose.connect(process.env.MONGO_URI || '');
  const latest = await Result.findOne().sort({ createdAt: -1 }).lean();
  console.log(JSON.stringify(latest?.content));
  process.exit(0);
}
run();
