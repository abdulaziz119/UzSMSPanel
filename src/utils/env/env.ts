import * as dotenv from 'dotenv';

dotenv.config();
const DB_PORT = parseInt(process.env.DB_PORT || '5433', 10);
const DB_HOST = process.env.DB_HOST || '';
const DB_USER = process.env.DB_USERNAME || '';
const DB_DB = process.env.DB_DATABASE || '';
const DB_PASS = process.env.DB_PASSWORD || '';
const DB_SCHEMA = process.env.DB_SCHEMA || '';

const MEDIA_DIRECTORY = process.env.MEDIA_DIRECTORY || '';
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || '';

const JWT_SECRET = process.env.JWT_SECRET || '';

const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';

// Port konfiguratsiyasi
const DASHBOARD_PORT = process.env.DASHBOARD_PORT || 8080;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 3000;

if (!DB_SCHEMA || !DB_HOST || !DB_USER || !DB_DB || !DB_PASS) {
  throw new Error('Database environment variables are not set');
}

export {
  MEDIA_DIRECTORY,
  SERVER_BASE_URL,
  SMTP_USER,
  SMTP_PASS,
  DASHBOARD_PORT,
  DB_DB,
  DB_HOST,
  DB_PASS,
  DB_PORT,
  DB_SCHEMA,
  DB_USER,
  FRONTEND_PORT,
  JWT_SECRET,
};
