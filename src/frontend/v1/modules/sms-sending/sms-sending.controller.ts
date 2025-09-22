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
  SendContactResponse,
  SendGroupResponse,
} from '../../../../utils/interfaces/request/sms-sending.request.interfaces';
import { SMS_SENDING_URL } from '../../../../utils/env/env';
import { AxiosService } from '../../../../helpers/axios.service';

@ApiBearerAuth()
@ApiTags('sms-sending')
@Controller({ path: '/frontend/sms-sending', version: '1' })
export class SmsSendingController {
  private url = SMS_SENDING_URL;
  constructor(
    @InjectQueue(SMS_MESSAGE_QUEUE) private readonly messageQueue: Queue,
    private readonly messagesService: SmsSendingService,
    private readonly axiosService: AxiosService,
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
    const url = `${this.url}/api/excel/import-excel`;
    const response = await this.axiosService.sendPostFileRequest(url, {
      file: fileBase64,
      fileName: file.originalname,
      fileType: file.mimetype,
      default_group_id: body.default_group_id,
      user_id: user_id,
    });

    return response.data;
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
    const url = `${this.url}/api/excel/import-excel`;
    const response = await this.axiosService.sendPostFileRequest(url, {
      file: fileBase64,
      fileName: file.originalname,
      fileType: file.mimetype,
      default_group_id: body.default_group_id,
      user_id: user_id,
    });

    return response.data;
  }
}
