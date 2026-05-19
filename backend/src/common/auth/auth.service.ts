import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  // 1. ลงทะเบียน (Local)
  async register(dto: RegisterDto) {
    // Hash Password
    const hash = await argon2.hash(dto.password);

    // Check if user exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.email },
          { username: dto.username },
          { phoneNumber: dto.phoneNumber },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === dto.email) {
        throw new ForbiddenException('Email already in use');
      }
      if (existingUser.username === dto.username) {
        throw new ForbiddenException('Username already in use');
      }
      if (existingUser.phoneNumber === dto.phoneNumber) {
        throw new ForbiddenException('Phone number already in use');
      }
    }

    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          username: dto.username,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phoneNumber: dto.phoneNumber,
          password: hash,
          provider: 'LOCAL',
        },
      });
      return this.signToken(user.id, user.email, user.role);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          // รหัส Error ข้อมูลซ้ำ
          throw new ForbiddenException('Credentials taken');
        }
      }
      throw error;
    }
  }

  // 2. ล็อกอิน (Local)
  async login(dto: LoginDto) {
    // หา User จาก Email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) throw new ForbiddenException('Credentials incorrect');
    if (!user.password)
      throw new ForbiddenException('Please login with Google');

    // Check if user is banned
    if (user.isBanned) {
      if (user.banExpiresAt && new Date() > user.banExpiresAt) {
        // Auto unban
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            isBanned: false,
            banExpiresAt: null,
            banReason: null,
            bannedAt: null,
          },
        });
      } else {
        throw new ForbiddenException({
          message: 'Your account has been suspended',
          reason: user.banReason,
          expiresAt: user.banExpiresAt,
        });
      }
    }

    // ตรวจสอบ Password
    const pwMatches = await argon2.verify(user.password, dto.password);
    if (!pwMatches) throw new ForbiddenException('Credentials incorrect');

    return this.signToken(user.id, user.email, user.role);
  }

  // 3. จัดการ Google Login
  async googleLogin(req) {
    if (!req.user) {
      return 'No user from google';
    }

    // เช็คว่ามี User นี้หรือยัง ถ้าไม่มีให้สร้างใหม่
    let user = await this.prisma.user.findUnique({
      where: { email: req.user.email },
    });

    if (!user) {
      // สร้าง Username สุ่มจากชื่อ ห  รือใช้ email prefix
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const generatedUsername =
        `${req.user.firstName}${randomSuffix}`.toLowerCase();

      user = await this.prisma.user.create({
        data: {
          email: req.user.email,
          username: generatedUsername,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          provider: 'GOOGLE',
          providerId: req.user.providerId,
          avatarUrl: req.user.picture,
        },
      });
    }

    // Check if user is banned
    if (user.isBanned) {
      if (user.banExpiresAt && new Date() > user.banExpiresAt) {
        // Auto unban
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            isBanned: false,
            banExpiresAt: null,
            banReason: null,
            bannedAt: null,
          },
        });
      } else {
        throw new ForbiddenException({
          message: 'Your account has been suspended',
          reason: user.banReason,
          expiresAt: user.banExpiresAt,
        });
      }
    }

    return this.signToken(user.id, user.email, user.role, !user.phoneNumber);
  }

  // Helper: สร้าง JWT Token
  async signToken(
    userId: string,
    email: string,
    role: string,
    requiresPhone: boolean = false,
  ) {
    console.log('signToken', userId, requiresPhone);
    const payload = { sub: userId, email, role };
    const secret = this.config.get('JWT_SECRET');

    const token = await this.jwt.signAsync(payload, {
      expiresIn: this.config.get('JWT_EXPIRATION'),
      secret: secret,
    });

    return {
      access_token: token,
      requiresPhone: requiresPhone,
    };
  }
}
