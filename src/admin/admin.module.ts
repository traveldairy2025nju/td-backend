import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DiariesModule } from '../diaries/diaries.module';
import { User, UserSchema } from '../users/entities/user.entity';
import { Diary, DiarySchema } from '../diaries/entities/diary.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Diary.name, schema: DiarySchema },
    ]),
    DiariesModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {} 