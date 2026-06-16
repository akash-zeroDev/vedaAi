import Assignment from '../models/Assignment';
import Result from '../models/Result';
import { addAssessmentJob } from '../queues/assessmentQueue';
import redisClient from '../config/redis';
import crypto from 'crypto';

export class AssignmentService {
  /**
   * Core logic for creating a new assignment and queueing the LLM job
   */
  static async createAssignment(payload: any, fileData: any, userId: string) {
    const hashData = {
      title: payload.title,
      questionTypes: payload.questionTypes,
      totalQuestions: payload.totalQuestions,
      totalMarks: payload.totalMarks,
      instructions: payload.instructions,
      fileData: fileData,
    };
    const llmHash = crypto.createHash('sha256').update(JSON.stringify(hashData)).digest('hex');
    const llmCacheKey = `llm_cache:${llmHash}`;

    const cachedContent = await redisClient.get(llmCacheKey);

    if (cachedContent) {
      console.log('LLM Cache hit! Skipping generation.');

      const newAssignment = new Assignment({
        ...payload,
        userId,
        fileData,
        status: 'completed',
      });
      await newAssignment.save();

      const newResult = new Result({
        assignmentId: newAssignment._id,
        content: JSON.parse(cachedContent),
      });
      await newResult.save();

      // Invalidate list cache
      await redisClient.del(`assignments:user:${userId}`);

      return {
        message: 'Assignment created instantly from cache',
        assignmentId: newAssignment._id,
        jobId: newAssignment._id.toString(),
        isCached: true
      };
    }

    const newAssignment = new Assignment({
      ...payload,
      userId,
      fileData,
      status: 'pending',
    });

    await newAssignment.save();

    const jobPayload = {
      ...payload,
      fileData,
      llmHash,
    };

    // Add to Redis job queue (BullMQ)
    const job = await addAssessmentJob(newAssignment._id.toString(), jobPayload);

    // Invalidate assignments list cache
    await redisClient.del(`assignments:user:${userId}`);

    return {
      message: 'Assignment created successfully',
      assignmentId: newAssignment._id,
      jobId: job.id,
      isCached: false
    };
  }

  /**
   * Retrieve all assignments with caching
   */
  static async getAllAssignments(userId: string) {
    const cacheKey = `assignments:user:${userId}`;
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const assignments = await Assignment.find({ userId }).sort({ createdAt: -1 });
    await redisClient.set(cacheKey, JSON.stringify(assignments), 'EX', 3600);
    return assignments;
  }

  /**
   * Retrieve an assignment result with caching
   */
  static async getAssignmentResult(id: string) {
    const cacheKey = `assignment:result:${id}`;

    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const result = await Result.findOne({ assignmentId: id });
    const assignment = await Assignment.findById(id);

    if (!assignment) throw new Error('NOT_FOUND: Assignment not found');
    if (assignment.status === 'failed') throw new Error('FAILED: Generation failed for this assignment. Please try regenerating.');
    if (!result) throw new Error('NOT_FOUND: Result not found for this assignment');

    const responseData = { ...result.toJSON(), assignment };

    if (assignment.status === 'completed') {
      await redisClient.set(cacheKey, JSON.stringify(responseData), 'EX', 3600);
    }

    return responseData;
  }

  /**
   * Delete an assignment and clear its cache
   */
  static async deleteAssignment(id: string) {
    const assignment = await Assignment.findById(id);
    if (assignment) {
      await Assignment.findByIdAndDelete(id);
      await Result.findOneAndDelete({ assignmentId: id });
      await redisClient.del(`assignments:user:${assignment.userId}`);
      await redisClient.del(`assignment:result:${id}`);
    }
  }

  /**
   * Regenerate an assignment
   */
  static async regenerateAssignment(id: string) {
    const assignment = await Assignment.findById(id);
    if (!assignment) throw new Error('NOT_FOUND: Assignment not found');

    await Result.findOneAndDelete({ assignmentId: id });

    assignment.status = 'pending';
    await assignment.save();

    await redisClient.del(`assignments:user:${assignment.userId}`);
    await redisClient.del(`assignment:result:${id}`);

    const payload = {
      title: assignment.title,
      fileUrl: assignment.fileUrl,
      fileData: assignment.fileData,
      dueDate: assignment.dueDate,
      questionTypes: assignment.questionTypes,
      totalQuestions: assignment.totalQuestions,
      totalMarks: assignment.totalMarks,
      instructions: assignment.instructions,
    };

    const job = await addAssessmentJob(assignment._id.toString(), payload as any);

    return {
      message: 'Assignment regeneration started',
      assignmentId: assignment._id,
      jobId: job.id,
    };
  }
}
