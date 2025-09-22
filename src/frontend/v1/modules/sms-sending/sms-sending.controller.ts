import { Body, Controller, HttpCode, Post, Headers } from '@nestjs/common';
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
  constructor(private readonly axiosService: AxiosService) {}

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
    const url = `${this.url}/api/v1/sms-sending/send-contact`;
    const response: any = await this.axiosService.sendPostRequest(
      url,
      {
        phone: body.phone,
        message: body.message,
        user_id: user_id,
        balance_type: balance,
      },
      {},
    );

    return response;
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
    const url = `${this.url}/api/v1/sms-sending/send-group`;
    const response: any = await this.axiosService.sendPostRequest(
      url,
      {
        group_id: body.group_id,
        message: body.message,
        user_id: user_id,
        balance_type: balance,
      },
      {},
    );

    return response;
  }
}
