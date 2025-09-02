import {
  SendToContactDto,
  SendToGroupDto,
} from '../../frontend/v1/modules/sms-sending/dto/sms-sending.dto';
import { ContactTypeEnum } from '../enum/contact.enum';

export interface SendToContactJobData {
  payload: SendToContactDto;
  user_id: number;
  balance?: ContactTypeEnum;
  meta?: Record<string, any>;
}

export interface SendToGroupJobData {
  payload: SendToGroupDto;
  user_id: number;
  balance?: ContactTypeEnum;
  meta?: Record<string, any>;
}
