<<<<<<< HEAD
=======
import {
  normalizeEmail as normalizeEmailExisting,
  isValidEmail as isValidEmailRegexOnly,
} from "@/lib/validation";

>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
// Strict, centralized email validation.
// Guarantees:
// - invalid emails are rejected before any mail delivery
// - normalization (trim + lowercase) is always applied
//
// Note: keeps regex usage but adds extra guardrails (reject local-part that looks like a domain).

const EMAIL_LIKE_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

// Reject emails like "domain.com@gmail.com" where local-part contains a domain-like suffix.
const LOCAL_PART_DOMAIN_LIKE =
  /\.(com|org|net|io|co|in|gov|edu|ac|ai|ml|tk|ga|cf|gq|xyz|top|link)$/i;

export function normalizeEmail(value: string): string {
<<<<<<< HEAD
  return String(value || "").trim().toLowerCase();
=======
  return normalizeEmailExisting(value);
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
}

export function isValidEmailStrict(value: string): boolean {
  if (!value || typeof value !== "string") return false;

  const normalized = normalizeEmail(value);
  if (!EMAIL_LIKE_REGEX.test(normalized)) return false;

  // Extra constraint on local-part
  const localPart = normalized.split("@")[0] || "";
  if (LOCAL_PART_DOMAIN_LIKE.test(localPart)) return false;

<<<<<<< HEAD
=======
  // Compatibility: preserve current behavior even if regex differs.
  // If current isValidEmailRegexOnly rejects a value, reject it too.
  if (!isValidEmailRegexOnly(normalized)) return false;

>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
  return true;
}

export function getEmailStrictError(value: string): string {
  if (!value || typeof value !== "string" || value.trim().length === 0) {
    return "Email is required";
  }
  if (!isValidEmailStrict(value)) {
    return "Please enter a valid email address";
  }
  return "";
}
