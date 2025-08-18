import * as dotenv from 'dotenv';

dotenv.config();
const DB_PORT = parseInt(process.env.DB_PORT || '5433', 10);
const DB_HOST = process.env.DB_HOST || '';
const DB_USER = process.env.DB_USERNAME || '';
const DB_DB = process.env.DB_DATABASE || '';
const DB_PASS = process.env.DB_PASSWORD || '';
const DB_SCHEMA = process.env.DB_SCHEMA || '';
const DB_SYNCHRONIZE = (process.env.DB_SYNCHRONIZE || 'false').toLowerCase() === 'true';

const REDIS_HOST = process.env.REDIS_HOST || '';
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || '';

const MEDIA_DIRECTORY = process.env.MEDIA_DIRECTORY || '';
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || '';

const JWT_SECRET = process.env.JWT_SECRET || '';

// Port konfiguratsiyasi
const DASHBOARD_PORT = process.env.DASHBOARD_PORT || 8080;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 3000;

if (!DB_SCHEMA || !DB_HOST || !DB_USER || !DB_DB || !DB_PASS) {
  throw new Error('Database environment variables are not set');
}

export {
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD,
  MEDIA_DIRECTORY,
  SERVER_BASE_URL,
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
};
