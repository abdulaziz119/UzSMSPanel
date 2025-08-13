import { PaginationParams } from '../../../../../utils/dto/dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { TemplateStatusEnum } from '../../../../../utils/enum/sms-template.enum';

export class SmsTemplateFrontendFilterDto extends PaginationParams {
  @ApiProperty({
    example: 'ACTIVE',
    enum: TemplateStatusEnum,
    description: 'Filter by sms template status',
    required: false,
  })
  @IsOptional()
  @IsEnum(TemplateStatusEnum)
  status?: TemplateStatusEnum;
}
