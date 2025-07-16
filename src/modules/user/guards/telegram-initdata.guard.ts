import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { UserService } from '../user.service';

@Injectable()
export class TelegramInitDataGuard implements CanActivate {
  constructor(private readonly userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const initData = request.headers['authorization'];
    if (!initData) {
      throw new UnauthorizedException(
        'initData (authorization header) is required',
      );
    }
    const validationResult = this.userService.validateInitData(
      initData as string,
    );
    if (!validationResult || !validationResult.telegramId) {
      throw new UnauthorizedException('Invalid initData');
    }
    const telegramId = validationResult.telegramId;

    const user = await this.userService.findByTelegramId(telegramId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    request['user'] = user;
    request['initData'] = { telegram_id: telegramId, user: user };

    return true;
  }
}
