import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SquadController } from './squad.controller';
import { SquadService } from './squad.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [SquadController],
  providers: [SquadService],
})
export class SquadModule {}
