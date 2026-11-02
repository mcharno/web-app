// Apply a game's art-visibility flags to an API response. The DB values and the
// files are kept, so a re-scrape (which would refill a NULL box_art_url) can't
// bring hidden art back. Pass includeHidden to get the real values.
export function applyArtVisibility(game, includeHidden = false) {
  if (includeHidden) return game;
  const visible = { ...game };
  if (game.box_art_hidden) visible.box_art_url = null;
  if (game.screenshots_hidden) visible.screenshots = [];
  return visible;
}
