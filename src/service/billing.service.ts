import { Injectable, BadRequestException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { UserEntity } from '../entity/user.entity';
import { ContactEntity } from '../entity/contact.entity';
import { ContactStatusEnum } from '../utils/enum/contact.enum';

@Injectable()
export class BillingService {
  /**
   * Perform an atomic balance deduction inside an existing transaction
   * using the provided EntityManager. Throws BadRequestException when
   * the user has insufficient balance.
   */
  async deductBalanceTransactional(
    em: EntityManager,
    user_id: number,
    amount: number,
  ): Promise<void> {
    const deductRes = await em
      .createQueryBuilder()
      .update(UserEntity)
      .set({ balance: () => 'balance - :amount' })
      .where('id = :id')
      .andWhere('balance >= :amount')
      .setParameters({ id: user_id, amount })
      .returning('*')
      .execute();

    if (!deductRes || deductRes.affected === 0) {
      throw new BadRequestException('Insufficient balance');
    }
  }

  /**
   * Deduct amount from an active Contact (contacts table) belonging to user_id
   * and matching the provided contact type. Throws when no contact has
   * sufficient balance.
   */
  async deductContactBalanceTransactional(
    em: EntityManager,
    user_id: number,
    contactType: string,
    amount: number,
  ): Promise<void> {
    const deductRes = await em
      .createQueryBuilder()
      .update(ContactEntity)
      .set({ balance: () => 'balance - :amount' })
      .where('user_id = :user_id')
      .andWhere('type = :type')
      .andWhere('status = :status')
      .andWhere('balance >= :amount')
      .setParameters({ user_id, type: contactType, status: ContactStatusEnum.ACTIVE, amount })
      .returning('*')
      .execute();

    if (!deductRes || deductRes.affected === 0) {
      throw new BadRequestException('Insufficient contact balance');
    }
  }
}
