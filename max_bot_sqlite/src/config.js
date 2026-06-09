import path from 'node:path';
import fs from 'node:fs';
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

function resolvePathEnv(name, fallback) {
  const raw = process.env[name];
  if (!raw || !raw.trim()) return path.resolve(fallback);
  const value = raw.trim();
  return path.isAbsolute(value) ? path.resolve(value) : path.resolve(botDir, value);
}

export const config = {
  token: required('MAX_BOT_TOKEN'),
  dbPath: resolvePathEnv('CATALOG_DB_PATH', path.join(projectDir, 'max_catalog.db')),
  runtimeDbPath: resolvePathEnv('RUNTIME_DB_PATH', path.join(projectDir, 'max_bot_runtime.db')),
  rootPath: resolvePathEnv('CATALOG_ROOT_PATH', path.join(projectDir, 'input', 'Макеты1')),
  pageSize: intEnv('PAGE_SIZE', 8),
  maxSearchResults: intEnv('MAX_SEARCH_RESULTS', 20),
  favoritesLimit: intEnv('FAVORITES_LIMIT', 8),
  allowedUserIds: parseAllowedIds(process.env.ALLOWED_USER_IDS || ''),
  adminUserIds: parseAllowedIds(
    process.env.ADMIN_USER_IDS || process.env.ALLOWED_USER_IDS || ''
  ),
};

export function validateConfigPaths(value = config) {
  if (!fs.existsSync(value.dbPath)) {
    throw new Error(
      [
        `[config] CATALOG_DB_PATH does not exist: ${value.dbPath}`,
        'Build it with: npm run build-db',
      ].join('\n')
    );
  }

  if (!fs.statSync(value.dbPath).isFile()) {
    throw new Error(`[config] CATALOG_DB_PATH is not a file: ${value.dbPath}`);
  }

  const runtimeDir = path.dirname(value.runtimeDbPath);
  if (!fs.existsSync(runtimeDir)) {
    throw new Error(`[config] RUNTIME_DB_PATH directory does not exist: ${runtimeDir}`);
  }

  if (!fs.existsSync(value.rootPath)) {
    throw new Error(`[config] CATALOG_ROOT_PATH does not exist: ${value.rootPath}`);
  }

  if (!fs.statSync(value.rootPath).isDirectory()) {
    throw new Error(`[config] CATALOG_ROOT_PATH is not a directory: ${value.rootPath}`);
  }
}
