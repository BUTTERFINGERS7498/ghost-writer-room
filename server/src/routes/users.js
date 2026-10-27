import { Router } from 'express';
import { getProfile } from '../controllers/userController.js';

const router = Router();

router.get('/:id', getProfile);

export default router;
