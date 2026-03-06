import test from 'node:test';
import assert from 'node:assert/strict';
import { buttonLayoutUnits, packButtonsIntoRows } from '../src/keyboard-layout.js';

test('buttonLayoutUnits classifies button lengths for compact and long labels', () => {
  assert.equal(buttonLayoutUnits('AI'), 1);
  assert.equal(buttonLayoutUnits('Фирменный знак'), 2);
  assert.equal(buttonLayoutUnits('Сувенирная продукция'), 4);
});

test('packButtonsIntoRows keeps order and puts long labels on separate rows', () => {
  const items = [
    { label: 'Логотип' },
    { label: 'Фирменный знак' },
    { label: 'Сувенирная продукция' },
    { label: 'PNG' },
    { label: 'SVG' },
  ];

  const rows = packButtonsIntoRows(items, {
    measure: (item) => buttonLayoutUnits(item.label),
    maxButtonsPerRow: 3,
  });

  assert.deepEqual(
    rows.map((row) => row.map((item) => item.label)),
    [
      ['Логотип', 'Фирменный знак'],
      ['Сувенирная продукция'],
      ['PNG', 'SVG'],
    ]
  );
});
