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

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const initData = request.headers['authorization'];
    if (!initData) {
      throw new UnauthorizedException(
        'initData (authorization header) is required',
      );
    }
    const telegramId = this.userService.validateInitData(initData as string);
    if (!telegramId) {
      throw new UnauthorizedException('Invalid initData');
    }
    request['initData'] = { telegram_id: telegramId };
    return true;
  }
}
