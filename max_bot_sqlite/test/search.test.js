import test from 'node:test';
import assert from 'node:assert/strict';
import { buildQueryVariants, rankSearch } from '../src/search.js';

test('buildQueryVariants expands synonyms and transliteration', () => {
  const variants = buildQueryVariants('логотип');
  assert.deepEqual(variants, [
    'логотип',
    'logotip',
    'лого',
    'logo',
    'logotype',
    'brandmark',
    'знак',
    'эмблема',
  ]);
});

test('buildQueryVariants expands non-obvious user vocabulary', () => {
  assert.deepEqual(buildQueryVariants('сувенирка'), [
    'сувенирка',
    'suvenirka',
    'сувенир',
    'мерч',
    'merch',
    'подарок',
  ]);
  assert.deepEqual(buildQueryVariants('гайд'), [
    'гайд',
    'gaid',
    'брендбук',
    'гайдлайн',
    'guide',
  ]);
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
