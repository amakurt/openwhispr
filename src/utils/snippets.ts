export interface Snippet {
  trigger: string;
  replacement: string;
}

export const DEFAULT_SYMBOL_SNIPPETS: Snippet[] = [
  // Underscore
  { trigger: "underline", replacement: "_" },
  { trigger: "underscore", replacement: "_" },
  { trigger: "sublinhado", replacement: "_" },
  // Asterisk
  { trigger: "asterisk", replacement: "*" },
  { trigger: "star", replacement: "*" },
  { trigger: "asterisco", replacement: "*" },
  { trigger: "estrela", replacement: "*" },
  // Hashtag
  { trigger: "hashtag", replacement: "#" },
  { trigger: "number sign", replacement: "#" },
  // At sign
  { trigger: "at sign", replacement: "@" },
  { trigger: "at symbol", replacement: "@" },
  { trigger: "arroba", replacement: "@" },
  // Dash / hyphen / minus
  { trigger: "dash", replacement: "-" },
  { trigger: "hyphen", replacement: "-" },
  { trigger: "minus", replacement: "-" },
  { trigger: "traço", replacement: "-" },
  { trigger: "hífen", replacement: "-" },
  { trigger: "menos", replacement: "-" },
  // Plus
  { trigger: "plus", replacement: "+" },
  { trigger: "mais", replacement: "+" },
  // Equals
  { trigger: "equals", replacement: "=" },
  { trigger: "igual", replacement: "=" },
  // Slash
  { trigger: "slash", replacement: "/" },
  { trigger: "barra", replacement: "/" },
  // Backslash
  { trigger: "backslash", replacement: "\\" },
  { trigger: "barra invertida", replacement: "\\" },
  // Pipe
  { trigger: "pipe", replacement: "|" },
  { trigger: "vertical bar", replacement: "|" },
  // Colon
  { trigger: "colon", replacement: ":" },
  { trigger: "dois pontos", replacement: ":" },
  // Semicolon
  { trigger: "semicolon", replacement: ";" },
  { trigger: "ponto e vírgula", replacement: ";" },
  // Comma
  { trigger: "comma", replacement: "," },
  { trigger: "vírgula", replacement: "," },
  // Period
  { trigger: "period", replacement: "." },
  { trigger: "dot", replacement: "." },
  { trigger: "ponto", replacement: "." },
  // Exclamation
  { trigger: "exclamation", replacement: "!" },
  { trigger: "exclamation mark", replacement: "!" },
  { trigger: "exclamação", replacement: "!" },
  { trigger: "ponto de exclamação", replacement: "!" },
  // Question mark
  { trigger: "question mark", replacement: "?" },
  { trigger: "interrogação", replacement: "?" },
  { trigger: "ponto de interrogação", replacement: "?" },
  // Ampersand
  { trigger: "ampersand", replacement: "&" },
  { trigger: "and sign", replacement: "&" },
  { trigger: "e comercial", replacement: "&" },
  // Percent
  { trigger: "percent", replacement: "%" },
  { trigger: "por cento", replacement: "%" },
  // Dollar
  { trigger: "dollar sign", replacement: "$" },
  { trigger: "dollar", replacement: "$" },
  { trigger: "dólar", replacement: "$" },
  { trigger: "cifrão", replacement: "$" },
  // Caret
  { trigger: "caret", replacement: "^" },
  { trigger: "circunflexo", replacement: "^" },
  // Tilde
  { trigger: "tilde", replacement: "~" },
  { trigger: "til", replacement: "~" },
  // Backtick
  { trigger: "backtick", replacement: "`" },
  { trigger: "crase", replacement: "`" },
  // Parentheses
  { trigger: "open parenthesis", replacement: "(" },
  { trigger: "close parenthesis", replacement: ")" },
  { trigger: "parêntese", replacement: "(" },
  { trigger: "parêntese de abertura", replacement: "(" },
  { trigger: "parêntese de fechamento", replacement: ")" },
  // Brackets
  { trigger: "open bracket", replacement: "[" },
  { trigger: "close bracket", replacement: "]" },
  { trigger: "colchete", replacement: "[" },
  { trigger: "colchete de abertura", replacement: "[" },
  { trigger: "colchete de fechamento", replacement: "]" },
  // Braces
  { trigger: "open brace", replacement: "{" },
  { trigger: "close brace", replacement: "}" },
  { trigger: "chave", replacement: "{" },
  { trigger: "chave de abertura", replacement: "{" },
  { trigger: "chave de fechamento", replacement: "}" },
  // Angle brackets
  { trigger: "angle bracket", replacement: "<" },
  { trigger: "open angle bracket", replacement: "<" },
  { trigger: "close angle bracket", replacement: ">" },
  { trigger: "menor que", replacement: "<" },
  { trigger: "maior que", replacement: ">" },
  // Quotes
  { trigger: "single quote", replacement: "'" },
  { trigger: "double quote", replacement: '"' },
  { trigger: "aspas simples", replacement: "'" },
  { trigger: "aspas", replacement: '"' },
  { trigger: "aspas duplas", replacement: '"' },
  // Apostrophe
  { trigger: "apostrophe", replacement: "'" },
  { trigger: "apóstrofo", replacement: "'" },
];

