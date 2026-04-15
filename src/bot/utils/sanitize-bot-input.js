import { sanitizeText } from '../../utils/sanitize.js';

export const sanitizeBotInput = (value, maxLength = 120) => sanitizeText(value, maxLength);
