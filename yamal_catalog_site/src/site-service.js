import crypto from 'node:crypto';
import path from 'node:path';
import { CatalogDb } from '../../max_bot_sqlite/src/db.js';
import { RuntimeStateDb } from '../../max_bot_sqlite/src/state-db.js';
import { buildQueryVariants, rankSearch } from '../../max_bot_sqlite/src/search.js';
import {
  decorateFolderItems,
  getSectionHint,
  resolveRootMenuFolders,
} from '../../max_bot_sqlite/src/menu.js';

function safeId(value) {
  return crypto.createHash('sha1').update(value, 'utf8').digest('hex').slice(0, 16);
}

export const ROOT_ID = safeId('.');

const FILE_KIND_LABELS = {
  ai: 'Исходник AI',
  cdr: 'Исходник CDR',
  eps: 'Вектор EPS',
  jpg: 'Изображение JPG',
  jpeg: 'Изображение JPG',
  pdf: 'Документ PDF',
  png: 'Изображение PNG',
  svg: 'Вектор SVG',
  zip: 'Архив ZIP',
  otf: 'Шрифт OTF',
  ttf: 'Шрифт TTF',
};

export function humanFileSize(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = value;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  const digits = size >= 10 || index === 0 ? 0 : 1;
  return `${size.toFixed(digits).replace(/\.0$/u, '')} ${units[index]}`;
}

export function contentTypeByExt(ext) {
  const key = String(ext || '').toLowerCase();
  return {
    ai: 'application/postscript',
    cdr: 'application/octet-stream',
    css: 'text/css; charset=utf-8',
    eps: 'application/postscript',
    html: 'text/html; charset=utf-8',
    ico: 'image/x-icon',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    js: 'text/javascript; charset=utf-8',
    json: 'application/json; charset=utf-8',
    otf: 'font/otf',
    pdf: 'application/pdf',
    png: 'image/png',
    svg: 'image/svg+xml',
    ttf: 'font/ttf',
    txt: 'text/plain; charset=utf-8',
    webp: 'image/webp',
    zip: 'application/zip',
  }[key] || 'application/octet-stream';
}

export function buildBreadcrumbs(item, db) {
  if (!item) return [];
  const chain = [];
  let current = item;
  while (current) {
    chain.push({
      id: current.id,
      name: current.name,
      type: current.type,
      relative_path: current.relative_path,
    });
    if (!current.parent_id || current.id === ROOT_ID) break;
    current = db.getById(current.parent_id);
  }
  return chain.reverse();
}

export function presentItem(item) {
  const ext = String(item.extension || '').toLowerCase();
  return {
    id: item.id,
    type: item.type,
    name: item.name,
    label: item.label || item.name,
    icon: item.icon || (item.type === 'folder' ? '📁' : '📄'),
    relativePath: item.relative_path,
    parentId: item.parent_id,
    extension: ext,
    sizeBytes: item.size_bytes || 0,
    sizeLabel: ext ? humanFileSize(item.size_bytes || 0) : '',
    kindLabel: item.type === 'folder' ? 'Раздел' : FILE_KIND_LABELS[ext] || 'Файл',
    modifiedUtc: item.modified_utc || '',
    downloadUrl: item.type === 'file' ? `/download/${item.id}` : '',
  };
}

function rootFallbackItems(rootItems, limit) {
  const preferred = [
    'Логотип',
    'Брендбук ЯМАЛ 100',
    'Брендбук ЯМАЛ Мастер бренд',
    'Логотипы городов',
    'Каталог сувенирной продукции',
    'Паттерны',
  ];
  const byName = new Map(rootItems.map((item) => [item.name, item]));
  const out = [];
  for (const name of preferred) {
    const item = byName.get(name);
    if (!item) continue;
    out.push(item);
    if (out.length >= limit) break;
  }
  return out;
}

export class SiteCatalogService {
  constructor(options) {
    const {
      db,
      state,
      catalogDbPath,
      runtimeDbPath,
      rootPath,
      pageSize = 18,
      favoritesLimit = 8,
      siteTitle = 'ЯМАЛ Бренд Каталог',
    } = options;

    this.db = db || new CatalogDb(catalogDbPath);
    this.state = state || new RuntimeStateDb(runtimeDbPath);
    this.rootPath = path.resolve(rootPath);
    this.pageSize = pageSize;
    this.favoritesLimit = favoritesLimit;
    this.siteTitle = siteTitle;
  }

  close() {
    this.db?.close?.();
    this.state?.close?.();
  }

  getRootFolders() {
    return resolveRootMenuFolders(
      this.db.listChildren(ROOT_ID, 200, 0).filter((item) => item.type === 'folder')
    );
  }

