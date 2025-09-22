import { Body, Controller, HttpCode, Post, Headers } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { SMS_MESSAGE_QUEUE } from '../../../constants/constants';
import { SmsSendingService } from '../../../service/sms-sending.service';
import {
  SendToContactJobData,
  SendToGroupJobData,
} from '../../../utils/interfaces/messages.interfaces';
import { ContactTypeEnum } from '../../../utils/enum/contact.enum';
import {
  SendContactResponse,
  SendGroupResponse,
} from '../../../utils/interfaces/request/sms-sending.request.interfaces';
import { SendToContactDto, SendToGroupDto } from './dto/sms-sending.dto';

@Controller({ path: '/sms-sending', version: '1' })
export class SmsSendingController {
  constructor(
    @InjectQueue(SMS_MESSAGE_QUEUE) private readonly messageQueue: Queue,
    private readonly messagesService: SmsSendingService,
  ) {}

  @Post('/send-contact')
  @HttpCode(202)
  async sendContact(
    @Body() body: SendToContactDto,
  ): Promise<SendContactResponse> {
    const { user_id, balance_type } = body;
    await this.messagesService.validateBeforeQueueContact(
      user_id,
      body,
      balance_type,
    );

    const job = await this.messageQueue.add(
      'send-to-contact',
      {
        payload: body,
        user_id,
        balance_type,
      } as SendToContactJobData,
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    );

    return {
      jobId: job.id.toString(),
      message: 'Message queued for processing',
    };
  }

  @Post('/send-group')
  @HttpCode(202)
  async sendGroup(
    @Body() body: SendToGroupDto,
  ): Promise<SendGroupResponse> {
    const { user_id, balance_type } = body;
    const validationResult =
      await this.messagesService.validateBeforeQueueGroup(
        user_id,
        body,
        balance_type,
      );

    const job = await this.messageQueue.add(
      'send-to-group',
      {
        payload: body,
        user_id,
        balance_type,
      } as SendToGroupJobData,
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    );

    return {
      jobId: job.id.toString(),
      message: 'Group messages queued for processing',
      contact_count: validationResult.contact_count,
      valid_contact_count: validationResult.valid_contact_count,
      invalid_contact_count: validationResult.invalid_contact_count,
    };
  }
}
