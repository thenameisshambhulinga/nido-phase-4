// Stricter email regex that rejects invalid formats like "domain.com@domain.com"
// Requires: local-part@domain.tld where local-part can't be a domain name
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

// Domain-like patterns to reject in local part (，防止 domain.com@gmail.com)
const DOMAIN_like_PATTERNS =
  /\.(com|org|net|io|co|in|gov|edu|ac|ai|ml|tk|ga|cf|gq|xyz|top|link)$/i;
export const PHONE_REGEX = /^[6-9]\d{9}$/;
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

export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const GST_REGEX =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/;

export const CVV_REGEX = /^[0-9]{3}$/;

export const luhnCheck = (cardNumber) => {
  const digits = String(cardNumber).replace(/\D/g, "").split("").map(Number);
  if (digits.length < 13) return false;
  let sum = 0;
  let isEven = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = digits[i];
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
};

export const validateExpiry = (month, year) => {
  const now = new Date();
  const expiry = new Date(Number(year), Number(month) - 1, 1);
  expiry.setMonth(expiry.getMonth() + 1);
  expiry.setDate(0);
  return expiry > now;
};

export const validateCardFull = (cardNumber, month, year, cvv) =>
  CARD_REGEX.test(String(cardNumber || "").replace(/\D/g, "")) &&
  luhnCheck(cardNumber) &&
  CVV_REGEX.test(String(cvv || "")) &&
  validateExpiry(month, year);

export const validatePassword = (password) =>
  PASSWORD_REGEX.test(String(password || ""));

export const validateGST = (gst) =>
  GST_REGEX.test(
    String(gst || "")
      .trim()
      .toUpperCase(),
  );

export const ensurePositiveNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};
