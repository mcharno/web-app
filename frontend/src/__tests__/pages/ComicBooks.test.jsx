import { describe, test, expect } from 'vitest';
import { groupSeriesByPublisher, truncateDescription } from '../../pages/ComicBooks';

const series = (publisher, id = publisher || 'unpublished') => ({ id, title: id, publisher });

describe('groupSeriesByPublisher', () => {
  test('groups with no publisher at all render as a single section', () => {
    const list = [series(''), series('')];
    const { isMulti, sections } = groupSeriesByPublisher(list);
    expect(isMulti).toBe(false);
    expect(sections).toHaveLength(1);
    expect(sections[0].publisher).toBeNull();
    expect(sections[0].series).toEqual(list);
  });

  test('a single real publisher (even mixed with blanks) stays a single section', () => {
    const list = [series('Marvel', 'a'), series('', 'b'), series('Marvel', 'c')];
    const { isMulti, sections } = groupSeriesByPublisher(list);
    expect(isMulti).toBe(false);
    expect(sections).toHaveLength(1);
    expect(sections[0].series).toEqual(list);
  });

  test('two or more real publishers split into one section each, sorted', () => {
    const list = [series('Midway', 'a'), series('Malibu', 'b')];
    const { isMulti, sections } = groupSeriesByPublisher(list);
    expect(isMulti).toBe(true);
    expect(sections.map(s => s.publisher)).toEqual(['Malibu', 'Midway']);
    expect(sections[0].series).toEqual([list[1]]);
    expect(sections[1].series).toEqual([list[0]]);
  });

  test('blank-publisher series are bucketed into a trailing "Other" section when multi', () => {
    const list = [series('Marvel', 'a'), series('Image', 'b'), series('', 'c')];
    const { isMulti, sections } = groupSeriesByPublisher(list);
    expect(isMulti).toBe(true);
    expect(sections.map(s => s.publisher)).toEqual(['Image', 'Marvel', null]);
    expect(sections.at(-1).series).toEqual([list[2]]);
  });

  test('no trailing "Other" section when there are no blank-publisher series', () => {
    const list = [series('Marvel', 'a'), series('Image', 'b')];
    const { sections } = groupSeriesByPublisher(list);
    expect(sections.some(s => s.publisher === null)).toBe(false);
  });

  test('handles an empty or missing series list', () => {
    expect(groupSeriesByPublisher([])).toEqual({ isMulti: false, sections: [{ publisher: null, series: [] }] });
    expect(groupSeriesByPublisher(undefined)).toEqual({ isMulti: false, sections: [{ publisher: null, series: [] }] });
  });
});

describe('truncateDescription', () => {
  test('returns null for missing or empty descriptions', () => {
    expect(truncateDescription(null)).toBeNull();
    expect(truncateDescription('')).toBeNull();
    expect(truncateDescription('<p></p>')).toBeNull();
  });

  test('returns short text unchanged, HTML stripped', () => {
    // stripHtml() turns each tag into a space, so a tag hard against
    // punctuation (</b>.) leaves a space before it — pre-existing behavior.
    expect(truncateDescription('<p>Ghost Rider fights <b>Blackout</b></p>'))
      .toBe('Ghost Rider fights Blackout');
  });

  test('leaves text at exactly the limit unchanged', () => {
    const text = 'a'.repeat(200);
    expect(truncateDescription(text, 200)).toBe(text);
  });

  test('cuts at a word boundary and appends an ellipsis when over the limit', () => {
    const text = 'Johnny Blaze makes a deal with Mephisto and becomes the Ghost Rider, a spirit of vengeance bound to punish the wicked';
    const result = truncateDescription(text, 60);
    expect(result.endsWith('…')).toBe(true);
    expect(result.length).toBeLessThanOrEqual(61); // 60 chars + ellipsis
    // never cuts a word in half
    const withoutEllipsis = result.slice(0, -1);
    expect(text.startsWith(withoutEllipsis)).toBe(true);
    expect(text[withoutEllipsis.length]).toBe(' ');
  });

  test('falls back to a hard cut when there is no space within the budget', () => {
    const text = 'a'.repeat(300);
    const result = truncateDescription(text, 60);
    expect(result).toBe(`${'a'.repeat(60)}…`);
  });
});
