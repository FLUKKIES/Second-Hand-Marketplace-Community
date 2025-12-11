import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { join } from 'path';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

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
    }))

    // // --- เพิ่มตรงนี้เพื่อ Debug ---
    // console.log('------------------------------------------------');
    // console.log('Current Directory (__dirname):', __dirname);
    // console.log('Current Directory (__dirname):', process.cwd());
    // console.log('Target Public Path:', join(__dirname, '..', 'public'));
    // console.log('------------------------------------------------');
    // // ---------------------------

    await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
