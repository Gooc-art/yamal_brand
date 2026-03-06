import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const botDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectDir = path.resolve(botDir, '..');

function required(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value.trim();
}

function intEnv(name, fallback) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return n;
}

function parseAllowedIds(raw) {
  if (!raw || !raw.trim()) return new Set();
  return new Set(
    raw
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
  );
}

export const config = {
  token: required('MAX_BOT_TOKEN'),
  dbPath: path.resolve(process.env.CATALOG_DB_PATH || path.join(projectDir, 'max_catalog.db')),
  rootPath: path.resolve(process.env.CATALOG_ROOT_PATH || path.join(projectDir, 'input', 'Макеты1')),
  pageSize: intEnv('PAGE_SIZE', 8),
  maxSearchResults: intEnv('MAX_SEARCH_RESULTS', 20),
  allowedUserIds: parseAllowedIds(process.env.ALLOWED_USER_IDS || ''),
};
