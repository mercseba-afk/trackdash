// postgres.js 3.4.9 array parser, adapted from src/types.js (Unlicense).
// https://github.com/porsager/postgres/blob/v3.4.9/src/types.js
// The built-in driver skips the first opening brace before calling this parser.
// Only built-in text[] (1009) and uuid[] (2951): all array columns currently
// declared in the application schema. Keep driver decoding, including escapes
// and its existing NULL-element behavior, rather than Drizzle's text fallback.
// No custom/project-specific OIDs, catalog cache, user cache or extra queries.
type TextArray = Array<string | TextArray>
type ArrayState = { i: number; char: string | null; str: string; quoted: boolean; last: number; p?: string | null }
function parseTextArray(x: string): TextArray {
  return arrayParserLoop({ i: 0, char: null, str: "", quoted: false, last: 0 }, x.slice(1))
}
function serializeTextArray(value: unknown): string {
  if (!Array.isArray(value)) return String(value)
  return "{" + value.map((item) => {
    if (item === undefined) throw new Error("UNDEFINED_VALUE")
    if (Array.isArray(item)) return serializeTextArray(item)
    return item === null ? "null" : '"' + String(item).replaceAll("\\", "\\\\").replaceAll('"', '\\"') + '"'
  }).join(",") + "}"
}

export const runtimePostgresOptions = {
  prepare: false, // Supabase transaction-mode pooler
  fetch_types: false, // avoid pg_type discovery on EVERY physical connection
  types: {
    textArray: { to: 1009, from: [1009], parse: parseTextArray, serialize: serializeTextArray },
    uuidArray: { to: 2951, from: [2951], parse: parseTextArray, serialize: serializeTextArray },
  },
}

function arrayParserLoop(s: ArrayState, x: string): TextArray {
  const xs: TextArray = []
  // text[] and uuid[] both use comma delimiters.
  const delimiter = ','
  for (; s.i < x.length; s.i++) {
    s.char = x[s.i]
    if (s.quoted) {
      if (s.char === '\\') {
        s.str += x[++s.i]
      } else if (s.char === '"') {
        xs.push(s.str)
        s.str = ''
        s.quoted = x[s.i + 1] === '"'
        s.last = s.i + 2
      } else {
        s.str += s.char
      }
    } else if (s.char === '"') {
      s.quoted = true
    } else if (s.char === '{') {
      s.last = ++s.i
      xs.push(arrayParserLoop(s, x))
    } else if (s.char === '}') {
      s.quoted = false
      s.last < s.i && xs.push(x.slice(s.last, s.i))
      s.last = s.i + 1
      break
    } else if (s.char === delimiter && s.p !== '}' && s.p !== '"') {
      xs.push(x.slice(s.last, s.i))
      s.last = s.i + 1
    }
    s.p = s.char
  }
  s.last < s.i && xs.push(x.slice(s.last, s.i + 1))
  return xs
}

