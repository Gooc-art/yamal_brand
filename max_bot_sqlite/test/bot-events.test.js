import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const botSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'bot.js'), 'utf8');

test('bot uses MAX-specific update names for start and text messages', () => {
  assert.match(botSource, /ctx\?\.\s*updateType === 'bot_started'/);
  assert.match(botSource, /bot\.on\('message_created'/);
  assert.doesNotMatch(botSource, /bot\.on\('message'/);
});

test('bot logs sanitized incoming update metadata for production diagnostics', () => {
  assert.match(botSource, /function logIncomingUpdate\(ctx\)/);
  assert.match(botSource, /console\.log\('\[update\]'/);
  assert.match(botSource, /hasText:\s*Boolean\(getMessageText\(ctx\)\)/);
  assert.match(botSource, /hasPayload:\s*Boolean\(getCallbackData\(ctx\)\)/);
  assert.doesNotMatch(botSource, /text:\s*getMessageText\(ctx\)/);
});

test('bot publishes MAX command hints on startup', () => {
  assert.match(botSource, /await bot\.api\.getMyInfo\(\)/);
  assert.match(botSource, /await bot\.api\.setMyCommands\(\[/);
  assert.match(botSource, /name:\s*'start'/);
  assert.match(botSource, /name:\s*'admin'/);
  assert.match(botSource, /\[boot\] commands=updated/);
});

test('bot handles MAX start button before generic event routing', () => {
  assert.match(botSource, /async function renderStartMenu\(ctx\)/);
  assert.match(botSource, /\[start\] sending main menu/);
  assert.match(botSource, /await clearPreviousBotReply\(ctx\)/);
  assert.match(botSource, /\[start\] main menu sent/);
  assert.match(
    botSource,
    /if \(ctx\?\.\s*updateType === 'bot_started'\) \{[\s\S]*await renderStartMenu\(ctx\);[\s\S]*return;/
  );
});

test('bot sends inline buttons as MAX attachments instead of unsupported keyboard field', () => {
  assert.match(botSource, /attachments:\s*\[buildMainMenuKeyboard\(\)\]/);
  assert.match(botSource, /attachments:\s*\[inlineKeyboardAttachment\(rows\)\]/);
  assert.match(botSource, /attachments:\s*\[\s*attachmentJson,\s*[\s\S]*inlineKeyboardAttachment\(\[/);
  assert.doesNotMatch(botSource, /keyboard:\s*Keyboard\.inlineKeyboard/);
});

test('bot reads MAX callback payload directly from MAX update fields', () => {
  assert.match(botSource, /ctx\?\.\s*callback\?\.\s*payload/);
  assert.doesNotMatch(botSource, /ctx\.answerOnCallback\(/);
});

test('bot replaces previous bot reply before sending a new one', () => {
  assert.match(botSource, /const lastBotMessageIds = new Map\(\)/);
  assert.match(botSource, /await clearPreviousBotReply\(ctx,\s*\{\s*deleteCurrentMessage:\s*ctx\?\.\s*updateType === 'message_callback'/);
  assert.match(botSource, /rememberBotReply\(ctx,\s*sent\)/);
});

test('help screen includes back and menu buttons', () => {
  assert.match(botSource, /function buildHelpKeyboard\(\)/);
  assert.match(botSource, /Keyboard\.button\.callback\('⬅️ Назад'/);
  assert.match(botSource, /Keyboard\.button\.callback\('🏠 В меню'/);
  assert.match(botSource, /open:\$\{ROOT_ID\}:0/);
  assert.match(botSource, /attachments:\s*\[buildHelpKeyboard\(\)\]/);
});

test('main menu exposes dedicated search screen with quick shortcuts', () => {
  assert.match(botSource, /Keyboard\.button\.callback\('🔎 Поиск',\s*'search:main'\)/);
  assert.match(botSource, /function buildSearchKeyboard\(\)/);
  assert.match(botSource, /function buildSearchText\(\)/);
  assert.match(botSource, /if \(data === 'search:main'\)/);
  assert.match(botSource, /Поиск по официальному каталогу бренда Ямала:/);
  assert.match(botSource, /Отправьте слово или фразу, даже если не уверены в точном названии материала\./);
  assert.match(botSource, /attachments:\s*\[buildSearchKeyboard\(\)\]/);
});

test('main menu uses the agreed top-level button order', () => {
  assert.match(botSource, /const orderedFolderNames = \[/);
  assert.match(
    botSource,
    /'01 Мастер-бренд Ямала',[\s\S]*'02 Ямал-100',[\s\S]*'03 Фирменные стили МО'/
  );
  assert.match(botSource, /Keyboard\.button\.callback\('ℹ️ Как пользоваться',\s*'help:main'\)/);
  assert.match(botSource, /Keyboard\.button\.callback\('⭐ Избранное',\s*'favorites:main'\)/);
});

test('bot uses the approved PDF onboarding and help topics', () => {
  assert.match(botSource, /function buildMainMenuText\(intro = false\)/);
  assert.match(botSource, /const BOT_INTRO_TEXT = \[/);
  assert.match(botSource, /Добро пожаловать в чат-бот дизайн-материалов Ямала!/);
  assert.match(botSource, /\[ссылка\]/);
  assert.match(botSource, /function buildHelpText\(\)/);
  assert.match(botSource, /const HELP_TOPICS = \{/);
  assert.match(botSource, /help:topic:navigation/);
  assert.match(botSource, /help:topic:download/);
  assert.match(botSource, /help:topic:favorites/);
  assert.match(botSource, /help:topic:search/);
});

test('main menu exposes favorites screen and tracks runtime usage', () => {
  assert.match(botSource, /Keyboard\.button\.callback\('⭐ Избранное',\s*'favorites:main'\)/);
  assert.match(botSource, /if \(data === 'favorites:main'\)/);
  assert.match(botSource, /async function renderFavorites\(ctx,\s*page = 0\)/);
  assert.match(botSource, /state\s*\.listFavorites\(/);
  assert.match(botSource, /state\.toggleFavorite\(/);
  assert.match(botSource, /function getFavoritesUserKey\(ctx\)/);
  assert.match(botSource, /return chatKey \? `chat:\$\{chatKey\}` : getAnalyticsUserKey\(ctx\)/);
  assert.match(botSource, /state\.touchUser\(\{/);
  assert.match(botSource, /state\.logSearch\(query,\s*items\.length\)/);
  assert.match(botSource, /state\.trackItemEvent\(parent,\s*'open_folder'\)/);
  assert.match(botSource, /state\.trackItemEvent\(item,\s*'send_file'\)/);
  assert.match(botSource, /async function previewFileById\(ctx,\s*fileId\)/);
  assert.match(botSource, /function pickFolderPreviewItem\(items\)/);
  assert.match(botSource, /async function renderFolderPreview\(ctx,\s*text,\s*rows,\s*previewItem\)/);
  assert.match(botSource, /db\.listAllChildren\(parentId\)/);
  assert.match(botSource, /Keyboard\.button\.callback\('⬇️ Скачать',\s*`download:\$\{item\.id\}`\)/);
  assert.match(botSource, /m = data\.match\(\/\^download:\(\[a-f0-9\]\{16\}\)\$\/i\);/);
  assert.match(botSource, /await previewFileById\(ctx,\s*m\[1\]\.toLowerCase\(\)\)/);
});

test('bot exposes admin analytics commands and callback actions', () => {
  assert.match(botSource, /function isAdmin\(ctx\)/);
  assert.match(botSource, /function canUseAdminReport\(ctx\)/);
  assert.match(botSource, /const adminReportChats = new Set\(\)/);
  assert.doesNotMatch(botSource, /ADMIN_REPORT_SESSION_TTL_MS/);
  assert.match(botSource, /bot\.command\('admin'/);
  assert.match(botSource, /bot\.command\('stats'/);
  assert.match(botSource, /async function renderAdminReport\(ctx,\s*days = 7\)/);
  assert.match(botSource, /Взаимодействий всего:/);
  assert.match(botSource, /Keyboard\.button\.callback\(`🗓 \$\{weeklyLabel\}`,\s*'admin:report:7'\)/);
  assert.match(botSource, /Keyboard\.button\.callback\(`📊 \$\{allTimeLabel\}`,\s*'admin:report:0'\)/);
  assert.match(botSource, /m = data\.match\(\/\^admin:report:\(\\d\+\)\$\/i\);/);
  assert.match(botSource, /if \(!canUseAdminReport\(ctx\)\)/);
});

test('bot can show the current user id inside the chat', () => {
  assert.match(botSource, /bot\.command\('myid'/);
  assert.match(botSource, /Ваш ID в боте:/);
  assert.match(botSource, /sender_id:/);
  assert.match(botSource, /chat_id:/);
});

test('main menu uses only the three new catalog roots', () => {
  assert.doesNotMatch(botSource, /const fontShortcut = getMainMenuQuickSearches/);
});

test('search empty state shows custom text and menu button', () => {
  assert.match(botSource, /'Пупупу\.\.\.\.пусто'/);
  assert.match(botSource, /Keyboard\.button\.callback\('🏠 В меню',\s*`open:\$\{ROOT_ID\}:0`\)/);
});

test('bot renders every inline button as a full-width row', () => {
  assert.doesNotMatch(botSource, /packButtonsIntoRows/);
  assert.match(botSource, /return items\.map\(\(item\) => \[buttonForItem\(item\)\]\)/);
  assert.match(botSource, /rows\.push\(\.\.\.pagingRow\.map\(\(button\) => \[button\]\)\)/);
  assert.match(botSource, /function buildNavigationRows\(/);
});

test('bot hides counters and supports personal favorites plus multi-format archives', () => {
  assert.doesNotMatch(botSource, /Элементов:/);
  assert.doesNotMatch(botSource, /Страница:/);
  assert.match(botSource, /⬇️ Скачать всё/);
  assert.match(botSource, /favorites:page:/);
  assert.match(botSource, /100 \* 1024 \* 1024/);
});

test('bot wraps MAX API calls with retry helper for transient failures', () => {
  assert.match(botSource, /import\s+\{\s*retryMaxApiCall\s*\}\s+from '\.\/max-api-retry\.js'/);
  assert.match(botSource, /retryMaxApiCall\('reply',\s*\(\)\s*=>\s*ctx\.reply\(text,\s*extra\)\)/);
  assert.match(botSource, /retryMaxApiCall\(\s*'uploadFile'/);
  assert.match(botSource, /retryMaxApiCall\(\s*'uploadImage'/);
  assert.match(botSource, /retryMaxApiCall\(\s*'attachmentToJson'/);
});
