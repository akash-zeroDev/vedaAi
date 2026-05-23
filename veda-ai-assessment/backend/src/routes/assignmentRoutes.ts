import { Router } from 'express';
import { createAssignment, getAssignments, getAssignmentResult, deleteAssignment, regenerateAssignment } from '../controllers/assignmentController';

const router = Router();

router.post('/', createAssignment);
router.post('/:id/regenerate', regenerateAssignment);
router.get('/', getAssignments);
router.get('/:id/result', getAssignmentResult);
router.delete('/:id', deleteAssignment);

export default router;
