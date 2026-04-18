import { describe, expect, it } from 'vitest';

import { buildTailorSummary } from '../../src/bot/services/tailor-onboarding.service.js';

describe('buildTailorSummary', () => {
  it('renders safely when optional tailor fields are missing', () => {
    const summary = buildTailorSummary({
      tailor: {
        fullName: 'Ada Obi',
        businessName: 'Ada Stitches',
        publicName: 'Ada Stitches',
        location: {
          country: 'Nigeria',
          city: 'Lagos',
        },
        workAddress: '12 Marina',
        specialties: ['Bridal', 'Ready-to-wear'],
      },
    });

    expect(summary).toContain('Tailor onboarding complete.');
    expect(summary).toContain('Portfolio uploads: 0');
    expect(summary).toContain('ID submitted: No');
    expect(summary).toContain('Selfie with ID submitted: No');
    expect(summary).toContain('Verification: pending');
    expect(summary).toContain('Service range: not set');
  });
});
