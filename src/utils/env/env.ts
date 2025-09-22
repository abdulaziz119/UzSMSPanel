import * as dotenv from 'dotenv';

dotenv.config();
const DB_PORT = parseInt(process.env.DB_PORT || '5433', 10);
const DB_HOST = process.env.DB_HOST || '';
const DB_USER = process.env.DB_USERNAME || '';
const DB_DB = process.env.DB_DATABASE || '';
const DB_PASS = process.env.DB_PASSWORD || '';
const DB_SCHEMA = process.env.DB_SCHEMA || '';
const DB_SYNCHRONIZE =
  (process.env.DB_SYNCHRONIZE || 'false').toLowerCase() === 'true';

const REDIS_HOST = process.env.REDIS_HOST || '';
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || '';

const JWT_SECRET = process.env.JWT_SECRET || '';

const MY_GO_URL = process.env.MY_GO_URL || '';

const IMAGES_URL = process.env.IMAGES_URL || '';
const IMAGES_PROJECT_NAME = process.env.IMAGES_PROJECT_NAME || '';

const EXCEL_SERVICE_URL = process.env.EXCEL_SERVICE_URL || '';
const SMS_SENDING_URL = process.env.SMS_SENDING_URL || '';

const EXCEL_PORT = process.env.EXCEL_PORT || 3003;
const DASHBOARD_PORT = process.env.DASHBOARD_PORT || 8080;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 3000;
const SMS_SENDING_PORT = process.env.SMS_SENDING_PORT || 9000;

const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';

// SMPP konfiguratsiyasi
const SMPP_HOST = process.env.SMPP_HOST || '185.213.228.19';
const SMPP_PORT = parseInt(process.env.SMPP_PORT || '2775', 10);
const SMPP_SYSTEM_ID = process.env.SMPP_SYSTEM_ID || 'your_system_id';
const SMPP_PASSWORD = process.env.SMPP_PASSWORD || 'your_password';
const SMPP_SOURCE_ADDR = process.env.SMPP_SOURCE_ADDR || '6060';

if (!DB_SCHEMA || !DB_HOST || !DB_USER || !DB_DB || !DB_PASS) {
  throw new Error('Database environment variables are not set');
}

export {
  SMS_SENDING_URL,
  SMS_SENDING_PORT,
  EXCEL_PORT,
  EXCEL_SERVICE_URL,
  SMTP_USER,
  SMTP_PASS,
  IMAGES_PROJECT_NAME,
  IMAGES_URL,
  MY_GO_URL,
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD,
  DASHBOARD_PORT,
  DB_DB,
  DB_HOST,
  DB_PASS,
  DB_PORT,
  DB_SCHEMA,
  DB_SYNCHRONIZE,
  DB_USER,
  FRONTEND_PORT,
  JWT_SECRET,
  SMPP_HOST,
  SMPP_PORT,
  SMPP_SYSTEM_ID,
  SMPP_PASSWORD,
  SMPP_SOURCE_ADDR,
};
