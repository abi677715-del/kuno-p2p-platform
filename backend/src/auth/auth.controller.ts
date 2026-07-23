import { Body, Controller, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { EnableTwoFaDto } from './dto/enable-two-fa.dto';
import { TwoFaCodeDto } from './dto/two-fa-code.dto';
import { VerifyTwoFaLoginDto } from './dto/verify-two-fa-login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
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
