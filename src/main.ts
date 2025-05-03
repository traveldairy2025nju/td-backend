import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // 设置API前缀（仅为功能模块添加前缀，保留根路径访问）
  app.setGlobalPrefix('api', {
    exclude: ['/', '/ping', '/init-test-user'],  // 排除根路径、ping路径和测试用户创建接口
  });
  
  // 配置静态文件服务
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });
  
  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,  // 不剔除未在DTO中声明的属性
      transform: true,
      forbidNonWhitelisted: false,  // 不拒绝未在DTO中声明的属性
    }),
  );
  
  // 配置Swagger文档
  const config = new DocumentBuilder()
    .setTitle('旅游日记平台 API')
    .setDescription('旅游日记平台的后端API文档')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
  
  // 启用CORS
  app.enableCors();
  
  await app.listen(process.env.PORT || 3000);
  console.log(`应用程序运行在: ${await app.getUrl()}`);
}
bootstrap(); 