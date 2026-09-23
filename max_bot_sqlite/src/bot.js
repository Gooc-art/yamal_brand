import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { Bot, Keyboard } from '@maxhub/max-bot-api';
import { config, validateConfigPaths } from './config.js';
import { CatalogDb } from './db.js';
import { buildMessageIdsToDelete, getMessageId } from './chat-cleanup.js';
import { retryMaxApiCall } from './max-api-retry.js';
import { RuntimeStateDb } from './state-db.js';
import {
  QUICK_SEARCHES,
  cleanupFolderLabel,
  decorateFolderItems,
  getQuickSearchByKey,
  getRootMenuLabel,
  getSectionHint,
  resolveRootMenuFolders,
} from './menu.js';
import { buildQueryVariants, filterExactIntentMatches, rankSearch } from './search.js';

function safeId(value) {
  return crypto.createHash('sha1').update(value, 'utf8').digest('hex').slice(0, 16);
}

const ROOT_ID = safeId('.');
validateConfigPaths(config);
const db = new CatalogDb(config.dbPath);
const state = new RuntimeStateDb(config.runtimeDbPath);
const bot = new Bot(config.token);
const lastBotMessageIds = new Map();
const adminReportChats = new Set();
const activeArchives = new Set();
const execFileAsync = promisify(execFile);
const BOT_SEARCH_EXAMPLES = 'Брендбук, Логотип, Шрифт, Паттерн';
const BOT_INTRO_TEXT = [
  'Добро пожаловать в чат-бот дизайн-материалов Ямала!',
  'Чтобы создать проект в едином стиле региона, скачайте нужные логотипы, шрифты или паттерны. Перед началом работы обязательно ознакомьтесь с правилами применения и порядком получения согласия на использование элементов мастер-бренда по ссылке: [ссылка].',
  'Выберите нужный раздел в меню ниже или отправьте команду: «Брендбук»/«Логотип»/«Шрифт»/«Паттерн».',
  'Добавляйте файлы в «Избранное», чтобы они всегда были под рукой.',
].join('\n\n');

function buildMainMenuText(intro = false) {
  return BOT_INTRO_TEXT;
}

function buildHelpText() {
  return [
    'Коротко о том, как быстрее найти и скачать нужный материал в этом боте.',
    'Выберите интересующий пункт.',
  ].join('\n\n');
}

const HELP_TOPICS = {
  navigation: 'Материалы разделены на три проекта: «Мастер-бренд Ямала», «Ямал-100» и «Фирменные стили МО». Набор зависит от проекта и может включать брендбук, логотипы, шрифты и паттерны. Вернуться в стартовое меню можно с любого экрана кнопкой «В меню», а на шаг назад – кнопкой «Назад».',
  download: 'У каждого элемента – свои форматы для скачивания в зависимости от материала. Если форматов больше одного, появляется кнопка «Скачать всё» – она даёт возможность получить все форматы одним архивом.',
  favorites: 'Кнопка «Добавить в избранное» есть у каждой категории целиком и у каждого отдельного файла. Всё, что Вы отметили, коллекционируется в разделе «Избранное» в стартовом меню.',
  search: 'Если знаете название нужного файла или элемента, отправьте его текстом в чат – бот покажет совпадения по всем разделам.',
};

