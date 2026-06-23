import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateSquadDto } from './dto/create-squad.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { RespondInviteDto } from './dto/respond-invite.dto';
import { SquadService } from './squad.service';

@ApiTags('squads')
@Controller()
export class SquadController {
  constructor(private readonly squad: SquadService) {}

  // IMPORTANT: literal-path routes declared BEFORE parameterised routes
  // so NestJS does not treat 'me', 'invites', or 'feed' as an :id segment.

  @Get('squads/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user's active squad, or null" })
  getMySquad(@CurrentUser() user: { id: number }) {
    return this.squad.getMySquad(user.id);
  }

  @Get('squads/invites/pending')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pending squad invites addressed to the current user' })
  getPendingInvites(@CurrentUser() user: { id: number }) {
    return this.squad.getPendingInvites(user.id);
  }

  @Get('squads/feed')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get active squads in the user\'s city that the user has not joined' })
  getSquadFeed(@CurrentUser() user: { id: number }) {
    return this.squad.getSquadFeed(user.id);
  }

  @Post('squads')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new squad; creator becomes leader' })
  createSquad(
    @CurrentUser() user: { id: number },
    @Body() dto: CreateSquadDto,
  ) {
    return this.squad.createSquad(user.id, dto);
  }

  @Post('squads/:id/invites')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invite a match to join the squad (leader only)' })
  inviteMember(
    @CurrentUser() user: { id: number },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: InviteMemberDto,
  ) {
    return this.squad.inviteMember(id, user.id, dto.recipientId);
  }

  @Patch('squads/invites/:inviteId/respond')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept or decline a squad invite' })
  respondInvite(
    @CurrentUser() user: { id: number },
    @Param('inviteId', ParseIntPipe) inviteId: number,
    @Body() dto: RespondInviteDto,
  ) {
    return this.squad.respondInvite(inviteId, user.id, dto.action);
  }

  @Delete('squads/:id/members/me')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Leave a squad; leader leaving deactivates the squad' })
  leaveSquad(
    @CurrentUser() user: { id: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.squad.leaveSquad(id, user.id);
  }
}
