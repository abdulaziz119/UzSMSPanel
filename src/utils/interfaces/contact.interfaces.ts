export interface CommonData {
  id: number | null;
  first_name: string | null;
  first_name_en: string | null;
  middle_name: string | null;
  last_name: string | null;
  last_name_en: string | null;
  pinfl: string | null;
  inn: string | null;
  gender: string | null;
  birth_place: string | null;
  birth_country: string | null;
  birth_country_id: string | null;
  birth_country_id_cbu: string | null;
  birth_date: string | null;
  nationality: string | null;
  nationality_id: string | null;
  nationality_id_cbu: string | null;
  citizenship: string | null;
  citizenship_id: string | null;
  citizenship_id_cbu: string | null;
  doc_type: string | null;
  doc_type_id: string | null;
  doc_type_id_cbu: string | null;
  sdk_hash: string | null;
  last_update_pass_data: string | null;
  last_update_inn: string | null;
  last_update_address: string | null;
  created_at: string | null;
  profile_id: number | null;
}

export interface DocData {
  id: number | null;
  pass_data: string | null;
  issued_by: string | null;
  issued_by_id: string | null;
  issued_date: string | null;
  expiry_date: string | null;
  doc_type: string | null;
  doc_type_id: string | null;
  doc_type_id_cbu: string | null;
  created_at: string | null;
  profile_id: number | null;
}

export interface Contacts {
  id: number | null;
  phone: string | null;
  email: string | null;
  created_at: string | null;
  profile_id: number | null;
}

export interface Address {
  id: number | null;
  region: string | null;
  address: string | null;
  country: string | null;
  cadastre: string | null;
  district: string | null;
  region_id: string | null;
  country_id: string | null;
  district_id: string | null;
  region_id_cbu: string | null;
  country_id_cbu: string | null;
  district_id_cbu: string | null;
  registration_date: string | null;
  date_from: string | null;
  date_till: string | null;
  type: string | null;
  created_at: string | null;
  profile_id: number | null;
}
