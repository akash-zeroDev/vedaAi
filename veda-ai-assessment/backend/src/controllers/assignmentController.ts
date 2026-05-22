import { Request, Response } from 'express';
import { createAssignmentSchema } from '../validators/assignmentValidator';
import Assignment from '../models/Assignment';
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
