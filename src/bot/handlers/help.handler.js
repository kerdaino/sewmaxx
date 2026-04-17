import { getStartFlowState } from '../services/start-flow.service.js';
import { buildRoleAwareHelpMessage } from '../services/role-guidance.service.js';

export const handleHelpCommand = async (ctx) => {
  ctx.session.lastCommand = '/help';
  const flowState = await getStartFlowState(ctx);

  await ctx.reply(
    buildRoleAwareHelpMessage({
      profiles: flowState.profiles,
      selectedRole: ctx.session.selectedRole,
      telegramUserId: String(ctx.from?.id ?? ''),
    }),
  );
};
