import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongoose';
import Analysis from '@/lib/models/Analysis';
import Rubric from '@/lib/models/Rubric';
import Summary from '@/lib/models/Summary';
import Assignment from '@/lib/models/Assignment';

export async function getUserTokenCount(userId: string): Promise<number> {
  await connectToDatabase();
  const userObjId = new mongoose.Types.ObjectId(userId);

  const [analysesStats, rubricsStats, summariesStats, assignmentsStats] = await Promise.all([
    Analysis.aggregate([
      { $match: { userId: userObjId } },
      { $group: { _id: null, tokens: { $sum: '$tokenUsage' } } }
    ]),
    Rubric.aggregate([
      { $match: { userId: userObjId } },
      { $group: { _id: null, tokens: { $sum: '$tokenUsage' } } }
    ]),
    Summary.aggregate([
      { $match: { userId: userObjId } },
      { $group: { _id: null, tokens: { $sum: '$tokenUsage' } } }
    ]),
    Assignment.aggregate([
      { $group: { _id: null, tokens: { $sum: '$tokenUsage' } } }
    ])
  ]);

  const totalTokensUsed = 
    (analysesStats[0]?.tokens || 0) + 
    (rubricsStats[0]?.tokens || 0) + 
    (summariesStats[0]?.tokens || 0) +
    (assignmentsStats[0]?.tokens || 0);

  return totalTokensUsed;
}
