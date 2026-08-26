import {
  normalizeTitle, titleSimilarity, scoreVolumeCandidate,
  AUTO_ACCEPT_SCORE, AUTO_ACCEPT_TITLE_SIM,
} from '../../utils/cvMatching.js';

describe('normalizeTitle', () => {
  test('lowercases and strips punctuation', () => {
    expect(normalizeTitle('Deadpool: The Circle Chase')).toBe('deadpool the circle chase');
  });

  test('turns hyphens into spaces like other punctuation', () => {
    // Compound-word dehyphenation ("Dead-Pool" ~ "Deadpool") is handled at the
    // titleSimilarity level (whole-string comparison), not here.
    expect(normalizeTitle('Dead-Pool- The Circle Chase')).toBe('dead pool the circle chase');
  });

  test('unifies & and and', () => {
    expect(normalizeTitle('G.I. Joe & Transformers'))
      .toBe(normalizeTitle('G.I. Joe and Transformers'));
  });

  test('handles empty input', () => {
    expect(normalizeTitle('')).toBe('');
    expect(normalizeTitle(null)).toBe('');
  });
});

describe('titleSimilarity', () => {
  test('identical titles score 1', () => {
    expect(titleSimilarity('Spawn', 'Spawn')).toBe(1);
  });

  test('local hyphen-for-colon entry matches canonical CV title', () => {
    expect(titleSimilarity('Dead-Pool- The Circle Chase', 'Deadpool: The Circle Chase'))
      .toBeGreaterThanOrEqual(AUTO_ACCEPT_TITLE_SIM);
  });

  test('tolerates typos', () => {
    expect(titleSimilarity(
      'Ghost Rider-Blaze- Spirits of Vengence',
      'Ghost Rider/Blaze: Spirits of Vengeance'
    )).toBeGreaterThanOrEqual(AUTO_ACCEPT_TITLE_SIM);
  });

  test('penalises unrelated extra tokens', () => {
    expect(titleSimilarity('X-Men', 'X-Men and the Micronauts')).toBeLessThan(0.9);
  });

  test('unrelated titles score low', () => {
    expect(titleSimilarity('Spawn', 'The Simpsons')).toBeLessThan(0.4);
  });

  test('empty input scores 0', () => {
    expect(titleSimilarity('', 'Spawn')).toBe(0);
  });
});

describe('scoreVolumeCandidate', () => {
  const series = { title: 'Ghost Rider', publisher: 'Marvel', volume: '3' };

  test('right title + publisher + plausible issue count auto-accepts', () => {
    const candidate = {
      name: 'Ghost Rider',
      publisher: { name: 'Marvel' },
      count_of_issues: 94,
    };
    const score = scoreVolumeCandidate(series, candidate, ['1', '2', '15']);
    expect(score).toBeGreaterThanOrEqual(AUTO_ACCEPT_SCORE);
  });

  test('too few issues for the owned numbers drags the score down', () => {
    const candidate = {
      name: 'Ghost Rider',
      publisher: { name: 'Marvel' },
      count_of_issues: 5,
    };
    const withPlausible = scoreVolumeCandidate(series, candidate, ['1']);
    const withImplausible = scoreVolumeCandidate(series, candidate, ['15']);
    expect(withImplausible).toBeLessThan(withPlausible);
  });

  test('publisher mismatch drags the score down', () => {
    const marvel = { name: 'Ghost Rider', publisher: { name: 'Marvel' }, count_of_issues: 94 };
    const other  = { name: 'Ghost Rider', publisher: { name: 'Dynamite' }, count_of_issues: 94 };
    expect(scoreVolumeCandidate(series, other, ['1']))
      .toBeLessThan(scoreVolumeCandidate(series, marvel, ['1']));
  });

  test('unknown publisher and issue count stay neutral', () => {
    const candidate = { name: 'Ghost Rider', publisher: null };
    const score = scoreVolumeCandidate({ title: 'Ghost Rider', publisher: '' }, candidate, []);
    expect(score).toBeGreaterThan(0.7); // perfect title, neutral rest
    expect(score).toBeLessThan(0.9);
  });

  test('wrong title never auto-accepts even with matching publisher', () => {
    const candidate = {
      name: 'Ghost Rider 2099',
      publisher: { name: 'Marvel' },
      count_of_issues: 25,
    };
    const score = scoreVolumeCandidate(series, candidate, ['1']);
    const sim = titleSimilarity(series.title, candidate.name);
    expect(score >= AUTO_ACCEPT_SCORE && sim >= AUTO_ACCEPT_TITLE_SIM).toBe(false);
  });
});
