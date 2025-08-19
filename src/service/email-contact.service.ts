import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { EmailContactEntity } from '../entity/email-contact.entity';
import {
  CreateEmailContactDto,
  CreateBulkEmailContactDto,
  UpdateEmailContactDto,
  EmailContactQueryDto,
} from '../utils/dto/email-contact.dto';
import { PaginationBuilder } from '../utils/pagination.builder';
import { EmailGroupService } from './email-group.service';
import { MODELS } from '../constants/constants';

@Injectable()
export class EmailContactService {
  constructor(
    @Inject(MODELS.EMAIL_CONTACT)
    private emailContactRepository: Repository<EmailContactEntity>,
    private emailGroupService: EmailGroupService,
  ) {}

  async create(
    userId: number,
    createDto: CreateEmailContactDto,
  ): Promise<EmailContactEntity> {
    // Verify that group belongs to user
    await this.emailGroupService.findOne(userId, createDto.email_group_id);

    // Check if email already exists in this group
    const existingContact = await this.emailContactRepository.findOne({
      where: {
        email: createDto.email,
        email_group_id: createDto.email_group_id,
      },
    });

    if (existingContact) {
      throw new BadRequestException('Email already exists in this group');
    }

    const contact = this.emailContactRepository.create({
      ...createDto,
      user_id: userId,
    });

    const savedContact = await this.emailContactRepository.save(contact);

    // Update group contact count
    await this.emailGroupService.updateContactCount(createDto.email_group_id);

    return savedContact;
  }

  async createBulk(
    userId: number,
    createBulkDto: CreateBulkEmailContactDto,
  ): Promise<{ created: number; skipped: number; errors: string[] }> {
    const results = {
      created: 0,
      skipped: 0,
      errors: [],
    };

    for (const contactDto of createBulkDto.contacts) {
      try {
        await this.create(userId, contactDto);
        results.created++;
      } catch (error) {
        results.skipped++;
        results.errors.push(`${contactDto.email}: ${error.message}`);
      }
    }

    return results;
  }

  async findAll(userId: number, query: EmailContactQueryDto) {
    const queryBuilder = this.emailContactRepository
      .createQueryBuilder('contact')
      .leftJoinAndSelect('contact.emailGroup', 'group')
      .where('contact.user_id = :userId', { userId });

    if (query.email_group_id) {
      queryBuilder.andWhere('contact.email_group_id = :groupId', {
        groupId: query.email_group_id,
      });
    }

    if (query.is_active !== undefined) {
      queryBuilder.andWhere('contact.is_active = :isActive', {
        isActive: query.is_active,
      });
    }

    if (query.search) {
      queryBuilder.andWhere(
        '(contact.email ILIKE :search OR contact.first_name ILIKE :search OR contact.last_name ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    queryBuilder.orderBy('contact.created_at', 'DESC');

    const total = await queryBuilder.getCount();
    const data = await queryBuilder
      .limit(query.limit)
      .offset((query.page - 1) * query.limit)
      .getMany();

    return PaginationBuilder.build(data, query.page, query.limit, total);
  }

  async findOne(userId: number, id: number): Promise<EmailContactEntity> {
    const contact = await this.emailContactRepository.findOne({
      where: { id, user_id: userId },
      relations: ['emailGroup'],
    });

    if (!contact) {
      throw new NotFoundException('Email contact not found');
    }

    return contact;
  }

  async update(
    userId: number,
    id: number,
    updateDto: UpdateEmailContactDto,
  ): Promise<EmailContactEntity> {
    const contact = await this.findOne(userId, id);

    if (
      updateDto.email_group_id &&
      updateDto.email_group_id !== contact.email_group_id
    ) {
      // Verify new group belongs to user
      await this.emailGroupService.findOne(userId, updateDto.email_group_id);

      // Check if email already exists in new group
      const existingContact = await this.emailContactRepository.findOne({
        where: {
          email: updateDto.email || contact.email,
          email_group_id: updateDto.email_group_id,
        },
      });

      if (existingContact && existingContact.id !== contact.id) {
        throw new BadRequestException(
          'Email already exists in the target group',
        );
      }
    }

    const oldGroupId = contact.email_group_id;
    Object.assign(contact, updateDto);
    const savedContact = await this.emailContactRepository.save(contact);

    // Update contact counts for affected groups
    await this.emailGroupService.updateContactCount(contact.email_group_id);
    if (oldGroupId !== contact.email_group_id) {
      await this.emailGroupService.updateContactCount(oldGroupId);
    }

    return savedContact;
  }

  async remove(userId: number, id: number): Promise<void> {
    const contact = await this.findOne(userId, id);
    const groupId = contact.email_group_id;

    await this.emailContactRepository.remove(contact);

    // Update group contact count
    await this.emailGroupService.updateContactCount(groupId);
  }

  async getContactsByGroup(
    userId: number,
    groupId: number,
  ): Promise<EmailContactEntity[]> {
    // Verify group belongs to user
    await this.emailGroupService.findOne(userId, groupId);

    return this.emailContactRepository.find({
      where: {
        user_id: userId,
        email_group_id: groupId,
        is_active: true,
      },
      order: { email: 'ASC' },
    });
  }

  async updateEmailStats(contactId: number): Promise<void> {
    const contact = await this.emailContactRepository.findOne({
      where: { id: contactId },
    });

    if (contact) {
      contact.total_emails_sent += 1;
      contact.last_email_sent_at = new Date();
      await this.emailContactRepository.save(contact);
    }
  }

  async updateBounceCount(contactId: number): Promise<void> {
    const contact = await this.emailContactRepository.findOne({
      where: { id: contactId },
    });

    if (contact) {
      contact.bounced_count += 1;
      await this.emailContactRepository.save(contact);
    }
  }
}
