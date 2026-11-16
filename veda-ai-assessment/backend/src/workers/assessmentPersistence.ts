import { createHash } from 'crypto';
import mongoose from 'mongoose';
import Assignment from '../models/Assignment';
import Result from '../models/Result';
import type { AssessmentStore, AssignmentState, StoredResult } from './assessmentProcessor';

export function generationFilter(generationId?: string) {
  return generationId === undefined ? { generationId: { $exists: false } } : { generationId };
}

export function resultId(assignmentId: string, generationId?: string) {
  // MongoDB's existing unique _id index makes concurrent upserts idempotent.
  // No new unique index/migration that could fail on historical duplicate data.
  const id = createHash('sha256').update(JSON.stringify([assignmentId, generationId ?? null])).digest('hex').slice(0, 24);
  return new mongoose.Types.ObjectId(id);
}

export const assessmentStore: AssessmentStore = {
  loadAssignment: async id => Assignment.findById(id).lean<AssignmentState | null>(),
  loadResult: async (id, generationId) => Result.findOne({ assignmentId: id, ...generationFilter(generationId) }).lean<StoredResult | null>(),
  saveResult: async (id, generationId, content, tokenUsage) => {
    const filter = { _id: resultId(id, generationId) };
    try {
      const saved = await Result.findOneAndUpdate(filter, {
        $setOnInsert: { assignmentId: id, generationId, content, tokenUsage },
      }, { upsert: true, new: true, runValidators: true }).lean<StoredResult | null>();
      if (!saved) throw new Error('Result upsert returned no document');
      return saved;
    } catch (error: any) {
      // A simultaneous stalled-job recovery may have won the same _id insert.
      if (error?.code !== 11000) throw error;
      const saved = await Result.findOne(filter).lean<StoredResult | null>();
      if (!saved) throw error;
      return saved;
    }
  },
  transition: async (id, generationId, status, tokenUsage) => Assignment.findOneAndUpdate({
    _id: id, ...generationFilter(generationId), status: { $in: ['pending', 'processing'] },
  }, { $set: { status, ...(tokenUsage !== undefined && { tokenUsage }) } }, { new: true }).lean<AssignmentState | null>(),
};
