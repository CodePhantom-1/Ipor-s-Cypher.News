// @ts-nocheck — checked instead via scripts/legacy-ref.d.ts; the .d.ts is the typed contract,
// this body stays a verbatim, untyped port (see NOTE below for the source-of-truth caveat).
// Verbatim port of legacy calcGematria for parity testing ONLY.
// Defaults: no comments, digits ignored, no position multipliers.
export function legacyCalc(gemPhrase, cipher) {
  let gemValue = 0;
  if (cipher.diacriticsAsRegular === true) {
    gemPhrase = gemPhrase.normalize('NFD').replace(/[̀-ͯ]/g, '');
  }
  if (cipher.caseSensitive === false) {
    gemPhrase = gemPhrase.toLowerCase();
  }
  for (let i = 0; i < gemPhrase.length; i++) {
    const cur_char = gemPhrase.charCodeAt(i);
    const ch_pos = cipher.cArr.indexOf(cur_char);
    if (ch_pos > -1) gemValue += cipher.vArr[ch_pos];
  }
  return gemValue;
}
// NOTE: verify the copied body matches legacy/calc/gematria.js:12-82 for the default
// option branches. If the legacy file differs, the legacy file wins — update this copy.
