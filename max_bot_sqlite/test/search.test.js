import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildQueryVariants,
  filterExactIntentMatches,
  rankSearch,
  swapKeyboardLayout,
} from '../src/search.js';

test('buildQueryVariants expands synonyms and transliteration', () => {
  const variants = buildQueryVariants('логотип');
  assert.deepEqual(
    ['логотип', 'logotip', 'лого', 'logo', 'logotype', 'brandmark', 'знак', 'эмблема'].every(
      (item) => variants.includes(item)
    ),
    true
  );
});

test('buildQueryVariants expands non-obvious user vocabulary', () => {
  const souvenir = buildQueryVariants('сувенирка');
  assert.deepEqual(
    ['сувенирка', 'suvenirka', 'сувенир', 'мерч', 'merch', 'подарок'].every((item) =>
      souvenir.includes(item)
    ),
    true
  );

  const guide = buildQueryVariants('гайд');
  assert.deepEqual(
    ['гайд', 'gaid', 'брендбук', 'гайдлайн', 'guide'].every((item) => guide.includes(item)),
    true
  );

  const merch = buildQueryVariants('наклейка');
  assert.deepEqual(
    ['наклейка', 'stiker', 'стикер', 'наклейки'].every((item) => merch.includes(item)),
    true
  );

  const digital = buildQueryVariants('диджитал');
  assert.deepEqual(
    ['диджитал', 'prezentaciya', 'презентация', 'соцсети'].every((item) =>
      digital.includes(item)
    ),
    true
  );
});

test('buildQueryVariants corrects wrong keyboard layout', () => {
  assert.equal(swapKeyboardLayout('kjujnbg'), 'логотип');
  assert.equal(buildQueryVariants('kjujnbg').includes('логотип'), true);
});

test('exact brandbook search excludes descendants that only inherit the word from their path', () => {
  const rows = [
    { id: 'book', name: 'Брендбук Ямал.pdf', normalized_name: 'брендбук ямал' },
    { id: 'logo', name: 'Логотип.svg', normalized_name: 'логотип', normalized_path: 'брендбук ямал логотип' },
  ];

  assert.deepEqual(filterExactIntentMatches('брендбук', rows).map((row) => row.id), ['book']);
  assert.equal(filterExactIntentMatches('логотип', rows).length, 2);
});

test('rankSearch prefers exact and more relevant matches', () => {
  const rows = [
    {
      id: '1',
      name: 'Логотип Ямал',
      normalized_name: 'логотип ямал',
      normalized_path: 'логотип логотип ямал cdr',
      depth: 1,
    },
    {
      id: '2',
      name: 'Брендбук',
      normalized_name: 'брендбук',
      normalized_path: 'брендбук ямал pdf',
      depth: 1,
    },
    {
      id: '3',
      name: 'Логотип города',
      normalized_name: 'логотип города',
      normalized_path: 'логотипы городов логотип города svg',
      depth: 2,
    },
  ];

  const ranked = rankSearch('логотип', rows, 10);
  assert.equal(ranked[0].id, '1');
  assert.equal(ranked[1].id, '3');
  assert.ok(ranked.every((item) => item.score >= 0.35));
});

test('rankSearch tolerates typos and layout mistakes', () => {
  const rows = [
    {
      id: '1',
      name: 'Логотип Ямал',
      normalized_name: 'логотип ямал',
      normalized_path: 'логотип логотип ямал cdr',
      search_text: 'логотип ямал logo logotip',
      depth: 1,
    },
    {
      id: '2',
      name: 'Брендбук Ямал',
      normalized_name: 'брендбук ямал',
      normalized_path: 'брендбук ямал pdf',
      search_text: 'брендбук ямал brandbook guide',
      depth: 1,
    },
  ];

  assert.equal(rankSearch('логотип', rows, 10)[0]?.id, '1');
  assert.equal(rankSearch('kjujnbg', rows, 10)[0]?.id, '1');
  assert.equal(rankSearch('брендбк', rows, 10)[0]?.id, '2');
});
