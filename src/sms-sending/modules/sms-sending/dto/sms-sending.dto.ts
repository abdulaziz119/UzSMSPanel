import { IsNumber, IsString, IsNotEmpty, Length } from 'class-validator';

export class SendToContactDto {
  @IsString()
  @IsNotEmpty()
  @Length(7, 15)
  phone: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}

export class SendToGroupDto {
  @IsNumber()
  @IsNotEmpty()
  group_id: number;

  @IsString()
  @IsNotEmpty()
  message: string;
}
