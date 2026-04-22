export const BOT_SESSION_DEFAULTS = Object.freeze({
  activeDomain: null,
  lastCommand: null,
  lastSeenAt: null,
  onboardingStartInFlight: false,
  selectedRole: null,
  pendingReferralCode: null,
  onboardingFlow: null,
  onboardingStep: null,
  onboardingDraft: null,
  searchFlow: null,
  searchStep: null,
  searchDraft: null,
  searchResults: null,
  searchPage: 0,
  requestFlow: null,
  requestStep: null,
  requestDraft: null,
  requestPublishInFlight: false,
  lastPublishedRequestFingerprint: null,
  lastPublishedRequestAt: null,
  tailorRequestPage: 0,
});

export const VISIBLE_BOT_COMMANDS = Object.freeze({
  general: Object.freeze([
    Object.freeze({ command: '/start', description: 'open the Sewmaxx welcome menu and choose how you want to continue' }),
    Object.freeze({ command: '/help', description: 'see the commands available to you right now' }),
  ]),
  client: Object.freeze([
    Object.freeze({ command: '/search', description: 'find approved tailors by style, city, and budget' }),
    Object.freeze({ command: '/requests', description: 'send a clothing request for Sewmaxx coordinators to handle for you' }),
    Object.freeze({ command: '/client', description: 'start or continue your client setup' }),
    Object.freeze({ command: '/help', description: 'see your client options again' }),
  ]),
  tailor: Object.freeze([
    Object.freeze({
      command: '/tailor_requests',
      description: 'check request leads that match your city and specialties',
    }),
    Object.freeze({ command: '/tailor', description: 'start or continue your tailor setup' }),
    Object.freeze({ command: '/help', description: 'see your tailor options again' }),
  ]),
  affiliate: Object.freeze([
    Object.freeze({ command: '/affiliate', description: 'start or continue your affiliate setup' }),
    Object.freeze({ command: '/help', description: 'see your affiliate options again' }),
  ]),
  admin: Object.freeze([
    Object.freeze({ command: '/admin_tailors', description: 'review recent tailor signups' }),
    Object.freeze({ command: '/admin_tailor_detail <id>', description: 'open the private review record for one tailor' }),
    Object.freeze({ command: '/approve_tailor <id>', description: 'approve a tailor profile' }),
    Object.freeze({ command: '/reject_tailor <id>', description: 'reject a tailor profile' }),
    Object.freeze({ command: '/admin_affiliates', description: 'review recent affiliate signups' }),
    Object.freeze({ command: '/admin_affiliate_detail <id>', description: 'open the private review record for one affiliate' }),
    Object.freeze({ command: '/approve_affiliate <id>', description: 'approve an affiliate profile' }),
    Object.freeze({ command: '/reject_affiliate <id>', description: 'reject an affiliate profile' }),
    Object.freeze({ command: '/admin_requests', description: 'review recent client requests' }),
    Object.freeze({
      command: '/update_request <id> <pending|reviewing|assigned|completed>',
      description: 'change the status of a client request',
    }),
  ]),
});

export const REGISTERED_BOT_COMMAND_SETS = Object.freeze({
  global: Object.freeze(['/start', '/help']),
  private: Object.freeze(['/start', '/help']),
});
