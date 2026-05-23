import { Request, Response } from 'express';
import { createAssignmentSchema } from '../validators/assignmentValidator';
import Assignment from '../models/Assignment';
import Result from '../models/Result';
import { addAssessmentJob } from '../queues/assessmentQueue';

export const createAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = createAssignmentSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error,
      });
      return;
    }

    const payload = parseResult.data;

    const newAssignment = new Assignment({
      ...payload,
      status: 'pending',
    });

    await newAssignment.save();

    const job = await addAssessmentJob(newAssignment._id.toString(), payload);

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
    
    if (!result) {
      res.status(404).json({ error: 'Result not found for this assignment' });
      return;
    }

    res.status(200).json(result);
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
