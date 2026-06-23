import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSquadDto } from './dto/create-squad.dto';

@Injectable()
export class SquadService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertLeader(
    squadId: number,
    userId: number,
  ): Promise<void> {
    const member = await this.prisma.squadMember.findUnique({
      where: { squadId_userId: { squadId, userId } },
    });
    if (!member || member.role !== 'leader') {
      throw new ForbiddenException(
        'Only the squad leader can perform this action',
      );
    }
  }

  private formatSquad(squad: any) {
    return {
      id: squad.id,
      name: squad.name,
      memberCount: squad.members.length,
      maxMembers: squad.maxMembers,
      budgetMin: squad.budgetMin,
      budgetMax: squad.budgetMax,
      districts: squad.districts.map((sd: any) => ({
        id: sd.district.id,
        name: sd.district.name,
      })),
      members: squad.members.map((sm: any) => ({
        id: sm.user.id,
        name: sm.user.name,
        photo: sm.user.photos[0]?.url ?? null,
        role: sm.role as string,
      })),
    };
  }

  async createSquad(userId: number, dto: CreateSquadDto) {
    const existing = await this.prisma.squadMember.findFirst({
      where: { userId, squad: { isActive: true } },
    });
    if (existing) {
      throw new BadRequestException('You are already in an active squad');
    }

    return this.prisma.$transaction(async (tx) => {
      const squad = await tx.squad.create({
        data: {
          name: dto.name,
          budgetMin: dto.budgetMin,
          budgetMax: dto.budgetMax,
          cityId: dto.cityId,
          createdById: userId,
          ...(dto.districtIds?.length
            ? {
                districts: {
                  create: dto.districtIds.map((id) => ({ districtId: id })),
                },
              }
            : {}),
        },
      });

      await tx.squadMember.create({
        data: { squadId: squad.id, userId, role: 'leader' },
      });

      return tx.squad.findUniqueOrThrow({
        where: { id: squad.id },
        include: {
          members: {
            include: {
              user: {
                include: {
                  photos: { orderBy: { displayOrder: 'asc' }, take: 1 },
                },
              },
            },
          },
          districts: { include: { district: true } },
        },
      });
    }).then((squad) => this.formatSquad(squad));
  }

  async getMySquad(userId: number) {
    const member = await this.prisma.squadMember.findFirst({
      where: { userId, squad: { isActive: true } },
      include: {
        squad: {
          include: {
            members: {
              include: {
                user: {
                  include: {
                    photos: { orderBy: { displayOrder: 'asc' }, take: 1 },
                  },
                },
              },
            },
            districts: { include: { district: true } },
          },
        },
      },
    });

    if (!member) return null;
    return this.formatSquad(member.squad);
  }

  async inviteMember(
    squadId: number,
    senderId: number,
    recipientId: number,
  ) {
    await this.assertLeader(squadId, senderId);

    const match = await this.prisma.match.findFirst({
      where: {
        isActive: true,
        OR: [
          { user1Id: senderId, user2Id: recipientId },
          { user1Id: recipientId, user2Id: senderId },
        ],
      },
    });
    if (!match) {
      throw new BadRequestException('Recipient is not your match');
    }

    const count = await this.prisma.squadMember.count({
      where: { squadId },
    });
    const squad = await this.prisma.squad.findUniqueOrThrow({
      where: { id: squadId },
    });
    if (count >= squad.maxMembers) {
      throw new BadRequestException('Squad is full');
    }

    const existing = await this.prisma.squadInvite.findFirst({
      where: { squadId, recipientId, status: 'pending' },
    });
    if (existing) {
      throw new BadRequestException('Invite already pending for this user');
    }

    return this.prisma.squadInvite.create({
      data: { squadId, senderId, recipientId, status: 'pending' },
    });
  }

  async getPendingInvites(userId: number) {
    const invites = await this.prisma.squadInvite.findMany({
      where: { recipientId: userId, status: 'pending' },
      include: {
        squad: {
          include: {
            _count: { select: { members: true } },
          },
        },
        sender: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return invites.map((inv) => ({
      id: inv.id,
      squadId: inv.squadId,
      squadName: inv.squad.name,
      memberCount: inv.squad._count.members,
      senderId: inv.sender.id,
      senderName: inv.sender.name,
    }));
  }

  async respondInvite(
    inviteId: number,
    userId: number,
    action: 'accept' | 'decline',
  ) {
    const invite = await this.prisma.squadInvite.findUniqueOrThrow({
      where: { id: inviteId },
      include: {
        squad: {
          include: { members: true },
        },
      },
    });

    if (invite.recipientId !== userId) {
      throw new ForbiddenException('Not your invite');
    }
    if (invite.status !== 'pending') {
      throw new BadRequestException('Invite already resolved');
    }

    if (action === 'decline') {
      return this.prisma.squadInvite.update({
        where: { id: inviteId },
        data: { status: 'declined', resolvedAt: new Date() },
      });
    }

    // action === 'accept'
    if (invite.squad.members.length >= invite.squad.maxMembers) {
      throw new BadRequestException('Squad is now full');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.squadMember.create({
        data: { squadId: invite.squadId, userId, role: 'member' },
      });
      return tx.squadInvite.update({
        where: { id: inviteId },
        data: { status: 'accepted', resolvedAt: new Date() },
      });
    });
  }

  async leaveSquad(squadId: number, userId: number) {
    const member = await this.prisma.squadMember.findUnique({
      where: { squadId_userId: { squadId, userId } },
    });
    if (!member) {
      throw new NotFoundException('You are not in this squad');
    }

    if (member.role === 'leader') {
      await this.prisma.squad.update({
        where: { id: squadId },
        data: { isActive: false },
      });
    } else {
      await this.prisma.squadMember.delete({
        where: { squadId_userId: { squadId, userId } },
      });
    }
  }

  async getSquadFeed(userId: number) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { cityId: true },
    });

    const where: any = {
      isActive: true,
      members: { none: { userId } },
    };
    if (user.cityId) {
      where.cityId = user.cityId;
    }

    const squads = await this.prisma.squad.findMany({
      where,
      include: {
        members: {
          include: {
            user: {
              include: {
                photos: { orderBy: { displayOrder: 'asc' }, take: 1 },
              },
            },
          },
        },
        districts: { include: { district: true } },
      },
      take: 20,
    });

    return squads
      .filter((s) => s.members.length < s.maxMembers)
      .map((s) => this.formatSquad(s));
  }
}