interface SnippetMatcher {
  regex: RegExp;
  replacements: Map<string, string>;
}

let cachedSnippets: Snippet[] | null = null;
let cachedMatcher: SnippetMatcher | null = null;

// The regex /i flag can't case-fold Turkish İ (U+0130) or dotless ı
// (U+0131), and İ's toLowerCase() form is two code units ("i" + U+0307), so
// triggers like "İmza" never matched. Folding İ to a plain "i" gives Map
// keys a canonical form, and matching İ/ı explicitly in the pattern lets the
// regex find them in the transcript.
function foldCapitalIDot(value: string): string {
  return value.replace(/İ/g, "i");
}

function buildMatcher(snippets: Snippet[]): SnippetMatcher | null {
  const replacements = new Map<string, string>();
  for (const { trigger, replacement } of snippets) {
    const folded = foldCapitalIDot(trigger.trim().normalize("NFC"));
    const key = folded.toLowerCase();
    if (!key) continue;
    replacements.set(key, replacement);
    // An uppercase I in the trigger may mean Turkish ı as well as English i,
    // so register both readings; an explicit trigger wins over a variant.
    const dotlessKey = folded.replace(/I/g, "ı").toLowerCase();
    if (!replacements.has(dotlessKey)) replacements.set(dotlessKey, replacement);
  }
  if (replacements.size === 0) return null;

  // Longest-first so "investor ask" wins over a shorter "ask" trigger.
  const escaped = [...replacements.keys()]
    .sort((a, b) => b.length - a.length)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .map((t) => t.replace(/i/g, "[iİ]").replace(/ı/g, "[ıI]"));
  // Unicode-aware word boundaries — triggers never match inside a word.
  const regex = new RegExp(
    `(?<=^|[\\s\\p{P}\\p{S}])(?:${escaped.join("|")})(?=$|[\\s\\p{P}\\p{S}])`,
    "giu"
  );
  return { regex, replacements };
}

/**
 * Replace every spoken trigger with its saved text in a single pass. The
 * matcher is memoized against the snippets array reference (the settings
 * store replaces the array on every change).
 *
 * If the cleanup model appended punctuation after a standalone trigger
 * (e.g. "underline." → period), the punctuation is stripped so the symbol
 * is returned clean (e.g. "underline." → "_").
 */
export function expandSnippets(text: string, snippets: Snippet[]): string {
  if (!text || snippets.length === 0) return text;
  if (snippets !== cachedSnippets) {
    cachedSnippets = snippets;
    cachedMatcher = buildMatcher(snippets);
  }
  if (!cachedMatcher) return text;
  const { regex, replacements } = cachedMatcher;
  // NFC so a decomposed "I" + U+0307 in the transcript recombines into İ.
  const normalized = text.normalize("NFC");

  // Fast path: if the entire text is a single trigger (possibly with
  // leading/trailing punctuation from the cleanup model), return just the
  // replacement without the noise punctuation.
  const stripped = normalized.replace(/^\p{P}+|\p{P}+$/gu, "").trim();
  if (stripped) {
    const folded = foldCapitalIDot(stripped);
    const key = folded.toLowerCase();
    const singleReplacement =
      replacements.get(key) ?? replacements.get(folded.replace(/I/g, "ı").toLowerCase());
    if (singleReplacement) return singleReplacement;
  }

  // General case: expand all triggers in the text.
  return normalized.replace(regex, (match) => {
    const folded = foldCapitalIDot(match);
    return (
      replacements.get(folded.toLowerCase()) ??
      replacements.get(folded.replace(/I/g, "ı").toLowerCase()) ??
      match
    );
  });
}

/**
 * Dictionary words plus snippet triggers — the hint list fed to the STT
 * prompt and cleanup-model dictionary suffix so triggers survive both.
 */
export function getDictionaryHintWords(settings: {
  customDictionary: string[];
  snippets: Snippet[];
}): string[] {
  if (settings.snippets.length === 0) return settings.customDictionary;
  return [...settings.customDictionary, ...settings.snippets.map((s) => s.trigger)];
}
