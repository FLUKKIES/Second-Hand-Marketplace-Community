import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma/prisma.service';

@Injectable()
export class BanksService {
  constructor(private prisma: PrismaService) { }


  findAll() {
    return this.prisma.bank.findMany({
      orderBy: { name: 'asc' }
    });
  }

  create(data: any) {
    return this.prisma.bank.create({
      data
    });
  }

  update(id: string, data: any) {
    return this.prisma.bank.update({
      where: { id },
      data
    });
  }

  remove(id: string) {
    return this.prisma.bank.delete({
      where: { id }
    });
  }
}
