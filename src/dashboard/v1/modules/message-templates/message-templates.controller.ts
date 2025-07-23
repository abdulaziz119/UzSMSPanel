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
import {
  ApiTags,
  ApiBearerAuth,
  ApiResponse,
  ApiBadRequestResponse,
  ApiOperation,
} from '@nestjs/swagger';
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
  constructor(private readonly messageTemplatesService: MessageTemplatesService) {}

  @ApiOperation({ summary: 'Create new message template' })
  @ApiResponse({ status: 201, description: 'Message template created successfully' })
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Post()
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createTemplate(
    @Body() createTemplateDto: CreateMessageTemplateDto,
  ): Promise<SingleResponse<MessageTemplatesEntity>> {
    return this.messageTemplatesService.createTemplate(createTemplateDto);
  }

  @ApiOperation({ summary: 'Get all message templates' })
  @ApiResponse({ status: 200, description: 'Message templates retrieved successfully' })
  @Get()
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.OPERATOR)
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

  @ApiOperation({ summary: 'Get message template by ID' })
  @ApiResponse({ status: 200, description: 'Message template retrieved successfully' })
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Get(':id')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.OPERATOR)
  async getTemplateById(
    @Param() params: ParamIdDto,
  ): Promise<SingleResponse<MessageTemplatesEntity>> {
    return this.messageTemplatesService.getTemplateById(params.id);
  }

  @ApiOperation({ summary: 'Update message template' })
  @ApiResponse({ status: 200, description: 'Message template updated successfully' })
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Put(':id')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN)
  async updateTemplate(
    @Param() params: ParamIdDto,
    @Body() updateTemplateDto: UpdateMessageTemplateDto,
  ): Promise<SingleResponse<MessageTemplatesEntity>> {
    return this.messageTemplatesService.updateTemplate(params.id, updateTemplateDto);
  }

  @ApiOperation({ summary: 'Delete message template' })
  @ApiResponse({ status: 200, description: 'Message template deleted successfully' })
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Delete(':id')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN)
  async deleteTemplate(
    @Param() params: ParamIdDto,
  ): Promise<SingleResponse<{ message: string }>> {
    return this.messageTemplatesService.deleteTemplate(params.id);
  }

  @ApiOperation({ summary: 'Approve/Disapprove message template' })
  @ApiResponse({ status: 200, description: 'Template approval status updated successfully' })
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

  @ApiOperation({ summary: 'Get template statistics' })
  @ApiResponse({ status: 200, description: 'Template statistics retrieved successfully' })
  @Get('statistics/overview')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.OPERATOR)
  async getTemplateStatistics(): Promise<SingleResponse<{
    total: number;
    approved: number;
    pending: number;
  }>> {
    return this.messageTemplatesService.getTemplateStatistics();
  }
}
