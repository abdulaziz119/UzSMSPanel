import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiBadRequestResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { SingleResponse } from '../../../../utils/dto/dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import { ContactEntity } from '../../../../entity/contact.entity';
import { User } from '../auth/decorators/user.decorator';
import { ContactService } from '../../../../service/contact.service';
import {
  CreateIndividualContactDto,
  CreateCompanyContactDto,
} from '../../../../utils/dto/contact.dto';

@ApiBearerAuth()
@ApiTags('contact')
@Controller({ path: '/frontend/contact', version: '1' })
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post('/create/individual')
  @HttpCode(201)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async createIndividual(
    @Body() body: CreateIndividualContactDto,
    @User('id') user_id: number,
  ): Promise<
    SingleResponse<{
      id: number;
      first_name: string;
      last_name: string;
      middle_name: string;
    }>
  > {
    return await this.contactService.createIndividual(body, user_id);
  }

  @Post('/create/company')
  @HttpCode(201)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async createCompany(
    @Body() body: CreateCompanyContactDto,
    @User('id') user_id: number,
  ): Promise<SingleResponse<ContactEntity>> {
    return await this.contactService.createCompany(body, user_id);
  }
}
