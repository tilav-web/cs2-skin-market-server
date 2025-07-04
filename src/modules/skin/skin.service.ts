import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Skin, SkinDocument } from './skin.schema';
import { CreateSkinDto } from './dto/create-skin.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class SkinService {
  constructor(
    @InjectModel(Skin.name) private readonly skinModel: Model<SkinDocument>,
    private readonly userService: UserService,
  ) {}

  async create(createSkinDto: CreateSkinDto, telegram_id: string) {
    const user = await this.userService.findByTelegramId(telegram_id);
    if (!user) throw new NotFoundException('User not found');
    const created = new this.skinModel({
      ...createSkinDto,
      user: user._id,
    });
    return created.save();
  }

  async findAllByUser(telegram_id: string) {
    const user = await this.userService.findByTelegramId(telegram_id);
    if (!user) throw new NotFoundException('User not found');
    return this.skinModel.find({ user: user._id });
  }

  async findOneById(id: string, telegram_id: string) {
    const user = await this.userService.findByTelegramId(telegram_id);
    if (!user) throw new NotFoundException('User not found');
    const skin = await this.skinModel.findOne({ _id: id, user: user._id });
    if (!skin) throw new NotFoundException('Skin not found');
    return skin;
  }

  async update(id: string, dto: Partial<CreateSkinDto>, telegram_id: string) {
    const user = await this.userService.findByTelegramId(telegram_id);
    if (!user) throw new NotFoundException('User not found');
    const updated = await this.skinModel.findOneAndUpdate(
      {
        _id: id,
        user: user._id,
      },
      dto,
      { new: true },
    );
    if (!updated) throw new NotFoundException('Skin not found or not yours');
    return updated;
  }

  async remove(id: string, telegram_id: string) {
    const user = await this.userService.findByTelegramId(telegram_id);
    if (!user) throw new NotFoundException('User not found');
    const deleted = await this.skinModel.findOneAndDelete({
      _id: id,
      user: user._id,
    });
    if (!deleted) throw new NotFoundException('Skin not found or not yours');
    return deleted;
  }

  async findAdvertisingPending(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.skinModel
        .find({ advertising: true, status: 'pending' })
        .skip(skip)
        .limit(limit),
      this.skinModel.countDocuments({ advertising: true, status: 'pending' }),
    ]);
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOnePublicById(id: string) {
    const skin = await this.skinModel.findById(id);
    if (!skin) throw new NotFoundException('Skin not found');
    return skin;
  }
}
