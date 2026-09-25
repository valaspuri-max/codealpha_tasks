// Manual TF-IDF vectorization and cosine similarity implementation in TypeScript.
// No external NLP libraries are used — everything is computed from scratch.

import { preprocess } from './nlp';

export interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

export interface MatchResult {
  faq: FAQItem | null;
  similarity: number; // 0..1
}

/** Build the vocabulary (sorted unique terms) from a corpus of token lists. */
function buildVocabulary(processedDocs: string[][]): string[] {
  const set = new Set<string>();
  for (const doc of processedDocs) {
    for (const term of doc) set.add(term);
  }
  return Array.from(set).sort();
}

/** Compute term frequency for a document: count of each term / total terms. */
function termFrequency(tokens: string[], vocab: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  if (tokens.length === 0) return tf;
  for (const term of tokens) {
    tf.set(term, (tf.get(term) ?? 0) + 1);
  }
  for (const [term, count] of tf) {
    tf.set(term, count / tokens.length);
  }
  return tf;
}

/** Compute inverse document frequency for each vocabulary term. */
function inverseDocumentFrequency(processedDocs: string[][], vocab: string[]): Map<string, number> {
  const N = processedDocs.length;
  const df = new Map<string, number>();
  for (const term of vocab) df.set(term, 0);
  for (const doc of processedDocs) {
    const seen = new Set(doc);
    for (const term of seen) {
      df.set(term, (df.get(term) ?? 0) + 1);
    }
  }
  const idf = new Map<string, number>();
  for (const term of vocab) {
    const dfVal = df.get(term) ?? 0;
    // Standard smoothed IDF: log(N / df) + 1  (guard against divide-by-zero)
    idf.set(term, Math.log(N / (dfVal > 0 ? dfVal : 1)) + 1);
  }
  return idf;
}

/** Build a TF-IDF vector (aligned to vocab order) from a token list. */
function buildTfIdfVector(
  tokens: string[],
  vocab: string[],
  idf: Map<string, number>,
): number[] {
  const tf = termFrequency(tokens, vocab);
  return vocab.map((term) => (tf.get(term) ?? 0) * (idf.get(term) ?? 0));
}

/** Compute cosine similarity between two equal-length numeric vectors. */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

// ---------------------------------------------------------------------------
// Pre-compute the FAQ corpus TF-IDF model once at module load time.
// ---------------------------------------------------------------------------

let cachedFaqs: FAQItem[] | null = null;
let cachedVocab: string[] = [];
let cachedIdf: Map<string, number> = new Map();
let cachedFaqVectors: number[][] = [];

/** Initialize (or re-initialize) the TF-IDF model for a given FAQ set. */
export function buildFaqModel(faqs: FAQItem[]): void {
  cachedFaqs = faqs;
  const processedDocs = faqs.map((f) => preprocess(f.question));
  cachedVocab = buildVocabulary(processedDocs);
  cachedIdf = inverseDocumentFrequency(processedDocs, cachedVocab);
  cachedFaqVectors = processedDocs.map((tokens) =>
    buildTfIdfVector(tokens, cachedVocab, cachedIdf),
  );
}

/** Match a raw user query against the FAQ corpus using cosine similarity. */
export function matchFAQ(query: string): MatchResult {
  if (!cachedFaqs || cachedFaqs.length === 0) {
    return { faq: null, similarity: 0 };
  }

  const processedQuery = preprocess(query);
  const queryVector = buildTfIdfVector(processedQuery, cachedVocab, cachedIdf);

  let bestIdx = -1;
  let bestScore = 0;
  for (let i = 0; i < cachedFaqVectors.length; i++) {
    const score = cosineSimilarity(queryVector, cachedFaqVectors[i]);
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }

  if (bestIdx === -1 || bestScore < 0.15) {
    return { faq: null, similarity: bestScore };
  }

  return { faq: cachedFaqs[bestIdx], similarity: bestScore };
}
