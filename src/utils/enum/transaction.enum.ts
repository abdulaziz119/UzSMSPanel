export enum TransactionTypeEnum {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  SMS_PAYMENT = 'sms_payment',
  REFUND = 'refund',
  BONUS = 'bonus',
  PENALTY = 'penalty',
}

export enum TransactionStatusEnum {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum PaymentMethodEnum {
  CLICK = 'click',
  PAYME = 'payme',
  UZCARD = 'uzcard',
  HUMO = 'humo',
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
  SYSTEM = 'system',
}
