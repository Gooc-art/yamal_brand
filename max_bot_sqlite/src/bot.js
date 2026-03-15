import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Bot, Keyboard } from '@maxhub/max-bot-api';
import { config } from './config.js';
import { CatalogDb } from './db.js';
import { buildMessageIdsToDelete, getMessageId } from './chat-cleanup.js';
import { buttonLayoutUnits, packButtonsIntoRows } from './keyboard-layout.js';
import { retryMaxApiCall } from './max-api-retry.js';
import { RuntimeStateDb } from './state-db.js';
import {
  QUICK_SEARCHES,
  decorateFolderItems,
  getMainMenuQuickSearches,
  getQuickSearchByKey,
  getSectionHint,
  resolveRootMenuFolders,
} from './menu.js';
import { buildQueryVariants, rankSearch } from './search.js';

function safeId(value) {
  return crypto.createHash('sha1').update(value, 'utf8').digest('hex').slice(0, 16);
}

const ROOT_ID = safeId('.');
const db = new CatalogDb(config.dbPath);
const state = new RuntimeStateDb(config.runtimeDbPath);
const bot = new Bot(config.token);
const lastBotMessageIds = new Map();
const BOT_SEARCH_EXAMPLES = 'Логотип, Брендбук, Паттерн, Шрифт, Сувенир';
const BOT_INTRO_TEXT = [
  'Привет! Добро пожаловать в официальный каталог бренда Ямала.',
  'Этот чат-бот создан для удобства государственных служащих и предпринимателей, которые хотят использовать элементы регионального бренда Ямала в своей деятельности.',
  'В каталоге вы найдете утвержденные материалы, включая брендбуки, логотипы, шрифты и паттерны, которые помогут вам в реализации проектов в регионе и продвижении вашего бизнеса.',
  'Вы можете:',
  '• Ознакомиться с верхними разделами каталога.',
  '• Добавить интересующие материалы в Избранное.',
  '• Использовать функцию Поиск для быстрого нахождения нужной информации.',
  'Просто отправьте текст: Логотип, Брендбук, Паттерн, Шрифт, Сувенир — и получите доступ к необходимым ресурсам для успешного использования официального бренда Ямала.',
].join('\n\n');

function buildMainMenuText(intro = false) {
  return BOT_INTRO_TEXT;
}

function buildHelpText() {
  return [
    'Как пользоваться каталогом:',
    '1. Откройте нужный верхний раздел каталога.',
    '2. Для быстрых материалов перейдите в Избранное.',
    '3. Используйте Поиск, если знаете название, город или тип материала.',
    '4. Во вложенных папках открывайте разделы кнопками, а файлы бот отправит прямо в чат.',
    '',
    'Каталог содержит утвержденные материалы официального бренда Ямала для государственных служащих и предпринимателей.',
    `Для быстрого старта можно отправить текст: ${BOT_SEARCH_EXAMPLES}.`,
  ].join('\n');
}

function buildSearchText() {
  return [
    'Поиск по официальному каталогу бренда Ямала:',
    'Отправьте слово или фразу, даже если не уверены в точном названии материала.',
    'Можно искать брендбуки, логотипы, шрифты, паттерны и сувенирную продукцию.',
    `Например: ${BOT_SEARCH_EXAMPLES}.`,
  ].join('\n');
}

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

function getChatKey(ctx) {
  if (ctx?.chatId === undefined || ctx?.chatId === null) return '';
  return String(ctx.chatId);
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
  await replyReplacingLast(ctx, 'Доступ ограничен. Обратитесь к администратору бота.');
}

