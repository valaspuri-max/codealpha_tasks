// NLP preprocessing utilities: cleaning, tokenization, stop-word removal,
// light stemming, and synonym normalization for college-domain terms.

const STOP_WORDS = new Set([
  'the', 'is', 'a', 'an', 'how', 'do', 'i', 'can', 'to', 'for',
  'of', 'in', 'on', 'at', 'and', 'or', 'what', 'where', 'when',
  'why', 'who', 'my', 'me', 'we', 'our', 'you', 'your', 'it',
  'this', 'that', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'will', 'would', 'could', 'should',
  'does', 'did', 'get', 'about', 'with', 'from', 'by', 'as',
]);

const SYNONYM_MAP: Record<string, string> = {
  apply: 'admission',
  application: 'admission',
  admission: 'admission',
  admissions: 'admission',
  timetable: 'timetable',
  schedule: 'timetable',
  timings: 'timetable',
  hostel: 'hostel',
  accommodation: 'hostel',
  room: 'hostel',
  fees: 'fees',
  fee: 'fees',
  payment: 'fees',
  placement: 'placement',
  job: 'placement',
  jobs: 'placement',
  internship: 'placement',
  internships: 'placement',
  intern: 'placement',
  exam: 'examination',
  exams: 'examination',
  examination: 'examination',
};

/** Convert text to lowercase and remove punctuation. */
export function cleanText(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Split cleaned text into individual word tokens. */
export function tokenize(text: string): string[] {
  const cleaned = cleanText(text);
  if (!cleaned) return [];
  return cleaned.split(' ').filter((t) => t.length > 0);
}

/** Remove common stop words from a token list. */
export function removeStopWords(tokens: string[]): string[] {
  return tokens.filter((t) => !STOP_WORDS.has(t));
}

/** Apply light suffix-based stemming to a single word. */
export function stem(word: string): string {
  if (word.length <= 3) return word;
  if (word.endsWith('ing')) return word.slice(0, -3);
  if (word.endsWith('ed')) return word.slice(0, -2);
  if (word.endsWith('es')) return word.slice(0, -2);
  if (word.endsWith('s')) return word.slice(0, -1);
  return word;
}

/** Normalize college-domain synonyms to a canonical term. */
export function normalizeSynonym(word: string): string {
  return SYNONYM_MAP[word] ?? word;
}

/** Full NLP pipeline: clean → tokenize → remove stop words → stem → normalize synonyms. */
export function preprocess(text: string): string[] {
  const tokens = tokenize(text);
  const filtered = removeStopWords(tokens);
  return filtered.map((t) => normalizeSynonym(stem(t)));
}
