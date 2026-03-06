import Database from 'better-sqlite3';

export class CatalogDb {
  constructor(dbPath) {
    this.db = new Database(dbPath, { fileMustExist: true, readonly: true });

    this.stmtGetById = this.db.prepare('SELECT * FROM assets WHERE id = ? LIMIT 1');
    this.stmtCountChildren = this.db.prepare(
      `SELECT COUNT(*) AS total FROM assets WHERE parent_id = ? AND is_active = 1`
    );
    this.stmtListChildren = this.db.prepare(
      `SELECT *
       FROM assets
       WHERE parent_id = ? AND is_active = 1
       ORDER BY sort_order ASC,
                CASE type WHEN 'folder' THEN 0 ELSE 1 END ASC,
                name ASC
       LIMIT ? OFFSET ?`
    );
  }

  close() {
    this.db.close();
  }

  getById(id) {
    return this.stmtGetById.get(id) || null;
  }

  countChildren(parentId) {
    const row = this.stmtCountChildren.get(parentId);
    return Number(row?.total || 0);
  }

  listChildren(parentId, limit, offset) {
    return this.stmtListChildren.all(parentId, limit, offset);
  }

  searchByVariants(variants, includeFolders = false, limit = 120) {
    if (!variants.length) return [];
    const clauses = variants.map(() => 'search_text LIKE ?').join(' OR ');
    const typeFilter = includeFolders ? '' : `AND type = 'file'`;

    const sql = `
      SELECT *
      FROM assets
      WHERE is_active = 1
        ${typeFilter}
        AND (${clauses})
      ORDER BY depth ASC, name ASC
      LIMIT ?
    `;

    const params = variants.map((v) => `%${v}%`);
    params.push(limit);
    return this.db.prepare(sql).all(...params);
  }

  allSearchCandidates(includeFolders = false, limit = 2000) {
    const whereParts = ['is_active = 1'];
    if (!includeFolders) whereParts.push(`type = 'file'`);
    const whereSql = `WHERE ${whereParts.join(' AND ')}`;
    return this.db
      .prepare(
        `SELECT * FROM assets ${whereSql} ORDER BY depth ASC, name ASC LIMIT ?`
      )
      .all(limit);
  }

  stats() {
    const total = this.db.prepare('SELECT COUNT(*) AS c FROM assets').get().c;
    const files = this.db
      .prepare(`SELECT COUNT(*) AS c FROM assets WHERE type = 'file'`)
      .get().c;
    const folders = this.db
      .prepare(`SELECT COUNT(*) AS c FROM assets WHERE type = 'folder'`)
      .get().c;
    return { total, files, folders };
  }
}
