import { Body, Controller, HttpCode, Post, Headers } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import {
  ApiBearerAuth,
  ApiTags,
  ApiBadRequestResponse,
  ApiResponse,
} from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import { User } from '../auth/decorators/user.decorator';
import { SendToContactDto, SendToGroupDto } from './dto/sms-sending.dto';
import { ContactTypeEnum } from '../../../../utils/enum/contact.enum';
import { SMS_MESSAGE_QUEUE } from '../../../../constants/constants';
import { SmsSendingService } from '../../../../service/sms-sending.service';
import {
  SendToContactJobData,
  SendToGroupJobData,
} from '../../../../utils/interfaces/messages.interfaces';
import {
  SendContactResponse,
  SendGroupResponse,
} from '../../../../utils/interfaces/request/sms-sending.request.interfaces';

@ApiBearerAuth()
@ApiTags('sms-sending')
@Controller({ path: '/frontend/sms-sending', version: '1' })
export class SmsSendingController {
  constructor(
    @InjectQueue(SMS_MESSAGE_QUEUE) private readonly messageQueue: Queue,
    private readonly messagesService: SmsSendingService,
  ) {}

  @Post('/send-contact')
  @HttpCode(202)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async sendContact(
    @Body() body: SendToContactDto,
    @User('id') user_id: number,
    @Headers('balance_type') balance: ContactTypeEnum,
  ): Promise<SendContactResponse> {
    // Queue ga tushishdan oldin validatsiya
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
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  @ApiResponse({ status: 202, description: 'Group messages queued' })
  async sendGroup(
    @Body() body: SendToGroupDto,
    @User('id') user_id: number,
    @Headers('balance_type') balance: ContactTypeEnum,
  ): Promise<SendGroupResponse> {
    // Queue ga tushishdan oldin validatsiya
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