function getCallbackData(ctx) {
  return String(
    ctx?.callback?.payload ||
      ctx?.update?.callback?.payload ||
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
  const displayName = item.label || item.name;
  if (item.type === 'quick') {
    return Keyboard.button.callback(
      `${item.icon || '🔎'} ${truncate(displayName, 40)}`,
      `quick:${item.key}`
    );
  }
  if (item.type === 'folder') {
    return Keyboard.button.callback(
      `${item.icon || '📁'} ${truncate(displayName, 40)}`,
      `open:${item.id}:0`
    );
  }
  return Keyboard.button.callback(
    `${item.icon || '📄'} ${truncate(displayName, 40)}`,
    `file:${item.id}`
  );
}

function getRootFolders() {
  return db.listChildren(ROOT_ID, 200, 0).filter((item) => item.type === 'folder');
}

function inlineKeyboardAttachment(rows) {
  return Keyboard.inlineKeyboard(rows);
}

async function deleteMessageSafe(messageId) {
  if (!messageId) return;
  try {
    await retryMaxApiCall('deleteMessage', () => bot.api.deleteMessage(messageId));
  } catch (err) {
    if ([400, 403, 404].includes(Number(err?.status))) return;
    console.warn('[deleteMessageSafe] failed', { messageId, err });
  }
}

async function clearPreviousBotReply(ctx, { deleteCurrentMessage = false } = {}) {
  const chatKey = getChatKey(ctx);
  const ids = buildMessageIdsToDelete({
    trackedId: chatKey ? lastBotMessageIds.get(chatKey) : '',
    currentMessageId: ctx?.messageId,
    deleteCurrentMessage,
  });

  for (const messageId of ids) {
    await deleteMessageSafe(messageId);
  }

  if (chatKey) {
    lastBotMessageIds.delete(chatKey);
  }
}

function rememberBotReply(ctx, message) {
  const chatKey = getChatKey(ctx);
  const messageId = getMessageId(message);
  if (chatKey && messageId) {
    lastBotMessageIds.set(chatKey, messageId);
  }
}

async function replyReplacingLast(ctx, text, extra) {
  await clearPreviousBotReply(ctx, {
    deleteCurrentMessage: ctx?.updateType === 'message_callback',
  });
  const sent = await retryMaxApiCall('reply', () => ctx.reply(text, extra));
  rememberBotReply(ctx, sent);
  return sent;
}

function buildFolderItemRows(items) {
  return packButtonsIntoRows(items, {
    measure: (item) => buttonLayoutUnits(item.label || item.name || ''),
    maxButtonsPerRow: 3,
  }).map((row) => row.map((item) => buttonForItem(item)));
}

function buildMainMenuKeyboard() {
  const rootFolders = resolveRootMenuFolders(getRootFolders());
  const mainItems = [...rootFolders];
  const fontShortcut = getMainMenuQuickSearches()[0];
  if (fontShortcut) {
    const shortcutItem = {
      type: 'quick',
      key: fontShortcut.key,
      label: fontShortcut.label,
      icon: '⌨️',
      name: fontShortcut.label,
    };
    const insertIndex = mainItems.findIndex((item) => item.name === 'Каталог сувенирной продукции');
    if (insertIndex >= 0) {
      mainItems.splice(insertIndex, 0, shortcutItem);
    } else {
      mainItems.push(shortcutItem);
    }
  }

  const rows = packButtonsIntoRows(mainItems, {
    measure: (item) => buttonLayoutUnits(item.label || item.name || ''),
    maxButtonsPerRow: 2,
  }).map((row) => row.map((item) => buttonForItem(item)));
  rows.push([
    Keyboard.button.callback('⭐ Избранное', 'favorites:main'),
    Keyboard.button.callback('🔎 Поиск', 'search:main'),
  ]);
  rows.push([Keyboard.button.callback('ℹ️ Как пользоваться', 'help:main')]);

  return inlineKeyboardAttachment(rows);
}

function buildHelpKeyboard() {
  return inlineKeyboardAttachment([
    [
      Keyboard.button.callback('⬅️ Назад', `open:${ROOT_ID}:0`),
      Keyboard.button.callback('🏠 Меню', `open:${ROOT_ID}:0`),
    ],
  ]);
}

function buildSearchKeyboard() {
  const rows = packButtonsIntoRows(QUICK_SEARCHES, {
    measure: (item) => buttonLayoutUnits(item.label || item.name || ''),
    maxButtonsPerRow: 3,
  }).map((row) =>
    row.map((item) => Keyboard.button.callback(`🔎 ${item.label}`, `quick:${item.key}`))
  );
  rows.push([
    Keyboard.button.callback('⬅️ Назад', `open:${ROOT_ID}:0`),
    Keyboard.button.callback('🏠 Меню', `open:${ROOT_ID}:0`),
  ]);
  return inlineKeyboardAttachment(rows);
}

function decorateSingleItem(item) {
  const parent = item?.parent_id ? db.getById(item.parent_id) : null;
  return decorateFolderItems(parent, [item])[0] || item;
}

function buildFavoriteFallbackItems() {
  const preferredNames = [
    'Логотип',
    'Брендбук ЯМАЛ 100',
    'Брендбук ЯМАЛ Мастер бренд',
    'Каталог сувенирной продукции',
  ];
  const rootByName = new Map(resolveRootMenuFolders(getRootFolders()).map((item) => [item.name, item]));
  const fallback = [];

  for (const name of preferredNames) {
    const item = rootByName.get(name);
    if (!item) continue;
    fallback.push(item);
    if (fallback.length >= config.favoritesLimit - 1) break;
  }

  const fontShortcut = getMainMenuQuickSearches()[0];
  if (fontShortcut && fallback.length < config.favoritesLimit) {
    fallback.push({
      type: 'quick',
      key: fontShortcut.key,
      label: fontShortcut.label,
      icon: '⌨️',
      name: fontShortcut.label,
    });
  }

  return fallback.slice(0, config.favoritesLimit);
}

function getFavoriteItems() {
  const ranked = state.getTopItems(config.favoritesLimit * 3);
  const items = [];
  const seen = new Set();

  for (const record of ranked) {
    if (!record?.item_id || seen.has(record.item_id)) continue;
    const item = db.getById(record.item_id);
    if (!item || !item.is_active) continue;
    const decorated = decorateSingleItem(item);
    items.push({
      ...decorated,
      uses: Number(record.uses || 0),
    });
    seen.add(record.item_id);
    if (items.length >= config.favoritesLimit) break;
  }

  return items.length ? items : buildFavoriteFallbackItems();
}

async function renderMainMenu(ctx, intro = false) {
  const text = buildMainMenuText(intro);

  await replyReplacingLast(ctx, text, { attachments: [buildMainMenuKeyboard()] });
}

async function renderFavorites(ctx) {
  const items = getFavoriteItems();
  if (!items.length) {
    await replyReplacingLast(ctx, 'Избранное пока пусто.', {
      attachments: [
        inlineKeyboardAttachment([[Keyboard.button.callback('🏠 Меню', `open:${ROOT_ID}:0`)]]),
      ],
    });
    return;
  }

  const rows = buildFolderItemRows(items);
  rows.push([
    Keyboard.button.callback('⬅️ Назад', `open:${ROOT_ID}:0`),
    Keyboard.button.callback('🏠 Меню', `open:${ROOT_ID}:0`),
  ]);

  const hasStats = Number(state.stats()?.total_item_events || 0) > 0;
  const text = hasStats
    ? [
        '⭐ Избранное',
        'Здесь собраны самые часто открываемые разделы и файлы.',
      ].join('\n')
    : [
        '⭐ Избранное',
        'Пока статистики мало, поэтому показаны базовые разделы.',
      ].join('\n');

  await replyReplacingLast(ctx, text, {
    attachments: [inlineKeyboardAttachment(rows)],
  });
}

function buildNavigationRows(parentId, page, total, pageSize) {
  if (parentId === ROOT_ID) {
    return [[Keyboard.button.callback('🏠 Меню', `open:${ROOT_ID}:0`)]];
  }

  const rows = [];
  const pagingRow = [];
  if (page > 0) pagingRow.push(Keyboard.button.callback('◀️', `open:${parentId}:${page - 1}`));
  if ((page + 1) * pageSize < total) {
    pagingRow.push(Keyboard.button.callback('▶️', `open:${parentId}:${page + 1}`));
  }
  if (pagingRow.length) rows.push(pagingRow);

  const parent = db.getById(parentId);
  const backId = parent?.parent_id || ROOT_ID;
  rows.push([
    Keyboard.button.callback('⬅️ Назад', `open:${backId}:0`),
    Keyboard.button.callback('🏠 Меню', `open:${ROOT_ID}:0`),
  ]);
  return rows;
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
  const children = decorateFolderItems(parent, db.listChildren(parentId, config.pageSize, offset));

  const rows = buildFolderItemRows(children);
  rows.push(...buildNavigationRows(parentId, pageClamped, total, config.pageSize));
  const hint = getSectionHint(parent);

  const header = [
    `📂 ${title}`,
    `Элементов: ${total}`,
    `Страница: ${pageClamped + 1}/${Math.max(1, maxPage + 1)}`,
  ].join('\n');

  const text = children.length
    ? [header, hint].filter(Boolean).join('\n\n')
    : `${header}\n\nРаздел пуст.`;
  await replyReplacingLast(ctx, text, { attachments: [inlineKeyboardAttachment(rows)] });
  if (parent) {
    state.trackItemEvent(parent, 'open_folder');
  }
}

async function sendFileById(ctx, fileId) {
  const item = db.getById(fileId);
  if (!item || item.type !== 'file') {
    await replyReplacingLast(ctx, 'Файл не найден.');
    return;
  }

  const fullPath = path.resolve(
    config.rootPath,
    item.relative_path === '.' ? '' : item.relative_path
  );

  if (!fullPath.startsWith(config.rootPath)) {
    await replyReplacingLast(ctx, 'Некорректный путь файла.');
    return;
  }
  if (!fs.existsSync(fullPath)) {
    await replyReplacingLast(ctx, 'Файл отсутствует на диске.');
    return;
  }

  try {
    const fileAttachment = await retryMaxApiCall(
      'uploadFile',
      () => bot.api.uploadFile({ source: fs.createReadStream(fullPath) }),
      { retries: 3, delaysMs: [400, 1200, 2400] }
    );
    const attachmentJson = await retryMaxApiCall(
      'attachmentToJson',
      async () => fileAttachment.toJson(),
      { retries: 3, delaysMs: [300, 900, 1800] }
    );
    const backParent = item.parent_id || ROOT_ID;
    await replyReplacingLast(ctx, `📄 ${item.name}`, {
      attachments: [
        attachmentJson,
        inlineKeyboardAttachment([
          [Keyboard.button.callback('⬅️ К разделу', `open:${backParent}:0`)],
          [Keyboard.button.callback('🏠 Меню', `open:${ROOT_ID}:0`)],
        ]),
      ],
    });
    state.trackItemEvent(item, 'send_file');
  } catch (err) {
    await replyReplacingLast(ctx, 'Не удалось отправить файл. Проверь размер/доступность файла.');
    console.error('[sendFileById] upload failed', err);
  }
}

async function runSearch(ctx, query) {
  const variants = buildQueryVariants(query);
  if (!variants.length) {
    await replyReplacingLast(ctx, 'Введите запрос для поиска.');
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
  state.logSearch(query, items.length);
  if (!items.length) {
    await replyReplacingLast(
      ctx,
      'Пупупу....пусто',
      {
        attachments: [inlineKeyboardAttachment([[Keyboard.button.callback('🏠 Меню', `open:${ROOT_ID}:0`)]])],
      }
    );
    return;
  }

  const rows = items.map((item) => [buttonForItem(item)]);
  rows.push([Keyboard.button.callback('🏠 Меню', `open:${ROOT_ID}:0`)]);

  await replyReplacingLast(
    ctx,
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
    try {
      await replyReplacingLast(ctx, 'Внутренняя ошибка. Попробуйте еще раз.');
    } catch (replyErr) {
      console.error('[safeHandle] fallback reply failed', replyErr);
    }
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
    await replyReplacingLast(
      ctx,
      [
        buildHelpText(),
        '',
        'Команды:',
        '/start - открыть каталог',
        '/menu - главное меню',
        '/search <запрос> - поиск файла',
      ].join('\n')
    );
  });
});

