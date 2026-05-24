import { Request, Response } from 'express';
import { createAssignmentSchema } from '../validators/assignmentValidator';
import Assignment from '../models/Assignment';
import Result from '../models/Result';
import { addAssessmentJob } from '../queues/assessmentQueue';
import redisClient from '../config/redis';
import crypto from 'crypto';

export const createAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = { ...req.body };
    if (typeof body.questionTypes === 'string') {
      try { body.questionTypes = JSON.parse(body.questionTypes); } catch (e) {}
    }
    if (typeof body.totalQuestions === 'string') body.totalQuestions = Number(body.totalQuestions);
    if (typeof body.totalMarks === 'string') body.totalMarks = Number(body.totalMarks);

    const parseResult = createAssignmentSchema.safeParse(body);

    if (!parseResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error,
      });
      return;
    }

    const payload = parseResult.data;

    let fileData = null;
    if (req.file) {
      if (req.file.mimetype === 'image/jpeg' || req.file.mimetype === 'image/png' || req.file.mimetype === 'application/pdf') {
        fileData = {
          type: 'inline',
          mimeType: req.file.mimetype,
          data: req.file.buffer.toString('base64'),
        };
      } else if (req.file.mimetype === 'text/plain' || req.file.mimetype === 'application/rtf' || req.file.mimetype === 'text/rtf') {
        fileData = {
          type: 'text',
          data: req.file.buffer.toString('utf-8'),
        };
      }
    }

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
      await redisClient.del('assignments:all');

      res.status(201).json({
        message: 'Assignment created instantly from cache',
        assignmentId: newAssignment._id,
        jobId: newAssignment._id.toString(), // Fake job ID since no job was created
      });
      return;
    }

    const newAssignment = new Assignment({
      ...payload,
      fileData,
      status: 'pending',
    });

    await newAssignment.save();

    const jobPayload = {
      ...payload,
      fileData,
      llmHash, // Pass hash to worker to save the generated result later
    };

    const job = await addAssessmentJob(newAssignment._id.toString(), jobPayload);

    // Invalidate assignments list cache
    await redisClient.del('assignments:all');

    res.status(201).json({
      message: 'Assignment created successfully',
      assignmentId: newAssignment._id,
      jobId: job.id,
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAssignments = async (req: Request, res: Response): Promise<void> => {
  try {
    const cacheKey = 'assignments:all';
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      res.status(200).json(JSON.parse(cachedData));
      return;
    }

    const assignments = await Assignment.find().sort({ createdAt: -1 });
    
    // Cache the list of assignments for 1 hour (will be invalidated on creates/updates/deletes)
    await redisClient.set(cacheKey, JSON.stringify(assignments), 'EX', 3600);

    res.status(200).json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAssignmentResult = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const cacheKey = `assignment:result:${id}`;

    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      res.status(200).json(JSON.parse(cachedData));
      return;
    }

    const result = await Result.findOne({ assignmentId: id });
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    if (assignment.status === 'failed') {
      res.status(400).json({ error: 'Generation failed for this assignment. Please try regenerating.' });
      return;
    }

    if (!result) {
      res.status(404).json({ error: 'Result not found for this assignment' });
      return;
    }

    const responseData = { ...result.toJSON(), assignment };

    // Only cache completed assignments (pending/failed shouldn't be cached long term)
    if (assignment.status === 'completed') {
      await redisClient.set(cacheKey, JSON.stringify(responseData), 'EX', 3600); // 1 hour cache
    }

    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error fetching assignment result:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    await Assignment.findByIdAndDelete(id);
    await Result.findOneAndDelete({ assignmentId: id });
    
    // Invalidate caches
    await redisClient.del('assignments:all');
    await redisClient.del(`assignment:result:${id}`);

    res.status(200).json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const regenerateAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    await Result.findOneAndDelete({ assignmentId: id });
    
    assignment.status = 'pending';
    await assignment.save();

    // Invalidate caches
    await redisClient.del('assignments:all');
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

    res.status(202).json({
      message: 'Assignment regeneration started',
      assignmentId: assignment._id,
      jobId: job.id,
    });
  } catch (error) {
    console.error('Error regenerating assignment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
