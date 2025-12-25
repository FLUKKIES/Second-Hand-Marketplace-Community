import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { BankAccountsService } from './bank-accounts.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { GetUser } from 'src/common/auth/decorator/get-user.decorator';

@Controller('bank-accounts')
export class BankAccountsController {
  constructor(private readonly bankAccountsService: BankAccountsService) {}

  @Post()
  create(@GetUser('id') userId: string, @Body() createBankAccountDto: CreateBankAccountDto) {
    return this.bankAccountsService.create(userId, createBankAccountDto);
  }

  @Get('me')
  findAll(@GetUser('id') userId: string) {
    return this.bankAccountsService.findAll(userId);
  }

  @Delete(':id')
  remove(@GetUser('id') userId: string, @Param('id') id: string) {
    return this.bankAccountsService.remove(userId, id);
  }
}
