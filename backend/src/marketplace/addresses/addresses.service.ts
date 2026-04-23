import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAddressDto } from './dto/create-address.dto';
import { PrismaService } from 'src/common/database/prisma/prisma.service';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(private prisma: PrismaService) { }

  async create(userId: string, dto: CreateAddressDto) {
    // If setting as default, unset others?
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.create({
      data: {
        userId,
        ...dto,
      },
    });
  }

  findAll(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' },
    });
  }

  async update(userId: string, id: string, dto: UpdateAddressDto) {
    const address = await this.prisma.address.findUnique({
      where: { id }
    })

    if (!address || address.userId !== userId) {
      throw new NotFoundException('Address not found')
    }

    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.update({
      where: { id },
      data: dto
    });
  }

  async remove(userId: string, id: string) {
    const address = await this.prisma.address.findUnique({
      where: { id }
    })

    if (!address || address.userId !== userId) {
      throw new NotFoundException('Address not found')
    }

    return this.prisma.address.delete({
      where: { id },
    });
  }
}
