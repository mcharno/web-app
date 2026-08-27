// Run with: node --test scripts/comic-admin.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseIssueList } from './comic-admin.js';

test('expands numeric ranges', () => {
  assert.deepEqual(parseIssueList('1-5'), ['1', '2', '3', '4', '5']);
});

test('mixes ranges, singles, and named issues', () => {
  assert.deepEqual(
    parseIssueList('1-3, 12, Annual 1'),
    ['1', '2', '3', '12', 'Annual 1']
  );
});

test('trims whitespace and drops empty tokens', () => {
  assert.deepEqual(parseIssueList('  4 ,, 7 - 9 '), ['4', '7', '8', '9']);
});

test('dedupes while preserving order', () => {
  assert.deepEqual(parseIssueList('3, 1-4, 3'), ['3', '1', '2', '4']);
});

test('keeps non-numeric and invalid ranges verbatim', () => {
  assert.deepEqual(parseIssueList('12a, 9-7, 0.5'), ['12a', '9-7', '0.5']);
});

test('refuses to expand absurd ranges', () => {
  assert.deepEqual(parseIssueList('1-10000'), ['1-10000']);
});

test('handles empty input', () => {
  assert.deepEqual(parseIssueList(''), []);
  assert.deepEqual(parseIssueList(null), []);
});
