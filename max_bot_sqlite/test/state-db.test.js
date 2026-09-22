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
  assert.equal(stats.total_users, 0);
  assert.equal(stats.total_interactions, 0);
  assert.equal(stats.total_searches, 3);
  assert.equal(stats.empty_searches, 1);
  assert.equal(stats.total_item_events, 3);
  assert.equal(stats.total_file_sends, 2);

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

test('runtime state tracks users and filters admin report by recent period', () => {
  const dbPath = makeTempDbPath();
  const state = new RuntimeStateDb(dbPath);
  const recent = new Date().toISOString();
  const old = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString();

  state.touchUser({ userKey: 'user:100', senderId: '100', chatId: 'chat-1', displayName: 'Admin' });
  state.touchUser({ userKey: 'user:200', senderId: '200', chatId: 'chat-2', displayName: 'Recent User' });
  state.touchUser({ userKey: 'user:200', senderId: '200', chatId: 'chat-2', displayName: 'Recent User' });
  state.db.prepare('UPDATE bot_users SET first_seen_utc = ?, last_seen_utc = ? WHERE user_key = ?').run(
    old,
    old,
    'user:100'
  );
  state.db.prepare('UPDATE bot_users SET first_seen_utc = ?, last_seen_utc = ? WHERE user_key = ?').run(
    recent,
    recent,
    'user:200'
  );

  state.db.prepare(
    `INSERT INTO search_events (query_text, query_norm, result_count, created_utc) VALUES (?, ?, ?, ?)`
  ).run('Логотип', 'логотип', 2, recent);
  state.db.prepare(
    `INSERT INTO search_events (query_text, query_norm, result_count, created_utc) VALUES (?, ?, ?, ?)`
  ).run('Брендбук', 'брендбук', 1, old);
  state.db.prepare(
    `INSERT INTO item_events (item_id, event_type, item_name_snapshot, relative_path_snapshot, created_utc)
     VALUES (?, ?, ?, ?, ?)`
  ).run('folder-recent', 'open_folder', 'Логотип', 'Логотип', recent);
  state.db.prepare(
    `INSERT INTO item_events (item_id, event_type, item_name_snapshot, relative_path_snapshot, created_utc)
     VALUES (?, ?, ?, ?, ?)`
  ).run('folder-old', 'open_folder', 'Брендбук', 'Брендбук', old);

  const stats = state.stats();
  assert.equal(stats.total_users, 2);
  assert.equal(stats.total_interactions, 3);
  assert.equal(stats.total_item_events, 2);
  assert.equal(stats.total_file_sends, 0);

  const weekly = state.getAdminReport({ days: 7, topLimit: 5 });
  assert.equal(weekly.users.total_users, 2);
  assert.equal(weekly.users.total_interactions, 3);
  assert.equal(weekly.users.new_users, 1);
  assert.equal(weekly.users.active_users, 1);
  assert.equal(weekly.stats.total_file_sends, 0);
  assert.equal(weekly.top_searches[0].query_norm, 'логотип');
  assert.equal(weekly.top_items[0].item_id, 'folder-recent');
  assert.equal(weekly.top_searches.some((row) => row.query_norm === 'брендбук'), false);

  state.close();
});

test('runtime state keeps favorites separate for each user', () => {
  const state = new RuntimeStateDb(makeTempDbPath());

  assert.equal(state.toggleFavorite('user:100', 'folder-1'), true);
  assert.equal(state.toggleFavorite('user:100', 'file-1'), true);
  assert.equal(state.toggleFavorite('user:200', 'folder-1'), true);
  assert.equal(state.isFavorite('user:100', 'folder-1'), true);
  assert.deepEqual(state.listFavorites('user:100'), ['file-1', 'folder-1']);
  assert.deepEqual(state.listFavorites('user:200'), ['folder-1']);

  assert.equal(state.toggleFavorite('user:100', 'folder-1'), false);
  assert.equal(state.isFavorite('user:100', 'folder-1'), false);
  assert.deepEqual(state.listFavorites('user:100'), ['file-1']);
  assert.deepEqual(state.listFavorites(''), []);

  state.close();
});
