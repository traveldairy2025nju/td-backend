import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { json } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });
  
  // 设置API前缀
  app.setGlobalPrefix('api');
  
  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,  // 不剔除未在DTO中声明的属性
      transform: true,
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
  
  // 增加请求体大小限制
  app.use(json({ limit: '50mb' }));
  
  // 设置全局请求超时时间为 120 秒
  app.use((req, res, next) => {
    res.setTimeout(120000, () => {
      res.status(408).send('请求超时');
    });
    next();
  });
  
  await app.listen(port);
  console.log(`应用程序运行在: http://[::1]:${port}`);
}
bootstrap(); 