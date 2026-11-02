import { applyArtVisibility } from '../../utils/romImageFilter.js';

const game = (flags = {}) => ({
  id: 1,
  box_art_url: '/images/roms/1-box.jpg',
  screenshots: ['/images/roms/1-ss.jpg'],
  box_art_hidden: false,
  screenshots_hidden: false,
  ...flags,
});

describe('applyArtVisibility', () => {
  it('leaves an unflagged game alone', () => {
    expect(applyArtVisibility(game())).toEqual(game());
  });

  it('hides only box art when box_art_hidden is set', () => {
    const result = applyArtVisibility(game({ box_art_hidden: true }));
    expect(result.box_art_url).toBeNull();
    expect(result.screenshots).toEqual(['/images/roms/1-ss.jpg']);
  });

  it('hides only screenshots when screenshots_hidden is set', () => {
    const result = applyArtVisibility(game({ screenshots_hidden: true }));
    expect(result.box_art_url).toBe('/images/roms/1-box.jpg');
    expect(result.screenshots).toEqual([]);
  });

  it('returns the real values when includeHidden is true', () => {
    const flagged = game({ box_art_hidden: true, screenshots_hidden: true });
    expect(applyArtVisibility(flagged, true)).toEqual(flagged);
  });

  it('does not mutate the row it is given', () => {
    const row = game({ box_art_hidden: true });
    applyArtVisibility(row);
    expect(row.box_art_url).toBe('/images/roms/1-box.jpg');
  });
});
