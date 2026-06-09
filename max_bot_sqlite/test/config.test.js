import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const botDir = path.resolve(__dirname, '..');

test('config resolves relative catalog paths from bot directory and validates startup files', async () => {
  const catalogPath = path.join(botDir, 'test-catalog-config.db');
  const runtimePath = path.join(botDir, 'test-runtime-config.db');
  const rootPath = path.join(botDir, 'test-catalog-root-config');

  fs.rmSync(catalogPath, { force: true });
  fs.rmSync(runtimePath, { force: true });
  fs.rmSync(rootPath, { recursive: true, force: true });
  fs.writeFileSync(catalogPath, '');
  fs.mkdirSync(rootPath);

  const previous = {
    MAX_BOT_TOKEN: process.env.MAX_BOT_TOKEN,
    CATALOG_DB_PATH: process.env.CATALOG_DB_PATH,
    RUNTIME_DB_PATH: process.env.RUNTIME_DB_PATH,
    CATALOG_ROOT_PATH: process.env.CATALOG_ROOT_PATH,
  };

  process.env.MAX_BOT_TOKEN = 'test-token';
  process.env.CATALOG_DB_PATH = './test-catalog-config.db';
  process.env.RUNTIME_DB_PATH = './test-runtime-config.db';
  process.env.CATALOG_ROOT_PATH = './test-catalog-root-config';

  try {
    const moduleUrl = `../src/config.js?config_test=${Date.now()}_${Math.random()}`;
    const { config, validateConfigPaths } = await import(moduleUrl);

    assert.equal(config.dbPath, catalogPath);
    assert.equal(config.runtimeDbPath, runtimePath);
    assert.equal(config.rootPath, rootPath);
    assert.doesNotThrow(() => validateConfigPaths(config));

    fs.unlinkSync(catalogPath);
    assert.throws(
      () => validateConfigPaths(config),
      /CATALOG_DB_PATH does not exist[\s\S]*npm run build-db/
    );
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    fs.rmSync(catalogPath, { force: true });
    fs.rmSync(runtimePath, { force: true });
    fs.rmSync(rootPath, { recursive: true, force: true });
  }
});
