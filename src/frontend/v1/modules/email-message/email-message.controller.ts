import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Req,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { EmailMessageService } from '../../../../service/email-message.service';
import { SendEmailDto, EmailMessageQueryDto } from '../../../../utils/dto/email-message.dto';
import { JwtAuthGuard } from '../../../../dashboard/v1/modules/auth/jwt.strategy';

@Controller('email-message')
@UseGuards(JwtAuthGuard)
export class EmailMessageController {
  constructor(private readonly emailMessageService: EmailMessageService) {}

  @Post('send')
  @HttpCode(HttpStatus.CREATED)
  async sendEmail(@Req() req: any, @Body() sendDto: SendEmailDto) {
    const userId = req.user.id;
    return this.emailMessageService.sendEmail(userId, sendDto);
  }

  @Get()
  async findAll(@Req() req: any, @Query() query: EmailMessageQueryDto) {
    const userId = req.user.id;
    return this.emailMessageService.findAll(userId, query);
  }

  @Get('stats')
  async getEmailStats(@Req() req: any) {
    const userId = req.user.id;
    return this.emailMessageService.getEmailStats(userId);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.id;
    return this.emailMessageService.findOne(userId, +id);
  }

  @Patch(':id/retry')
  async retryFailedEmail(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.id;
    return this.emailMessageService.retryFailedEmail(userId, +id);
  }
}
