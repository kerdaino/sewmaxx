import { StatusCodes } from 'http-status-codes';
import { referralTrackingSchema } from '../validations/referral.validation.js';
import { validatePayload } from '../utils/validators.js';
import { trackReferral } from '../services/referral.service.js';

export const createReferralEvent = async (req, res) => {
  const payload = validatePayload(referralTrackingSchema, req.body);
  const referral = await trackReferral(payload);

  res.status(StatusCodes.CREATED).json({
    success: true,
    data: referral,
  });
};
