export interface SmppConfig {
  host: string;
  port: number;
  system_id: string;
  password: string;
}

export interface SmppMessageParams {
  source_addr_ton: number;
  source_addr_npi: number;
  source_addr: string;
  dest_addr_ton: number;
  dest_addr_npi: number;
  destination_addr: string;
  short_message: string;
  service_type?: string;
  registered_delivery?: number;
  data_coding?: number;
}
