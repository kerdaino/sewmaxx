import { StatusCodes } from 'http-status-codes';
import { searchTailorsSchema } from '../validations/search.validation.js';
import { validatePayload } from '../utils/validators.js';
import { searchTailors } from '../services/search.service.js';

export const performSearch = async (req, res) => {
  const payload = validatePayload(searchTailorsSchema, req.body);
  const results = await searchTailors(payload);

  res.status(StatusCodes.OK).json({
    success: true,
    data: results,
  });
};
