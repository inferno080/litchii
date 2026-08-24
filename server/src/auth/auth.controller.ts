import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from './current-user.decorator';
import { CreateProfileDto } from './dto/create-profile.dto';
import { SignInDto } from './dto/sign-in.dto';
import { SupabaseJwtGuard } from './supabase-jwt.guard';
import { AuthService } from './auth.service';
import type { AuthenticatedUser } from './authenticated-user.interface';

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-in')
  @ApiOperation({ summary: 'Sign in with Supabase email/password and receive a session' })
  @ApiBody({ type: SignInDto })
  @ApiOkResponse({ description: 'Supabase session, including access_token and refresh_token.' })
  signIn(@Body() dto: SignInDto) {
    return this.authService.signIn(dto);
  }

  @Get('me')
  @UseGuards(SupabaseJwtGuard)
  @ApiBearerAuth('SupabaseAccessToken')
  getCurrentUser(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getCurrentUser(user);
  }

  @Post('profile')
  @UseGuards(SupabaseJwtGuard)
  @ApiBearerAuth('SupabaseAccessToken')
  createProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProfileDto,
  ) {
    return this.authService.createProfile(user, dto);
  }
}
