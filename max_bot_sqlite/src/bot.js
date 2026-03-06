import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Bot, Keyboard } from '@maxhub/max-bot-api';
import { config } from './config.js';
import { CatalogDb } from './db.js';
import {
  QUICK_SEARCHES,
  getQuickSearchByKey,
  resolveRootMenuFolders,
} from './menu.js';
import { buildQueryVariants, rankSearch } from './search.js';

function safeId(value) {
  return crypto.createHash('sha1').update(value, 'utf8').digest('hex').slice(0, 16);
}

const ROOT_ID = safeId('.');
const db = new CatalogDb(config.dbPath);
const bot = new Bot(config.token);

bot.catch((err, ctx) => {
  console.error('[bot] unhandled error', {
    updateType: ctx?.updateType,
    chatId: ctx?.chatId,
    messageId: ctx?.messageId,
  });
  throw err;
});

function getMessageText(ctx) {
  return String(ctx?.message?.body?.text || ctx?.message?.text || ctx?.text || '').trim();
}

function getSenderId(ctx) {
  const value =
    ctx?.sender?.user_id ??
    ctx?.sender?.id ??
    ctx?.message?.sender?.user_id ??
    ctx?.message?.sender?.id ??
    ctx?.callbackQuery?.sender?.user_id ??
    ctx?.callbackQuery?.sender?.id ??
    ctx?.from?.id;
  return value === undefined || value === null ? '' : String(value);
}

function isAllowed(ctx) {
  if (!config.allowedUserIds.size) return true;
  return config.allowedUserIds.has(getSenderId(ctx));
}

async function denyAccess(ctx) {
  await ctx.reply('Доступ ограничен. Обратитесь к администратору бота.');
}

function getCallbackData(ctx) {
  return String(
    ctx?.callbackQuery?.payload ||
      ctx?.callbackQuery?.data ||
      ctx?.update?.callback_query?.payload ||
      ctx?.update?.callback_query?.data ||
      ''
  );
}

function truncate(text, max) {
  const s = String(text || '');
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

function buttonForItem(item) {
  if (item.type === 'folder') {
    return Keyboard.button.callback(`📁 ${truncate(item.name, 40)}`, `open:${item.id}:0`);
  }
  return Keyboard.button.callback(`📄 ${truncate(item.name, 40)}`, `file:${item.id}`);
}

function getRootFolders() {
  return db.listChildren(ROOT_ID, 200, 0).filter((item) => item.type === 'folder');
}

function chunkIntoRows(items, size) {
  const rows = [];
  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }
  return rows;
}

function inlineKeyboardAttachment(rows) {
  return Keyboard.inlineKeyboard(rows);
}

function buildMainMenuKeyboard() {
  const rootFolders = resolveRootMenuFolders(getRootFolders());
  const rows = chunkIntoRows(
    rootFolders.map((item) =>
      Keyboard.button.callback(`${item.icon} ${truncate(item.label, 28)}`, `open:${item.id}:0`)
    ),
    2
  );

  const quickSearchRows = chunkIntoRows(
    QUICK_SEARCHES.map((item) => Keyboard.button.callback(`🔎 ${item.label}`, `quick:${item.key}`)),
    2
  );
  rows.push(...quickSearchRows);
  rows.push([Keyboard.button.callback('ℹ️ Как пользоваться', 'help:main')]);

  return inlineKeyboardAttachment(rows);
}

async function renderMainMenu(ctx, intro = false) {
  const text = [
    intro ? 'Привет. Это каталог бренда ЯМАЛ.' : 'Главное меню бренда ЯМАЛ.',
    'Вынесены верхние разделы, городские брендбуки и паттерны.',
    'Можно просто отправить текст: логотип, брендбук, город, паттерн, шрифт, сувенир.',
  ].join('\n');

  await ctx.reply(text, { attachments: [buildMainMenuKeyboard()] });
}

