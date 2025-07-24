import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiBadRequestResponse } from '@nestjs/swagger';
import { MessageTemplatesService } from '../../../../service/message-templates.service';
import { Auth } from '../auth/decorators/auth.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { ParamIdDto, SingleResponse } from '../../../../utils/dto/dto';
import { PaginationResponse } from '../../../../utils/pagination.response';
import { MessageTemplatesEntity } from '../../../../entity/message-templates.entity';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import {
  CreateMessageTemplateDto,
  UpdateMessageTemplateDto,
  MessageTemplateQueryDto,
} from './dto/message-templates.dto';

@ApiTags('Dashboard - Message Templates')
@ApiBearerAuth()
@Controller({ path: '/dashboard/message-templates', version: '1' })
export class MessageTemplatesController {
  constructor(
    private readonly messageTemplatesService: MessageTemplatesService,
  ) {}

  @Post('/create')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Auth()
  @HttpCode(HttpStatus.CREATED)
  async createTemplate(
    @Body() createTemplateDto: CreateMessageTemplateDto,
  ): Promise<SingleResponse<MessageTemplatesEntity>> {
    return this.messageTemplatesService.createTemplate(createTemplateDto);
  }

  @Get('getAll')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.OPERATOR)
  @Auth()
  @HttpCode(HttpStatus.OK)
  async getAllTemplates(
    @Query() query: MessageTemplateQueryDto,
  ): Promise<PaginationResponse<MessageTemplatesEntity[]>> {
    return this.messageTemplatesService.getAllTemplates(
      query.page,
      query.limit,
      {
        is_approved: query.is_approved,
        user_id: query.user_id,
        search: query.search,
      },
    );
  }

  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Get('/findOne/:id')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.OPERATOR)
  @HttpCode(HttpStatus.OK)
  @Auth()
  async getTemplateById(
    @Param() params: ParamIdDto,
  ): Promise<SingleResponse<MessageTemplatesEntity>> {
    return this.messageTemplatesService.getTemplateById(params.id);
  }

  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Put('/update/:id')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateTemplate(
    @Param() params: ParamIdDto,
    @Body() updateTemplateDto: UpdateMessageTemplateDto,
  ): Promise<SingleResponse<MessageTemplatesEntity>> {
    return this.messageTemplatesService.updateTemplate(
      params.id,
      updateTemplateDto,
    );
  }

  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Delete('/delete/:id')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteTemplate(
    @Param() params: ParamIdDto,
  ): Promise<SingleResponse<{ message: string }>> {
    return this.messageTemplatesService.deleteTemplate(params.id);
  }

  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Post(':id/approve')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  async approveTemplate(
    @Param() params: ParamIdDto,
  ): Promise<SingleResponse<MessageTemplatesEntity>> {
    return this.messageTemplatesService.approveTemplate(params.id);
  }

  @Get('statistics/overview')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.OPERATOR)
  @HttpCode(HttpStatus.OK)
  async getTemplateStatistics(): Promise<
    SingleResponse<{
      total: number;
      approved: number;
      pending: number;
    }>
  > {
    return this.messageTemplatesService.getTemplateStatistics();
  }
}
