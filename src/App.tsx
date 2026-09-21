import { useCallback, useState } from 'react';
import { AlertCircle, ArrowLeftRight, Loader2, Languages, Sparkles } from 'lucide-react';
import LanguageSelect from '@/components/LanguageSelect';
import CopyButton from '@/components/CopyButton';
import { translateText, TranslationError } from '@/lib/translate';
import type { LanguageCode } from '@/lib/languages';

const MAX_CHARS = 500;

export default function App() {
  const [inputText, setInputText] = useState('');
  const [sourceLang, setSourceLang] = useState<LanguageCode>('en');
  const [targetLang, setTargetLang] = useState<LanguageCode>('es');
  const [outputText, setOutputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasTranslated, setHasTranslated] = useState(false);

  const handleSwap = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    if (outputText) {
      setInputText(outputText);
      setOutputText(inputText);
    }
  };

  const handleTranslate = useCallback(async () => {
    setError(null);
    if (!inputText.trim()) {
      setError('Please enter some text to translate.');
      return;
    }
    setLoading(true);
    setOutputText('');
    try {
      const result = await translateText(inputText, sourceLang, targetLang);
      setOutputText(result.text);
      setHasTranslated(true);
    } catch (err) {
      const message =
        err instanceof TranslationError
          ? err.message
          : 'An unexpected error occurred. Please try again.';
      setError(message);
      setHasTranslated(false);
    } finally {
      setLoading(false);
    }
  }, [inputText, sourceLang, targetLang]);

  const handleClear = () => {
    setInputText('');
    setOutputText('');
    setError(null);
    setHasTranslated(false);
  };

  const charCount = inputText.length;
  const overLimit = charCount > MAX_CHARS;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200/60 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4 sm:px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
            <Languages className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight text-slate-900 sm:text-lg">
              AI Language Translation Tool
            </h1>
            <p className="text-xs text-slate-500">
              Powered by MyMemory Translation API
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        {/* Intro */}
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50/60 p-4 sm:mb-8">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
          <p className="text-sm text-slate-600">
            Enter text below, choose your source and target languages, and click
            <span className="font-semibold text-brand-700"> Translate</span>. Supports English,
            Hindi, Telugu, Tamil, French, and Spanish.
          </p>
        </div>

        {/* Language selectors */}
        <div className="card mb-6 p-4 sm:p-5">
          <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-[1fr_auto_1fr]">
            <LanguageSelect
              id="source-lang"
              label="Source Language"
              value={sourceLang}
              onChange={setSourceLang}
              exclude={targetLang}
            />
            <div className="flex justify-center sm:pb-2">
              <button
                type="button"
                onClick={handleSwap}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-brand-300 hover:text-brand-600 active:scale-95"
                aria-label="Swap languages"
                title="Swap languages"
              >
                <ArrowLeftRight className="h-4 w-4" />
              </button>
            </div>
            <LanguageSelect
              id="target-lang"
              label="Target Language"
              value={targetLang}
              onChange={setTargetLang}
              exclude={sourceLang}
            />
          </div>
        </div>

        {/* Translation panels */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          {/* Input */}
          <div className="card flex flex-col p-4 sm:p-5">
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="input-text" className="field-label mb-0">
                Text to Translate
              </label>
              {inputText && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs font-medium text-slate-400 transition-colors hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>
            <textarea
              id="input-text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type or paste text here..."
              rows={6}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-sm leading-relaxed text-slate-800 transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className={overLimit ? 'font-semibold text-red-500' : 'text-slate-400'}>
                {charCount} / {MAX_CHARS} characters
              </span>
              {overLimit && (
                <span className="text-red-500">Please shorten the text.</span>
              )}
            </div>
          </div>

          {/* Output */}
          <div className="card flex flex-col p-4 sm:p-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="field-label mb-0">Translated Text</span>
              <CopyButton text={outputText} disabled={loading || !outputText} />
            </div>
            <div className="min-h-[156px] flex-1 rounded-xl border border-slate-200 bg-brand-50/30 p-3.5">
              {loading ? (
                <div className="flex h-full min-h-[120px] flex-col items-center justify-center gap-2 text-brand-600">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <p className="text-sm font-medium">Translating...</p>
                </div>
              ) : error ? (
                <div className="flex h-full min-h-[120px] flex-col items-center justify-center gap-2 text-center">
                  <AlertCircle className="h-6 w-6 text-red-400" />
                  <p className="text-sm font-medium text-red-500">{error}</p>
                </div>
              ) : outputText ? (
                <p className="animate-fade-in text-sm leading-relaxed text-slate-800">
                  {outputText}
                </p>
              ) : (
                <div className="flex h-full min-h-[120px] flex-col items-center justify-center gap-1 text-center">
                  <p className="text-sm text-slate-400">
                    {hasTranslated
                      ? 'No translation available.'
                      : 'Your translation will appear here.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="mt-6 flex justify-center sm:mt-8">
          <button
            type="button"
            onClick={handleTranslate}
            disabled={loading || overLimit}
            className="btn-primary w-full sm:w-auto sm:min-w-[200px]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Translating...
              </>
            ) : (
              <>
                <Languages className="h-4 w-4" />
                Translate
              </>
            )}
          </button>
        </div>
      </main>

      <footer className="mx-auto max-w-5xl px-4 pb-8 text-center sm:px-6">
        <p className="text-xs text-slate-400">
          AI Language Translation Tool &middot; Internship Project &middot; Translations by
          MyMemory API
        </p>
      </footer>
    </div>
  );
}
