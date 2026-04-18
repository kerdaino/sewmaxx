import { Composer } from 'telegraf';
import {
  handleAdminAffiliateDetailCommand,
  handleAdminAffiliatesCommand,
  handleAdminRequestsCommand,
  handleAdminTailorDetailCommand,
  handleAdminTailorsCommand,
  handleApproveAffiliateCommand,
  handleApproveTailorCommand,
  handleRejectAffiliateCommand,
  handleRejectTailorCommand,
  handleUpdateRequestCommand,
} from '../handlers/admin.handler.js';

const adminRouter = new Composer();

adminRouter.command('admin_affiliates', handleAdminAffiliatesCommand);
adminRouter.command('admin_affiliate_detail', handleAdminAffiliateDetailCommand);
adminRouter.command('admin_tailors', handleAdminTailorsCommand);
adminRouter.command('admin_tailor_detail', handleAdminTailorDetailCommand);
adminRouter.command('approve_affiliate', handleApproveAffiliateCommand);
adminRouter.command('approve_tailor', handleApproveTailorCommand);
adminRouter.command('reject_affiliate', handleRejectAffiliateCommand);
adminRouter.command('reject_tailor', handleRejectTailorCommand);
adminRouter.command('admin_requests', handleAdminRequestsCommand);
adminRouter.command('update_request', handleUpdateRequestCommand);

export default adminRouter;
