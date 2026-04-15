import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import {
  createAffiliateOnboarding,
  createClientOnboarding,
  createTailorOnboarding,
} from '../controllers/onboarding.controller.js';

const router = Router();

router.post('/onboarding/affiliate', asyncHandler(createAffiliateOnboarding));
router.post('/onboarding/client', asyncHandler(createClientOnboarding));
router.post('/onboarding/tailor', asyncHandler(createTailorOnboarding));

export default router;
