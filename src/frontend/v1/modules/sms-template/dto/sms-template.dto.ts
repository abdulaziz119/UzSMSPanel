import { PaginationParams } from '../../../../../utils/dto/dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TemplateStatusEnum } from '../../../../../utils/enum/sms-template.enum';

export class SmsTemplateFrontendFilterDto extends PaginationParams {
  @ApiPropertyOptional({
    example: 'Welcome',
    description: 'Shablon nomida qidiruv',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    enum: TemplateStatusEnum,
    description: 'Shablon holati boyicha filter',
    example: TemplateStatusEnum.ACTIVE,
  })
  @IsEnum(TemplateStatusEnum)
  @IsOptional()
  status?: TemplateStatusEnum;
}
