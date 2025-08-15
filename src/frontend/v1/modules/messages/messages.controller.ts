import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiBadRequestResponse,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { SingleResponse } from '../../../../utils/dto/dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import { User } from '../auth/decorators/user.decorator';
import { MessagesService } from '../../../../service/messages.service';
import { SendToContactDto, SendToGroupDto } from './dto/messages.dto';

@ApiBearerAuth()
@ApiTags('messages')
@Controller({ path: '/frontend/messages', version: '1' })
export class MessagesController {
  constructor(private readonly messageService: MessagesService) {}

  @Post('/send-contact')
  @HttpCode(200)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async sendContact(
    @Body() body: SendToContactDto,
    @User('id') user_id: number,
  ): Promise<SingleResponse<{ message_id: string }>> {
    return await this.messageService.sendToContact(body, user_id);
  }

  @Post('/send-group')
  @HttpCode(200)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  @ApiResponse({ status: 201, description: 'Group messages queued' })
  async sendGroup(
    @Body() body: SendToGroupDto,
    @User('id') user_id: number,
  ): Promise<SingleResponse<{ job_id?: string }>> {
    return await this.messageService.sendToGroup(body, user_id);
  }
}
