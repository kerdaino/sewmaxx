import mongoose from 'mongoose';
import { AffiliateProfile } from '../src/models/affiliate-profile.model.js';
import { ClientProfile } from '../src/models/client-profile.model.js';
import { Referral } from '../src/models/referral.model.js';
import { RequestPost } from '../src/models/request-post.model.js';
import { SearchSession } from '../src/models/search-session.model.js';
import { TailorProfile } from '../src/models/tailor-profile.model.js';
import { User } from '../src/models/user.model.js';
import { connectDatabase } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import { logger } from '../src/config/logger.js';

const CONFIRMATION_PHRASE = 'DELETE_SEWMAXX_TEST_DATA';
const SAFE_DB_NAME_PATTERN = /(dev|development|test|testing|local|sandbox|staging)/i;

const parseArgs = () => {
  const args = new Map();

  for (const arg of process.argv.slice(2)) {
    if (!arg.startsWith('--')) {
      continue;
    }

    const [key, ...valueParts] = arg.slice(2).split('=');
    args.set(key, valueParts.length > 0 ? valueParts.join('=') : 'true');
  }

  return args;
};

const splitList = (value) =>
  String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const buildRegex = (pattern) => {
  if (!pattern) {
    return null;
  }

  return new RegExp(pattern, 'i');
};

const toIdStrings = (items) => items.map((item) => String(item._id));

const buildUserTestFilter = ({ telegramIds, namePattern, testFlag }) => {
  const clauses = [];

  if (telegramIds.length > 0) {
    clauses.push({ telegramUserId: { $in: telegramIds } });
  }

  if (namePattern) {
    clauses.push(
      { telegramUsername: namePattern },
      { firstName: namePattern },
      { lastName: namePattern },
    );
  }

  if (testFlag) {
    clauses.push({ 'internalAudit.riskFlags': testFlag });
  }

  return clauses.length > 0 ? { $or: clauses } : null;
};

const buildProfileTestFilter = ({ userIds, namePattern, testFlag, profileNameFields }) => {
  const clauses = [];

  if (userIds.length > 0) {
    clauses.push({ userId: { $in: userIds } });
  }

  if (namePattern) {
    clauses.push(...profileNameFields.map((field) => ({ [field]: namePattern })));
  }

  if (testFlag) {
    clauses.push({ 'internalAudit.riskFlags': testFlag });
  }

  return clauses.length > 0 ? { $or: clauses } : null;
};

const findIds = async (Model, filter) => {
  if (!filter) {
    return [];
  }

  return Model.find(filter).select('_id').lean();
};

const assertSafeEnvironment = ({ allowDbName }) => {
  if (env.isProduction) {
    throw new Error('Refusing to run test data cleanup when NODE_ENV=production.');
  }

  if (SAFE_DB_NAME_PATTERN.test(env.MONGODB_DB_NAME)) {
    return;
  }

  if (allowDbName && allowDbName === env.MONGODB_DB_NAME) {
    return;
  }

  throw new Error(
    `Refusing to run cleanup for database "${env.MONGODB_DB_NAME}". Use a dev/test/staging database name, or pass --allow-db-name=${env.MONGODB_DB_NAME} after verifying the target database.`,
  );
};

const printPlan = ({ execute, selectors, ids, counts }) => {
  const plan = {
    mode: execute ? 'execute' : 'dry-run',
    selectors,
    database: env.MONGODB_DB_NAME,
    counts,
    ids,
  };

  process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
};

const deleteByIds = async (Model, ids) => {
  if (ids.length === 0) {
    return { deletedCount: 0 };
  }

  return Model.deleteMany({ _id: { $in: ids } });
};

