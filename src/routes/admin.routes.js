import { Router } from 'express';
import { getRecentAffiliates, getRecentClientRequests, getRecentTailorSignups, getSearchSessionReviews } from '../controllers/admin.controller.js';
import { adminAuthMiddleware } from '../middlewares/admin-auth.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

// Production-safe improvement needed later:
// replace this dev token middleware with real staff auth, role checks, IP/network restrictions, and audit persistence.
router.use('/admin', adminAuthMiddleware);

router.get('/admin/affiliates/recent', asyncHandler(getRecentAffiliates));
router.get('/admin/requests/recent', asyncHandler(getRecentClientRequests));
router.get('/admin/tailors/recent', asyncHandler(getRecentTailorSignups));
router.get('/admin/search-sessions/review', asyncHandler(getSearchSessionReviews));

export default router;
