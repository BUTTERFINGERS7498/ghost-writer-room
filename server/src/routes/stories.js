import { Router } from 'express';
import { listStories, createStory, getStory, getTree } from '../controllers/storyController.js';
import { submitEntry } from '../controllers/paragraphController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createStorySchema, entrySchema } from '../middleware/schemas.js';

const router = Router();

router.get('/', listStories);
router.post('/', requireAuth, validate(createStorySchema), createStory);
router.get('/:id', getStory);
router.get('/:id/tree', getTree);
router.post('/:id/paragraphs', requireAuth, validate(entrySchema), submitEntry);

export default router;
