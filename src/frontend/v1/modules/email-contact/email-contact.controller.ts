import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { EmailContactService } from '../../../../service/email-contact.service';
import { CreateEmailContactDto, CreateBulkEmailContactDto, UpdateEmailContactDto, EmailContactQueryDto } from '../../../../utils/dto/email-contact.dto';
import { JwtAuthGuard } from '../../../../dashboard/v1/modules/auth/jwt.strategy';

@Controller('email-contact')
@UseGuards(JwtAuthGuard)
export class EmailContactController {
  constructor(private readonly emailContactService: EmailContactService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: any, @Body() createDto: CreateEmailContactDto) {
    const userId = req.user.id;
    return this.emailContactService.create(userId, createDto);
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  async createBulk(@Req() req: any, @Body() createBulkDto: CreateBulkEmailContactDto) {
    const userId = req.user.id;
    return this.emailContactService.createBulk(userId, createBulkDto);
  }

  @Get()
  async findAll(@Req() req: any, @Query() query: EmailContactQueryDto) {
    const userId = req.user.id;
    return this.emailContactService.findAll(userId, query);
  }

  @Get('group/:groupId')
  async getContactsByGroup(@Req() req: any, @Param('groupId') groupId: string) {
    const userId = req.user.id;
    return this.emailContactService.getContactsByGroup(userId, +groupId);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.id;
    return this.emailContactService.findOne(userId, +id);
  }

  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() updateDto: UpdateEmailContactDto) {
    const userId = req.user.id;
    return this.emailContactService.update(userId, +id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.id;
    await this.emailContactService.remove(userId, +id);
  }
}
