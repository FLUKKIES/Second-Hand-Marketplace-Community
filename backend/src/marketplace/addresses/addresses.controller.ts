import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { GetUser } from 'src/common/auth/decorator/get-user.decorator';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  create(
    @GetUser('userId') userId: string,
    @Body() createAddressDto: CreateAddressDto,
  ) {
    return this.addressesService.create(userId, createAddressDto);
  }

  @Get('me')
  findAll(@GetUser('userId') userId: string) {
    return this.addressesService.findAll(userId);
  }

  @Delete(':id')
  remove(@GetUser('userId') userId: string, @Param('id') id: string) {
    return this.addressesService.remove(userId, id);
  }

  @Patch(':id')
  update(
    @GetUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addressesService.update(userId, id, dto);
  }
}
