import { Body, Controller, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { EnableTwoFaDto } from './dto/enable-two-fa.dto';
import { TwoFaCodeDto } from './dto/two-fa-code.dto';
import { VerifyTwoFaLoginDto } from './dto/verify-two-fa-login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

// 5 attempts per minute per IP — generous for a mistyped password, tight
// enough to make brute-forcing or mass account creation impractical.
const AUTH_THROTTLE = { default: { limit: 5, ttl: 60_000 } };

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  @Throttle(AUTH_THROTTLE)
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('login')
  @HttpCode(200)
  @Throttle(AUTH_THROTTLE)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('verify-email')
  @HttpCode(200)
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Post('2fa/verify-login')
  @HttpCode(200)
  verifyTwoFaLogin(@Body() dto: VerifyTwoFaLoginDto) {
    return this.authService.verifyTwoFaLogin(dto);
  }

  @Post('2fa/setup')
  @UseGuards(JwtAuthGuard)
  setupTwoFa(@Req() req: any) {
    return this.authService.generateTwoFaSetup(req.user.userId);
  }

  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard)
  enableTwoFa(@Req() req: any, @Body() dto: EnableTwoFaDto) {
    return this.authService.enableTwoFa(req.user.userId, dto);
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  disableTwoFa(@Req() req: any, @Body() dto: TwoFaCodeDto) {
    return this.authService.disableTwoFa(req.user.userId, dto);
  }
}
