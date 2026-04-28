import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { PrismaService } from 'src/common/database/prisma/prisma.service';

@Injectable()
export class BankAccountsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateBankAccountDto) {
    const existingAccountsCount = await this.prisma.bankAccount.count({
      where: { userId },
    });

    if (existingAccountsCount === 0) {
      dto.isDefault = true;
    } else if (dto.isDefault) {
      await this.prisma.bankAccount.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    return this.prisma.bankAccount.create({
      data: {
        userId,
        ...dto,
      },
    });
  }

  findAll(userId: string) {
    return this.prisma.bankAccount.findMany({
      where: { userId },
      include: { bank: true },
      orderBy: { isDefault: 'desc' },
    });
  }

  async update(userId: string, id: string, dto: UpdateBankAccountDto) {
    const account = await this.prisma.bankAccount.findUnique({
      where: { id },
    });

    if (!account || account.userId !== userId) {
      throw new NotFoundException('Account not found');
    }

    if (dto.isDefault) {
      await this.prisma.bankAccount.updateMany({
        where: { userId, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.bankAccount.update({
      where: { id },
      data: dto,
    });
  }

  async findDefaultByUser(userId: string) {
    const account = await this.prisma.bankAccount.findFirst({
      where: { userId, isDefault: true },
      include: { bank: true },
    });
    if (!account) {
      const anyAccount = await this.prisma.bankAccount.findFirst({
        where: { userId },
        include: { bank: true },
      });
      if (!anyAccount) {
        throw new NotFoundException('User has no bank accounts set up yet');
      }
      return anyAccount;
    }
    return account;
  }

  async remove(userId: string, id: string) {
    const account = await this.prisma.bankAccount.findUnique({
      where: { id },
    });

    if (!account || account.userId !== userId) {
      throw new NotFoundException('Account not found');
    }

    return this.prisma.bankAccount.delete({
      where: { id },
    });
  }
}
