// lambda.ts
import { Context, Callback, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as serverlessExpress from 'serverless-http';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ValidationPipe } from '@nestjs/common';

let server: any; // handle differing handler arities across serverless-http versions

async function bootstrapServer() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? '*',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.init();
  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress(expressApp);
}

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
  callback?: Callback
): Promise<APIGatewayProxyResult | void> => {
  context.callbackWaitsForEmptyEventLoop = false;

  if (!server) {
    server = await bootstrapServer();
  }

  // Some versions expect (event, context), others (event, context, callback)
  if (server.length === 2) {
    return server(event, context);
  } else {
    return server(event, context, callback);
  }
};
