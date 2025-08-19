import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { SenderPriceService } from '../../../../service/sender-price.service';
import {
  CreateSenderPriceDto,
  UpdateSenderPriceDto,
  SenderPriceFilterDto,
} from '../../../../utils/dto/sender-price.dto';
import { SingleResponse, ParamIdDto } from '../../../../utils/dto/dto';
import { PaginationResponse } from '../../../../utils/pagination.response';
import { SenderPriceEntity } from '../../../../entity/sender-price.entity';

@ApiBearerAuth()
@ApiTags('sender-price')
@Controller({ path: '/dashboard/sender-price', version: '1' })
export class SenderPriceController {
  constructor(private readonly senderPriceService: SenderPriceService) {}

  @Post('/create')
  @HttpCode(201)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @ApiOperation({ summary: 'Yangi sender price yaratish' })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth(false)
  async create(
    @Body() body: CreateSenderPriceDto,
  ): Promise<SingleResponse<SenderPriceEntity>> {
    return await this.senderPriceService.create(body);
  }

  @Post('/findAll')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @ApiOperation({ summary: 'Barcha sender price\'larni olish' })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth(false)
  async findAll(
    @Body() query: SenderPriceFilterDto,
  ): Promise<PaginationResponse<SenderPriceEntity[]>> {
    return await this.senderPriceService.findAll(query);
  }

  @Get('/findOne/:id')
  @ApiNotFoundResponse({ type: ErrorResourceDto })
  @ApiOperation({ summary: 'ID boyicha sender price olish' })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth(false)
  async findOne(
    @Param() params: ParamIdDto,
  ): Promise<SingleResponse<SenderPriceEntity>> {
    return await this.senderPriceService.findOne(params);
  }

  @Put('/update')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @ApiNotFoundResponse({ type: ErrorResourceDto })
  @ApiOperation({ summary: 'Sender price yangilash' })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth(false)
  async update(
    @Body() body: UpdateSenderPriceDto,
  ): Promise<SingleResponse<SenderPriceEntity>> {
    return await this.senderPriceService.update(body);
  }

  @Delete('/delete/:id')
  @ApiNotFoundResponse({ type: ErrorResourceDto })
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @ApiOperation({ summary: 'Sender price o\'chirish' })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth(false)
  async delete(@Param() params: ParamIdDto): Promise<SingleResponse<boolean>> {
    return await this.senderPriceService.delete(params);
  }

  @Get('/active')
  @ApiOperation({ summary: 'Faol sender price\'larni olish (dropdown uchun)' })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.CLIENT)
  @Auth(false)
  async getActivePrices(): Promise<SingleResponse<SenderPriceEntity[]>> {
    return await this.senderPriceService.getActivePrices();
  }
}
