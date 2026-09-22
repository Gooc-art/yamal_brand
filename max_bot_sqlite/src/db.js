import Database from 'better-sqlite3';

const VISIBLE_ASSET = `is_active = 1
  AND relative_path NOT LIKE '02 Ямал-100/%Паттерны и элементы%'`;

export class CatalogDb {
  constructor(dbPath) {
    this.db = new Database(dbPath, { fileMustExist: true, readonly: true });

    this.stmtGetById = this.db.prepare(`SELECT * FROM assets WHERE id = ? AND ${VISIBLE_ASSET} LIMIT 1`);
    this.stmtCountChildren = this.db.prepare(
      `SELECT COUNT(*) AS total FROM assets WHERE parent_id = ? AND ${VISIBLE_ASSET}`
    );
    this.stmtListChildren = this.db.prepare(
      `SELECT *
       FROM assets
       WHERE parent_id = ? AND ${VISIBLE_ASSET}
       ORDER BY sort_order ASC,
                CASE type WHEN 'folder' THEN 0 ELSE 1 END ASC,
                name ASC
       LIMIT ? OFFSET ?`
    );
    this.stmtListAllChildren = this.db.prepare(
      `SELECT *
       FROM assets
       WHERE parent_id = ? AND ${VISIBLE_ASSET}
       ORDER BY sort_order ASC,
                CASE type WHEN 'folder' THEN 0 ELSE 1 END ASC,
                name ASC`
    );
  }

  listDescendantFiles(parentId) {
    return this.db.prepare(
      `WITH RECURSIVE descendants AS (
         SELECT * FROM assets WHERE parent_id = ? AND ${VISIBLE_ASSET}
         UNION ALL
         SELECT child.* FROM assets child
         JOIN descendants parent ON child.parent_id = parent.id
         WHERE child.is_active = 1
           AND child.relative_path NOT LIKE '02 Ямал-100/%Паттерны и элементы%'
       )
       SELECT * FROM descendants WHERE type = 'file' ORDER BY relative_path ASC`
    ).all(parentId);
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

  listAllChildren(parentId) {
    return this.stmtListAllChildren.all(parentId);
  }

  searchByVariants(variants, includeFolders = false, limit = 120) {
    if (!variants.length) return [];
    const clauses = variants.map(() => 'search_text LIKE ?').join(' OR ');
    const typeFilter = includeFolders ? '' : `AND type = 'file'`;

    const sql = `
      SELECT *
      FROM assets
      WHERE ${VISIBLE_ASSET}
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
    const whereParts = [VISIBLE_ASSET];
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
