import { beforeEach, describe, expect, it, vi } from 'vitest';

const affiliateProfileFindByIdAndUpdate = vi.fn();
const requestPostFindById = vi.fn();
const requestPostFindByIdAndUpdate = vi.fn();
const tailorProfileFindByIdAndUpdate = vi.fn();

vi.mock('../../src/models/affiliate-profile.model.js', () => ({
  AffiliateProfile: {
    findByIdAndUpdate: affiliateProfileFindByIdAndUpdate,
    find: vi.fn(),
  },
}));

vi.mock('../../src/models/request-post.model.js', () => ({
  RequestPost: {
    find: vi.fn(),
    findById: requestPostFindById,
    findByIdAndUpdate: requestPostFindByIdAndUpdate,
  },
}));

vi.mock('../../src/models/search-session.model.js', () => ({
  SearchSession: {
    find: vi.fn(),
  },
}));

vi.mock('../../src/models/tailor-profile.model.js', () => ({
  TailorProfile: {
    find: vi.fn(),
    findByIdAndUpdate: tailorProfileFindByIdAndUpdate,
  },
}));

describe('admin service request transitions', () => {
  beforeEach(() => {
    affiliateProfileFindByIdAndUpdate.mockReset();
    requestPostFindById.mockReset();
    requestPostFindByIdAndUpdate.mockReset();
    tailorProfileFindByIdAndUpdate.mockReset();
  });

  it('updates tailor approval status and activation state together', async () => {
    const { updateTailorApprovalStatus } = await import('../../src/services/admin.service.js');

    tailorProfileFindByIdAndUpdate.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: 'tailor-1',
          verificationStatus: 'approved',
          status: 'active',
        }),
      }),
    });

    const result = await updateTailorApprovalStatus({
      tailorId: '507f1f77bcf86cd799439011',
      verificationStatus: 'approved',
      adminTelegramUserId: '99',
      auditRequestId: 'audit-1',
    });

    expect(result).toMatchObject({
      _id: 'tailor-1',
      verificationStatus: 'approved',
      status: 'active',
    });
  });

  it('updates affiliate approval status and activation state together', async () => {
    const { updateAffiliateApprovalStatus } = await import('../../src/services/admin.service.js');

    affiliateProfileFindByIdAndUpdate.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: 'affiliate-1',
          verificationStatus: 'rejected',
          status: 'inactive',
        }),
      }),
    });

    const result = await updateAffiliateApprovalStatus({
      affiliateId: '507f1f77bcf86cd799439011',
      verificationStatus: 'rejected',
      adminTelegramUserId: '99',
      auditRequestId: 'audit-1',
    });

    expect(result).toMatchObject({
      _id: 'affiliate-1',
      verificationStatus: 'rejected',
      status: 'inactive',
    });
  });

  it('rejects invalid request status transitions', async () => {
    const { updateRequestManagementStatus } = await import('../../src/services/admin.service.js');

    requestPostFindById.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ status: 'completed' }),
      }),
    });

    await expect(
      updateRequestManagementStatus({
        requestPostId: '507f1f77bcf86cd799439011',
        status: 'pending',
        adminTelegramUserId: '99',
        auditRequestId: 'audit-1',
      }),
    ).rejects.toMatchObject({
      message: 'Invalid request status transition from completed to pending',
    });

    expect(requestPostFindByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('updates valid request status transitions', async () => {
    const { updateRequestManagementStatus } = await import('../../src/services/admin.service.js');

    requestPostFindById.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ status: 'pending' }),
      }),
    });

    requestPostFindByIdAndUpdate.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: 'request-1',
          status: 'reviewing',
          coordinatorStatus: 'reviewing',
        }),
      }),
    });

    const result = await updateRequestManagementStatus({
      requestPostId: '507f1f77bcf86cd799439011',
      status: 'reviewing',
      adminTelegramUserId: '99',
      auditRequestId: 'audit-1',
    });

    expect(result).toMatchObject({
      _id: 'request-1',
      status: 'reviewing',
      coordinatorStatus: 'reviewing',
    });
  });
});
