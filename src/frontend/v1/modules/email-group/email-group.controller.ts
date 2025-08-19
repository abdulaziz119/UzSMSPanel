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
import { EmailGroupService } from '../../../../service/email-group.service';
import { CreateEmailGroupDto, UpdateEmailGroupDto, EmailGroupQueryDto } from '../../../../utils/dto/email-group.dto';
import { JwtAuthGuard } from '../../../../dashboard/v1/modules/auth/jwt.strategy';

@Controller('email-group')
@UseGuards(JwtAuthGuard)
export class EmailGroupController {
  constructor(private readonly emailGroupService: EmailGroupService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: any, @Body() createDto: CreateEmailGroupDto) {
    const userId = req.user.id;
    return this.emailGroupService.create(userId, createDto);
  }

  @Get()
  async findAll(@Req() req: any, @Query() query: EmailGroupQueryDto) {
    const userId = req.user.id;
    return this.emailGroupService.findAll(userId, query);
  }

  @Get('active')
  async getActiveGroups(@Req() req: any) {
    const userId = req.user.id;
    return this.emailGroupService.getActiveGroups(userId);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.id;
    return this.emailGroupService.findOne(userId, +id);
  }

  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() updateDto: UpdateEmailGroupDto) {
    const userId = req.user.id;
    return this.emailGroupService.update(userId, +id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.id;
    await this.emailGroupService.remove(userId, +id);
  }
}
