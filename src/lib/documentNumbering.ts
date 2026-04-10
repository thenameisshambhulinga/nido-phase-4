const DEFAULT_PADDING = 5;

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizePrefix = (prefix: string) => prefix.trim();

const toPositiveInt = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const parseSuffixNumber = (
  value: string,
  normalizedPrefix: string,
): number | null => {
  const escapedPrefix = escapeRegExp(normalizedPrefix);
  const directPattern = new RegExp(`^${escapedPrefix}(\\d+)$`);
  const dashedPattern = new RegExp(`^${escapedPrefix}-(\\d+)$`);

  const directMatch = value.match(directPattern);
  if (directMatch) return Number(directMatch[1]);

  const dashedMatch = value.match(dashedPattern);
  if (dashedMatch) return Number(dashedMatch[1]);

  return null;
};

export const formatSequentialCode = (
  prefix: string,
  sequence: number,
  padding = DEFAULT_PADDING,
) => {
  const normalizedPrefix = normalizePrefix(prefix);
  const safePadding = toPositiveInt(padding, DEFAULT_PADDING);
  return `${normalizedPrefix}-${String(sequence).padStart(safePadding, "0")}`;
};

export const nextSequentialCode = (
  prefix: string,
  existingValues: Array<string | undefined | null>,
  padding = DEFAULT_PADDING,
) => {
  const normalizedPrefix = normalizePrefix(prefix);
  const safePadding = toPositiveInt(padding, DEFAULT_PADDING);

  const highest = existingValues.reduce((max, value) => {
    if (!value) return max;
    const sequence = parseSuffixNumber(String(value).trim(), normalizedPrefix);
    if (sequence === null || Number.isNaN(sequence)) return max;
    return Math.max(max, sequence);
  }, 0);

  return formatSequentialCode(normalizedPrefix, highest + 1, safePadding);
};

export const resolveSequentialCode = (
  prefix: string,
  requestedValue: string | undefined,
  existingValues: Array<string | undefined | null>,
  padding = DEFAULT_PADDING,
) => {
  if (requestedValue && !existingValues.includes(requestedValue)) {
    return requestedValue;
  }
  return nextSequentialCode(prefix, existingValues, padding);
};