const main = async () => {
  const args = parseArgs();
  const execute = args.get('execute') === 'true';
  const confirmation = args.get('confirm') ?? process.env.SEWMAXX_TEST_DATA_CLEANUP_CONFIRM;
  const telegramIds = splitList(args.get('telegram-ids') ?? process.env.SEWMAXX_TEST_TELEGRAM_IDS);
  const testFlag = args.get('test-flag') ?? process.env.SEWMAXX_TEST_DATA_FLAG ?? '';
  const namePattern = buildRegex(args.get('name-pattern') ?? process.env.SEWMAXX_TEST_NAME_PATTERN ?? '');
  const allowDbName = args.get('allow-db-name') ?? process.env.SEWMAXX_CLEANUP_ALLOW_DB_NAME ?? '';

  assertSafeEnvironment({ allowDbName });

  if (telegramIds.length === 0 && !namePattern && !testFlag) {
    throw new Error(
      'No test selectors provided. Pass --telegram-ids=123,456, --name-pattern="^test", or --test-flag=test_data.',
    );
  }

  if (execute && confirmation !== CONFIRMATION_PHRASE) {
    throw new Error(`Deletion requires --confirm=${CONFIRMATION_PHRASE}. Run without --execute for a dry run.`);
  }

  await connectDatabase();

  const userFilter = buildUserTestFilter({ telegramIds, namePattern, testFlag });
  const users = await findIds(User, userFilter);
  const userIds = users.map((user) => user._id);

  const clients = await findIds(
    ClientProfile,
    buildProfileTestFilter({
      userIds,
      namePattern,
      testFlag,
      profileNameFields: ['fullName'],
    }),
  );
  const tailors = await findIds(
    TailorProfile,
    buildProfileTestFilter({
      userIds,
      namePattern,
      testFlag,
      profileNameFields: ['fullName', 'publicName', 'businessName'],
    }),
  );
  const affiliates = await findIds(
    AffiliateProfile,
    buildProfileTestFilter({
      userIds,
      namePattern,
      testFlag,
      profileNameFields: ['fullName', 'displayName'],
    }),
  );

  const clientProfileIds = clients.map((client) => client._id);
  const tailorProfileIds = tailors.map((tailor) => tailor._id);
  const affiliateProfileIds = affiliates.map((affiliate) => affiliate._id);
  const profileUserIds = [...userIds];

  const requests = await findIds(RequestPost, {
    $or: [
      { userId: { $in: profileUserIds } },
      { clientProfileId: { $in: clientProfileIds } },
      ...(testFlag ? [{ 'internalAudit.riskFlags': testFlag }] : []),
    ],
  });

  const searchSessions = await findIds(SearchSession, {
    $or: [
      { userId: { $in: profileUserIds } },
      { clientProfileId: { $in: clientProfileIds } },
      { matchedTailorIds: { $in: tailorProfileIds } },
      ...(testFlag ? [{ 'internalAudit.riskFlags': testFlag }] : []),
    ],
  });

  const referrals = await findIds(Referral, {
    $or: [
      { affiliateProfileId: { $in: affiliateProfileIds } },
      { affiliateUserId: { $in: profileUserIds } },
      { referredUserId: { $in: profileUserIds } },
      ...(telegramIds.length > 0 ? [{ referredTelegramUserId: { $in: telegramIds } }] : []),
      ...(testFlag ? [{ 'internalAudit.riskFlags': testFlag }] : []),
    ],
  });

  const ids = {
    users: toIdStrings(users),
    clients: toIdStrings(clients),
    tailors: toIdStrings(tailors),
    affiliates: toIdStrings(affiliates),
    requests: toIdStrings(requests),
    searchSessions: toIdStrings(searchSessions),
    referrals: toIdStrings(referrals),
  };
  const counts = Object.fromEntries(Object.entries(ids).map(([key, value]) => [key, value.length]));

  printPlan({
    execute,
    selectors: {
      telegramIds,
      namePattern: namePattern?.source ?? '',
      testFlag,
    },
    ids,
    counts,
  });

  if (!execute) {
    process.stdout.write('Dry run only. Add --execute --confirm=DELETE_SEWMAXX_TEST_DATA to delete these records.\n');
    return;
  }

  const results = {
    requests: await deleteByIds(RequestPost, requests.map((request) => request._id)),
    searchSessions: await deleteByIds(SearchSession, searchSessions.map((session) => session._id)),
    referrals: await deleteByIds(Referral, referrals.map((referral) => referral._id)),
    clients: await deleteByIds(ClientProfile, clientProfileIds),
    tailors: await deleteByIds(TailorProfile, tailorProfileIds),
    affiliates: await deleteByIds(AffiliateProfile, affiliateProfileIds),
    users: await deleteByIds(User, profileUserIds),
  };

  process.stdout.write(`${JSON.stringify({ deleted: results }, null, 2)}\n`);
};

main()
  .catch((error) => {
    logger.error({ error }, 'Test data cleanup failed');
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
