import mongoose from 'mongoose';
import { TailorProfile } from '../models/tailor-profile.model.js';
import { logger } from '../config/logger.js';
import { escapeRegExp } from '../utils/escape-regexp.js';

const normalize = (value) => String(value ?? '').trim().toLowerCase();
const PUBLIC_TAILOR_SEARCH_FIELDS = [
  'businessName',
  'publicName',
  'location',
  'specialties',
  'styles',
  'budgetRange',
  'verificationStatus',
  'status',
].join(' ');
// Public search results must not leak a tailor's exact work address or private review/KYC fields.
const toPublicTailorSearchResult = ({ workAddress: _workAddress, ...tailor }) => tailor;

export const getBudgetCompatibilityScore = (tailorBudgetRange, requestedBudgetRange) => {
  if (
    tailorBudgetRange?.min === null ||
    tailorBudgetRange?.max === null ||
    requestedBudgetRange?.min === undefined ||
    requestedBudgetRange?.max === undefined ||
    requestedBudgetRange?.min === null ||
    requestedBudgetRange?.max === null
  ) {
    return 0;
  }

  const overlaps =
    requestedBudgetRange.min <= tailorBudgetRange.max &&
    requestedBudgetRange.max >= tailorBudgetRange.min;

  return overlaps ? 2 : -1;
};

export const calculateTailorMatchScore = ({ tailor, city, specialty, budgetRange }) => {
  let score = 0;
  const normalizedCity = normalize(city);
  const normalizedSpecialty = normalize(specialty);
  const tailorCity = normalize(tailor.location?.city);
  const allCategories = [...(tailor.specialties ?? []), ...(tailor.styles ?? [])].map(normalize);

  if (tailorCity === normalizedCity) {
    score += 5;
  }

  if (
    allCategories.some(
      (category) => category.includes(normalizedSpecialty) || normalizedSpecialty.includes(category),
    )
  ) {
    score += 3;
  }

  score += getBudgetCompatibilityScore(tailor.budgetRange, budgetRange);

  return score;
};

export const searchTailors = async ({ city, specialty, limit, budgetRange }) => {
  // Escape the city before building a regex so search input cannot alter the Mongo query shape.
  const safeCityPattern = new RegExp(`^${escapeRegExp(city)}$`, 'i');
  const statusFilter = mongoose.trusted({ $in: ['active'] });
  const verificationStatusFilter = mongoose.trusted({ $in: ['approved'] });
  const tailorQuery = {
    'location.city': safeCityPattern,
    isAvailable: true,
    status: statusFilter,
    verificationStatus: verificationStatusFilter,
  };

  const tailors = await TailorProfile.find(tailorQuery)
    .select(PUBLIC_TAILOR_SEARCH_FIELDS)
    .lean();

  const scoredTailors = tailors
    .map((tailor) => {
      // Simple Phase 1 scoring:
      // 1. exact city match is the strongest signal for immediate feasibility (+5)
      // 2. exact or close style/category match indicates service relevance (+3)
      // 3. overlapping budget range improves affordability fit (+2) while a clear mismatch reduces rank (-1)
      const score = calculateTailorMatchScore({
        tailor,
        city,
        specialty,
        budgetRange,
      });

      return {
        ...toPublicTailorSearchResult(tailor),
        score,
      };
    })
    .filter((tailor) => tailor.score >= 5)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);

  logger.info(
    {
      event: 'search_tailors_executed',
      specialty,
      limit,
      candidateCount: tailors.length,
      resultCount: scoredTailors.length,
      hasBudgetRange: budgetRange?.min !== null && budgetRange?.max !== null,
    },
    'Tailor search executed',
  );

  return scoredTailors;
};
