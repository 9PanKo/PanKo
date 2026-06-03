/** PanKo — "Hey PanKo" wake phrase detection (lenient STT variants). */
export const HEY_PANKO_VARIANTS = [
  'hey panko',
  'hey pan ko',
  'hipan ko',
  'hey pan-ko',
  'hey pancho',
  'kanto',
  'hey paano ko',
  'hey franco',
  'hey pinko',
  'hey panco',
  'hey pango',
  'hey banko',
  'hey pan go',
  'hey pan co',
  'hey pan koe',
  'hey punko',
  'hey punco',
  'hey pan k',
  'a panko',
  'hey paco',
  'hey pan',
  'hey fan call',
  'epan ko',
  'hey fan ko',
  'a fan ko'
];

/** Loose pattern: "hey" + word(s) starting with "pan" (covers most misheard forms). */
const HEY_PAN_LOOSE = /\bhey[\s,.-]+pan[\s-]*(?:ko|co|go|cho|cake|k|ck|g|m|c)?\w*/i;

export function normalizeSpeech(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function wordSoundsLikePanko(word) {
  const w = word.replace(/\s/g, '');
  if (!w.startsWith('pan')) return false;
  const tail = w.slice(3);
  if (!tail.length) return true;
  if (/^(ko|co|go|cho|ck|ke|k)$/.test(tail)) return true;
  if (/^(cho|cake|co|ko|go|k)/.test(tail)) return true;
  if (['panko', 'pancho', 'pancake', 'pinko', 'panco', 'pango', 'banko'].includes(w)) {
    return true;
  }
  return tail.length <= 4 && /^[ckgopr]/.test(tail);
}

/** True if transcript contains the Hey PanKo wake phrase (lenient). */
export function containsHeyPanko(text) {
  const normalized = normalizeSpeech(text);
  if (!normalized) return false;

  for (const variant of HEY_PANKO_VARIANTS) {
    if (normalized.includes(normalizeSpeech(variant))) return true;
  }

  if (HEY_PAN_LOOSE.test(normalized)) return true;

  const heyIdx = normalized.search(/\bhey\b/);
  if (heyIdx === -1) return false;

  const afterHey = normalized.slice(heyIdx + 3).trim();
  const nextWords = afterHey.split(' ').filter(Boolean).slice(0, 2);
  const joined = nextWords.join(' ');
  const squashed = nextWords.join('');

  if (wordSoundsLikePanko(joined) || wordSoundsLikePanko(squashed)) return true;
  if (nextWords[0] && wordSoundsLikePanko(nextWords[0])) return true;
  if (nextWords.length === 2 && wordSoundsLikePanko(nextWords.join(''))) return true;

  return false;
}

/** Text to run commands on, after stripping the wake phrase. */
export function textAfterHeyPanko(text) {
  const normalized = normalizeSpeech(text);
  if (!normalized) return '';

  const sorted = [...HEY_PANKO_VARIANTS]
    .map((v) => normalizeSpeech(v))
    .sort((a, b) => b.length - a.length);

  for (const variant of sorted) {
    const idx = normalized.indexOf(variant);
    if (idx !== -1) {
      return normalized.slice(idx + variant.length).trim();
    }
  }

  const loose = normalized.match(HEY_PAN_LOOSE);
  if (loose) {
    return normalized.slice(loose.index + loose[0].length).trim();
  }

  const heyMatch = normalized.match(/\bhey\b\s*(\S+(?:\s+\S+)?)/);
  if (heyMatch && wordSoundsLikePanko(heyMatch[1])) {
    return normalized.slice(heyMatch.index + heyMatch[0].length).trim();
  }

  return '';
}

/** Pick best transcript line from a recognition result (all alternatives). */
export function collectTranscriptsFromResult(result) {
  const lines = [];
  for (let j = 0; j < result.length; j++) {
    const t = result[j]?.transcript?.trim();
    if (t) lines.push(t.toLowerCase());
  }
  return lines;
}

/** Latest final/interim segment only (avoids cumulative transcript in continuous mode). */
export function getLatestPhraseFromEvent(event) {
  let phraseFinal = '';
  let phraseInterim = '';

  for (let i = event.resultIndex; i < event.results.length; i++) {
    const result = event.results[i];
    const primary = result[0]?.transcript?.trim().toLowerCase() || '';
    if (result.isFinal) {
      phraseFinal = primary;
    } else {
      phraseInterim = primary;
    }
  }

  return {
    phraseFinal,
    phraseDisplay: phraseFinal || phraseInterim,
    isFinal: Boolean(phraseFinal),
  };
}

/** True if any final alternative in this event contains the wake phrase. */
export function eventHasWakePhrase(event) {
  for (let i = event.resultIndex; i < event.results.length; i++) {
    const result = event.results[i];
    if (!result.isFinal) continue;
    for (const line of collectTranscriptsFromResult(result)) {
      if (containsHeyPanko(line)) return true;
    }
  }
  return false;
}
