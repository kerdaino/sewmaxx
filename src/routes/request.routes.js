import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { postServiceRequest } from '../controllers/request.controller.js';

const router = Router();

router.post('/requests', asyncHandler(postServiceRequest));

export default router;
