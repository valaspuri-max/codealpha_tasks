import { ChevronDown } from 'lucide-react';
import { LANGUAGES, type LanguageCode, LANGUAGE_MAP } from '@/lib/languages';

interface LanguageSelectProps {
  id: string;
  label: string;
  value: LanguageCode;
  onChange: (value: LanguageCode) => void;
  exclude?: LanguageCode;
}

export default function LanguageSelect({
  id,
  label,
  value,
  onChange,
  exclude,
}: LanguageSelectProps) {
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value as LanguageCode)}
          className="select-base cursor-pointer"
        >
          {LANGUAGES.filter((l) => l.code !== exclude).map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-brand-500">
          {LANGUAGE_MAP[value]?.flag}
        </span>
      </div>
    </div>
  );
}