function buildSearchText() {
  return [
    'Поиск по официальному каталогу бренда Ямала:',
    'Отправьте слово или фразу, даже если не уверены в точном названии материала.',
    'Можно искать брендбуки, логотипы, шрифты, паттерны и иллюстрации.',
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

function getFavoritesUserKey(ctx) {
  const chatKey = getChatKey(ctx);
  return chatKey ? `chat:${chatKey}` : getAnalyticsUserKey(ctx);
}

function isAllowed(ctx) {
  if (!config.allowedUserIds.size) return true;
  return config.allowedUserIds.has(getSenderId(ctx));
}

function isAdmin(ctx) {
  if (!config.adminUserIds.size) return false;
  return config.adminUserIds.has(getSenderId(ctx));
}

function rememberAdminReportChat(ctx) {
  const chatKey = getChatKey(ctx);
  if (!chatKey) return;
  adminReportChats.add(chatKey);
}

function hasAdminReportChat(ctx) {
  const chatKey = getChatKey(ctx);
  if (!chatKey) return false;
  return adminReportChats.has(chatKey);
}

function canUseAdminReport(ctx) {
  return isAdmin(ctx) || hasAdminReportChat(ctx);
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
      `${item.icon || '🔎'} ${truncate(displayName, 100)}`,
      `quick:${item.key}`
    );
  }
  if (item.type === 'folder') {
    return Keyboard.button.callback(
      `${item.icon || '📁'} ${truncate(displayName, 100)}`,
      `open:${item.id}:0`
    );
  }
  return Keyboard.button.callback(
    `${item.icon || '📄'} ${truncate(displayName, 100)}`,
    `file:${item.id}`
  );
}

function fileExtension(item) {
  return path.extname(String(item?.name || item?.relative_path || '')).toLowerCase().replace(/^\./, '');
}

function isPreviewableFile(item) {
  return ['png', 'jpg', 'jpeg'].includes(fileExtension(item));
}

function folderPreviewRank(item) {
  const ext = fileExtension(item);
  const name = String(item?.name || '').toLowerCase();
  let rank = { png: 0, jpg: 1, jpeg: 1, pdf: 2 }[ext];
  if (rank === undefined) return 999;
  if (/preview|превью|просмотр|cover|облож/u.test(name)) rank -= 0.5;
  return rank;
}

function pickFolderPreviewItem(items) {
  return [...items]
    .filter((item) => item.type === 'file' && isPreviewableFile(item))
    .sort((a, b) => folderPreviewRank(a) - folderPreviewRank(b) || String(a.name).localeCompare(String(b.name), 'ru'))[0] || null;
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
  return items.map((item) => [buttonForItem(item)]);
}

function buildMainMenuKeyboard() {
  const rootFolders = new Map(resolveRootMenuFolders(getRootFolders()).map((item) => [item.name, item]));
  const orderedRows = [
    [Keyboard.button.callback('ℹ️ Как пользоваться', 'help:main')],
    [Keyboard.button.callback('🔎 Поиск', 'search:main')],
  ];

  const orderedFolderNames = [
    '01 Мастер-бренд Ямала',
    '02 Ямал-100',
    '03 Фирменные стили МО',
  ];

  for (const folderName of orderedFolderNames) {
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
    [Keyboard.button.callback('🧭 Навигация по разделам', 'help:topic:navigation')],
    [Keyboard.button.callback('⬇️ Скачивание файлов', 'help:topic:download')],
    [Keyboard.button.callback('⭐ Избранное', 'help:topic:favorites')],
    [Keyboard.button.callback('🔎 Поиск', 'help:topic:search')],
    [Keyboard.button.callback('⬅️ Назад', `open:${ROOT_ID}:0`)],
    [Keyboard.button.callback('🏠 В меню', `open:${ROOT_ID}:0`)],
  ]);
}

function buildHelpTopicKeyboard() {
  return inlineKeyboardAttachment([
    [Keyboard.button.callback('⬅️ Назад', 'help:main')],
    [Keyboard.button.callback('🏠 В меню', `open:${ROOT_ID}:0`)],
  ]);
}

function buildSearchKeyboard() {
  const rows = QUICK_SEARCHES.map((item) => [
    Keyboard.button.callback(`🔎 ${item.label}`, `quick:${item.key}`),
  ]);
  rows.push([Keyboard.button.callback('⬅️ Назад', `open:${ROOT_ID}:0`)]);
  rows.push([Keyboard.button.callback('🏠 В меню', `open:${ROOT_ID}:0`)]);
  return inlineKeyboardAttachment(rows);
}

function buildAdminKeyboard(activeDays = 7) {
  const weeklyLabel = activeDays === 7 ? '✅ 7 дней' : '7 дней';
  const allTimeLabel = activeDays === 0 ? '✅ Весь период' : 'Весь период';
  return inlineKeyboardAttachment([
    [Keyboard.button.callback(`🗓 ${weeklyLabel}`, 'admin:report:7')],
    [Keyboard.button.callback(`📊 ${allTimeLabel}`, 'admin:report:0')],
    [Keyboard.button.callback('🏠 В меню', `open:${ROOT_ID}:0`)],
  ]);
}

