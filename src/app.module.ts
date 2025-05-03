import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DiariesModule } from './diaries/diaries.module';
import { AdminModule } from './admin/admin.module';
import appConfig from './config/app.config';
import minioConfig from './config/minio.config';
import { MinioModule } from './minio/minio.module';

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
    
    // Minio模块
    MinioModule,
    
    // 功能模块
    UsersModule,
    AuthModule,
    DiariesModule,
    AdminModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {} 