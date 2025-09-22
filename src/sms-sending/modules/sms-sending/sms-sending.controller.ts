import { Body, Controller, HttpCode, Post, Headers } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { SMS_MESSAGE_QUEUE } from '../../../constants/constants';
import { SmsSendingService } from '../../../service/sms-sending.service';
import { UserRoleEnum } from '../../../utils/enum/user.enum';
import { Roles } from '../../../frontend/v1/modules/auth/decorators/roles.decorator';
import { Auth } from '../../../frontend/v1/modules/auth/decorators/auth.decorator';
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
import { User } from '../../../frontend/v1/modules/auth/decorators/user.decorator';

@Controller({ path: '/sms-sending', version: '1' })
export class SmsSendingController {
  constructor(
    @InjectQueue(SMS_MESSAGE_QUEUE) private readonly messageQueue: Queue,
    private readonly messagesService: SmsSendingService,
  ) {}

  @Post('/send-contact')
  @HttpCode(202)
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async sendContact(
    @Body() body: SendToContactDto,
    @User('id') user_id: number,
    @Headers('balance_type') balance: ContactTypeEnum,
  ): Promise<SendContactResponse> {
    await this.messagesService.validateBeforeQueueContact(
      user_id,
      body,
      balance,
    );

    const job = await this.messageQueue.add(
      'send-to-contact',
      {
        payload: body,
        user_id,
        balance,
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
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async sendGroup(
    @Body() body: SendToGroupDto,
    @User('id') user_id: number,
    @Headers('balance_type') balance: ContactTypeEnum,
  ): Promise<SendGroupResponse> {
    const validationResult =
      await this.messagesService.validateBeforeQueueGroup(
        user_id,
        body,
        balance,
      );

    const job = await this.messageQueue.add(
      'send-to-group',
      {
        payload: body,
        user_id,
        balance,
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
