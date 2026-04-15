import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { createReferralEvent } from '../controllers/referral.controller.js';

const router = Router();

router.post('/referrals/track', asyncHandler(createReferralEvent));

export default router;
