/** More explicit type for GLSL strings */
export type GLSL = string;

/**
 * Tagged template literal that does nothing. Useful for syntax highlighting.
 * @param strings
 * @param values
 */
export const glsl = (s: TemplateStringsArray, ...v: unknown[]) =>
  s.flatMap((s, i) => [s, v[i] === undefined ? '' : v[i]]).join('') as GLSL;