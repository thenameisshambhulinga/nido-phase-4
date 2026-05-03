

// Stricter email regex that rejects invalid formats like "domain.com@domain.com"
// Requires: local-part@domain.tld where local-part can't be a domain name
export const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/;

// Domain-like patterns to reject in local part (，防止 domain.com@gmail.com)
const DOMAIN_like_PATTERNS =
  /\.(com|org|net|io|co|in|gov|edu|ac|ai|ml|tk|ga|cf|gq|xyz|top|link)$/i;
export const PHONE_REGEX = /^[0-9]{10}$/;
export const CARD_REGEX = /^[0-9]{16}$/;
export const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;
export const NAME_REGEX = /^[a-zA-Z][a-zA-Z\s.'-]{1,99}$/;

export const normalizeEmail = (value = "") =>
  String(value).trim().toLowerCase();
export const normalizePhone = (value = "") =>
  String(value).replace(/\D/g, "").slice(0, 10);

// Enhanced email validation with domain-like pattern rejection
// Rejects emails like "shambhulinga.com@gmail.com" where local part looks like a domain
export const validateEmail = (email) => {
  const normalized = normalizeEmail(email);
  if (!EMAIL_REGEX.test(normalized)) return false;
  // Extract local part (before @) and check if it contains domain-like patterns
  const localPart = normalized.split("@")[0];
  if (localPart && DOMAIN_like_PATTERNS.test(localPart)) return false;
  return true;
};
export const validatePhone = (phone) => PHONE_REGEX.test(normalizePhone(phone));
export const validateCard = (card) =>
  CARD_REGEX.test(String(card || "").replace(/\D/g, ""));
export const validateName = (name) =>
  NAME_REGEX.test(String(name || "").trim());
export const validateUsername = (username) =>
  USERNAME_REGEX.test(String(username || "").trim());

export const ensurePositiveNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};