function decorateSingleItem(item) {
  const parent = item?.parent_id ? db.getById(item.parent_id) : null;
  return decorateFolderItems(parent, [item])[0] || item;
}

function favoriteButton(ctx, item) {
  const saved = state.isFavorite(getFavoritesUserKey(ctx), item.id);
  return Keyboard.button.callback(
    saved ? '★ Удалить из избранного' : '☆ Добавить в избранное',
    `favorite:${item.id}`
  );
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
  await clearPreviousBotReply(ctx);
  const sent = await retryMaxApiCall('start-reply', () =>
    ctx.reply(buildMainMenuText(true), { attachments: [buildMainMenuKeyboard()] })
  );
  rememberBotReply(ctx, sent);
  console.log('[start] main menu sent', {
    updateType: ctx?.updateType,
    chatId: getChatKey(ctx) || undefined,
    messageId: getMessageId(sent) || undefined,
  });
}

async function renderFavorites(ctx, page = 0) {
  const allItems = state
    .listFavorites(getFavoritesUserKey(ctx))
    .map((itemId) => db.getById(itemId))
    .filter(Boolean)
    .map(decorateSingleItem);
  if (!allItems.length) {
    await replyReplacingLast(ctx, 'Избранное пока пусто.', {
      attachments: [
        inlineKeyboardAttachment([[Keyboard.button.callback('🏠 В меню', `open:${ROOT_ID}:0`)]]),
      ],
    });
    return;
  }

  const maxPage = Math.max(0, Math.ceil(allItems.length / config.pageSize) - 1);
  const pageSafe = Math.min(Math.max(0, Number(page) || 0), maxPage);
  const items = allItems.slice(pageSafe * config.pageSize, (pageSafe + 1) * config.pageSize);
  const rows = buildFolderItemRows(items);
  if (pageSafe > 0) rows.push([Keyboard.button.callback('◀️', `favorites:page:${pageSafe - 1}`)]);
  if (pageSafe < maxPage) rows.push([Keyboard.button.callback('▶️', `favorites:page:${pageSafe + 1}`)]);
  rows.push([Keyboard.button.callback('🏠 В меню', `open:${ROOT_ID}:0`)]);

  await replyReplacingLast(ctx, '⭐ Избранное\nВаши сохранённые разделы и файлы.', {
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
  rememberAdminReportChat(ctx);
  const periodDays = Number(days) > 0 ? Number(days) : 0;
  const report = state.getAdminReport({ days: periodDays, topLimit: 5 });
  const users = report.users || {};
  const stats = report.stats || {};
  const lines = ['🛠 Админ-отчет'];

  if (periodDays > 0) {
    lines.push(`Период: последние ${periodDays} дней (с ${String(report.since_utc || '').slice(0, 10)})`);
    lines.push('');
    lines.push('Пользователи:');
    lines.push(`- Новые: ${users.new_users || 0}`);
    lines.push(`- Активные: ${users.active_users || 0}`);
    lines.push(`- Всего за все время: ${users.total_users || 0}`);
    lines.push(`- Взаимодействий всего: ${users.total_interactions || 0}`);
    lines.push(`- Скачиваний файлов всего: ${stats.total_file_sends || 0}`);
  } else {
    lines.push('Период: весь доступный runtime');
    lines.push('');
    lines.push('Пользователи:');
    lines.push(`- Всего за все время: ${users.total_users || 0}`);
    lines.push(`- Взаимодействий всего: ${users.total_interactions || 0}`);
    lines.push(`- Скачиваний файлов всего: ${stats.total_file_sends || 0}`);
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
    return [[Keyboard.button.callback('🏠 В меню', `open:${ROOT_ID}:0`)]];
  }

  const rows = [];
  const pagingRow = [];
  if (page > 0) pagingRow.push(Keyboard.button.callback('◀️', `open:${parentId}:${page - 1}`));
  if ((page + 1) * pageSize < total) {
    pagingRow.push(Keyboard.button.callback('▶️', `open:${parentId}:${page + 1}`));
  }
  rows.push(...pagingRow.map((button) => [button]));

  const parent = db.getById(parentId);
  const backId = parent?.parent_id || ROOT_ID;
  rows.push([Keyboard.button.callback('⬅️ Назад', `open:${backId}:0`)]);
  rows.push([Keyboard.button.callback('🏠 В меню', `open:${ROOT_ID}:0`)]);
  return rows;
}

const FORMAT_FOLDER_NAMES = new Set(['ai', 'cdr', 'eps', 'jpg', 'jpeg', 'pdf', 'png', 'svg']);

function canDownloadAll(parentId) {
  const children = db.listAllChildren(parentId);
  if (db.listDescendantFiles(parentId).length < 2 || !children.length) return false;
  if (children.every((item) => item.type === 'folder' && FORMAT_FOLDER_NAMES.has(item.name.toLowerCase()))) {
    return true;
  }
  if (!children.every((item) => item.type === 'file')) return false;
  return new Set(children.map((item) => path.parse(item.name).name.toLowerCase())).size === 1;
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
  const title = parentId === ROOT_ID
    ? 'Бренд ЯМАЛ'
    : getRootMenuLabel(parent?.name) || cleanupFolderLabel(parent?.name) || 'Раздел';
  const rawChildren = db.listChildren(parentId, config.pageSize, offset);
  const children = decorateFolderItems(parent, rawChildren);
  const previewItem = pageClamped === 0 ? pickFolderPreviewItem(db.listAllChildren(parentId)) : null;

  const rows = buildFolderItemRows(children);
  if (canDownloadAll(parentId)) {
    rows.push([Keyboard.button.callback('⬇️ Скачать всё', `archive:${parentId}`)]);
  }
  if (parent) rows.push([favoriteButton(ctx, parent)]);
  rows.push(...buildNavigationRows(parentId, pageClamped, total, config.pageSize));
  const hint = getSectionHint(parent);

  const header = `📂 ${title}`;

  const text = children.length
    ? [header, hint].filter(Boolean).join('\n\n')
    : `${header}\n\nРаздел пуст.`;
  await renderFolderPreview(ctx, text, rows, previewItem);
  if (parent) {
    state.trackItemEvent(parent, 'open_folder');
  }
}

function resolveCatalogFilePath(item) {
  const fullPath = path.resolve(
    config.rootPath,
    item.relative_path === '.' ? '' : item.relative_path
  );
  const relativeToRoot = path.relative(config.rootPath, fullPath);

  if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
    return { error: 'Некорректный путь файла.' };
  }
  if (!fs.existsSync(fullPath)) {
    return { error: 'Файл отсутствует на диске.' };
  }
  return { fullPath };
}

async function buildImagePreviewAttachment(item) {
  const resolved = resolveCatalogFilePath(item);
  if (resolved.error) return { error: resolved.error };
  if (!['png', 'jpg', 'jpeg'].includes(fileExtension(item))) return { attachment: null };

  const imageAttachment = await retryMaxApiCall(
    'uploadImage',
    () => bot.api.uploadImage({ source: fs.createReadStream(resolved.fullPath) }),
    { retries: 3, delaysMs: [400, 1200, 2400] }
  );
  const attachmentJson = await retryMaxApiCall(
    'imageAttachmentToJson',
    async () => imageAttachment.toJson(),
    { retries: 3, delaysMs: [300, 900, 1800] }
  );
  return { attachment: attachmentJson };
}

async function renderFolderPreview(ctx, text, rows, previewItem) {
  const keyboard = inlineKeyboardAttachment(rows);
  if (!previewItem) {
    await replyReplacingLast(ctx, text, { attachments: [keyboard] });
    return;
  }

  const previewText = [
    text,
    '',
    `Предпросмотр варианта: ${previewItem.name}`,
    'Выберите нужный формат ниже.',
  ].join('\n');

  if (['png', 'jpg', 'jpeg'].includes(fileExtension(previewItem))) {
    try {
      const imagePreview = await buildImagePreviewAttachment(previewItem);
      if (imagePreview.attachment) {
        await replyReplacingLast(ctx, previewText, {
          attachments: [imagePreview.attachment, keyboard],
        });
        return;
      }
    } catch (err) {
      console.error('[renderFolderPreview] image preview failed', err);
    }
  }

  await replyReplacingLast(ctx, previewText, { attachments: [keyboard] });
}

async function previewFileById(ctx, fileId) {
  const item = db.getById(fileId);
  if (!item || item.type !== 'file') {
    await replyReplacingLast(ctx, 'Файл не найден.');
    return;
  }

  const resolved = resolveCatalogFilePath(item);
  if (resolved.error) {
    await replyReplacingLast(ctx, resolved.error);
    return;
  }

  const extension = fileExtension(item).toUpperCase();
  const backParent = item.parent_id || ROOT_ID;
  const text = [
    `${isPreviewableFile(item) ? '👁 Предпросмотр' : '📄 Файл'}: ${item.name}`,
    `Формат: ${extension}`,
    'Нажмите «Скачать», чтобы получить исходный файл.',
  ].join('\n');
  const keyboard = inlineKeyboardAttachment([
    [Keyboard.button.callback('⬇️ Скачать', `download:${item.id}`)],
    [favoriteButton(ctx, item)],
    [Keyboard.button.callback('⬅️ К разделу', `open:${backParent}:0`)],
    [Keyboard.button.callback('🏠 В меню', `open:${ROOT_ID}:0`)],
  ]);

  if (['png', 'jpg', 'jpeg'].includes(fileExtension(item))) {
    try {
      const imagePreview = await buildImagePreviewAttachment(item);
      await replyReplacingLast(ctx, text, {
        attachments: [imagePreview.attachment, keyboard],
      });
      return;
    } catch (err) {
      console.error('[previewFileById] image preview failed', err);
    }
  }

  await replyReplacingLast(ctx, text, {
    attachments: [keyboard],
  });
}

async function sendFileById(ctx, fileId) {
  const item = db.getById(fileId);
  if (!item || item.type !== 'file') {
    await replyReplacingLast(ctx, 'Файл не найден.');
    return;
  }

  const resolved = resolveCatalogFilePath(item);
  if (resolved.error) {
    await replyReplacingLast(ctx, resolved.error);
    return;
  }

  try {
    const fileAttachment = await retryMaxApiCall(
      'uploadFile',
      () => bot.api.uploadFile({ source: fs.createReadStream(resolved.fullPath) }),
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
          [Keyboard.button.callback('🏠 В меню', `open:${ROOT_ID}:0`)],
        ]),
      ],
    });
    state.trackItemEvent(item, 'send_file');
  } catch (err) {
    await replyReplacingLast(ctx, 'Не удалось отправить файл. Проверь размер/доступность файла.');
    console.error('[sendFileById] upload failed', err);
  }
}

