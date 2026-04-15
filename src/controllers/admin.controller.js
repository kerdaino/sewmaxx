import { StatusCodes } from 'http-status-codes';
import { listRecentAffiliates, listRecentClientRequests, listRecentTailorSignups, reviewSearchSessions } from '../services/admin.service.js';
import { validatePayload } from '../utils/validators.js';
import { adminListQuerySchema } from '../validations/admin.validation.js';

const getValidatedQuery = (req) => validatePayload(adminListQuerySchema, req.query);

export const getRecentAffiliates = async (req, res) => {
  const query = getValidatedQuery(req);
  const data = await listRecentAffiliates({ limit: query.limit, requestId: req.id });

  res.status(StatusCodes.OK).json({
    success: true,
    data,
  });
};

export const getRecentClientRequests = async (req, res) => {
  const query = getValidatedQuery(req);
  const data = await listRecentClientRequests({ limit: query.limit, requestId: req.id });

  res.status(StatusCodes.OK).json({
    success: true,
    data,
  });
};

export const getRecentTailorSignups = async (req, res) => {
  const query = getValidatedQuery(req);
  const data = await listRecentTailorSignups({ limit: query.limit, requestId: req.id });

  res.status(StatusCodes.OK).json({
    success: true,
    data,
  });
};

export const getSearchSessionReviews = async (req, res) => {
  const query = getValidatedQuery(req);
  const data = await reviewSearchSessions({ limit: query.limit, requestId: req.id });

  res.status(StatusCodes.OK).json({
    success: true,
    data,
  });
};
