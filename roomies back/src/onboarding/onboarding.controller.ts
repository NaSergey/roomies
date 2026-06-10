import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BudgetDto } from './dto/budget.dto';
import { DealbreakersDto } from './dto/dealbreakers.dto';
import { LocationDto } from './dto/location.dto';
import { ProfileDto } from './dto/profile.dto';
import { QuizDto } from './dto/quiz.dto';
import { ScenarioDto } from './dto/scenario.dto';
import { OnboardingService } from './onboarding.service';

@ApiTags('onboarding')
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Статус онбординга текущего пользователя' })
  getStatus(@CurrentUser() user: { id: number }) {
    return this.onboarding.getStatus(user.id);
  }

  @Patch('scenario')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Шаг 0: сохранить сценарий' })
  patchScenario(
    @CurrentUser() user: { id: number },
    @Body() dto: ScenarioDto,
  ) {
    return this.onboarding.saveScenario(user.id, dto);
  }

  @Patch('location')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Шаг 1: сохранить город и районы' })
  patchLocation(
    @CurrentUser() user: { id: number },
    @Body() dto: LocationDto,
  ) {
    return this.onboarding.saveLocation(user.id, dto);
  }

  @Patch('budget')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Шаг 2: сохранить бюджет и даты' })
  patchBudget(
    @CurrentUser() user: { id: number },
    @Body() dto: BudgetDto,
  ) {
    return this.onboarding.saveBudget(user.id, dto);
  }

  @Patch('dealbreakers')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Шаг 3: сохранить непереговорные условия' })
  patchDealbreakers(
    @CurrentUser() user: { id: number },
    @Body() dto: DealbreakersDto,
  ) {
    return this.onboarding.saveDealbreakers(user.id, dto);
  }

  @Post('quiz')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Шаг 4: сохранить ответы вайб-квиза' })
  postQuiz(
    @CurrentUser() user: { id: number },
    @Body() dto: QuizDto,
  ) {
    return this.onboarding.saveQuiz(user.id, dto);
  }

  @Patch('profile')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Шаг 5: сохранить профиль и завершить онбординг' })
  patchProfile(
    @CurrentUser() user: { id: number },
    @Body() dto: ProfileDto,
  ) {
    return this.onboarding.saveProfile(user.id, dto);
  }
}
