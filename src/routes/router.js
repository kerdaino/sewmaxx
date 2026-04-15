import { Router } from 'express';
import adminRoutes from './admin.routes.js';
import healthRoutes from './health.routes.js';
import onboardingRoutes from './onboarding.routes.js';
import referralRoutes from './referral.routes.js';
import requestRoutes from './request.routes.js';
import searchRoutes from './search.routes.js';

const router = Router();

router.use(adminRoutes);
router.use(healthRoutes);
router.use(onboardingRoutes);
router.use(referralRoutes);
router.use(searchRoutes);
router.use(requestRoutes);

export default router;
