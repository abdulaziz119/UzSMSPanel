import { Injectable } from '@nestjs/common';
import { SmsMessageEntity } from '../entity/sms-message.entity';
import {
  SendToContactDto,
  SendToGroupDto,
} from '../frontend/v1/modules/messages/dto/messages.dto';
import { ContactTypeEnum } from '../utils/enum/contact.enum';
import { SingleResponse } from '../utils/dto/dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { SMS_MESSAGE_QUEUE } from '../constants/constants';
import {
  SendToContactJobData,
  SendToGroupJobData,
} from '../utils/interfaces/sms-message.queue.interfaces';

@Injectable()
export class MessagesService {
  constructor(
    @InjectQueue(SMS_MESSAGE_QUEUE)
    private readonly smsMessageQueue: Queue,
  ) {}

  async sendToContact(
    payload: SendToContactDto,
    user_id: number,
    balance?: ContactTypeEnum,
  ): Promise<SingleResponse<SmsMessageEntity>> {
    // Queue the job and wait for result to keep API response shape
    const jobData: SendToContactJobData = { payload, user_id, balance };
    const job = await this.smsMessageQueue.add('send-contact', jobData, {
      attempts: 2,
      backoff: { type: 'fixed', delay: 1000 },
      removeOnComplete: 50,
      removeOnFail: 10,
      priority: 1,
    });
    const result = await job.finished();
    return result as SingleResponse<SmsMessageEntity>;
  }

  async sendToGroup(
    payload: SendToGroupDto,
    user_id: number,
    balance?: ContactTypeEnum,
  ): Promise<SingleResponse<SmsMessageEntity[]>> {
    const jobData: SendToGroupJobData = { payload, user_id, balance };
    const job = await this.smsMessageQueue.add('send-group', jobData, {
      attempts: 2,
      backoff: { type: 'fixed', delay: 1500 },
      removeOnComplete: 30,
      removeOnFail: 5,
      priority: 2,
    });
    const result = await job.finished();
    return result as SingleResponse<SmsMessageEntity[]>;
  }
}