function buildNavigationRow(parentId, page, total, pageSize) {
  if (parentId === ROOT_ID) {
    return [Keyboard.button.callback('🏠 Меню', `open:${ROOT_ID}:0`)];
  }

  const row = [];
  if (page > 0) row.push(Keyboard.button.callback('◀️', `open:${parentId}:${page - 1}`));
  if ((page + 1) * pageSize < total) row.push(Keyboard.button.callback('▶️', `open:${parentId}:${page + 1}`));

  if (parentId !== ROOT_ID) {
    const parent = db.getById(parentId);
    const backId = parent?.parent_id || ROOT_ID;
    row.push(Keyboard.button.callback('⬅️ Назад', `open:${backId}:0`));
  }

  if (parentId !== ROOT_ID) {
    row.push(Keyboard.button.callback('🏠 Меню', `open:${ROOT_ID}:0`));
  }

  return row;
}

async function renderFolder(ctx, parentId, page = 0) {
  if (parentId === ROOT_ID) {
    await renderMainMenu(ctx);
    return;
  }

  const pageSafe = Number.isFinite(page) && page >= 0 ? page : 0;
  const total = db.countChildren(parentId);
  const maxPage = Math.max(0, Math.ceil(total / config.pageSize) - 1);
  const pageClamped = Math.min(pageSafe, maxPage);
  const offset = pageClamped * config.pageSize;

  const parent = db.getById(parentId);
  const title = parentId === ROOT_ID ? 'Бренд ЯМАЛ' : parent?.name || 'Раздел';
  const children = db.listChildren(parentId, config.pageSize, offset);

  const rows = children.map((item) => [buttonForItem(item)]);
  const navRow = buildNavigationRow(parentId, pageClamped, total, config.pageSize);
  if (navRow.length) rows.push(navRow);

  const header = [
    `📂 ${title}`,
    `Элементов: ${total}`,
    `Страница: ${pageClamped + 1}/${Math.max(1, maxPage + 1)}`,
  ].join('\n');

  const text = children.length ? header : `${header}\n\nРаздел пуст.`;
  await ctx.reply(text, { attachments: [inlineKeyboardAttachment(rows)] });
}

async function sendFileById(ctx, fileId) {
  const item = db.getById(fileId);
  if (!item || item.type !== 'file') {
    await ctx.reply('Файл не найден.');
    return;
  }

  const fullPath = path.resolve(
    config.rootPath,
    item.relative_path === '.' ? '' : item.relative_path
  );

  if (!fullPath.startsWith(config.rootPath)) {
    await ctx.reply('Некорректный путь файла.');
    return;
  }
  if (!fs.existsSync(fullPath)) {
    await ctx.reply('Файл отсутствует на диске.');
    return;
  }

  try {
    const fileAttachment = await bot.api.uploadFile({ source: fs.createReadStream(fullPath) });
    const backParent = item.parent_id || ROOT_ID;
    await ctx.reply(`📄 ${item.name}`, {
      attachments: [
        fileAttachment.toJson(),
        inlineKeyboardAttachment([
          [Keyboard.button.callback('⬅️ К разделу', `open:${backParent}:0`)],
          [Keyboard.button.callback('🏠 Меню', `open:${ROOT_ID}:0`)],
        ]),
      ],
    });
  } catch (err) {
    await ctx.reply('Не удалось отправить файл. Проверь размер/доступность файла.');
    console.error('[sendFileById] upload failed', err);
  }
}

async function runSearch(ctx, query) {
  const variants = buildQueryVariants(query);
  if (!variants.length) {
    await ctx.reply('Введите запрос для поиска.');
    return;
  }

  const direct = db.searchByVariants(variants, true, config.maxSearchResults * 5);
  const fuzzyPool = db.allSearchCandidates(true, 2000);
  const fuzzy = rankSearch(query, fuzzyPool, config.maxSearchResults * 5);

  const merged = new Map();
  for (const row of direct) {
    merged.set(row.id, { ...row, score: 1.0 });
    if (merged.size >= config.maxSearchResults) break;
  }
  for (const row of fuzzy) {
    if (!merged.has(row.id)) {
      merged.set(row.id, row);
      if (merged.size >= config.maxSearchResults) break;
    }
  }

  const items = [...merged.values()].slice(0, config.maxSearchResults);
  if (!items.length) {
    await ctx.reply(
      `По запросу «${query}» ничего не найдено. Попробуйте: логотип, брендбук, город, паттерн, шрифт, сувенир.`
    );
    return;
  }

  const rows = items.map((item) => [buttonForItem(item)]);
  rows.push([Keyboard.button.callback('🏠 Меню', `open:${ROOT_ID}:0`)]);

  await ctx.reply(
    [
      `🔎 Найдено: ${items.length} (запрос: ${query})`,
      'Папки открываются, файлы отправляются сразу.',
    ].join('\n'),
    {
      attachments: [inlineKeyboardAttachment(rows)],
    }
  );
}

