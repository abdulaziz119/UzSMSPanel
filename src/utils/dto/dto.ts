import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsOptional, IsString } from 'class-validator';

export class PaginationParams {
  @ApiProperty({ example: 1 })
  @IsDefined()
  page: number;
  @ApiProperty({ example: 10, examples: [10, 20, 30, 40, 50] })
  @IsDefined()
  limit: number;
}

export class ParamIdDto {
  @ApiProperty({ example: 1 })
  @IsDefined()
  id: number;
}

export class TextFieldDto {
  @IsOptional()
  @IsString()
  uz?: string;

  @IsOptional()
  @IsString()
  ru?: string;

  @IsOptional()
  @IsString()
  en?: string;
}

export interface SingleResponse<T> {
  result: T;
}
