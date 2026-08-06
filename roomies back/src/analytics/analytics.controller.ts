import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/admin.guard';
import { AnalyticsService } from './analytics.service';
import { TimeSeriesQueryDto } from './dto/time-series-query.dto';
import { UsersQueryDto } from './dto/users-query.dto';

// CRM-бэк для отдельного фронта аналитики — весь контроллер закрыт AdminGuard
// (JWT + role === 'admin'). Публичный клиент (Mini App) сюда не ходит.
@ApiTags('admin-analytics')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin/analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Ключевые метрики продукта одним снимком' })
  overview() {
    return this.analytics.getOverview();
  }

  @Get('growth')
  @ApiOperation({ summary: 'Регистрации по дням + накопительный итог' })
  growth(@Query() query: TimeSeriesQueryDto) {
    return this.analytics.getGrowth(query.days ?? 30);
  }

  @Get('engagement')
  @ApiOperation({ summary: 'Свайпы/мэтчи/сообщения по дням' })
  engagement(@Query() query: TimeSeriesQueryDto) {
    return this.analytics.getEngagement(query.days ?? 30);
  }

  @Get('funnel')
  @ApiOperation({
    summary:
      'Воронка активации: регистрация → квиз → онбординг → свайп → мэтч → сообщение',
  })
  funnel() {
    return this.analytics.getFunnel();
  }

  @Get('cities')
  @ApiOperation({ summary: 'Распределение пользователей по городам' })
  cities() {
    return this.analytics.getCities();
  }

  @Get('scenarios')
  @ApiOperation({
    summary: 'Распределение пользователей по сценариям использования',
  })
  scenarios() {
    return this.analytics.getScenarios();
  }

  @Get('users')
  @ApiOperation({
    summary: 'Список пользователей: поиск, фильтры, сортировка, пагинация',
  })
  users(@Query() query: UsersQueryDto) {
    return this.analytics.getUsers(query);
  }

  @Get('users/:id')
  @ApiOperation({
    summary:
      'Детальная карточка пользователя: профиль, активность, доверие, платежи',
  })
  userDetail(@Param('id', ParseIntPipe) id: number) {
    return this.analytics.getUserDetail(id);
  }
}
