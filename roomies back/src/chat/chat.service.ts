import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const AGREEMENT_ITEMS = [
  { category: 'quiet', ruleText: 'Тишина после 23:00' },
  { category: 'cleaning', ruleText: 'Уборка по очереди раз в неделю' },
  { category: 'guests', ruleText: 'Гости предупреждают за сутки' },
  { category: 'utilities', ruleText: 'Коммуналка делится поровну' },
  { category: 'shared_zones', ruleText: 'Кухня и ванная — убираем за собой' },
];

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertParticipant(
    chatId: number,
    userId: number,
  ): Promise<void> {
    const chat = await this.prisma.chat.findUniqueOrThrow({
      where: { id: chatId },
      include: { match: true },
    });
    if (
      chat.match.user1Id !== userId &&
      chat.match.user2Id !== userId
    ) {
      throw new ForbiddenException('Not a participant');
    }
  }

  async getMatches(userId: number) {
    const matches = await this.prisma.match.findMany({
      where: {
        isActive: true,
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        chat: {
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
            reads: {
              where: { userId },
            },
          },
        },
        user1: {
          include: {
            photos: {
              orderBy: { displayOrder: 'asc' },
              take: 1,
            },
          },
        },
        user2: {
          include: {
            photos: {
              orderBy: { displayOrder: 'asc' },
              take: 1,
            },
          },
        },
      },
    });

    const results = await Promise.all(
      matches.map(async (match) => {
        const partner =
          match.user1Id === userId ? match.user2 : match.user1;
        const chatRead = match.chat?.reads[0] ?? null;
        const unreadCount = match.chat
          ? await this.prisma.message.count({
              where: {
                chatId: match.chat.id,
                createdAt: { gt: chatRead?.lastReadAt ?? new Date(0) },
              },
            })
          : 0;
        const lastMsg = match.chat?.messages[0] ?? null;
        return {
          matchId: match.id,
          chatId: match.chat?.id ?? null,
          partner: {
            id: partner.id,
            name: partner.name,
            photo: partner.photos[0]?.url ?? null,
          },
          lastMessage: lastMsg
            ? {
                content: lastMsg.content,
                createdAt: lastMsg.createdAt.toISOString(),
                senderId: lastMsg.senderId,
                messageType: lastMsg.messageType as string,
              }
            : null,
          unreadCount,
          matchScore: Number(match.matchScore),
        };
      }),
    );

    return results;
  }

  async getChatMessages(
    chatId: number,
    userId: number,
    limit = 30,
    before?: string,
  ) {
    await this.assertParticipant(chatId, userId);

    const where: { chatId: number; id?: { lt: bigint } } = { chatId };
    if (before) {
      where.id = { lt: BigInt(before) };
    }

    const rows = await this.prisma.message.findMany({
      where,
      orderBy: { id: 'desc' },
      take: limit + 1,
    });

    let hasMore = false;
    let messages = rows;
    if (rows.length > limit) {
      hasMore = true;
      messages = rows.slice(0, limit);
    }

    const nextCursor = hasMore
      ? String(messages[messages.length - 1].id)
      : null;

    return {
      messages: messages.map((m) => ({
        id: String(m.id),
        chatId: m.chatId,
        senderId: m.senderId,
        content: m.content,
        messageType: m.messageType as string,
        metadata: m.metadata as Record<string, unknown> | null,
        createdAt: m.createdAt.toISOString(),
      })),
      nextCursor,
    };
  }

  async sendMessage(chatId: number, userId: number, content: string) {
    await this.assertParticipant(chatId, userId);

    const m = await this.prisma.message.create({
      data: {
        chatId,
        senderId: userId,
        content,
        messageType: 'text',
      },
    });

    return {
      id: String(m.id),
      chatId: m.chatId,
      senderId: m.senderId,
      content: m.content,
      messageType: m.messageType as string,
      metadata: m.metadata as Record<string, unknown> | null,
      createdAt: m.createdAt.toISOString(),
    };
  }

  async proposeCall(
    chatId: number,
    userId: number,
    proposedTimes: string[],
  ) {
    await this.assertParticipant(chatId, userId);

    return this.prisma.$transaction(async (tx) => {
      const invite = await tx.callInvite.create({
        data: {
          chatId,
          proposerId: userId,
          proposedTimes,
          status: 'pending',
        },
      });

      await tx.message.create({
        data: {
          chatId,
          senderId: userId,
          messageType: 'call_invite',
          content: null,
          metadata: {
            callInviteId: invite.id,
            proposedTimes: invite.proposedTimes,
            status: invite.status,
            confirmedTime: invite.confirmedTime,
            proposerId: invite.proposerId,
          },
        },
      });

      return {
        ...invite,
        proposedTimes: invite.proposedTimes as string[],
      };
    });
  }

  async respondCall(
    chatId: number,
    userId: number,
    inviteId: number,
    action: 'accept' | 'decline',
    confirmedTime?: string,
  ) {
    await this.assertParticipant(chatId, userId);

    const invite = await this.prisma.callInvite.findFirstOrThrow({
      where: { id: inviteId, chatId },
    });

    if (invite.status !== 'pending') {
      throw new BadRequestException('Invite already resolved');
    }

    const updated = await this.prisma.callInvite.update({
      where: { id: inviteId },
      data:
        action === 'accept'
          ? { status: 'accepted', confirmedTime: new Date(confirmedTime!) }
          : { status: 'declined' },
    });

    return updated;
  }

  async createAgreement(chatId: number, userId: number) {
    await this.assertParticipant(chatId, userId);

    return this.prisma.$transaction(async (tx) => {
      const agreement = await tx.roomieAgreement.create({
        data: {
          chatId,
          createdById: userId,
          status: 'draft',
          items: {
            create: AGREEMENT_ITEMS,
          },
        },
        include: { items: true },
      });

      await tx.message.create({
        data: {
          chatId,
          senderId: userId,
          messageType: 'system',
          content: 'Предложено соглашение соседей',
          metadata: { agreementId: agreement.id },
        },
      });

      return agreement;
    });
  }

  async respondAgreement(
    chatId: number,
    userId: number,
    agreementId: number,
    action: 'accept' | 'decline',
  ) {
    await this.assertParticipant(chatId, userId);

    const agreement = await this.prisma.roomieAgreement.findFirstOrThrow({
      where: { id: agreementId, chatId },
    });

    if (agreement.status !== 'draft') {
      throw new BadRequestException('Agreement already resolved');
    }

    if (agreement.createdById === userId) {
      throw new BadRequestException('Cannot respond to own agreement');
    }

    const updated = await this.prisma.roomieAgreement.update({
      where: { id: agreementId },
      data: {
        status: action === 'accept' ? 'accepted' : 'declined',
        acceptedAt: action === 'accept' ? new Date() : null,
      },
      include: { items: true },
    });

    return updated;
  }

  async markRead(chatId: number, userId: number) {
    await this.assertParticipant(chatId, userId);

    await this.prisma.chatRead.upsert({
      where: { chatId_userId: { chatId, userId } },
      update: { lastReadAt: new Date() },
      create: { chatId, userId, lastReadAt: new Date() },
    });
  }

  async getCallInvites(chatId: number, userId: number) {
    await this.assertParticipant(chatId, userId);

    return this.prisma.callInvite.findMany({
      where: { chatId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAgreements(chatId: number, userId: number) {
    await this.assertParticipant(chatId, userId);

    return this.prisma.roomieAgreement.findMany({
      where: { chatId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
