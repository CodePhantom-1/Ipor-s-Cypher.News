export interface Cipher {
  id: string;
  name: string;
  category: string;
  hsl: [number, number, number];
  cArr: number[];   // char codes, parallel to vArr
  vArr: number[];   // values, parallel to cArr
  diacriticsAsRegular: boolean;
  enabled: boolean;
  caseSensitive: boolean;
}
export interface CalcOptions {
  allowPhraseComments: boolean;
  numCalcMethod: 0 | 1 | 2;      // 0 ignore digits, 1 full, 2 reduced
  multCharPos: boolean;
  multCharPosReverse: boolean;
}
export interface PerChar { char: string; value: number }
export interface CalcResult { total: number; perChar: PerChar[] }
