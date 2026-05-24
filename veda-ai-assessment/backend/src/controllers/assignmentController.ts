import { Request, Response } from 'express';
import { createAssignmentSchema } from '../validators/assignmentValidator';
import Assignment from '../models/Assignment';
import Result from '../models/Result';
import { addAssessmentJob } from '../queues/assessmentQueue';

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

    const newAssignment = new Assignment({
      ...payload,
      status: 'pending',
    });

    await newAssignment.save();

    const jobPayload = {
      ...payload,
      fileData,
    };

    const job = await addAssessmentJob(newAssignment._id.toString(), jobPayload);

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
    const assignments = await Assignment.find().sort({ createdAt: -1 });
    res.status(200).json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAssignmentResult = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
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

    res.status(200).json({ ...result.toJSON(), assignment });
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

    const payload = {
      title: assignment.title,
      fileUrl: assignment.fileUrl,
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
