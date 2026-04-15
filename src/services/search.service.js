import { TailorProfile } from '../models/tailor-profile.model.js';

const normalize = (value) => String(value ?? '').trim().toLowerCase();

export const getBudgetCompatibilityScore = (tailorBudgetRange, requestedBudgetRange) => {
  if (
    tailorBudgetRange?.min === null ||
    tailorBudgetRange?.max === null ||
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
  const tailors = await TailorProfile.find({
    'location.city': new RegExp(`^${city}$`, 'i'),
    isAvailable: true,
    status: { $in: ['active', 'pending_review'] },
    verificationStatus: { $in: ['pending', 'verified'] },
  })
    .select('businessName publicName location workAddress specialties styles budgetRange verificationStatus status')
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
        ...tailor,
        score,
      };
    })
    .filter((tailor) => tailor.score >= 5)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);

  return scoredTailors;
};
