import { DataSource } from 'typeorm';
import { MODELS, UZ_SMS_PANEL } from '../constants/constants';
import { SmsCampaignEntity } from '../entity/sms-campaign.entity';

export const smsCampaignProviders = [
  {
    provide: MODELS.SMS_CAMPAIGN,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(SmsCampaignEntity),
    inject: [UZ_SMS_PANEL],
  },
];