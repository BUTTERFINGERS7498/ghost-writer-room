import { Router } from 'express';
import { toggleVote } from '../controllers/paragraphController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/:id/vote', requireAuth, toggleVote);

export default router;
