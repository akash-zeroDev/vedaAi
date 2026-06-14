import { Request, Response } from 'express';
import { createAssignmentSchema } from '../validators/assignmentValidator';
import { AssignmentService } from '../services/assignment.service';

export const createAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = { ...req.body };
    if (typeof body.questionTypes === 'string') {
      try { body.questionTypes = JSON.parse(body.questionTypes); } catch (e) { }
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

    const result = await AssignmentService.createAssignment(payload, fileData);

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAssignments = async (req: Request, res: Response): Promise<void> => {
  try {
    const assignments = await AssignmentService.getAllAssignments();
    res.status(200).json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAssignmentResult = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await AssignmentService.getAssignmentResult(id as string);
    res.status(200).json(result);
  } catch (error: any) {
    console.error('Error fetching assignment result:', error);
    if (error.message.startsWith('NOT_FOUND')) {
      res.status(404).json({ error: error.message.replace('NOT_FOUND: ', '') });
    } else if (error.message.startsWith('FAILED')) {
      res.status(400).json({ error: error.message.replace('FAILED: ', '') });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const deleteAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await AssignmentService.deleteAssignment(id as string);
    res.status(200).json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const regenerateAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await AssignmentService.regenerateAssignment(id as string);
    res.status(202).json(result);
  } catch (error: any) {
    console.error('Error regenerating assignment:', error);
    if (error.message.startsWith('NOT_FOUND')) {
      res.status(404).json({ error: error.message.replace('NOT_FOUND: ', '') });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};