bot.command('search', async (ctx) => {
  await safeHandle(ctx, async () => {
    const text = getMessageText(ctx);
    const query = parseCommandArgs(text, 'search');
    if (!query) {
      await replyReplacingLast(ctx, 'Использование: /search логотип');
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
        await replyReplacingLast(ctx, 'Быстрый поиск не найден.');
        return;
      }
      await runSearch(ctx, quick.query);
      return;
    }

    if (data === 'help:main') {
      await replyReplacingLast(
        ctx,
        buildHelpText(),
        { attachments: [buildHelpKeyboard()] }
      );
      return;
    }

    if (data === 'favorites:main') {
      await renderFavorites(ctx);
      return;
    }

    if (data === 'search:main') {
      await replyReplacingLast(
        ctx,
        buildSearchText(),
        { attachments: [buildSearchKeyboard()] }
      );
      return;
    }

    await replyReplacingLast(ctx, 'Неизвестное действие.');
  });
});

const stat = db.stats();
console.log('[boot] db=', config.dbPath, 'rows=', stat.total, 'files=', stat.files, 'folders=', stat.folders);
console.log('[boot] runtimeDb=', config.runtimeDbPath, 'state=', state.stats());
console.log('[boot] rootPath=', config.rootPath);
console.log('[boot] rootId=', ROOT_ID);

bot.start();
