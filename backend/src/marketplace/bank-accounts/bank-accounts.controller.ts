import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { BankAccountsService } from './bank-accounts.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { GetUser } from 'src/common/auth/decorator/get-user.decorator';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('bank-accounts')
export class BankAccountsController {
  constructor(private readonly bankAccountsService: BankAccountsService) { }

  @Post()
  create(@GetUser('userId') userId: string, @Body() createBankAccountDto: CreateBankAccountDto) {
    return this.bankAccountsService.create(userId, createBankAccountDto);
  }

  @Get('me')
  findAll(@GetUser('userId') userId: string) {
    return this.bankAccountsService.findAll(userId);
  }

  @Delete(':id')
  remove(@GetUser('userId') userId: string, @Param('id') id: string) {
    return this.bankAccountsService.remove(userId, id);
  }
}
