import type { LanguageCode } from './languages';

interface MyMemoryResponse {
  responseData?: { translatedText?: string };
  responseStatus?: number;
  responseDetails?: string;
  matches?: Array<{ translation: string; quality?: string | number }>;
}

export interface TranslationResult {
  text: string;
  detectedMatch?: boolean;
}

export class TranslationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TranslationError';
  }
}

function toApiLang(code: LanguageCode): string {
  return code;
}

export async function translateText(
  text: string,
  source: LanguageCode,
  target: LanguageCode
): Promise<TranslationResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new TranslationError('Please enter some text to translate.');
  }
  if (source === target) {
    return { text: trimmed };
  }

  const langPair = `${toApiLang(source)}|${toApiLang(target)}`;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
    trimmed
  )}&langpair=${langPair}`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new TranslationError(
      'Could not reach the translation service. Please check your internet connection and try again.'
    );
  }

  if (!response.ok) {
    throw new TranslationError(
      `The translation service returned an error (status ${response.status}). Please try again shortly.`
    );
  }

  let data: MyMemoryResponse;
  try {
    data = (await response.json()) as MyMemoryResponse;
  } catch {
    throw new TranslationError('Received an invalid response from the translation service.');
  }

  const translated = data.responseData?.translatedText;
  if (!translated) {
    const detail = data.responseDetails || 'No translation was returned.';
    throw new TranslationError(detail);
  }

  const detectedMatch = (data.responseStatus ?? 200) === 200 && (data.matches?.length ?? 0) > 1;

  return { text: translated, detectedMatch };
}
