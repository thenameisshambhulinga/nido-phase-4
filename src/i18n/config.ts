import en from './locales/en.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import es from './locales/es.json';
import enIN from './locales/en-IN.json';

export const SUPPORTED_LANGUAGES = [
  { code: 'en-US', label: 'English - United States', native: 'English', flag: '🇺🇸' },
  { code: 'fr-FR', label: 'French - France', native: 'Français', flag: '🇫🇷' },
  { code: 'es-MX', label: 'Spanish - Mexico', native: 'Español', flag: '🇲🇽' },
  { code: 'de-DE', label: 'German - Germany', native: 'Deutsch', flag: '🇩🇪' },
  { code: 'en-AU', label: 'English - Australia', native: 'English', flag: '🇦🇺' },
  { code: 'en-CA', label: 'English - Canada', native: 'English', flag: '🇨🇦' },
  { code: 'en-IN', label: 'English - India', native: 'English (भारत)', flag: '🇮🇳' },
  { code: 'en-IE', label: 'English - Ireland', native: 'English', flag: '🇮🇪' },
  { code: 'en-SG', label: 'English - Singapore', native: 'English', flag: '🇸🇬' },
  { code: 'en-ZA', label: 'English - South Africa', native: 'English', flag: '🇿🇦' },
] as const;

export const DEFAULT_LANGUAGE = 'en-US';

export const TRANSLATIONS: Record<string, Record<string, string>> = {
  'en-US': en,
  'en-IN': enIN,
  'fr-FR': fr,
  'de-DE': de,
  'es-MX': es,
  'en-AU': en,
  'en-CA': en,
  'en-IE': en,
  'en-SG': en,
  'en-ZA': en,
};

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES extends readonly (infer T)[] 
  ? T extends { code: infer C } ? C : never 
  : never;
