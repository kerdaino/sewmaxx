import { isTelegramAdmin } from './admin-access.service.js';

const CLIENT_HELP = [
  'Client commands:',
  '/search - find approved tailors by style, city, and budget',
  '/requests - post a request for Sewmaxx coordinators to handle manually',
  '/client - view your client profile again',
  '/help - see your next best actions',
];

const TAILOR_HELP = [
  'Tailor commands:',
  '/tailor_requests - view request leads that match your city and specialties',
  '/tailor - view your onboarding summary again',
  '/help - see your next best actions',
];

const AFFILIATE_HELP = [
  'Affiliate commands:',
  '/affiliate - view your affiliate profile and referral link',
  '/help - see your next best actions',
];

const ADMIN_HELP = [
  'Admin commands:',
  '/admin_tailors - list recent tailor signups',
  '/approve_tailor <id> - approve a tailor',
  '/reject_tailor <id> - reject a tailor',
  '/admin_affiliates - list recent affiliate signups',
  '/approve_affiliate <id> - approve an affiliate',
  '/reject_affiliate <id> - reject an affiliate',
  '/admin_requests - list recent client requests',
  '/update_request <id> <pending|reviewing|assigned|completed> - update request status',
];

const NEXT_STEPS = Object.freeze({
  client: [
    'What you can do next:',
    'Use /search to review approved tailor options by city, style, and budget.',
    'Use /requests if you want Sewmaxx coordinators to handle matching and follow-up for you.',
  ],
  tailor: [
    'What you can do next:',
    'Wait for admin approval so your profile can appear in client search results.',
    'Use /tailor_requests to review matching request leads while Sewmaxx coordinators handle manual matching and follow-up.',
  ],
  affiliate: [
    'What you can do next:',
    'Share your referral link or affiliate code with new users.',
    'Use /affiliate anytime to view your code and referral link again.',
  ],
  admin: [
    'What you can do next:',
    'Use the admin commands below to review new records and move approvals or request updates forward.',
  ],
});

export const inferPrimaryRole = ({ profiles, selectedRole }) => {
  if (selectedRole) {
    return selectedRole;
  }

  if (profiles?.clientProfile) {
    return 'client';
  }

  if (profiles?.tailorProfile) {
    return 'tailor';
  }

  if (profiles?.affiliateProfile) {
    return 'affiliate';
  }

  return null;
};

export const buildRoleAwareHelpMessage = ({ profiles, selectedRole, telegramUserId }) => {
  const isAdmin = isTelegramAdmin(telegramUserId);
  const role = inferPrimaryRole({ profiles, selectedRole });
  const sections = [];

  if (!role && !isAdmin) {
    sections.push(
      'Getting started commands:',
      '/start - choose your role and begin',
      '/client - client onboarding',
      '/tailor - tailor onboarding',
      '/affiliate - affiliate onboarding',
      '/help - see role-based guidance',
    );
  }

  if (role === 'client') {
    sections.push('You are using Sewmaxx as a client.', '', ...CLIENT_HELP);
  } else if (role === 'tailor') {
    sections.push('You are using Sewmaxx as a tailor.', '', ...TAILOR_HELP);
  } else if (role === 'affiliate') {
    sections.push('You are using Sewmaxx as an affiliate.', '', ...AFFILIATE_HELP);
  } else if (isAdmin) {
    sections.push('You are using Sewmaxx as an admin.');
  }

  if (role && NEXT_STEPS[role]) {
    sections.push('', ...NEXT_STEPS[role]);
  }

  if (isAdmin) {
    sections.push('', ...ADMIN_HELP, '', ...NEXT_STEPS.admin);
  }

  return sections.join('\n');
};

export const buildNextStepsMessage = (role) => NEXT_STEPS[role]?.join('\n') ?? '';
