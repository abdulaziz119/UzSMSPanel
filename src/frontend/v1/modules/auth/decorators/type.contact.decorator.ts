import { SetMetadata } from '@nestjs/common';
import { ContactTypeEnum } from '../../../../../utils/enum/contact.enum';

export const TYPE_KEY = 'TYPE_KEY';
export const ContactType = (...type: ContactTypeEnum[]) =>
  SetMetadata(TYPE_KEY, type);
