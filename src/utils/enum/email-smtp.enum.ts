export enum SmtpStatusEnum {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked',
  PENDING = 'pending',
  REJECTED = 'rejected',
}

export enum EmailStatusEnum {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  DELIVERED = 'delivered',
  BOUNCED = 'bounced',
  OPENED = 'opened',
  CLICKED = 'clicked',
}

export enum EmailTemplateStatusEnum {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  REJECTED = 'rejected',
}

export enum EmailGroupStatusEnum {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum EmailTemplateTypeEnum {
  CUSTOM = 'custom',
  NEWSLETTER = 'newsletter',
  PROMOTIONAL = 'promotional',
  TRANSACTIONAL = 'transactional',
  WELCOME = 'welcome',
  RESET_PASSWORD = 'reset_password',
  ORDER_CONFIRMATION = 'order_confirmation',
  MARKETING = 'marketing',
}
