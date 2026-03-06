export function getMessageId(message) {
  const value = message?.body?.mid || message?.message?.body?.mid;
  if (value === undefined || value === null) return '';
  return String(value);
}

export function buildMessageIdsToDelete({ trackedId = '', currentMessageId = '', deleteCurrentMessage = false } = {}) {
  const ids = [];
  if (deleteCurrentMessage && currentMessageId) ids.push(String(currentMessageId));
  if (trackedId) ids.push(String(trackedId));
  return [...new Set(ids)];
}
