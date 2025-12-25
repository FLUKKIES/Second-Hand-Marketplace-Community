import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma/prisma.service';

@Injectable()
export class BanksService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.bank.findMany({
        orderBy: { name: 'asc' }
    });
  }
}
