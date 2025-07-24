export interface CreateTransactionDto {
  amount: number;
  payment_method: string;
  user_id: number;
}

export interface UpdateTransactionDto {
  amount?: number;
  payment_method?: string;
  status?: 'pending' | 'completed' | 'failed';
}

export interface TransactionFilters {
  status?: 'pending' | 'completed' | 'failed';
  user_id?: number;
  payment_method?: string;
  min_amount?: number;
  max_amount?: number;
  date_from?: Date;
  date_to?: Date;
}
