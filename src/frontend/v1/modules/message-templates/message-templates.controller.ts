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
import { User } from '../auth/decorators/user.decorator';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { ParamIdDto, SingleResponse } from '../../../../utils/dto/dto';
import { PaginationResponse } from '../../../../utils/pagination.response';
import { MessageTemplatesEntity } from '../../../../entity/message-templates.entity';
import {
  CreateMessageTemplateDto,
  UpdateMessageTemplateDto,
  MessageTemplateQueryDto,
} from './dto/message-templates.dto';

@ApiTags('Message Templates')
@ApiBearerAuth()
@Controller({ path: 'message-templates', version: '1' })
export class MessageTemplatesController {
  constructor(private readonly messageTemplatesService: MessageTemplatesService) {}

  @ApiOperation({ summary: 'Create new message template' })
  @ApiResponse({ status: 201, description: 'Message template created successfully' })
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Post()
  @Auth()
  @HttpCode(HttpStatus.CREATED)
  async createTemplate(
    @Body() createTemplateDto: CreateMessageTemplateDto,
    @User('id') userId: number,
  ): Promise<SingleResponse<MessageTemplatesEntity>> {
    return this.messageTemplatesService.createTemplate({
      ...createTemplateDto,
      user_id: userId,
    });
  }

  @ApiOperation({ summary: 'Get user message templates' })
  @ApiResponse({ status: 200, description: 'Message templates retrieved successfully' })
  @Get('my-templates')
  @Auth()
  async getUserTemplates(
    @Query() query: MessageTemplateQueryDto,
    @User('id') userId: number,
  ): Promise<PaginationResponse<MessageTemplatesEntity[]>> {
    return this.messageTemplatesService.getUserTemplates(
      userId,
      query.page,
      query.limit,
      query.is_approved,
    );
  }

  @ApiOperation({ summary: 'Get approved templates (public)' })
  @ApiResponse({ status: 200, description: 'Approved templates retrieved successfully' })
  @Get('approved')
  @Auth(true) // Optional auth
  async getApprovedTemplates(
    @Query() query: MessageTemplateQueryDto,
  ): Promise<PaginationResponse<MessageTemplatesEntity[]>> {
    return this.messageTemplatesService.getApprovedTemplates(
      query.page,
      query.limit,
    );
  }

  @ApiOperation({ summary: 'Get message template by ID' })
  @ApiResponse({ status: 200, description: 'Message template retrieved successfully' })
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Get(':id')
  @Auth()
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
  async deleteTemplate(
    @Param() params: ParamIdDto,
  ): Promise<SingleResponse<{ message: string }>> {
    return this.messageTemplatesService.deleteTemplate(params.id);
  }

  @ApiOperation({ summary: 'Get template statistics' })
  @ApiResponse({ status: 200, description: 'Template statistics retrieved successfully' })
  @Get('statistics/overview')
  @Auth()
  async getTemplateStatistics(
    @User('id') userId: number,
  ): Promise<SingleResponse<{
    total: number;
    approved: number;
    pending: number;
  }>> {
    return this.messageTemplatesService.getTemplateStatistics(userId);
  }
}
