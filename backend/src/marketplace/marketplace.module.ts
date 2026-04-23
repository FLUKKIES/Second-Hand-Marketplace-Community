import { Module } from '@nestjs/common';
import { AddressesModule } from './addresses/addresses.module';
import { BankAccountsModule } from './bank-accounts/bank-accounts.module';
import { BanksModule } from './banks/banks.module';
import { CategoriesModule } from './categories/categories.module';
import { OffersModule } from './offers/offers.module';
import { OrdersModule } from './orders/orders.module';
import { ReviewsModule } from './reviews/reviews.module';

@Module({
  imports: [
    AddressesModule,
    BankAccountsModule,
    BanksModule,
    CategoriesModule,
    OffersModule,
    OrdersModule,
    ReviewsModule,
  ],
  exports: [
    AddressesModule,
    BankAccountsModule,
    BanksModule,
    CategoriesModule,
    OffersModule,
    OrdersModule,
    ReviewsModule,
  ],
})
export class MarketplaceModule {}
