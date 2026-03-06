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

test('bot reads MAX callback payload and acknowledges button clicks', () => {
  assert.match(botSource, /ctx\?\.\s*callback\?\.\s*payload/);
  assert.match(botSource, /ctx\.answerOnCallback\(\)/);
});
