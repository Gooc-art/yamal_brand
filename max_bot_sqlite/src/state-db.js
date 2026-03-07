import Database from 'better-sqlite3';
import { normalizeText } from './search.js';

function nowIso() {
  return new Date().toISOString();
}

export class RuntimeStateDb {
  constructor(dbPath) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = OFF');
    this.init();

    this.stmtInsertSearch = this.db.prepare(
      `INSERT INTO search_events (query_text, query_norm, result_count, created_utc)
       VALUES (?, ?, ?, ?)`
    );
    this.stmtInsertItemEvent = this.db.prepare(
      `INSERT INTO item_events (item_id, event_type, item_name_snapshot, relative_path_snapshot, created_utc)
       VALUES (?, ?, ?, ?, ?)`
    );
    this.stmtTopSearches = this.db.prepare(
      `SELECT query_norm,
              MIN(query_text) AS sample_query,
              COUNT(*) AS uses,
              SUM(CASE WHEN result_count = 0 THEN 1 ELSE 0 END) AS empty_uses,
              MAX(created_utc) AS last_used_utc
       FROM search_events
       WHERE query_norm <> ''
       GROUP BY query_norm
       ORDER BY uses DESC, last_used_utc DESC, query_norm ASC
       LIMIT ?`
    );
    this.stmtTopEmptySearches = this.db.prepare(
      `SELECT query_norm,
              MIN(query_text) AS sample_query,
              COUNT(*) AS uses,
              MAX(created_utc) AS last_used_utc
       FROM search_events
       WHERE query_norm <> ''
         AND result_count = 0
       GROUP BY query_norm
       ORDER BY uses DESC, last_used_utc DESC, query_norm ASC
       LIMIT ?`
    );
    this.stmtTopItems = this.db.prepare(
      `SELECT item_id,
              COUNT(*) AS uses,
              SUM(CASE WHEN event_type = 'open_folder' THEN 1 ELSE 0 END) AS folder_opens,
              SUM(CASE WHEN event_type = 'send_file' THEN 1 ELSE 0 END) AS file_sends,
              MAX(item_name_snapshot) AS item_name_snapshot,
              MAX(relative_path_snapshot) AS relative_path_snapshot,
              MAX(created_utc) AS last_used_utc
       FROM item_events
       WHERE item_id <> ''
       GROUP BY item_id
       ORDER BY uses DESC, last_used_utc DESC, item_id ASC
       LIMIT ?`
    );
    this.stmtStats = this.db.prepare(
      `SELECT
         (SELECT COUNT(*) FROM search_events) AS total_searches,
         (SELECT COUNT(*) FROM search_events WHERE result_count = 0) AS empty_searches,
         (SELECT COUNT(*) FROM item_events) AS total_item_events`
    );
  }

  init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS search_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        query_text TEXT NOT NULL,
        query_norm TEXT NOT NULL,
        result_count INTEGER NOT NULL DEFAULT 0,
        created_utc TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_search_events_query_norm
        ON search_events (query_norm);
      CREATE INDEX IF NOT EXISTS idx_search_events_created
        ON search_events (created_utc);

      CREATE TABLE IF NOT EXISTS item_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        item_name_snapshot TEXT NOT NULL DEFAULT '',
        relative_path_snapshot TEXT NOT NULL DEFAULT '',
        created_utc TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_item_events_item_id
        ON item_events (item_id);
      CREATE INDEX IF NOT EXISTS idx_item_events_created
        ON item_events (created_utc);
    `);
  }

  close() {
    this.db.close();
  }

  logSearch(queryText, resultCount) {
    const query = String(queryText || '').trim();
    if (!query) return;
    this.stmtInsertSearch.run(query, normalizeText(query), Number(resultCount) || 0, nowIso());
  }

  trackItemEvent(item, eventType) {
    const itemId = String(item?.id || '').trim();
    const event = String(eventType || '').trim();
    if (!itemId || !event) return;

    this.stmtInsertItemEvent.run(
      itemId,
      event,
      String(item?.name || '').trim(),
      String(item?.relative_path || '').trim(),
      nowIso()
    );
  }

  getTopSearches(limit = 10) {
    return this.stmtTopSearches.all(limit);
  }

  getTopEmptySearches(limit = 10) {
    return this.stmtTopEmptySearches.all(limit);
  }

  getTopItems(limit = 8) {
    return this.stmtTopItems.all(limit);
  }

  stats() {
    return this.stmtStats.get();
  }
}
