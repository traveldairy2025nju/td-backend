import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import appConfig from './config/app.config';
import minioConfig from './config/minio.config';
import { MinioModule } from './minio/minio.module';
import { User, UserSchema } from './users/entities/user.entity';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, minioConfig],
    }),
    
    // MongoDB连接
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('app.mongoUri'),
      }),
    }),
    
    // 为AppController提供User模型
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    
    // Minio模块
    MinioModule,
    
    // 功能模块
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {} 