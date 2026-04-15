import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { performSearch } from '../controllers/search.controller.js';

const router = Router();

router.post('/search', asyncHandler(performSearch));

export default router;
