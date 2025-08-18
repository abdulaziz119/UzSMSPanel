import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SmsMessageService } from './sms-message.service';
import { Repository } from 'typeorm';
import { MODELS } from '../constants/constants';
import { SmsContactEntity } from '../entity/sms-contact.entity';
import {
  SendToContactDto,
  SendToGroupDto,
} from '../frontend/v1/modules/messages/dto/messages.dto';
import { ContactTypeEnum } from '../utils/enum/contact.enum';

@Injectable()
export class MessagesService {
  constructor(
    private readonly smsMessageService: SmsMessageService,
    @Inject(MODELS.SMS_CONTACT)
    private readonly smsContactRepo?: Repository<SmsContactEntity>,
  ) {}

  async sendToContact(
    payload: SendToContactDto,
    user_id: number,
    balance?: ContactTypeEnum,
  ) {
    return await this.smsMessageService.sendToContact(
      payload,
      user_id,
      balance,
    );
  }

  async sendToGroup(
    payload: SendToGroupDto,
    user_id: number,
    balance?: ContactTypeEnum,
  ) {
    return await this.smsMessageService.sendToGroup(payload, user_id, balance);
  }
}
