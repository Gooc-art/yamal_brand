import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Bot, Keyboard } from '@maxhub/max-bot-api';
import { config, validateConfigPaths } from './config.js';
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
  getRootMenuLabel,
  getSectionHint,
  resolveRootMenuFolders,
} from './menu.js';
import { buildQueryVariants, rankSearch } from './search.js';

function safeId(value) {
  return crypto.createHash('sha1').update(value, 'utf8').digest('hex').slice(0, 16);
}

const ROOT_ID = safeId('.');
validateConfigPaths(config);
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
    'Как пользоваться этим ботом',
    'На главном экране выберите нужный раздел: «Логотип», «Фирменный знак», «Детский логотип», «Мастер-бренд», «Паттерны», «Иллюстрации», «Шрифт», «Сувенирная продукция».',
    'Переходите по кнопкам внутри разделов, чтобы открывать папки и файлы с материалами.',
    'Если вы ищете конкретный элемент, воспользуйтесь кнопкой «Поиск» и введите ключевое слово (например: «логотип», «паттерн»).',
    'Чтобы быстро возвращаться к важным материалам, добавляйте их в «Избранное» и открывайте их через кнопку «Избранное».',
    'Вы также можете просто отправить текстовый запрос (например: «логотип Ямал», «брендбук Ямал 100», «шрифт», «сувенирная продукция») — бот подберёт соответствующие материалы и отправит их в чат.',
    'Все выбранные файлы и ссылки бот отправляет вам прямо в этот чат.',
  ].join('\n\n');
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

function logIncomingUpdate(ctx) {
  console.log('[update]', {
    updateType: ctx?.updateType,
    senderId: getSenderId(ctx) || undefined,
    chatId: getChatKey(ctx) || undefined,
    hasText: Boolean(getMessageText(ctx)),
    hasPayload: Boolean(getCallbackData(ctx)),
    allowed: isAllowed(ctx),
    admin: isAdmin(ctx),
  });
}

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

function getDisplayName(ctx) {
  const firstName =
    ctx?.sender?.first_name ??
    ctx?.message?.sender?.first_name ??
    ctx?.callbackQuery?.sender?.first_name ??
    ctx?.from?.first_name ??
    '';
  const lastName =
    ctx?.sender?.last_name ??
    ctx?.message?.sender?.last_name ??
    ctx?.callbackQuery?.sender?.last_name ??
    ctx?.from?.last_name ??
    '';
  const username =
    ctx?.sender?.username ??
    ctx?.message?.sender?.username ??
    ctx?.callbackQuery?.sender?.username ??
    ctx?.from?.username ??
    '';
  const fullName = `${String(firstName).trim()} ${String(lastName).trim()}`.trim();
  if (fullName) return fullName;
  if (username) return `@${String(username).trim()}`;
  return '';
}

function getAnalyticsUserKey(ctx) {
  const senderId = getSenderId(ctx);
  if (senderId) return `user:${senderId}`;
  const chatKey = getChatKey(ctx);
  return chatKey ? `chat:${chatKey}` : '';
}

function isAllowed(ctx) {
  if (!config.allowedUserIds.size) return true;
  return config.allowedUserIds.has(getSenderId(ctx));
}

function isAdmin(ctx) {
  if (!config.adminUserIds.size) return false;
  return config.adminUserIds.has(getSenderId(ctx));
}

async function denyAccess(ctx) {
  await replyReplacingLast(ctx, 'Доступ ограничен. Обратитесь к администратору бота.');
}