function parseCommandArgs(text, cmd) {
  return text.replace(new RegExp(`^/${cmd}(?:@\\w+)?\\s*`, 'i'), '').trim();
}

async function safeHandle(ctx, fn) {
  try {
    if (!isAllowed(ctx)) {
      await denyAccess(ctx);
      return;
    }
    await fn();
  } catch (err) {
    console.error('[handler] error', err);
    await ctx.reply('Внутренняя ошибка. Попробуйте еще раз.');
  }
}

bot.command('start', async (ctx) => {
  await safeHandle(ctx, async () => {
    await renderMainMenu(ctx, true);
  });
});

bot.on('bot_started', async (ctx) => {
  await safeHandle(ctx, async () => {
    await renderMainMenu(ctx, true);
  });
});

bot.command('menu', async (ctx) => {
  await safeHandle(ctx, async () => {
    await renderMainMenu(ctx);
  });
});

bot.command('help', async (ctx) => {
  await safeHandle(ctx, async () => {
    await ctx.reply(
      [
        'Команды:',
        '/start - открыть каталог',
        '/menu - главное меню',
        '/search <запрос> - поиск файла',
        '',
        'Можно просто отправить текст, бот воспримет это как поиск.',
        'В главном меню есть кнопки всех верхних разделов и быстрые поисковые кнопки.',
      ].join('\n')
    );
  });
});

bot.command('search', async (ctx) => {
  await safeHandle(ctx, async () => {
    const text = getMessageText(ctx);
    const query = parseCommandArgs(text, 'search');
    if (!query) {
      await ctx.reply('Использование: /search логотип');
      return;
    }
    await runSearch(ctx, query);
  });
});

bot.on('message_created', async (ctx) => {
  await safeHandle(ctx, async () => {
    const text = getMessageText(ctx);
    if (!text || text.startsWith('/')) return;
    await runSearch(ctx, text);
  });
});

bot.action(/.*/, async (ctx) => {
  await safeHandle(ctx, async () => {
    const data = getCallbackData(ctx);
    let m = data.match(/^open:([a-f0-9]{16}):(\d+)$/i);
    if (m) {
      await renderFolder(ctx, m[1].toLowerCase(), Number.parseInt(m[2], 10));
      return;
    }

    m = data.match(/^file:([a-f0-9]{16})$/i);
    if (m) {
      await sendFileById(ctx, m[1].toLowerCase());
      return;
    }

    m = data.match(/^quick:([a-z0-9_-]+)$/i);
    if (m) {
      const quick = getQuickSearchByKey(m[1].toLowerCase());
      if (!quick) {
        await ctx.reply('Быстрый поиск не найден.');
        return;
      }
      await runSearch(ctx, quick.query);
      return;
    }

    if (data === 'help:main') {
      await ctx.reply(
        [
          'Как пользоваться:',
          '1. Нажмите кнопку нужного верхнего раздела.',
          '2. Дальше открывайте вложенные папки кнопками.',
          '3. Или нажмите быстрый поиск.',
          '4. Или просто отправьте текстовый запрос.',
          '',
          'Папки открываются, файлы отправляются сразу в чат.',
        ].join('\n')
      );
      return;
    }

    await ctx.reply('Неизвестное действие.');
  });
});

const stat = db.stats();
console.log('[boot] db=', config.dbPath, 'rows=', stat.total, 'files=', stat.files, 'folders=', stat.folders);
console.log('[boot] rootPath=', config.rootPath);
console.log('[boot] rootId=', ROOT_ID);

bot.start();
