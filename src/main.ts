import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import 'reflect-metadata';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(json({ limit: '5mb' }));
  app.use(urlencoded({ limit: '5mb', extended: true }));
  app.enableCors(
    {
      credentials: true,
      origin: (origin, callback) => {
        const allowedOrigins = [
          'https://www.cpvl.esp.br',
          /^http:\/\/localhost:\d+$/,
        ];

        if (
          !origin ||
          allowedOrigins.some((pattern) =>
            pattern instanceof RegExp ? pattern.test(origin) : pattern === origin,
          )
        ) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
    }
  );
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  await app.listen(process.env.PORT || 8000);
}
bootstrap();
