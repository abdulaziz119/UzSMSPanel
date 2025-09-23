import {
  IsNumber,
  IsString,
  IsNotEmpty,
  Length,
  IsEnum,
} from 'class-validator';
import { ContactTypeEnum } from '../../../../../utils/enum/contact.enum';

export class SendToContactDto {
  @IsString()
  @IsNotEmpty()
  @Length(7, 15)
  phone: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsNumber()
  @IsNotEmpty()
  user_id: number;

  @IsEnum(ContactTypeEnum)
  @IsNotEmpty()
  balance_type: ContactTypeEnum;
}

export class SendToGroupDto {
  @IsNumber()
  @IsNotEmpty()
  group_id: number;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsNumber()
  @IsNotEmpty()
  user_id: number;

  @IsEnum(ContactTypeEnum)
  @IsNotEmpty()
  balance_type: ContactTypeEnum;
}
