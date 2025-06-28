import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findOne(steamId: string): Promise<User> {
    const user = await this.userModel.findOne({ steam_id: steamId }).exec();
    if (!user) {
      throw new NotFoundException(`User with Steam ID ${steamId} not found`);
    }
    return user;
  }

  async findBySteamId(steamId: string): Promise<User | null> {
    return this.userModel.findOne({ steam_id: steamId }).exec();
  }

  async update(steamId: string, updateUserDto: UpdateUserDto): Promise<User> {
    const updatedUser = await this.userModel
      .findOneAndUpdate({ steam_id: steamId }, updateUserDto, { new: true })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with Steam ID ${steamId} not found`);
    }

    return updatedUser;
  }

  async remove(steamId: string): Promise<void> {
    const result = await this.userModel.deleteOne({ steam_id: steamId }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`User with Steam ID ${steamId} not found`);
    }
  }

  // Steam specific methods
  async createOrUpdateSteamUser(steamData: any): Promise<User> {
    const existingUser = await this.findBySteamId(steamData.steamid);

    if (existingUser) {
      // Update existing user
      const updateData: UpdateUserDto = {
        personaname: steamData.personaname,
      };

      return this.update(steamData.steamid, updateData);
    } else {
      // Create new user
      const createData: CreateUserDto = {
        steam_id: steamData.steamid,
        personaname: steamData.personaname,
      };

      return this.create(createData);
    }
  }

  async updateSteamToken(steamId: string, token: string): Promise<User> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

    return this.update(steamId, {
      steam_token: token,
      token_expires_at: expiresAt,
    });
  }

  async updatePhone(steamId: string, phone: string): Promise<User> {
    return this.update(steamId, {
      phone,
    });
  }

  async updateTelegramId(steamId: string, telegramId: string): Promise<User> {
    return this.update(steamId, {
      telegram_id: telegramId,
    });
  }

  async getUsersWithPhone(): Promise<User[]> {
    return this.userModel
      .find({
        phone: { $exists: true, $ne: null },
      })
      .exec();
  }

  async getUsersWithTelegram(): Promise<User[]> {
    return this.userModel
      .find({
        telegram_id: { $exists: true, $ne: null },
      })
      .exec();
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.userModel.findOne({ phone }).exec();
  }

  async findByTelegramId(telegramId: string): Promise<User | null> {
    return this.userModel.findOne({ telegram_id: telegramId }).exec();
  }
}
