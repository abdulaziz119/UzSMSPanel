import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ContactEntity } from '../entity/contact.entity';
import { ContactStatusEnum } from '../utils/enum/contact.enum';

@Injectable()
export class BillingService {
  async deductContactBalanceTransactional(
    em: EntityManager,
    user_id: number,
    contactType: string,
    amount: number,
  ): Promise<void> {
    const balanceField =
      contactType === 'individual' ? 'individual_balance' : 'company_balance';

    const deductRes = await em
      .createQueryBuilder()
      .update(ContactEntity)
      .set({ [balanceField]: () => `${balanceField} - :amount` })
      .where('user_id = :user_id')
      .andWhere('type = :type')
      .andWhere('status = :status')
      .andWhere(`${balanceField} >= :amount`)
      .setParameters({
        user_id,
        type: contactType,
        status: ContactStatusEnum.ACTIVE,
        amount,
      })
      .returning('*')
      .execute();

    if (!deductRes || deductRes.affected === 0) {
      throw new HttpException(
        'Insufficient contact balance',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
