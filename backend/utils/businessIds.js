export const generateBusinessId = (
  prefix,
  sequence,
  padding = 4,
) => `${prefix}${String(sequence).padStart(padding, "0")}`;

export const ensureBusinessId = (
  value,
  prefix,
  sequence,
  padding = 4,
) => {
  if (value && String(value).trim()) {
    return String(value).trim();
  }
  return generateBusinessId(prefix, sequence, padding);
};
