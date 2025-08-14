import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBadRequestResponse, ApiTags } from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { SmsSenderService } from '../../../../service/sms-sender.service';
import { CreateSmsSenderDto } from '../../../../utils/dto/sms-sender.dto';
import { SingleResponse, PaginationParams } from '../../../../utils/dto/dto';
import { PaginationResponse } from '../../../../utils/pagination.response';
import { SmsSenderEntity } from '../../../../entity/sms-sender.entity';
import { User } from '../auth/decorators/user.decorator';

@ApiBearerAuth()
@ApiTags('sms-sender')
@Controller({ path: '/frontend/sms-sender', version: '1' })
export class SmsSenderController {
  constructor(private readonly smsSenderService: SmsSenderService) {}

  @Post('/create')
  @HttpCode(201)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async create(
    @Body() body: CreateSmsSenderDto,
    @User('id') user_id: number,
  ): Promise<SingleResponse<SmsSenderEntity>> {
    return await this.smsSenderService.create(body, user_id);
  }

  @Post('/findAll')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async findAll(
    @Body() query: PaginationParams,
  ): Promise<PaginationResponse<SmsSenderEntity[]>> {
    return await this.smsSenderService.findAll(query);
  }
}