async function denyAdminAccess(ctx) {
  await replyReplacingLast(ctx, 'Админский раздел доступен только администратору бота.');
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
  const rootFolders = new Map(resolveRootMenuFolders(getRootFolders()).map((item) => [item.name, item]));
  const fontShortcut = getMainMenuQuickSearches()[0];
  const orderedRows = [
    [Keyboard.button.callback('ℹ️ Как пользоваться', 'help:main')],
    [Keyboard.button.callback('🔎 Поиск', 'search:main')],
  ];

  const orderedFolderNames = [
    'Логотип',
    'Детский логотип',
    'Фирменный знак',
    'Брендбук ЯМАЛ Мастер бренд',
    'Паттерны',
    'Иллюстрации мастер-бренда SVG-элементы',
  ];

  for (const folderName of orderedFolderNames) {
    const item = rootFolders.get(folderName);
    if (!item) continue;
    orderedRows.push([buttonForItem(item)]);
  }

  if (fontShortcut) {
    orderedRows.push([
      buttonForItem({
        type: 'quick',
        key: fontShortcut.key,
        label: fontShortcut.label,
        icon: '⌨️',
        name: fontShortcut.label,
      }),
    ]);
  }

  for (const folderName of ['Каталог сувенирной продукции', 'Брендбук ЯМАЛ 100']) {
    const item = rootFolders.get(folderName);
    if (!item) continue;
    orderedRows.push([buttonForItem(item)]);
  }

  orderedRows.push([Keyboard.button.callback('⭐ Избранное', 'favorites:main')]);

  const rows = orderedRows.filter((row) => row.length);
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

function buildAdminKeyboard(activeDays = 7) {
  const weeklyLabel = activeDays === 7 ? '✅ 7 дней' : '7 дней';
  const allTimeLabel = activeDays === 0 ? '✅ Весь период' : 'Весь период';
  return inlineKeyboardAttachment([
    [
      Keyboard.button.callback(`🗓 ${weeklyLabel}`, 'admin:report:7'),
      Keyboard.button.callback(`📊 ${allTimeLabel}`, 'admin:report:0'),
    ],
    [Keyboard.button.callback('🏠 Меню', `open:${ROOT_ID}:0`)],
  ]);
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

async function renderStartMenu(ctx) {
  console.log('[start] sending main menu', {
    updateType: ctx?.updateType,
    chatId: getChatKey(ctx) || undefined,
  });
  const sent = await retryMaxApiCall(
    'start-reply',
    () => ctx.reply(buildMainMenuText(true), { attachments: [buildMainMenuKeyboard()] }),
    { retries: 3, delaysMs: [500, 1500, 3000] }
  );
  rememberBotReply(ctx, sent);
  console.log('[start] main menu sent', {
    updateType: ctx?.updateType,
    chatId: getChatKey(ctx) || undefined,
    messageId: getMessageId(sent) || undefined,
  });
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

function formatTopSearchLines(rows) {
  if (!rows.length) return ['- пока пусто'];
  return rows.map((row) => `- ${row.sample_query} — ${row.uses}`);
}

function formatTopItemLines(rows) {
  if (!rows.length) return ['- пока пусто'];
  return rows.map((row) => {
    const item = db.getById(row.item_id);
    const name =
      item?.name || row.item_name_snapshot || row.relative_path_snapshot || row.item_id;
    return `- ${name} — ${row.uses}`;
  });
}

async function renderAdminReport(ctx, days = 7) {
  const periodDays = Number(days) > 0 ? Number(days) : 0;
  const report = state.getAdminReport({ days: periodDays, topLimit: 5 });
  const users = report.users || {};
  const lines = ['🛠 Админ-отчет'];

  if (periodDays > 0) {
    lines.push(`Период: последние ${periodDays} дней (с ${String(report.since_utc || '').slice(0, 10)})`);
    lines.push('');
    lines.push('Пользователи:');
    lines.push(`- Новые: ${users.new_users || 0}`);
    lines.push(`- Активные: ${users.active_users || 0}`);
    lines.push(`- Всего за все время: ${users.total_users || 0}`);
    lines.push(`- Взаимодействий всего: ${users.total_interactions || 0}`);
  } else {
    lines.push('Период: весь доступный runtime');
    lines.push('');
    lines.push('Пользователи:');
    lines.push(`- Всего за все время: ${users.total_users || 0}`);
    lines.push(`- Взаимодействий всего: ${users.total_interactions || 0}`);
  }

  lines.push('');
  lines.push('Что чаще используют:');
  lines.push('Поиски:');
  lines.push(...formatTopSearchLines(report.top_searches || []));
  lines.push('');
  lines.push('Разделы и файлы:');
  lines.push(...formatTopItemLines(report.top_items || []));

  if ((report.top_empty_searches || []).length) {
    lines.push('');
    lines.push('Пустые запросы:');
    for (const row of report.top_empty_searches) {
      lines.push(`- ${row.sample_query} — ${row.uses}`);
    }
  }

  await replyReplacingLast(ctx, lines.join('\n'), {
    attachments: [buildAdminKeyboard(periodDays)],
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
  const title = parentId === ROOT_ID ? 'Бренд ЯМАЛ' : getRootMenuLabel(parent?.name) || parent?.name || 'Раздел';
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
    state.touchUser({
      userKey: getAnalyticsUserKey(ctx),
      senderId: getSenderId(ctx),
      chatId: getChatKey(ctx),
      displayName: getDisplayName(ctx),
    });
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

bot.use(async (ctx, next) => {
  logIncomingUpdate(ctx);
  if (ctx?.updateType === 'bot_started') {
    await safeHandle(ctx, async () => {
      await renderStartMenu(ctx);
    });
    return;
  }
  await next();
});

bot.command('start', async (ctx) => {
  await safeHandle(ctx, async () => {
    await renderStartMenu(ctx);
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
        '/myid - показать ваш ID для настройки доступа',
      ].join('\n')
    );
  });
});

bot.command('myid', async (ctx) => {
  await safeHandle(ctx, async () => {
    await replyReplacingLast(
      ctx,
      [
        'Ваш ID в боте:',
        `- sender_id: ${getSenderId(ctx) || 'не найден'}`,
        `- chat_id: ${getChatKey(ctx) || 'не найден'}`,
      ].join('\n')
    );
  });
});

bot.command('admin', async (ctx) => {
  await safeHandle(ctx, async () => {
    if (!isAdmin(ctx)) {
      await denyAdminAccess(ctx);
      return;
    }
    await renderAdminReport(ctx, 7);
  });
});

bot.command('stats', async (ctx) => {
  await safeHandle(ctx, async () => {
    if (!isAdmin(ctx)) {
      await denyAdminAccess(ctx);
      return;
    }
    await renderAdminReport(ctx, 7);
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

    m = data.match(/^admin:report:(\d+)$/i);
    if (m) {
      if (!isAdmin(ctx)) {
        await denyAdminAccess(ctx);
        return;
      }
      await renderAdminReport(ctx, Number.parseInt(m[1], 10));
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

async function startBot() {
  const botInfo = await bot.api.getMyInfo();
  console.log('[boot] bot=', {
    userId: botInfo?.user_id,
    username: botInfo?.username,
    name: botInfo?.name,
  });
  await bot.api.setMyCommands([
    { name: 'start', description: 'Открыть официальный каталог бренда Ямала' },
    { name: 'menu', description: 'Главное меню каталога' },
    { name: 'search', description: 'Поиск материалов каталога' },
    { name: 'help', description: 'Как пользоваться ботом' },
    { name: 'myid', description: 'Показать ваш ID' },
    { name: 'admin', description: 'Статистика для администратора' },
  ]);
  console.log('[boot] commands=updated');
  await bot.start();
}

startBot().catch((err) => {
  console.error('[boot] fatal', err);
  process.exit(1);
});
