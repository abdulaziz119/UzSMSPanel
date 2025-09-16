import { Provider } from '@nestjs/common';
import * as smpp from 'smpp';
import { MODELS } from '../constants/constants';

export const smppProvider: Provider = {
  provide: MODELS.SMPP,
  useFactory: () => {
    return smpp;
  },
};
