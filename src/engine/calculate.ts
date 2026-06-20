import type { Cipher, CalcOptions, CalcResult, PerChar } from './types';

export const DEFAULT_OPTS: CalcOptions = {
  allowPhraseComments: false,
  numCalcMethod: 0,
  multCharPos: false,
  multCharPosReverse: false,
};

export function calculate(text: string, cipher: Cipher, opts?: Partial<CalcOptions>): CalcResult {
  const o = { ...DEFAULT_OPTS, ...opts };
  let s = text;
  // 1) strip [comments]
  if (o.allowPhraseComments) s = s.replace(/\[.+\]/g, '').trim();
  // 2) fold diacritics — escape form of the Unicode combining-marks block (U+0300-U+036F),
  //    written as a literal char range to avoid pasting raw combining characters into source.
  if (cipher.diacriticsAsRegular) s = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
  // 3) case fold
  if (!cipher.caseSensitive) s = s.toLowerCase();

  const perChar: PerChar[] = [];
  let total = 0;
  let pos = 0; // 1-based position among matched letters (for multipliers)
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    // digit handling
    if (code >= 48 && code <= 57) {
      if (o.numCalcMethod === 2) { const d = code - 48; total += d; perChar.push({ char: s[i], value: d }); }
      else if (o.numCalcMethod === 1) {
        let j = i; let numStr = '';
        while (j < s.length && s.charCodeAt(j) >= 48 && s.charCodeAt(j) <= 57) { numStr += s[j]; j++; }
        const n = parseInt(numStr, 10); total += n; perChar.push({ char: numStr, value: n }); i = j - 1;
      }
      continue; // numCalcMethod 0 → ignore
    }
    const idx = cipher.cArr.indexOf(code);
    if (idx === -1) continue; // spaces, punctuation, unmapped
    pos++;
    let v = cipher.vArr[idx];
    if (o.multCharPos) v *= pos;
    perChar.push({ char: s[i], value: v });
    total += v;
  }
  if (o.multCharPosReverse) {
    // recompute with reverse position multiplier over the matched chars
    const n = perChar.length;
    total = perChar.reduce((sum, pc, k) => sum + (pc.value * (n - k)), 0);
  }
  return { total, perChar };
}
