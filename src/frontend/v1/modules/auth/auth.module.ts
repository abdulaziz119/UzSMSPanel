import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { DatabaseModule } from '../../../../database/database.module';
import { userProviders } from '../../../../providers/user.providers';
import { AuthorizationService } from '../../../../utils/authorization.service';
import { JWT_SECRET } from '../../../../utils/env/env';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';
import { otpProviders } from '../../../../providers/otp.providers';
import { AuthService } from '../../../../service/auth.service';
import { contactProviders } from '../../../../providers/contact.providers';
import { MailService } from '../../../../service/mail.service';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.register({
      secret: JWT_SECRET,
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [AuthController],
  providers: [
    ...userProviders,
    ...otpProviders,
    ...contactProviders,
    JwtStrategy,
    AuthService,
    AuthorizationService,
    MailService,
  ],
  exports: [PassportModule, JwtStrategy, AuthService],
})
export class AuthModule {}
