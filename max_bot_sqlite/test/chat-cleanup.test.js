import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMessageIdsToDelete, getMessageId } from '../src/chat-cleanup.js';

test('getMessageId reads MAX message id from direct and nested responses', () => {
  assert.equal(getMessageId({ body: { mid: 'direct-mid' } }), 'direct-mid');
  assert.equal(getMessageId({ message: { body: { mid: 'nested-mid' } } }), 'nested-mid');
  assert.equal(getMessageId({}), '');
});

test('buildMessageIdsToDelete deduplicates tracked and current bot message ids', () => {
  assert.deepEqual(
    buildMessageIdsToDelete({
      trackedId: 'bot-1',
      currentMessageId: 'bot-1',
      deleteCurrentMessage: true,
    }),
    ['bot-1']
  );

  assert.deepEqual(
    buildMessageIdsToDelete({
      trackedId: 'bot-1',
      currentMessageId: 'bot-2',
      deleteCurrentMessage: true,
    }),
    ['bot-2', 'bot-1']
  );

  assert.deepEqual(
    buildMessageIdsToDelete({
      trackedId: 'bot-1',
      currentMessageId: 'user-1',
      deleteCurrentMessage: false,
    }),
    ['bot-1']
  );
});
