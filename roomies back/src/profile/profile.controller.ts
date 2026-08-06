import { existsSync, mkdirSync } from 'fs';
import { open, unlink } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';

const UPLOADS_DIR = join(process.cwd(), 'uploads');
if (!existsSync(UPLOADS_DIR)) {
  mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Расширение выводим ИЗ разрешённого mime-типа, а не из имени файла клиента:
// иначе можно прислать Content-Type: image/png с именем «x.html» и HTML внутри,
// получить его обратно по /uploads/... как страницу и выполнить свой JS
// на нашем origin (stored XSS).
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

// Заявленный Content-Type — данные от клиента, ему верить нельзя. multer отдаёт
// только заголовки в fileFilter, поэтому содержимое сверяем уже после записи:
// не картинка — удаляем файл и отказываем, чтобы uploads не превращался
// в файлопомойку для произвольного контента.
function hasImageSignature(head: Buffer, mimetype: string): boolean {
  switch (mimetype) {
    case 'image/jpeg':
      return head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
    case 'image/png':
      return (
        head[0] === 0x89 &&
        head[1] === 0x50 &&
        head[2] === 0x4e &&
        head[3] === 0x47 &&
        head[4] === 0x0d &&
        head[5] === 0x0a &&
        head[6] === 0x1a &&
        head[7] === 0x0a
      );
    case 'image/webp':
      return (
        head.subarray(0, 4).toString('ascii') === 'RIFF' &&
        head.subarray(8, 12).toString('ascii') === 'WEBP'
      );
    default:
      return false;
  }
}

async function assertRealImage(path: string, mimetype: string): Promise<void> {
  const head = Buffer.alloc(12);
  const handle = await open(path, 'r');
  try {
    await handle.read(head, 0, 12, 0);
  } finally {
    await handle.close();
  }

  if (!hasImageSignature(head, mimetype)) {
    await unlink(path).catch(() => undefined);
    throw new BadRequestException('Файл не является корректным изображением');
  }
}

@ApiTags('profile')
@Controller('profile')
export class ProfileController {
  constructor(private readonly profile: ProfileService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile with roomieScore' })
  getMe(@CurrentUser() user: { id: number }) {
    return this.profile.getMe(user.id);
  }

  @Patch()
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile fields' })
  updateProfile(
    @CurrentUser() user: { id: number },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profile.updateProfile(user.id, dto);
  }

  @Post('photo')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Загрузить фото профиля, вернуть его публичный URL' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOADS_DIR,
        filename: (req, file, cb) => {
          // JwtAuthGuard уже отработал (guards выполняются до interceptors),
          // поэтому req.user гарантированно заполнен.
          const authedReq = req as unknown as { user?: { id: number } };
          const userId = authedReq.user?.id ?? 'anon';
          // Имя от клиента не используем вообще — ни как имя, ни как источник расширения.
          const ext = MIME_TO_EXT[file.mimetype] ?? '.jpg';
          cb(null, `${userId}-${randomUUID()}${ext}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
      fileFilter: (_req, file, cb) => {
        if (!(file.mimetype in MIME_TO_EXT)) {
          cb(new BadRequestException('Разрешены только JPEG, PNG или WebP'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadPhoto(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Файл не передан');
    }
    await assertRealImage(file.path, file.mimetype);
    // Возвращаем ОТНОСИТЕЛЬНЫЙ путь, а не абсолютный URL. Раньше сюда
    // подставлялся хост текущего запроса, и ссылка намертво запоминала адрес
    // dev-туннеля: после его перезапуска (а имя эфемерное и меняется каждый
    // раз) все ранее загруженные фото переставали открываться. Хост
    // подставляет клиент — он всегда знает актуальный адрес API.
    return { url: `/uploads/${file.filename}` };
  }
}
