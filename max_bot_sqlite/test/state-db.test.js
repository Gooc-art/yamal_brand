import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { RuntimeStateDb } from '../src/state-db.js';

function makeTempDbPath() {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'yamal-state-')), 'runtime.db');
}

test('runtime state stores search analytics and top items', () => {
  const dbPath = makeTempDbPath();
  const state = new RuntimeStateDb(dbPath);

  state.logSearch('Логотип', 3);
  state.logSearch('логотип', 1);
  state.logSearch('Сувенирка', 0);
  state.trackItemEvent({ id: 'file1', name: 'Брендбук.pdf', relative_path: 'Брендбук/Брендбук.pdf' }, 'send_file');
  state.trackItemEvent({ id: 'file1', name: 'Брендбук.pdf', relative_path: 'Брендбук/Брендбук.pdf' }, 'send_file');
  state.trackItemEvent({ id: 'folder1', name: 'Логотип', relative_path: 'Логотип' }, 'open_folder');

  const stats = state.stats();
  assert.equal(stats.total_searches, 3);
  assert.equal(stats.empty_searches, 1);
  assert.equal(stats.total_item_events, 3);

  const topSearches = state.getTopSearches(5);
  assert.equal(topSearches[0].query_norm, 'логотип');
  assert.equal(topSearches[0].uses, 2);

  const topEmpty = state.getTopEmptySearches(5);
  assert.equal(topEmpty[0].query_norm, 'сувенирка');
  assert.equal(topEmpty[0].uses, 1);

  const topItems = state.getTopItems(5);
  assert.equal(topItems[0].item_id, 'file1');
  assert.equal(topItems[0].uses, 2);
  assert.equal(topItems[0].file_sends, 2);

  state.close();
});
