import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const botSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'bot.js'), 'utf8');

test('bot uses MAX-specific update names for start and text messages', () => {
  assert.match(botSource, /bot\.on\('bot_started'/);
  assert.match(botSource, /bot\.on\('message_created'/);
  assert.doesNotMatch(botSource, /bot\.on\('message'/);
});

test('bot sends inline buttons as MAX attachments instead of unsupported keyboard field', () => {
  assert.match(botSource, /attachments:\s*\[buildMainMenuKeyboard\(\)\]/);
  assert.match(botSource, /attachments:\s*\[inlineKeyboardAttachment\(rows\)\]/);
  assert.match(botSource, /fileAttachment\.toJson\(\),[\s\S]*inlineKeyboardAttachment\(\[/);
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
  assert.match(botSource, /Keyboard\.button\.callback\('⬅️ Назад',\s*`open:\$\{ROOT_ID\}:0`\)/);
  assert.match(botSource, /Keyboard\.button\.callback\('🏠 Меню',\s*`open:\$\{ROOT_ID\}:0`\)/);
  assert.match(botSource, /attachments:\s*\[buildHelpKeyboard\(\)\]/);
});

test('main menu exposes dedicated search screen with quick shortcuts', () => {
  assert.match(botSource, /Keyboard\.button\.callback\('🔎 Поиск',\s*'search:main'\)/);
  assert.match(botSource, /function buildSearchKeyboard\(\)/);
  assert.match(botSource, /if \(data === 'search:main'\)/);
  assert.match(botSource, /Отправьте слово или фразу, даже если не уверены в точном названии\./);
  assert.match(botSource, /attachments:\s*\[buildSearchKeyboard\(\)\]/);
});

test('bot uses adaptive row packing for menu and folder keyboards', () => {
  assert.match(botSource, /import\s+\{\s*buttonLayoutUnits,\s*packButtonsIntoRows\s*\}\s+from '\.\/keyboard-layout\.js'/);
  assert.match(botSource, /packButtonsIntoRows\(items,\s*\{/);
  assert.match(botSource, /function buildNavigationRows\(/);
});
