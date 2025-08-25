import { ContactTypeEnum } from '../enum/contact.enum';
import {
  SendEmailToContactDto,
  SendEmailToGroupDto,
  CanSendEmailToContactDto,
  CanSendEmailToGroupDto,
} from '../../frontend/v1/modules/email-messages/dto/email-messages.dto';

export interface SendEmailToContactJobData {
  payload: SendEmailToContactDto;
  user_id: number;
  balance: ContactTypeEnum;
}

export interface SendEmailToGroupJobData {
  payload: SendEmailToGroupDto;
  user_id: number;
  balance: ContactTypeEnum;
}

export interface CanSendEmailToContactJobData {
  payload: CanSendEmailToContactDto;
  user_id: number;
  balance: ContactTypeEnum;
}

export interface CanSendEmailToGroupJobData {
  payload: CanSendEmailToGroupDto;
  user_id: number;
  balance: ContactTypeEnum;
}
