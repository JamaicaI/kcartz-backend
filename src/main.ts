import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Input validation for every request body, using the rules in the DTO classes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips properties that are not in the DTO
      forbidNonWhitelisted: true, // ...and returns 400 if extra properties are sent
      transform: true, // converts the JSON body into the DTO class
    }),
  );

  app.enableCors(); // allows a React frontend to call this API later

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
