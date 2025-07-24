export interface CreateMessageTemplateDto {
  template_name: string;
  template_text: string;
  user_id: number;
}

export interface UpdateMessageTemplateDto {
  template_name?: string;
  template_text?: string;
  is_approved?: boolean;
}

export interface MessageTemplateFilters {
  is_approved?: boolean;
  user_id?: number;
  search?: string;
}
