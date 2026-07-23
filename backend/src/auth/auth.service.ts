import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { UsersService } from '../users/users.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { EnableTwoFaDto } from './dto/enable-two-fa.dto';
import { TwoFaCodeDto } from './dto/two-fa-code.dto';
import { VerifyTwoFaLoginDto } from './dto/verify-two-fa-login.dto';

const SALT_ROUNDS = 12;
const APP_NAME = 'Birrly';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.usersService.createWithWallets(dto.email, passwordHash, dto.phone);

    return this.issueTokens(user.id, user.email, user.role);
  }

  /**
   * If the account has 2FA enabled, this does NOT return access tokens.
   * It returns a short-lived preAuthToken that must be exchanged for real
   * tokens via verifyTwoFaLogin() once the user supplies a valid TOTP code.
   */
  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.twoFaEnabled) {
      const preAuthToken = await this.jwtService.signAsync(
        { sub: user.id, twoFaPending: true },
        { secret: process.env.JWT_SECRET, expiresIn: '5m' },
      );
      return { requiresTwoFa: true, preAuthToken };
    }

    return this.issueTokens(user.id, user.email, user.role);
  }

  async verifyTwoFaLogin(dto: VerifyTwoFaLoginDto) {
    let payload: { sub: string; twoFaPending: boolean };
    try {
      payload = await this.jwtService.verifyAsync(dto.preAuthToken, { secret: process.env.JWT_SECRET });
    } catch {
      throw new UnauthorizedException('Login session expired, please log in again');
    }
    if (!payload.twoFaPending) {
      throw new UnauthorizedException('Invalid login session');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.twoFaSecret) {
      throw new UnauthorizedException('2FA is not set up for this account');
    }

    const isValid = authenticator.verify({ token: dto.code, secret: user.twoFaSecret });
    if (!isValid) {
      throw new UnauthorizedException('Invalid authentication code');
    }

    return this.issueTokens(user.id, user.email, user.role);
  }

  /** Step 1 of enabling 2FA: generates a secret + QR code, not yet persisted. */
  async generateTwoFaSetup(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new BadRequestException('User not found');
    if (user.twoFaEnabled) throw new BadRequestException('2FA is already enabled');

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(user.email, APP_NAME, secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    return { secret, qrCodeDataUrl };
  }

  /** Step 2: confirms the user actually scanned the QR code correctly before turning 2FA on. */
  async enableTwoFa(userId: string, dto: EnableTwoFaDto) {
    const isValid = authenticator.verify({ token: dto.code, secret: dto.secret });
    if (!isValid) {
      throw new BadRequestException('That code doesn\u2019t match — check your authenticator app and try again');
    }
    await this.usersService.setTwoFaSecret(userId, dto.secret);
    await this.usersService.setTwoFaEnabled(userId, true);
    return { twoFaEnabled: true };
  }

  async disableTwoFa(userId: string, dto: TwoFaCodeDto) {
    const user = await this.usersService.findById(userId);
    if (!user?.twoFaSecret) throw new BadRequestException('2FA is not enabled');

    const isValid = authenticator.verify({ token: dto.code, secret: user.twoFaSecret });
    if (!isValid) throw new BadRequestException('Invalid authentication code');

    await this.usersService.setTwoFaEnabled(userId, false);
    return { twoFaEnabled: false };
  }

  private async issueTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    });

    return { accessToken, refreshToken };
  }
}
