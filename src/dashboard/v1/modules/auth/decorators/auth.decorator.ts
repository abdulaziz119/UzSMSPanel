import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OptionalJwtGuard } from '../optional-jwt.guard';

export function Auth(optional: boolean = false) {
  if (optional === true) {
    return applyDecorators(UseGuards(OptionalJwtGuard));
  }
  return applyDecorators(UseGuards(AuthGuard('jwt')));
}
