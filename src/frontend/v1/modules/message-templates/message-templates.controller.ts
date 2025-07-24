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
  constructor(
    private readonly messageTemplatesService: MessageTemplatesService,
  ) {}

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

  @Get('my-templates')
  @Auth()
  @HttpCode(HttpStatus.OK)
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

  @Get('approved')
  @Auth(true) // Optional auth
  @HttpCode(HttpStatus.OK)
  async getApprovedTemplates(
    @Query() query: MessageTemplateQueryDto,
  ): Promise<PaginationResponse<MessageTemplatesEntity[]>> {
    return this.messageTemplatesService.getApprovedTemplates(
      query.page,
      query.limit,
    );
  }

  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Get('/findOne/:id')
  @Auth()
  @HttpCode(HttpStatus.OK)
  async getTemplateById(
    @Param() params: ParamIdDto,
  ): Promise<SingleResponse<MessageTemplatesEntity>> {
    return this.messageTemplatesService.getTemplateById(params.id);
  }

  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Put('/update/:id')
  @Auth()
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
  @HttpCode(HttpStatus.OK)
  async deleteTemplate(
    @Param() params: ParamIdDto,
  ): Promise<SingleResponse<{ message: string }>> {
    return this.messageTemplatesService.deleteTemplate(params.id);
  }

  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Get('statistics/overview')
  @Auth()
  @HttpCode(HttpStatus.OK)
  async getTemplateStatistics(@User('id') userId: number): Promise<
    SingleResponse<{
      total: number;
      approved: number;
      pending: number;
    }>
  > {
    return this.messageTemplatesService.getTemplateStatistics(userId);
  }
}
