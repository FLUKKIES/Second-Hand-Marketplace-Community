import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { join } from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.enableCors({
        origin: 'http://localhost:3000',
        credentials: true,
    });

    app.use(cookieParser());

    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        exceptionFactory: (errors) => {
            const messages = errors.map((error) => ({
                field: error.property,
                message: error.constraints ? Object.values(error.constraints).join('. ') + '.' : 'Validation failed',
            }));
            return new BadRequestException({ errors: messages });
        },
    }));

    // const config = new DocumentBuilder()
    //     .setTitle('Social Mart API')
    //     .setDescription('The Social Mart API description')
    //     .setVersion('1.0')
    //     .addBearerAuth()
    //     .build();
    // const document = SwaggerModule.createDocument(app, config);
    // SwaggerModule.setup('api', app, document);

    await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
    console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
