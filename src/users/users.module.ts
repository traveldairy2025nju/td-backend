import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User, UserSchema } from './entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { MinioModule } from '../minio/minio.module';
import { memoryStorage } from 'multer';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MulterModule.register({
      storage: memoryStorage(),
    }),
    forwardRef(() => AuthModule),
    MinioModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {} 