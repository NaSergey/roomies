import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { GetMessagesQueryDto } from './dto/get-messages-query.dto';
import { ProposeCallDto } from './dto/propose-call.dto';
import { RespondAgreementDto } from './dto/respond-agreement.dto';
import { RespondCallDto } from './dto/respond-call.dto';

@ApiTags('chat')
@Controller()
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('matches')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get active matches with last message and unread count',
  })
  getMatches(@CurrentUser() user: { id: number }) {
    return this.chat.getMatches(user.id);
  }

  @Get('chats/:chatId/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get paginated messages for a chat (newest first)' })
  getMessages(
    @CurrentUser() user: { id: number },
    @Param('chatId', ParseIntPipe) chatId: number,
    @Query() query: GetMessagesQueryDto,
  ) {
    return this.chat.getChatMessages(
      chatId,
      user.id,
      query.limit ?? 30,
      query.before,
    );
  }

  @Post('chats/:chatId/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a text message to a chat' })
  sendMessage(
    @CurrentUser() user: { id: number },
    @Param('chatId', ParseIntPipe) chatId: number,
    @Body() dto: CreateMessageDto,
  ) {
    return this.chat.sendMessage(chatId, user.id, dto.content);
  }

  @Post('chats/:chatId/call-invites')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Propose a call with 1–3 time slots' })
  proposeCall(
    @CurrentUser() user: { id: number },
    @Param('chatId', ParseIntPipe) chatId: number,
    @Body() dto: ProposeCallDto,
  ) {
    return this.chat.proposeCall(chatId, user.id, dto.proposedTimes);
  }

  @Patch('chats/:chatId/call-invites/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept or decline a call invite' })
  respondCall(
    @CurrentUser() user: { id: number },
    @Param('chatId', ParseIntPipe) chatId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RespondCallDto,
  ) {
    return this.chat.respondCall(
      chatId,
      user.id,
      id,
      dto.action,
      dto.confirmedTime,
    );
  }

  @Post('chats/:chatId/agreements')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a Roomie Agreement with 5 standard items' })
  createAgreement(
    @CurrentUser() user: { id: number },
    @Param('chatId', ParseIntPipe) chatId: number,
  ) {
    return this.chat.createAgreement(chatId, user.id);
  }

  @Patch('chats/:chatId/agreements/:id/respond')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept or decline a Roomie Agreement' })
  respondAgreement(
    @CurrentUser() user: { id: number },
    @Param('chatId', ParseIntPipe) chatId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RespondAgreementDto,
  ) {
    return this.chat.respondAgreement(chatId, user.id, id, dto.action);
  }

  @Patch('chats/:chatId/read')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark chat as read for current user' })
  markRead(
    @CurrentUser() user: { id: number },
    @Param('chatId', ParseIntPipe) chatId: number,
  ) {
    return this.chat.markRead(chatId, user.id);
  }

  @Get('chats/:chatId/call-invites')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all call invites for a chat' })
  getCallInvites(
    @CurrentUser() user: { id: number },
    @Param('chatId', ParseIntPipe) chatId: number,
  ) {
    return this.chat.getCallInvites(chatId, user.id);
  }

  @Get('chats/:chatId/agreements')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all agreements for a chat' })
  getAgreements(
    @CurrentUser() user: { id: number },
    @Param('chatId', ParseIntPipe) chatId: number,
  ) {
    return this.chat.getAgreements(chatId, user.id);
  }
}
