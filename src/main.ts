import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // 设置API前缀
  app.setGlobalPrefix('api');
  
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
  
  // 提供JSON格式的API文档
  app.use('/api-json', (req, res) => {
    res.send(document);
  });
  
  SwaggerModule.setup('api-docs', app, document);
  
  // 启用CORS
  app.enableCors();
  
  // 获取配置服务
  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port');
  
  await app.listen(port);
  console.log(`应用程序运行在: http://[::1]:${port}`);
}
bootstrap(); 