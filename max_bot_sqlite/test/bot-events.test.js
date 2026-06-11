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
  assert.match(botSource, /Keyboard\.button\.callback\('🏠 Меню'/);
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
    /'Логотип',[\s\S]*'Детский логотип',[\s\S]*'Фирменный знак',[\s\S]*'Брендбук ЯМАЛ Мастер бренд',[\s\S]*'Паттерны',[\s\S]*'Иллюстрации мастер-бренда SVG-элементы'/
  );
  assert.match(botSource, /Keyboard\.button\.callback\('ℹ️ Как пользоваться',\s*'help:main'\)/);
  assert.match(botSource, /Keyboard\.button\.callback\('⭐ Избранное',\s*'favorites:main'\)/);
});

test('bot onboarding clearly explains official regional brand catalog context', () => {
  assert.match(botSource, /function buildMainMenuText\(intro = false\)/);
  assert.match(botSource, /const BOT_INTRO_TEXT = \[/);
  assert.match(botSource, /Привет! Добро пожаловать в официальный каталог бренда Ямала\./);
  assert.match(botSource, /элементы регионального бренда Ямала в своей деятельности/);
  assert.match(botSource, /которые помогут вам в реализации проектов в регионе и продвижении вашего бизнеса/);
  assert.match(botSource, /• Ознакомиться с верхними разделами каталога\./);
  assert.match(botSource, /• Добавить интересующие материалы в Избранное\./);
  assert.match(botSource, /• Использовать функцию Поиск для быстрого нахождения нужной информации\./);
  assert.match(botSource, /Просто отправьте текст: Логотип, Брендбук, Паттерн, Шрифт, Сувенир — и получите доступ к необходимым ресурсам для успешного использования официального бренда Ямала\./);
  assert.match(botSource, /function buildHelpText\(\)/);
  assert.match(botSource, /Как пользоваться этим ботом/);
  assert.match(botSource, /На главном экране выберите нужный раздел: «Логотип», «Фирменный знак», «Детский логотип», «Мастер-бренд», «Паттерны», «Иллюстрации», «Шрифт», «Сувенирная продукция»\./);
  assert.match(botSource, /Если вы ищете конкретный элемент, воспользуйтесь кнопкой «Поиск» и введите ключевое слово \(например: «логотип», «паттерн»\)\./);
  assert.match(botSource, /Чтобы быстро возвращаться к важным материалам, добавляйте их в «Избранное» и открывайте их через кнопку «Избранное»\./);
  assert.match(botSource, /Вы также можете просто отправить текстовый запрос \(например: «логотип Ямал», «брендбук Ямал 100», «шрифт», «сувенирная продукция»\) — бот подберёт соответствующие материалы и отправит их в чат\./);
  assert.match(botSource, /Все выбранные файлы и ссылки бот отправляет вам прямо в этот чат\./);
});

test('main menu exposes favorites screen and tracks runtime usage', () => {
  assert.match(botSource, /Keyboard\.button\.callback\('⭐ Избранное',\s*'favorites:main'\)/);
  assert.match(botSource, /if \(data === 'favorites:main'\)/);
  assert.match(botSource, /async function renderFavorites\(ctx\)/);
  assert.match(botSource, /state\.touchUser\(\{/);
  assert.match(botSource, /state\.logSearch\(query,\s*items\.length\)/);
  assert.match(botSource, /state\.trackItemEvent\(parent,\s*'open_folder'\)/);
  assert.match(botSource, /state\.trackItemEvent\(item,\s*'send_file'\)/);
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
  assert.match(botSource, /\/myid - показать ваш ID для настройки доступа/);
  assert.match(botSource, /Ваш ID в боте:/);
  assert.match(botSource, /sender_id:/);
  assert.match(botSource, /chat_id:/);
});

test('main menu keeps only quick font shortcut instead of root font folder button', () => {
  assert.match(botSource, /item\.type === 'quick'/);
  assert.match(botSource, /`quick:\$\{item\.key\}`/);
  assert.match(botSource, /const fontShortcut = getMainMenuQuickSearches\(\)\[0\]/);
  assert.match(botSource, /buttonForItem\(\{\s*type:\s*'quick'/);
});

test('search empty state shows custom text and menu button', () => {
  assert.match(botSource, /'Пупупу\.\.\.\.пусто'/);
  assert.match(botSource, /Keyboard\.button\.callback\('🏠 Меню',\s*`open:\$\{ROOT_ID\}:0`\)/);
});

test('bot uses adaptive row packing for menu and folder keyboards', () => {
  assert.match(botSource, /import\s+\{\s*buttonLayoutUnits,\s*packButtonsIntoRows\s*\}\s+from '\.\/keyboard-layout\.js'/);
  assert.match(botSource, /packButtonsIntoRows\(items,\s*\{/);
  assert.match(botSource, /function buildNavigationRows\(/);
});

test('bot wraps MAX API calls with retry helper for transient failures', () => {
  assert.match(botSource, /import\s+\{\s*retryMaxApiCall\s*\}\s+from '\.\/max-api-retry\.js'/);
  assert.match(botSource, /retryMaxApiCall\('reply',\s*\(\)\s*=>\s*ctx\.reply\(text,\s*extra\)\)/);
  assert.match(botSource, /retryMaxApiCall\(\s*'uploadFile'/);
  assert.match(botSource, /retryMaxApiCall\(\s*'attachmentToJson'/);
});
