import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/common/auth/decorator/get-user.decorator';
import { CreateOfferDto } from './dto/create-offer.dto';
import { RespondOfferDto } from './dto/respond-offer.dto';
import { OffersService } from './offers.service';

@UseGuards(AuthGuard('jwt'))
@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post()
  create(@GetUser('userId') userId: string, @Body() dto: CreateOfferDto) {
    return this.offersService.create(userId, dto);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') offerId: string, @GetUser('userId') userId: string) {
    return this.offersService.cancel(userId, offerId);
  }

  @Patch(':id/respond')
  respond(
    @Param('id') offerId: string,
    @GetUser('userId') userId: string,
    @Body() dto: RespondOfferDto,
  ) {
    return this.offersService.respond(userId, offerId, dto);
  }

  // Buyer respond to counter-offer (ACCEPT | REJECT | COUNTER)
  @Patch(':id/respond-counter')
  respondToCounter(
    @Param('id') offerId: string,
    @GetUser('userId') userId: string,
    @Body() dto: RespondOfferDto,
  ) {
    return this.offersService.respondToCounter(userId, offerId, dto);
  }

  @Get('incoming')
  getIncoming(@GetUser('userId') userId: string) {
    return this.offersService.getIncomingOffers(userId);
  }

  @Get('my-offers')
  getMyOffers(@GetUser('userId') userId: string) {
    return this.offersService.getMyOffers(userId);
  }

  @Get('accepted')
  getAcceptedOffers(@GetUser('userId') userId: string) {
    return this.offersService.getAcceptedOffers(userId);
  }
}
