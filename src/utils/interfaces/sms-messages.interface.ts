export interface CreateSmsMessageDto {
  recipient_phone: string;
  message_text: string;
  user_id: number;
  tariff_ids?: number[];
}

export interface UpdateSmsMessageDto {
  recipient_phone?: string;
  message_text?: string;
  status?: 'pending' | 'sent' | 'failed';
  sent_at?: Date;
}

export interface SmsMessageFilters {
  status?: 'pending' | 'sent' | 'failed';
  user_id?: number;
  recipient_phone?: string;
  date_from?: Date;
  date_to?: Date;
}
