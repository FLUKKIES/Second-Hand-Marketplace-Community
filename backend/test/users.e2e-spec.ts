import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { RegisterDto } from '../src/common/auth/dto/auth.dto';
import { UpdateUserDto } from '../src/users/dto/update-user.dto';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let userId: string;
  const username = `user_${Math.random().toString(36).substring(7)}`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Register and Login to get token
    const registerDto: RegisterDto = {
      email: `${username}@example.com`,
      username: username,
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
    };

    const res = await request(app.getHttpServer())
      .post('/auth/signup')
      .send(registerDto)
      .expect(201);

    // Auth returns access_token, not user object
    accessToken = res.body.access_token;

    // Fetch user profile to get ID
    const profileRes = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    userId = profileRes.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/users/me (GET)', () => {
    it('should get current user profile', () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .then((res) => {
          expect(res.body).toHaveProperty('id', userId);
          expect(res.body).toHaveProperty('username', username);
        });
    });

    it('should fail without token', () => {
      return request(app.getHttpServer()).get('/users/me').expect(401);
    });
  });

  describe('/users/me (PATCH)', () => {
    it('should update user profile', () => {
      const updateDto: UpdateUserDto = {
        firstName: 'UpdatedName',
        bio: 'New bio',
      };

      return request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateDto)
        .expect(200)
        .then((res) => {
          expect(res.body).toHaveProperty('firstName', 'UpdatedName');
          expect(res.body).toHaveProperty('bio', 'New bio');
        });
    });
  });

  describe('/users/:username (GET)', () => {
    it('should get public profile', () => {
      return request(app.getHttpServer())
        .get(`/users/${username}`)
        .expect(200)
        .then((res) => {
          expect(res.body).toHaveProperty('username', username);
          // Should not return sensitive info like password
          expect(res.body).not.toHaveProperty('password');
        });
    });
  });
});
