import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags, ApiBadRequestResponse } from '@nestjs/swagger';
import { EmailTemplateService } from '../../../../service/email-template.service';
import {
  CreateEmailTemplateDto,
  UpdateEmailTemplateDto,
  EmailTemplateQueryDto,
} from '../../../../utils/dto/email-template.dto';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Auth } from '../auth/decorators/auth.decorator';
import { User } from '../auth/decorators/user.decorator';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import { ParamIdDto, SingleResponse } from '../../../../utils/dto/dto';
import { PaginationResponse } from '../../../../utils/pagination.response';
import { EmailTemplateEntity } from '../../../../entity/email-template.entity';

@ApiBearerAuth()
@ApiTags('email-template')
@Controller({ path: '/frontend/email-template', version: '1' })
export class EmailTemplateController {
  constructor(private readonly emailTemplateService: EmailTemplateService) {}

  @Post('/create')
  @HttpCode(201)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async create(
    @Body() body: CreateEmailTemplateDto,
    @User('id') user_id: number,
  ): Promise<SingleResponse<EmailTemplateEntity>> {
    return await this.emailTemplateService.create(user_id, body);
  }

  @Post('/findAll')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async findAll(
    @Body() query: EmailTemplateQueryDto,
    @User('id') user_id: number,
  ): Promise<PaginationResponse<EmailTemplateEntity[]>> {
    return this.emailTemplateService.findAll(user_id, query);
  }

  @Post('/update')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async update(
    @Body() body: UpdateEmailTemplateDto & { id: number },
    @User('id') user_id: number,
  ): Promise<SingleResponse<EmailTemplateEntity>> {
    return await this.emailTemplateService.update(user_id, body.id, body);
  }

  @Post('/delete')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async delete(
    @Body() param: ParamIdDto,
    @User('id') user_id: number,
  ): Promise<{ result: true }> {
    await this.emailTemplateService.remove(user_id, param.id);
    return { result: true };
  }

  @Post('upload-images')
  @UseInterceptors(FilesInterceptor('images', 10))
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
    @User('id') user_id: number,
  ) {
    return this.emailTemplateService.uploadTemplateImages(user_id, files);
  }

  @Get('default')
  async getDefaultTemplates() {
    return {
      success: true,
      data: await this.emailTemplateService.getDefaultTemplates(),
    };
  }

  @Post('create-from-default/:templateKey')
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async createFromDefault(
    @User('id') user_id: number,
    @Param('templateKey') templateKey: string,
  ) {
    const template = await this.emailTemplateService.createFromDefault(
      user_id,
      templateKey,
    );

    return {
      success: true,
      message: 'Template created from default successfully',
      data: template,
    };
  }

  @Post('preview')
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async previewTemplate(@Body() param: ParamIdDto) {
    const htmlContent = await this.emailTemplateService.previewTemplate(
      param.id,
    );
    return { success: true, data: { html_content: htmlContent } };
  }

  @Post('builder/save')
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async saveBuilderTemplate(
    @User('id') user_id: number,
    @Body() builderData: any,
  ) {
    return this.emailTemplateService.saveBuilderTemplate(user_id, builderData);
  }

  @Get('builder/templates')
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async getBuilderTemplates(@User('id') user_id: number) {
    return this.emailTemplateService.getBuilderTemplates(user_id);
  }
}
