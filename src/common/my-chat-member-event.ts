import { Bot } from 'grammy';
import { UserService } from 'src/modules/user/user.service';
import { UserStatus } from 'src/modules/user/user.schema';

export const myChatMemberEvent = (bot: Bot, userService: UserService) => {
  bot.on('my_chat_member', async (ctx) => {
    const { new_chat_member } = ctx.myChatMember;
    const telegram_id = ctx.from.id;
    const user = await userService.findByTelegramId(telegram_id.toString());

    // If user is blocked, do not process further
    if (user && user.status === UserStatus.BLOCK) {
      return;
    }

    // Update user status regardless of chat type
    if (new_chat_member.status === 'kicked') {
      if (user) {
        await userService.updateUserStatus(
          telegram_id.toString(),
          UserStatus.NOT_ACTIVE,
        );
      }
    } else if (
      new_chat_member.status === 'member' ||
      new_chat_member.status === 'administrator'
    ) {
      if (user && user.status === UserStatus.NOT_ACTIVE) {
        await userService.updateUserStatus(
          telegram_id.toString(),
          UserStatus.ACTIVE,
        );
      }
    }
  });
};
