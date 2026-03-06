function textLength(value) {
  return String(value || '').trim().length;
}

export function buttonLayoutUnits(label) {
  const length = textLength(label);
  if (length <= 8) return 1;
  if (length <= 18) return 2;
  return 4;
}

export function packButtonsIntoRows(items, options = {}) {
  const {
    measure = buttonLayoutUnits,
    maxUnits = 4,
    maxButtonsPerRow = 3,
  } = options;

  const rows = [];
  let row = [];
  let rowUnits = 0;

  for (const item of items) {
    const units = Math.max(1, Math.min(maxUnits, Number(measure(item)) || 1));
    const shouldWrap =
      row.length > 0 && (rowUnits + units > maxUnits || row.length >= maxButtonsPerRow);

    if (shouldWrap) {
      rows.push(row);
      row = [];
      rowUnits = 0;
    }

    row.push(item);
    rowUnits += units;

    if (units >= maxUnits) {
      rows.push(row);
      row = [];
      rowUnits = 0;
    }
  }

  if (row.length) {
    rows.push(row);
  }

  return rows;
}
