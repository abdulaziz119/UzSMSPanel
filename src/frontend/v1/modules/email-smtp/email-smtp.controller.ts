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
import { EmailSmtpService } from '../../../../service/email-smtp.service';
import { CreateEmailSmtpDto, UpdateEmailSmtpDto, EmailSmtpQueryDto } from '../../../../utils/dto/email-smtp.dto';
import { JwtAuthGuard } from '../../../../dashboard/v1/modules/auth/jwt.strategy';

@Controller('email-smtp')
@UseGuards(JwtAuthGuard)
export class EmailSmtpController {
  constructor(private readonly emailSmtpService: EmailSmtpService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: any, @Body() createDto: CreateEmailSmtpDto) {
    const userId = req.user.id;
    return this.emailSmtpService.create(userId, createDto);
  }

  @Get()
  async findAll(@Req() req: any, @Query() query: EmailSmtpQueryDto) {
    const userId = req.user.id;
    return this.emailSmtpService.findAll(userId, query);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.id;
    return this.emailSmtpService.findOne(userId, +id);
  }

  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() updateDto: UpdateEmailSmtpDto) {
    const userId = req.user.id;
    return this.emailSmtpService.update(userId, +id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.id;
    await this.emailSmtpService.remove(userId, +id);
  }

  @Post(':id/test')
  async testConnection(@Req() req: any, @Param('id') id: string) {
    const result = await this.emailSmtpService.testConnection(+id);
    return { success: result, message: 'SMTP connection successful' };
  }

  @Get('active/list')
  async getActiveSmtp(@Req() req: any) {
    const userId = req.user.id;
    return this.emailSmtpService.getActiveSmtp(userId);
  }
}
