import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectDir = path.resolve(siteDir, '..');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator < 0) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (!key || process.env[key] !== undefined) continue;
    process.env[key] = value;
  }
}

loadEnvFile(path.join(siteDir, '.env'));

function intEnv(name, fallback) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export const config = {
  host: process.env.SITE_HOST || '0.0.0.0',
  port: intEnv('SITE_PORT', 3200),
  title: process.env.SITE_TITLE || 'ЯМАЛ Бренд Каталог',
  catalogDbPath: path.resolve(process.env.SITE_CATALOG_DB_PATH || path.join(projectDir, 'max_catalog.db')),
  runtimeDbPath: path.resolve(
    process.env.SITE_RUNTIME_DB_PATH || path.join(projectDir, 'max_bot_runtime.db')
  ),
  rootPath: path.resolve(
    process.env.SITE_CATALOG_ROOT_PATH || path.join(projectDir, 'input', 'Макеты1')
  ),
  pageSize: intEnv('SITE_PAGE_SIZE', 18),
  favoritesLimit: intEnv('SITE_FAVORITES_LIMIT', 8),
  publicDir: path.join(siteDir, 'public'),
};
