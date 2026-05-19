import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { RegisterDto, LoginDto } from '../src/common/auth/dto/auth.dto';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const generateRandomSuffix = () => Math.random().toString(36).substring(7);

  describe('/auth/signup (POST)', () => {
    it('should register a new user successfully', () => {
      const suffix = generateRandomSuffix();
      const registerDto: RegisterDto = {
        email: `testuser_${suffix}@example.com`,
        username: `user_${suffix}`,
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      return request(app.getHttpServer())
        .post('/auth/signup')
        .send(registerDto)
        .expect(201)
        .then((res) => {
          expect(res.body).toHaveProperty('access_token');
        });
    });

    it('should fail if email is invalid', () => {
      const suffix = generateRandomSuffix();
      const registerDto = {
        email: `invalid-email`,
        username: `user_${suffix}`,
        password: 'password123',
      };

      return request(app.getHttpServer())
        .post('/auth/signup')
        .send(registerDto)
        .expect(400);
    });
  });

  describe('/auth/signin (POST)', () => {
    const suffix = generateRandomSuffix();
    const userCredentials = {
      email: `existing_${suffix}@example.com`,
      username: `existing_${suffix}`,
      password: 'password123',
    };

    beforeAll(async () => {
      // Create a user for login testing
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send(userCredentials)
        .expect(201);
    });

    it('should login successfully with valid credentials', () => {
      const loginDto: LoginDto = {
        email: userCredentials.email,
        password: userCredentials.password,
      };

      return request(app.getHttpServer())
        .post('/auth/signin')
        .send(loginDto)
        .expect(201)
        .then((res) => {
          expect(res.body).toHaveProperty('access_token');
        });
    });

    it('should fail with invalid credentials', () => {
      const loginDto: LoginDto = {
        email: userCredentials.email,
        password: 'wrongpassword',
      };

      return request(app.getHttpServer())
        .post('/auth/signin')
        .send(loginDto)
        .expect(403);
    });
  });
});