async function sendFolderArchive(ctx, folderId) {
  const item = db.getById(folderId);
  if (!item || item.type !== 'folder' || !canDownloadAll(folderId)) {
    await replyReplacingLast(ctx, 'Архив недоступен.');
    return;
  }
  const resolved = resolveCatalogFilePath(item);
  if (resolved.error) {
    await replyReplacingLast(ctx, resolved.error);
    return;
  }

  if (activeArchives.size || activeArchives.has(folderId)) {
    await replyReplacingLast(ctx, 'Архив уже создаётся. Попробуйте чуть позже.');
    return;
  }
  const files = db.listDescendantFiles(folderId);
  const totalBytes = files.reduce((sum, file) => {
    const filePath = resolveCatalogFilePath(file);
    return sum + (filePath.error ? 0 : fs.statSync(filePath.fullPath).size);
  }, 0);
  // ponytail: 100 MiB input cap; raise it only after MAX upload limits are verified in production.
  if (totalBytes > 100 * 1024 * 1024) {
    await replyReplacingLast(ctx, 'Архив слишком большой. Скачайте форматы по отдельности.');
    return;
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yamal-archive-'));
  const archiveName = item.name.replace(/[^0-9a-zа-я._ -]+/giu, '_').slice(0, 80) || 'files';
  const archiveBase = path.join(tempDir, archiveName);
  const archivePath = `${archiveBase}.zip`;
  activeArchives.add(folderId);
  try {
    await execFileAsync('python3', [
      '-c',
      'import shutil,sys; shutil.make_archive(sys.argv[1], "zip", root_dir=sys.argv[2])',
      archiveBase,
      resolved.fullPath,
    ]);
    const attachment = await retryMaxApiCall(
      'uploadArchive',
      () => bot.api.uploadFile({ source: fs.createReadStream(archivePath) }),
      { retries: 3, delaysMs: [400, 1200, 2400] }
    );
    const attachmentJson = await retryMaxApiCall('archiveAttachmentToJson', () => attachment.toJson());
    await replyReplacingLast(ctx, `🗜️ ${item.name}.zip`, {
      attachments: [
        attachmentJson,
        inlineKeyboardAttachment([
          [Keyboard.button.callback('⬅️ К разделу', `open:${item.id}:0`)],
          [Keyboard.button.callback('🏠 В меню', `open:${ROOT_ID}:0`)],
        ]),
      ],
    });
  } catch (err) {
    console.error('[sendFolderArchive] failed', err);
    await replyReplacingLast(ctx, 'Не удалось создать архив.');
  } finally {
    activeArchives.delete(folderId);
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

async function runSearch(ctx, query) {
  const variants = buildQueryVariants(query);
  if (!variants.length) {
    await replyReplacingLast(ctx, 'Введите запрос для поиска.');
    return;
  }

  const direct = filterExactIntentMatches(
    query,
    db.searchByVariants(variants, true, config.maxSearchResults * 5)
  );
  const fuzzyPool = filterExactIntentMatches(query, db.allSearchCandidates(true, 2000));
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
        attachments: [inlineKeyboardAttachment([[Keyboard.button.callback('🏠 В меню', `open:${ROOT_ID}:0`)]])],
      }
    );
    return;
  }

  const rows = items.map((item) => [buttonForItem(item)]);
  rows.push([Keyboard.button.callback('🏠 В меню', `open:${ROOT_ID}:0`)]);

  await replyReplacingLast(
    ctx,
    [
      `🔎 Найдено: ${items.length} (запрос: ${query})`,
      'Папки открываются, для PNG, JPG и PDF сначала показывается предпросмотр.',
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
    await replyReplacingLast(ctx, buildHelpText(), { attachments: [buildHelpKeyboard()] });
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
      await previewFileById(ctx, m[1].toLowerCase());
      return;
    }

    m = data.match(/^download:([a-f0-9]{16})$/i);
    if (m) {
      await sendFileById(ctx, m[1].toLowerCase());
      return;
    }

    m = data.match(/^archive:([a-f0-9]{16})$/i);
    if (m) {
      await sendFolderArchive(ctx, m[1].toLowerCase());
      return;
    }

    m = data.match(/^favorite:([a-f0-9]{16})$/i);
    if (m) {
      const item = db.getById(m[1].toLowerCase());
      if (!item) {
        await replyReplacingLast(ctx, 'Материал не найден.');
        return;
      }
      state.toggleFavorite(getFavoritesUserKey(ctx), item.id);
      if (item.type === 'folder') await renderFolder(ctx, item.id, 0);
      else await previewFileById(ctx, item.id);
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

    m = data.match(/^help:topic:(navigation|download|favorites|search)$/i);
    if (m) {
      await replyReplacingLast(ctx, HELP_TOPICS[m[1].toLowerCase()], {
        attachments: [buildHelpTopicKeyboard()],
      });
      return;
    }

    if (data === 'favorites:main') {
      await renderFavorites(ctx);
      return;
    }

    m = data.match(/^favorites:page:(\d+)$/i);
    if (m) {
      await renderFavorites(ctx, Number.parseInt(m[1], 10));
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
      if (!canUseAdminReport(ctx)) {
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
