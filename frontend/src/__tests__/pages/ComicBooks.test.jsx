import { describe, test, expect } from 'vitest';
import { groupSeriesByPublisher } from '../../pages/ComicBooks';

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
