import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { UploadModule } from 'src/common/upload/upload.module';

@Module({
  imports: [UploadModule],
  controllers: [GroupsController],
  providers: [GroupsService],
})
export class GroupsModule {}
