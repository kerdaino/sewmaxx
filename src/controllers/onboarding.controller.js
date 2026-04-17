import { StatusCodes } from 'http-status-codes';
import {
  affiliateOnboardingSchema,
  clientOnboardingSchema,
  tailorOnboardingSchema,
} from '../validations/onboarding.validation.js';
import { validatePayload } from '../utils/validators.js';
import { onboardAffiliate, onboardClient, onboardTailor } from '../services/onboarding.service.js';

export const createAffiliateOnboarding = async (req, res) => {
  const payload = validatePayload(affiliateOnboardingSchema, req.body);
  const affiliate = await onboardAffiliate(payload);

  res.status(StatusCodes.CREATED).json({
    success: true,
    data: {
      id: affiliate._id,
      affiliateCode: affiliate.affiliateCode,
      status: affiliate.status,
    },
  });
};

export const createClientOnboarding = async (req, res) => {
  const payload = validatePayload(clientOnboardingSchema, req.body);
  const client = await onboardClient(payload);

  res.status(StatusCodes.CREATED).json({
    success: true,
    data: {
      id: client._id,
      city: client.location?.city ?? '',
    },
  });
};

export const createTailorOnboarding = async (req, res) => {
  const payload = validatePayload(tailorOnboardingSchema, req.body);
  const tailor = await onboardTailor(payload);

  res.status(StatusCodes.CREATED).json({
    success: true,
    data: {
      id: tailor._id,
      city: tailor.location?.city ?? '',
      specialties: tailor.specialties,
    },
  });
};
