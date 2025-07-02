import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-steam';
import { UserService } from './user.service';
import { serverUrl, steamApiKey, steamCallbackUrl } from 'src/utils/shared';

@Injectable()
export class SteamStrategy extends PassportStrategy(Strategy, 'steam') {
  constructor(private userService: UserService) {
    super({
      returnURL: `${serverUrl}${steamCallbackUrl}`, // https://bluebird-fancy-painfully.ngrok-free.app/users/steam/callback
      realm: serverUrl, // https://bluebird-fancy-painfully.ngrok-free.app
      apiKey: steamApiKey, // 7B2D69A499F4BF6F99FD9E862D781BA6
      passReqToCallback: true,
    });
  }

  async validate(
    req: any,
    identifier: string,
    profile: any,
    done: (err: any, user: any) => void,
  ) {
    const steamId = identifier.match(/\d+$/)[0]; // 64-bit Steam ID
    const initData = req.cookies.initData;

    if (!initData) {
      return done(new Error('strategy da initData topilmadi'), null);
    }
    done(null, { steamId, profile, initData });
  }
}
