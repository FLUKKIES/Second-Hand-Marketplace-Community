import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { PrismaService } from 'src/common/database/prisma/prisma.service';

@Injectable()
export class BankAccountsService {
  constructor(private prisma: PrismaService) { }

  async create(userId: string, dto: CreateBankAccountDto) {
    if (dto.isDefault) {
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

  async remove(userId: string, id: string) {
    const account = await this.prisma.bankAccount.findUnique({
      where: { id }
    })

    if (!account || account.userId !== userId) {
      throw new NotFoundException('Account not found')
    }

    return this.prisma.bankAccount.delete({
      where: { id },
    });
  }
}
