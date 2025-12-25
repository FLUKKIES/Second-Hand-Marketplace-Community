import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

import { PrismaService } from '../src/common/database/prisma/prisma.service';

describe('MarketplaceModule (e2e)', () => {
  let app: INestApplication;
  let sellerToken: string;
  let buyerToken: string;
  let sellerId: string;
  let buyerId: string;
  let productId: string;
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
    
    const category = await prisma.category.create({
      data: { name: `MktCat ${Date.now()}`, slug: `mkt-cat-${Date.now()}` }
    });
    const group = await prisma.group.create({
      data: { name: `MktGroup ${Date.now()}`, categoryId: category.id }
    });
    groupId = group.id;

    // Create Seller
    const sellerUnique = Math.random().toString(36).substring(7);
    const sellerRes = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        email: `seller_${sellerUnique}@test.com`,
        username: `seller_${sellerUnique}`,
        password: 'password123',
        firstName: 'Seller',
        lastName: 'One'
      })
      .expect(201);
    
    sellerToken = sellerRes.body.access_token;
    
    // Get Seller ID
    const sellerProfile = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${sellerToken}`)
      .expect(200);
    sellerId = sellerProfile.body.id;

    // Create Buyer
    const buyerUnique = Math.random().toString(36).substring(7);
    const buyerRes = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        email: `buyer_${buyerUnique}@test.com`,
        username: `buyer_${buyerUnique}`,
        password: 'password123',
        firstName: 'Buyer',
        lastName: 'Two'
      })
      .expect(201);
    
    buyerToken = buyerRes.body.access_token;

    // Get Buyer ID
    const buyerProfile = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);
    buyerId = buyerProfile.body.id;

    // Seller creates Product via Post
    const productPostRes = await request(app.getHttpServer())
      .post('/posts')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        content: 'Selling Product',
        type: 'SELLING',
        groupId: groupId,
        products: [
          { name: 'Test Product', price: 500, stock: 10, description: 'Good condition' }
        ]
      });

    if (productPostRes.status !== 201) {
      console.error('Create Post Failed:', JSON.stringify(productPostRes.body, null, 2));
    }
    
    // Assuming the API returns the created products in the response
    // If details are in post.products array
    productId = productPostRes.body.products[0].id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/orders (POST)', () => {
    it('should create an order successfully', () => {
      return request(app.getHttpServer())
        .post('/orders/create')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          items: [
            { productId: productId, quantity: 1 }
          ],
          shippingAddress: '123 Test St, Bangkok'
        })
        .expect(201)
        .then((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('status', 'TO_PAY');
          expect(res.body[0]).toHaveProperty('totalPrice');
        });
    });
  });

  describe('/orders/buying (GET)', () => {
    it('should list buying orders', () => {
      return request(app.getHttpServer())
        .get('/orders/buying')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200)
        .then((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });
  });

  describe('/orders/selling (GET)', () => {
    it('should list selling orders for seller', () => {
      return request(app.getHttpServer())
        .get('/orders/selling')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200)
        .then((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });
  });
});
