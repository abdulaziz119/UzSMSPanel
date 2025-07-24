import { TariffStatusEnum } from '../enum/tariff.enum';

export interface CreateTariffDto {
  operator: string;
  price_per_sms: number;
  currency?: string;
  status?: TariffStatusEnum;
  description?: string;
  is_default?: boolean;
}

export interface UpdateTariffDto {
  operator?: string;
  price_per_sms?: number;
  currency?: string;
  status?: TariffStatusEnum;
  description?: string;
  is_default?: boolean;
}

export interface TariffFilters {
  operator?: string;
  min_price?: number;
  max_price?: number;
  currency?: string;
  status?: TariffStatusEnum;
  is_default?: boolean;
}
