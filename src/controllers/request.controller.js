import { StatusCodes } from 'http-status-codes';
import { createServiceRequestSchema } from '../validations/request.validation.js';
import { validatePayload } from '../utils/validators.js';
import { createServiceRequest } from '../services/request.service.js';

export const postServiceRequest = async (req, res) => {
  const payload = validatePayload(createServiceRequestSchema, req.body);
  const request = await createServiceRequest(payload);

  res.status(StatusCodes.CREATED).json({
    success: true,
    data: request,
  });
};
