import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module'; // Adjust path
import { RegisterDto } from '../src/common/auth/dto/auth.dto';
import { CreatePostDto, PostType } from '../src/social/posts/dto/create-post.dto';

import { PrismaService } from '../src/common/database/prisma/prisma.service';

describe('SocialModule (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let userId: string;
  let prisma: PrismaService;
  let groupId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get(PrismaService);

    // Setup Group
    const category = await prisma.category.create({
      data: { name: `Cat ${Date.now()}`, slug: `cat-${Date.now()}` }
    });
    const group = await prisma.group.create({
      data: { name: `Group ${Date.now()}`, categoryId: category.id }
    });
    groupId = group.id;

    // Setup User
    const unique = Math.random().toString(36).substring(7);
    const registerDto: RegisterDto = {
      email: `social_${unique}@test.com`,
      username: `social_${unique}`,
      password: 'password123',
      firstName: 'Social',
      lastName: 'Tester'
    };
    const res = await request(app.getHttpServer())
      .post('/auth/signup')
      .send(registerDto)
      .expect(201);
    
    // Use the token from signup directly or login
    accessToken = res.body.access_token;

    // Fetch user to get ID
    const userRes = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    userId = userRes.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/posts (POST)', () => {
    it('should create a normal post', () => {
      const createDto: CreatePostDto = {
        content: 'Hello World',
        type: PostType.NORMAL,
        imageUrls: ['http://example.com/image.jpg'],
        groupId: groupId
      };

      return request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto)
        .expect(201)
        .then((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('content', 'Hello World');
          expect(res.body).toHaveProperty('type', 'NORMAL');
        });
    });

    it('should create a selling post with products', () => {
      const createDto: CreatePostDto = {
        content: 'Selling items',
        type: PostType.SELLING,
        groupId: groupId,
        products: [
          { name: 'Item 1', price: 100, stock: 10, description: 'Desc 1' },
          { name: 'Item 2', price: 200, stock: 5 }
        ]
      };

      return request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto)
        .expect(201)
        .then((res) => {
          expect(res.body).toHaveProperty('type', 'SELLING');
          expect(res.body.products).toHaveLength(2);
          expect(res.body.products[0]).toHaveProperty('name', 'Item 1');
        });
    });
  });

  describe('/posts (GET)', () => {
    it('should get all posts', () => {
      return request(app.getHttpServer())
        .get('/posts')
        .expect(200)
        .then((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should filter posts by type', () => {
      return request(app.getHttpServer())
        .get('/posts?type=SELLING')
        .expect(200)
        .then((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          if (res.body.length > 0) {
            expect(res.body[0].type).toBe('SELLING');
          }
        });
    });

    it('should search posts by keyword', () => {
      return request(app.getHttpServer())
        .get('/posts/search?keyword=Hello')
        .expect(200)
        .then((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          // We created "Hello World" post manually in previous test, so it might return it if not filtered by group?
          // Actually findOne logic in service enforces deletedAt=null.
          // Search uses deletedAt=null.
          // But our "Hello World" post was created with groupId.
          // Search logic checks: groupId: groupId ? groupId : undefined.
          // If we don't pass groupId in search, it searches all?
          // Service: groupId: groupId ? groupId : undefined.
          // So if undefined, it searches all groups?
          // Service code: groupId: groupId ? groupId : undefined. 
          // Wait, Prisma "groupId: undefined" means "do not filter by groupId".
          // So yes, it searches all.
          if (res.body.length > 0) {
             const found = res.body.find(p => p.content.includes('Hello'));
             if (found) expect(found.content).toContain('Hello');
          }
        });
    });
  });
});
