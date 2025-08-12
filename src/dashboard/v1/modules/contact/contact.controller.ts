import {
  Body,
  Controller,
  HttpCode,
  Post,
  Get,
  Query,
  Param,
  Delete,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiBadRequestResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import {
  SingleResponse,
  PaginationParams,
  ParamIdDto,
} from '../../../../utils/dto/dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import { ContactEntity } from '../../../../entity/contact.entity';
import { User } from '../auth/decorators/user.decorator';
import { ContactService } from '../../../../service/contact.service';
import {
  CreateContactDto,
  CreateIndividualContactDto,
  CreateCompanyContactDto,
} from '../../../../utils/dto/contact.dto';
import { PaginationResponse } from '../../../../utils/pagination.response';

@ApiBearerAuth()
@ApiTags('dashboard-contact')
@Controller({ path: '/dashboard/contact', version: '1' })
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post('/create/individual')
  @HttpCode(201)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @ApiOperation({ summary: 'Create individual contact' })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth(false)
  async createIndividual(
    @Body() body: CreateIndividualContactDto,
    @User('id') user_id: number,
  ): Promise<SingleResponse<ContactEntity>> {
    return await this.contactService.createIndividual(body, user_id);
  }

  @Post('/create/company')
  @HttpCode(201)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @ApiOperation({ summary: 'Create company contact' })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth(false)
  async createCompany(
    @Body() body: CreateCompanyContactDto,
    @User('id') user_id: number,
  ): Promise<SingleResponse<ContactEntity>> {
    return await this.contactService.createCompany(body, user_id);
  }

  @Get()
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @ApiOperation({ summary: 'Get all contacts' })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth(false)
  async findAll(
    @Query() query: PaginationParams,
  ): Promise<PaginationResponse<ContactEntity[]>> {
    return await this.contactService.findAll(query);
  }

  @Get('/:id')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @ApiOperation({ summary: 'Get contact by ID' })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth(false)
  async findOne(
    @Param() param: ParamIdDto,
  ): Promise<SingleResponse<ContactEntity>> {
    return await this.contactService.findOne(param);
  }

  @Delete('/:id')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @ApiOperation({ summary: 'Delete contact by ID' })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth(false)
  async delete(@Param() param: ParamIdDto): Promise<{ result: true }> {
    return await this.contactService.delete(param);
  }
}
