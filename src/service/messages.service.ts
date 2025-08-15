import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SmsMessageService } from './sms-message.service';
import { Repository } from 'typeorm';
import { MODELS } from '../constants/constants';
import { SmsContactEntity } from '../entity/sms-contact.entity';

@Injectable()
export class MessagesService {
  constructor(
    @Inject(MODELS.SMS_MESSAGE)
    private readonly smsMessageService: SmsMessageService,
    @Inject(MODELS.SMS_CONTACT)
    private readonly smsContactRepo?: Repository<SmsContactEntity>,
  ) {}

  async sendToContact(payload: any, user_id: number) {
    return await this.smsMessageService.sendToContact(payload, user_id);
  }

  async sendToGroup(payload: any, user_id: number) {
    return await this.smsMessageService.sendToGroup(payload, user_id);
  }
}
