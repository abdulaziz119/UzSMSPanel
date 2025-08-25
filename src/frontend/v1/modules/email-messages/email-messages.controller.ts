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
  SendEmailToContactDto,
  SendEmailToGroupDto,
  CanSendEmailToContactDto,
  CanSendEmailToGroupDto,
} from './dto/email-messages.dto';
import { ContactTypeEnum } from '../../../../utils/enum/contact.enum';
import { EMAIL_MESSAGE_QUEUE } from '../../../../constants/constants';
import { EmailMessagesService } from '../../../../service/email-messages.service';
import {
  SendEmailToContactJobData,
  SendEmailToGroupJobData,
} from '../../../../utils/interfaces/email-messages.interfaces';

@ApiBearerAuth()
@ApiTags('email-messages')
@Controller({ path: '/frontend/email-messages', version: '1' })
export class EmailMessagesController {
  constructor(
    @InjectQueue(EMAIL_MESSAGE_QUEUE) private readonly emailMessageQueue: Queue,
    private readonly emailMessagesService: EmailMessagesService,
  ) {}

  @Post('/send-contact')
  @HttpCode(202)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async sendEmailToContact(
    @Body() body: SendEmailToContactDto,
    @User('id') user_id: number,
    @Headers('balance_type') balance: ContactTypeEnum,
  ): Promise<{ jobId: string; message: string }> {
    const job = await this.emailMessageQueue.add(
      'send-to-contact',
      {
        payload: body,
        user_id,
        balance,
      } as SendEmailToContactJobData,
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    );

    return {
      jobId: job.id.toString(),
      message: 'Email queued for processing',
    };
  }

  @Post('/send-group')
  @HttpCode(202)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  @ApiResponse({ status: 202, description: 'Group emails queued' })
  async sendEmailToGroup(
    @Body() body: SendEmailToGroupDto,
    @User('id') user_id: number,
    @Headers('balance_type') balance: ContactTypeEnum,
  ): Promise<{ jobId: string; message: string }> {
    const job = await this.emailMessageQueue.add(
      'send-to-group',
      {
        payload: body,
        user_id,
        balance,
      } as SendEmailToGroupJobData,
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    );

    return {
      jobId: job.id.toString(),
      message: 'Group emails queued for processing',
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
  async canSendEmailToContact(
    @Body() body: CanSendEmailToContactDto,
    @User('id') user_id: number,
    @Headers('balance_type') balance: ContactTypeEnum,
  ): Promise<any> {
    return this.emailMessagesService.estimateCanSendEmailToContact(user_id, body, balance);
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
  async canSendEmailToGroup(
    @Body() body: CanSendEmailToGroupDto,
    @User('id') user_id: number,
    @Headers('balance_type') balance: ContactTypeEnum,
  ): Promise<any> {
    return this.emailMessagesService.estimateCanSendEmailToGroup(user_id, body, balance);
  }
}
