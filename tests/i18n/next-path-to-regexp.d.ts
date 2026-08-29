// Next ships this module as a compiled internal, with no published types.
// It is the exact compiler Next itself runs over a proxy `config.matcher`
// pattern, which is why tests/i18n/app-shell.test.ts imports it directly
// instead of reimplementing matcher semantics by hand.
declare module "next/dist/compiled/path-to-regexp" {
  export function pathToRegexp(path: string): RegExp;
}
