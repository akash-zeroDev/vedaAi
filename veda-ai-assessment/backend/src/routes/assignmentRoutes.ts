import { Router } from 'express';
import { createAssignment, getAssignments, getAssignmentResult, deleteAssignment, regenerateAssignment } from '../controllers/assignmentController';

import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('file'), createAssignment);
router.post('/:id/regenerate', regenerateAssignment);
router.get('/', getAssignments);
router.get('/:id/result', getAssignmentResult);
router.delete('/:id', deleteAssignment);

export default router;
