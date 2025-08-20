import {
  Controller,
  Post,
  Body,
  HttpCode,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiBadRequestResponse } from '@nestjs/swagger';
import { EmailContactService } from '../../../../service/email-contact.service';
import { CreateEmailContactDto, CreateBulkEmailContactDto, UpdateEmailContactDto, EmailContactQueryDto } from '../../../../utils/dto/email-contact.dto';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Auth } from '../auth/decorators/auth.decorator';
import { User } from '../auth/decorators/user.decorator';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import { ParamIdDto, SingleResponse } from '../../../../utils/dto/dto';
import { PaginationResponse } from '../../../../utils/pagination.response';

@ApiBearerAuth()
@ApiTags('email-contact')
@Controller({ path: '/frontend/email-contact', version: '1' })
export class EmailContactController {
  constructor(private readonly emailContactService: EmailContactService) {}

  @Post('/create')
  @HttpCode(201)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async create(
    @Body() body: CreateEmailContactDto,
    @User('id') user_id: number,
  ): Promise<SingleResponse<any>> {
    const result = await this.emailContactService.create(user_id, body);
    return { result };
  }

  @Post('/bulk')
  @HttpCode(201)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async createBulk(
    @Body() body: CreateBulkEmailContactDto,
    @User('id') user_id: number,
  ): Promise<any> {
    return await this.emailContactService.createBulk(user_id, body);
  }

  @Post('/findAll')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async findAll(
    @Body() query: EmailContactQueryDto,
    @User('id') user_id: number,
  ): Promise<PaginationResponse<any[]>> {
    return await this.emailContactService.findAll(user_id, query);
  }

  @Post('/update')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async update(
    @Body() body: UpdateEmailContactDto & { id: number },
    @User('id') user_id: number,
  ): Promise<SingleResponse<any>> {
    const result = await this.emailContactService.update(user_id, body.id, body);
    return { result };
  }

  @Post('/delete')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async delete(
    @Body() param: ParamIdDto,
    @User('id') user_id: number,
  ): Promise<{ result: true }> {
    await this.emailContactService.remove(user_id, param.id);
    return { result: true };
  }
}
