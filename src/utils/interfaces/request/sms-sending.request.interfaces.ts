export interface ValidateBeforeQueueGroupResponse {
  contact_count: number;
  valid_contact_count: number;
  invalid_contact_count: number;
}

export interface SendToContactJobResult {
  success: boolean;
  messageId?: number;
  error?: string;
  phone?: string;
  cost?: number;
  operator?: string;
}

export interface SendToGroupJobResult {
  success: boolean;
  messageCount?: number;
  error?: string;
  group_id?: number;
  total_cost?: number;
  processed_contacts?: number;
  failed_contacts?: number;
  contact_details?: Array<{
    phone: string;
    success: boolean;
    error?: string;
    message_id?: number;
    cost?: number;
    operator?: string;
  }>;
}

export interface BulkSendJobResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: Array<{ phone: string; error: string }>;
  total_cost?: number;
  processing_time?: number;
  summary?: {
    total_contacts: number;
    successful_sends: number;
    failed_sends: number;
    total_cost: number;
  };
}

export interface SendGroupResponse {
  jobId: string;
  message: string;
  contact_count: number;
  valid_contact_count: number;
  invalid_contact_count: number;
}

export interface SendContactResponse {
  jobId: string;
  message: string;
}
