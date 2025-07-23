import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

export function Auth(optional: boolean = false) {
  if (optional) {
    return applyDecorators(UseGuards(AuthGuard('jwt-optional')));
  }
  return applyDecorators(UseGuards(AuthGuard('jwt')));
}
