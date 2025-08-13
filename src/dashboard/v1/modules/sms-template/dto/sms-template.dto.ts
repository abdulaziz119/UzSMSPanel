import { PaginationParams } from '../../../../../utils/dto/dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { TemplateStatusEnum } from '../../../../../utils/enum/sms-template.enum';

export class SmsTemplateDashboardFilterDto extends PaginationParams {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  user_id?: number;

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
