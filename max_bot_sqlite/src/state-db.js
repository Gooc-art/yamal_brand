import Database from 'better-sqlite3';
import { normalizeText } from './search.js';

function nowIso() {
  return new Date().toISOString();
}

function periodSinceIso(days) {
  const value = Number(days);
  if (!Number.isFinite(value) || value <= 0) return '';
  return new Date(Date.now() - value * 24 * 60 * 60 * 1000).toISOString();
}

export class RuntimeStateDb {
  constructor(dbPath) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = OFF');
    this.init();

    this.stmtTouchUser = this.db.prepare(
      `INSERT INTO bot_users (
         user_key,
         sender_id,
         chat_id,
         display_name,
         first_seen_utc,
         last_seen_utc,
         interaction_count
       )
       VALUES (?, ?, ?, ?, ?, ?, 1)
       ON CONFLICT(user_key) DO UPDATE SET
         sender_id = CASE
           WHEN excluded.sender_id <> '' THEN excluded.sender_id
           ELSE bot_users.sender_id
         END,
         chat_id = CASE
           WHEN excluded.chat_id <> '' THEN excluded.chat_id
           ELSE bot_users.chat_id
         END,
         display_name = CASE
           WHEN excluded.display_name <> '' THEN excluded.display_name
           ELSE bot_users.display_name
         END,
         last_seen_utc = excluded.last_seen_utc,
         interaction_count = bot_users.interaction_count + 1`
    );
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
         (SELECT COUNT(*) FROM bot_users) AS total_users,
         (SELECT COALESCE(SUM(interaction_count), 0) FROM bot_users) AS total_interactions,
         (SELECT COUNT(*) FROM search_events) AS total_searches,
         (SELECT COUNT(*) FROM search_events WHERE result_count = 0) AS empty_searches,
         (SELECT COUNT(*) FROM item_events) AS total_item_events`
    );
  }

  init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS bot_users (
        user_key TEXT PRIMARY KEY,
        sender_id TEXT NOT NULL DEFAULT '',
        chat_id TEXT NOT NULL DEFAULT '',
        display_name TEXT NOT NULL DEFAULT '',
        first_seen_utc TEXT NOT NULL,
        last_seen_utc TEXT NOT NULL,
        interaction_count INTEGER NOT NULL DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_bot_users_first_seen
        ON bot_users (first_seen_utc);
      CREATE INDEX IF NOT EXISTS idx_bot_users_last_seen
        ON bot_users (last_seen_utc);

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

  touchUser(user) {
    const userKey = String(user?.userKey || '').trim();
    if (!userKey) return;
    const now = nowIso();
    this.stmtTouchUser.run(
      userKey,
      String(user?.senderId || '').trim(),
      String(user?.chatId || '').trim(),
      String(user?.displayName || '').trim(),
      now,
      now
    );
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
    return this.queryTopSearches(limit);
  }

  getTopEmptySearches(limit = 10) {
    return this.queryTopEmptySearches(limit);
  }

  getTopItems(limit = 8) {
    return this.queryTopItems(limit);
  }

  queryTopSearches(limit = 10, sinceUtc = '') {
    const where = [`query_norm <> ''`];
    const params = [];
    if (sinceUtc) {
      where.push('created_utc >= ?');
      params.push(sinceUtc);
    }
    params.push(limit);
    return this.db
      .prepare(
        `SELECT query_norm,
                MIN(query_text) AS sample_query,
                COUNT(*) AS uses,
                SUM(CASE WHEN result_count = 0 THEN 1 ELSE 0 END) AS empty_uses,
                MAX(created_utc) AS last_used_utc
         FROM search_events
         WHERE ${where.join(' AND ')}
         GROUP BY query_norm
         ORDER BY uses DESC, last_used_utc DESC, query_norm ASC
         LIMIT ?`
      )
      .all(...params);
  }

  queryTopEmptySearches(limit = 10, sinceUtc = '') {
    const where = [`query_norm <> ''`, 'result_count = 0'];
    const params = [];
    if (sinceUtc) {
      where.push('created_utc >= ?');
      params.push(sinceUtc);
    }
    params.push(limit);
    return this.db
      .prepare(
        `SELECT query_norm,
                MIN(query_text) AS sample_query,
                COUNT(*) AS uses,
                MAX(created_utc) AS last_used_utc
         FROM search_events
         WHERE ${where.join(' AND ')}
         GROUP BY query_norm
         ORDER BY uses DESC, last_used_utc DESC, query_norm ASC
         LIMIT ?`
      )
      .all(...params);
  }

  queryTopItems(limit = 8, sinceUtc = '') {
    const where = [`item_id <> ''`];
    const params = [];
    if (sinceUtc) {
      where.push('created_utc >= ?');
      params.push(sinceUtc);
    }
    params.push(limit);
    return this.db
      .prepare(
        `SELECT item_id,
                COUNT(*) AS uses,
                SUM(CASE WHEN event_type = 'open_folder' THEN 1 ELSE 0 END) AS folder_opens,
                SUM(CASE WHEN event_type = 'send_file' THEN 1 ELSE 0 END) AS file_sends,
                MAX(item_name_snapshot) AS item_name_snapshot,
                MAX(relative_path_snapshot) AS relative_path_snapshot,
                MAX(created_utc) AS last_used_utc
         FROM item_events
         WHERE ${where.join(' AND ')}
         GROUP BY item_id
         ORDER BY uses DESC, last_used_utc DESC, item_id ASC
         LIMIT ?`
      )
      .all(...params);
  }

  getUserSummary(days = 7) {
    const sinceUtc = periodSinceIso(days);
    if (!sinceUtc) {
      const totalUsers = Number(
        this.db.prepare('SELECT COUNT(*) AS total_users FROM bot_users').get()?.total_users || 0
      );
      const totalInteractions = Number(
        this.db
          .prepare('SELECT COALESCE(SUM(interaction_count), 0) AS total_interactions FROM bot_users')
          .get()?.total_interactions || 0
      );
      return {
        total_users: totalUsers,
        total_interactions: totalInteractions,
        new_users: totalUsers,
        active_users: totalUsers,
        since_utc: '',
        period_days: 0,
      };
    }

    const row = this.db
      .prepare(
        `SELECT
           (SELECT COUNT(*) FROM bot_users) AS total_users,
           (SELECT COALESCE(SUM(interaction_count), 0) FROM bot_users) AS total_interactions,
           (SELECT COUNT(*) FROM bot_users WHERE first_seen_utc >= ?) AS new_users,
           (SELECT COUNT(*) FROM bot_users WHERE last_seen_utc >= ?) AS active_users`
      )
      .get(sinceUtc, sinceUtc);

    return {
      total_users: Number(row?.total_users || 0),
      total_interactions: Number(row?.total_interactions || 0),
      new_users: Number(row?.new_users || 0),
      active_users: Number(row?.active_users || 0),
      since_utc: sinceUtc,
      period_days: Number(days) || 0,
    };
  }

  getAdminReport(options = {}) {
    const periodDays = Number(options.days) > 0 ? Number(options.days) : 0;
    const topLimit = Number(options.topLimit) > 0 ? Number(options.topLimit) : 5;
    const sinceUtc = periodSinceIso(periodDays);

    return {
      period_days: periodDays,
      since_utc: sinceUtc,
      users: this.getUserSummary(periodDays),
      top_searches: this.queryTopSearches(topLimit, sinceUtc),
      top_empty_searches: this.queryTopEmptySearches(topLimit, sinceUtc),
      top_items: this.queryTopItems(topLimit, sinceUtc),
    };
  }

  stats() {
    return this.stmtStats.get();
  }
}
