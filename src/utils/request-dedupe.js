import crypto from 'node:crypto';

const normalize = (value, maxLength = 120) => String(value ?? '').trim().toLowerCase().slice(0, maxLength);

export const buildRequestDedupeKey = ({
  clientProfileId,
  outfitType,
  style,
  country,
  city,
  area,
  dueDate,
  budgetMin,
  budgetMax,
  currency,
}) =>
  crypto
    .createHash('sha256')
    .update(
      [
        normalize(clientProfileId, 64),
        normalize(outfitType, 40),
        normalize(style, 80),
        normalize(country, 80),
        normalize(city, 80),
        normalize(area, 120),
        dueDate instanceof Date ? dueDate.toISOString() : '',
        Number.isFinite(budgetMin) ? String(budgetMin) : '',
        Number.isFinite(budgetMax) ? String(budgetMax) : '',
        normalize(currency, 8),
      ].join('|'),
      'utf8',
    )
    .digest('hex');
