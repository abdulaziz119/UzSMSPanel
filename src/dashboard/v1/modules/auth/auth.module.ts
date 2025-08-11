import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { DatabaseModule } from '../../../../database/database.module';
import { AuthService } from '../../../../service/auth.service';
import { AuthorizationService } from '../../../../utils/authorization.service';
import { JWT_SECRET } from '../../../../utils/env/env';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { otpProviders } from './otp.providers';
import { userProviders } from '../../../../providers/user.providers';

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
    JwtStrategy,
    AuthService,
    AuthorizationService,
  ],
  exports: [PassportModule, JwtStrategy, AuthService],
})
export class AuthModule {}