  getFavorites() {
    const records = this.state.getTopItems(this.favoritesLimit * 3);
    const items = [];
    const seen = new Set();

    for (const record of records) {
      if (!record?.item_id || seen.has(record.item_id)) continue;
      const item = this.db.getById(record.item_id);
      if (!item || !item.is_active) continue;
      const parent = item.parent_id ? this.db.getById(item.parent_id) : null;
      const decorated = decorateFolderItems(parent, [item])[0] || item;
      items.push({ ...presentItem(decorated), uses: Number(record.uses || 0) });
      seen.add(record.item_id);
      if (items.length >= this.favoritesLimit) break;
    }

    if (items.length) return items;
    return rootFallbackItems(this.getRootFolders(), this.favoritesLimit).map((item) => presentItem(item));
  }

  getBootstrap() {
    const catalogStats = this.db.stats();
    const runtimeStats = this.state.stats();
    const roots = this.getRootFolders().map((item) => presentItem(item));
    return {
      title: this.siteTitle,
      rootId: ROOT_ID,
      stats: {
        totalAssets: Number(catalogStats.total || 0),
        files: Number(catalogStats.files || 0),
        folders: Number(catalogStats.folders || 0),
        searches: Number(runtimeStats.total_searches || 0),
        emptySearches: Number(runtimeStats.empty_searches || 0),
      },
      sections: roots,
      favorites: this.getFavorites(),
      topSearches: this.state.getTopSearches(8).map((row) => ({
        query: row.sample_query,
        uses: Number(row.uses || 0),
      })),
    };
  }

  getFolder(folderId = ROOT_ID, page = 0) {
    if (folderId === ROOT_ID) {
      return {
        root: true,
        folder: {
          id: ROOT_ID,
          label: 'Главное меню',
          name: 'Главное меню',
          type: 'folder',
        },
        breadcrumbs: [{ id: ROOT_ID, name: 'Главная', type: 'folder', relative_path: '.' }],
        hint: 'Выберите раздел каталога.',
        page: 0,
        total: this.getRootFolders().length,
        pageSize: this.pageSize,
        maxPage: 0,
        items: this.getRootFolders().map((item) => presentItem(item)),
      };
    }

    const folder = this.db.getById(folderId);
    if (!folder || folder.type !== 'folder') return null;

    const total = this.db.countChildren(folderId);
    const maxPage = Math.max(0, Math.ceil(total / this.pageSize) - 1);
    const currentPage = Math.min(Math.max(Number(page) || 0, 0), maxPage);
    const offset = currentPage * this.pageSize;
    const items = decorateFolderItems(folder, this.db.listChildren(folderId, this.pageSize, offset));

    this.state.trackItemEvent(folder, 'open_folder');

    return {
      root: false,
      folder: presentItem({ ...folder, label: folder.name, icon: '📂' }),
      breadcrumbs: buildBreadcrumbs(folder, this.db),
      hint: getSectionHint(folder),
      page: currentPage,
      total,
      pageSize: this.pageSize,
      maxPage,
      items: items.map((item) => presentItem(item)),
    };
  }

  search(query) {
    const variants = buildQueryVariants(query);
    if (!variants.length) {
      this.state.logSearch(query, 0);
      return {
        query,
        total: 0,
        items: [],
        emptyState: 'Пупупу....пусто',
      };
    }

    const direct = this.db.searchByVariants(variants, true, this.pageSize * 3);
    const fuzzyPool = this.db.allSearchCandidates(true, 2500);
    const fuzzy = rankSearch(query, fuzzyPool, this.pageSize * 3);
    const merged = new Map();

    for (const row of direct) {
      if (!merged.has(row.id)) merged.set(row.id, row);
      if (merged.size >= this.pageSize) break;
    }
    for (const row of fuzzy) {
      if (!merged.has(row.id)) merged.set(row.id, row);
      if (merged.size >= this.pageSize) break;
    }

    const items = [...merged.values()].slice(0, this.pageSize).map((item) => {
      const parent = item.parent_id ? this.db.getById(item.parent_id) : null;
      return presentItem(decorateFolderItems(parent, [item])[0] || item);
    });

    this.state.logSearch(query, items.length);

    return {
      query,
      total: items.length,
      items,
      emptyState: items.length ? '' : 'Пупупу....пусто',
    };
  }

  getFile(fileId) {
    const item = this.db.getById(fileId);
    if (!item || item.type !== 'file') return null;
    const payload = presentItem(item);
    payload.breadcrumbs = buildBreadcrumbs(item, this.db);
    payload.pathLabel = item.relative_path;
    payload.downloadUrl = `/download/${item.id}`;
    return payload;
  }

  resolveDownload(fileId) {
    const item = this.db.getById(fileId);
    if (!item || item.type !== 'file') return null;

    const fullPath = path.resolve(this.rootPath, item.relative_path === '.' ? '' : item.relative_path);
    if (!fullPath.startsWith(this.rootPath)) return null;
    return {
      item,
      fullPath,
      contentType: contentTypeByExt(item.extension),
    };
  }
}
