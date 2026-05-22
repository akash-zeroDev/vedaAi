import { Router } from 'express';
import { createAssignment } from '../controllers/assignmentController';

const router = Router();

router.post('/', createAssignment);

export default router;
