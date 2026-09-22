import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { CatalogDb } from '../src/db.js';

function makeTempCatalogDb() {
  const dbPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'yamal-catalog-')), 'catalog.db');
  const db = new Database(dbPath);
  db.exec(`
    CREATE TABLE assets (
      id TEXT PRIMARY KEY,
      parent_id TEXT NOT NULL DEFAULT '',
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      relative_path TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
  `);
  db.prepare(
    `INSERT INTO assets (id, parent_id, type, name, relative_path, is_active, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run('folder1', 'root', 'folder', 'Папка', 'Папка', 1, 1);
  db.prepare(
    `INSERT INTO assets (id, parent_id, type, name, relative_path, is_active, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run('file1', 'root', 'file', 'Preview.png', 'Папка/Preview.png', 1, 2);
  db.prepare(
    `INSERT INTO assets (id, parent_id, type, name, relative_path, is_active, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run('file2', 'root', 'file', 'Source.pdf', 'Папка/Source.pdf', 1, 3);
  db.prepare(
    `INSERT INTO assets (id, parent_id, type, name, relative_path, is_active, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run('nested', 'folder1', 'file', 'Nested.svg', 'Папка/Nested.svg', 1, 1);
  db.prepare(
    `INSERT INTO assets (id, parent_id, type, name, relative_path, is_active, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run('hidden', 'root', 'folder', '04 Паттерны и элементы (каркас)', '02 Ямал-100/04 Паттерны и элементы (каркас)', 1, 4);
  db.close();
  return dbPath;
}

test('catalog db can list all active children without pagination', () => {
  const catalog = new CatalogDb(makeTempCatalogDb());

  const firstPage = catalog.listChildren('root', 1, 0);
  const allChildren = catalog.listAllChildren('root');

  assert.equal(firstPage.length, 1);
  assert.deepEqual(
    allChildren.map((item) => item.id),
    ['folder1', 'file1', 'file2']
  );

  catalog.close();
});

test('catalog hides the removed Yamal-100 patterns branch and lists descendant files', () => {
  const catalog = new CatalogDb(makeTempCatalogDb());
  assert.equal(catalog.getById('hidden'), null);
  assert.deepEqual(catalog.listDescendantFiles('folder1').map((item) => item.id), ['nested']);
  catalog.close();
});
