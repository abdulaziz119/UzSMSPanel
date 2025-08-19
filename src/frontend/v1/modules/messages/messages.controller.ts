import {
  Body,
  Controller,
  HttpCode,
  Post,
  Headers,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import {
  ApiBearerAuth,
  ApiTags,
  ApiBadRequestResponse,
  ApiResponse,
  ApiHeader,
} from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import { User } from '../auth/decorators/user.decorator';
import {
  SendToContactDto,
  SendToGroupDto,
  CanSendContactDto,
  CanSendGroupDto,
} from './dto/messages.dto';
import { ContactTypeEnum } from '../../../../utils/enum/contact.enum';
import { SMS_MESSAGE_QUEUE } from '../../../../constants/constants';
import {
  SendToContactJobData,
  SendToGroupJobData,
} from '../../../../queue/messages.queue';
import { MessagesService } from '../../../../service/messages.service';

@ApiBearerAuth()
@ApiTags('messages')
@Controller({ path: '/frontend/messages', version: '1' })
export class MessagesController {
  constructor(
    @InjectQueue(SMS_MESSAGE_QUEUE) private readonly messageQueue: Queue,
    private readonly messagesService: MessagesService,
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
  ): Promise<{ jobId: string; message: string }> {
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
  ): Promise<{ jobId: string; message: string }> {
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
    };
  }

  @Post('/can-send-contact')
  @HttpCode(200)
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  @ApiHeader({
    name: 'balance_type',
    required: false,
    description:
      'Balance manbai: individual yoki company (default: individual)',
    schema: { type: 'string', enum: Object.values(ContactTypeEnum) },
    example: 'individual',
  })
  async canSendContact(
    @Body() body: CanSendContactDto,
    @User('id') user_id: number,
    @Headers('balance_type') balance: ContactTypeEnum,
  ): Promise<any> {
    return this.messagesService.estimateCanSendContact(user_id, body, balance);
  }

  @Post('/can-send-group')
  @HttpCode(200)
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  @ApiHeader({
    name: 'balance_type',
    required: false,
    description:
      'Balance manbai: individual yoki company (default: individual)',
    schema: { type: 'string', enum: Object.values(ContactTypeEnum) },
    example: 'company',
  })
  async canSendGroup(
    @Body() body: CanSendGroupDto,
    @User('id') user_id: number,
    @Headers('balance_type') balance: ContactTypeEnum,
  ): Promise<any> {
    return this.messagesService.estimateCanSendGroup(user_id, body, balance);
  }
}
