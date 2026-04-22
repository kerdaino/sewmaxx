import { isTelegramAdmin } from './admin-access.service.js';
import { VISIBLE_BOT_COMMANDS } from '../constants.js';

const buildCommandSection = (title, commands) => [
  `${title}`,
  ...commands.map(({ command, description }) => `${command} — ${description}`),
];

const NEXT_STEPS = Object.freeze({
  client: [
    'Quick tip',
    'Use /search to browse approved tailors yourself, or /requests if you want Sewmaxx coordinators to handle the matching for you.',
  ],
  tailor: [
    'Quick tip',
    'Use /tailor_requests to review matching leads. Your profile appears in client search after admin approval.',
  ],
  affiliate: [
    'Quick tip',
    'Use /affiliate anytime to view your referral code and link before sharing them.',
  ],
  admin: [
    'Quick tip',
    'Use the admin tools below to review records, approve or reject profiles, and update client request status.',
  ],
});

const roleHeadings = Object.freeze({
  client: 'Client',
  tailor: 'Tailor',
  affiliate: 'Affiliate',
  admin: 'Admin',
});

const ONBOARDING_SECTIONS = Object.freeze({
  client: buildCommandSection('Client', [VISIBLE_BOT_COMMANDS.client.find(({ command }) => command === '/client')]),
  tailor: buildCommandSection('Tailor', [VISIBLE_BOT_COMMANDS.tailor.find(({ command }) => command === '/tailor')]),
  affiliate: buildCommandSection('Affiliate', [VISIBLE_BOT_COMMANDS.affiliate.find(({ command }) => command === '/affiliate')]),
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
  const sections = ['Sewmaxx commands', '', ...buildCommandSection('General', VISIBLE_BOT_COMMANDS.general)];

  if (role && VISIBLE_BOT_COMMANDS[role]) {
    sections.push(
      '',
      ...buildCommandSection(roleHeadings[role], VISIBLE_BOT_COMMANDS[role]),
    );

    if (NEXT_STEPS[role]) {
      sections.push('', ...NEXT_STEPS[role]);
    }
  } else if (!isAdmin) {
    sections.push(
      '',
      ...ONBOARDING_SECTIONS.client,
      '',
      ...ONBOARDING_SECTIONS.tailor,
      '',
      ...ONBOARDING_SECTIONS.affiliate,
      '',
      'Choose the role that fits what you want to do, then continue with the matching commands for that role.',
    );
  }

  if (isAdmin) {
    sections.push('', ...buildCommandSection('Admin', VISIBLE_BOT_COMMANDS.admin), '', ...NEXT_STEPS.admin);
  }

  return sections.join('\n');
};

export const buildNextStepsMessage = (role) => NEXT_STEPS[role]?.join('\n') ?? '';
