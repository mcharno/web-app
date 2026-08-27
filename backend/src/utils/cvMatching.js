/**
 * Title matching helpers for Comic Vine scraping.
 *
 * Local series titles are hand-entered and drift from Comic Vine's canonical
 * names in predictable ways: hyphens standing in for colons ("Dead-Pool- The
 * Circle Chase"), "and" vs "&", stray punctuation, and the odd typo. These
 * helpers normalise both sides and score candidates so the scraper can
 * auto-accept confident matches and park ambiguous ones for manual review.
 */

// Lowercase, unify '&'/'and', turn all punctuation (hyphens, colons, slashes,
// periods) into spaces, collapse whitespace.
export function normalizeTitle(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Levenshtein distance — small strings only, O(a*b).
function editDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev = curr;
  }
  return prev[b.length];
}

// Similarity of two words in [0,1] tolerant of typos ("vengence"/"vengeance").
function wordSimilarity(a, b) {
  if (a === b) return 1;
  const dist = editDistance(a, b);
  const maxLen = Math.max(a.length, b.length);
  return maxLen ? 1 - dist / maxLen : 0;
}

/**
 * Similarity of two titles in [0,1]. The max of two views:
 *
 * 1. Whole-string: typo-tolerant edit distance over the space-stripped
 *    normalised titles. Catches word-boundary drift ("Dead-Pool" vs
 *    "Deadpool", "Gen 13" vs "Gen13") and small typos ("Vengence").
 * 2. Token-based: each token of the shorter title greedily matched to its
 *    best typo-tolerant counterpart in the longer one, with a strong penalty
 *    for unmatched leftover tokens — "Ghost Rider" must not score as
 *    "Ghost Rider 2099", which is a different series.
 */
export function titleSimilarity(rawA, rawB) {
  const a = normalizeTitle(rawA);
  const b = normalizeTitle(rawB);
  if (!a || !b) return 0;
  if (a === b) return 1;

  const wholeScore = wordSimilarity(a.replace(/ /g, ''), b.replace(/ /g, ''));

  const tokensA = a.split(' ');
  const tokensB = b.split(' ');
  const [shorter, longer] = tokensA.length <= tokensB.length
    ? [tokensA, tokensB] : [tokensB, tokensA];

  const remaining = [...longer];
  let matchedScore = 0;
  for (const tok of shorter) {
    let bestIdx = -1;
    let best = 0;
    for (let i = 0; i < remaining.length; i++) {
      const s = wordSimilarity(tok, remaining[i]);
      if (s > best) { best = s; bestIdx = i; }
    }
    // Accept typo-level matches only (>= 0.75 per word)
    if (best >= 0.75 && bestIdx !== -1) {
      matchedScore += best;
      remaining.splice(bestIdx, 1);
    }
  }

  const coverage = matchedScore / shorter.length;          // how well the shorter title is covered
  const extraPenalty = remaining.length / longer.length;   // leftover tokens on the longer side
  const tokenScore = Math.max(0, coverage * (1 - 0.9 * extraPenalty));

  return Math.max(wholeScore, tokenScore);
}

// Parse the leading integer of an issue number ("12", "12a", "Annual 1" -> 12, 12, null)
function issueNumberInt(n) {
  const m = String(n).match(/^(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

/**
 * Score a Comic Vine volume candidate against a local series in [0,1].
 *
 * `candidate` is a CV volume: { name, publisher: {name}|null, count_of_issues, start_year }.
 * `ownedIssueNumbers` are the local issue_number strings.
 */
export function scoreVolumeCandidate(series, candidate, ownedIssueNumbers = []) {
  const titleScore = titleSimilarity(series.title, candidate.name);

  let publisherScore = 0.5; // neutral when either side is unknown
  const localPub = normalizeTitle(series.publisher);
  const cvPub = normalizeTitle(candidate.publisher?.name);
  if (localPub && cvPub) {
    publisherScore = (cvPub.includes(localPub) || localPub.includes(cvPub)) ? 1 : 0;
  }

  // A real match must have at least as many issues as the highest owned number.
  const maxOwned = Math.max(0, ...ownedIssueNumbers.map(issueNumberInt).filter(n => n !== null));
  let issueCountScore = 0.5; // neutral when unknown
  if (maxOwned > 0 && Number.isFinite(candidate.count_of_issues)) {
    issueCountScore = candidate.count_of_issues >= maxOwned ? 1 : 0;
  }

  return titleScore * 0.7 + publisherScore * 0.15 + issueCountScore * 0.15;
}

// Auto-accept floor for combined candidate scores.
export const AUTO_ACCEPT_SCORE = 0.8;
// The title component alone must also clear this bar for auto-acceptance.
export const AUTO_ACCEPT_TITLE_SIM = 0.75;
