/**
 * NIDO Phase 3 - Enhanced Validation Library
 * Production-grade validation for enterprise procurement platform
 */

// =============================================================================
// EMAIL VALIDATION (RFC Standard)
// =============================================================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

import { isValidEmailStrict } from "@/lib/emailStrictValidation";

export function isValidEmail(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  return isValidEmailStrict(value);
}

// =============================================================================
// PHONE NUMBER VALIDATION (Exactly 10 digits, numbers only)
// =============================================================================

export function isValidPhoneNumber(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  return /^[6-9]\d{9}$/.test(value.replace(/\s/g, ""));
}

export function normalizePhoneNumber(value: string): string {
  if (!value || typeof value !== "string") return "";
  return value.replace(/\D/g, "").slice(0, 10);
}

// =============================================================================
// CREDIT/DEBIT CARD VALIDATION
// =============================================================================

/**
 * Luhn Algorithm for card number validation
 */
function luhnCheck(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, "");
  if (!/^\d+$/.test(digits)) return false;

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Validate credit/debit card
 */
export function isValidCardNumber(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  const digits = value.replace(/\D/g, "");
  return digits.length === 16 && /^\d{16}$/.test(digits) && luhnCheck(digits);
}

/**
 * Validate card expiry date (must be in future)
 */
export function isValidCardExpiry(
  month: string | number,
  year: string | number,
): boolean {
  const m = parseInt(String(month), 10);
  const y = parseInt(String(year), 10);

  if (isNaN(m) || isNaN(y)) return false;
  if (m < 1 || m > 12) return false;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Card is valid if expiry is in the future, or same year but future month
  if (y > currentYear) return true;
  if (y === currentYear && m >= currentMonth) return true;

  return false;
}

/**
 * Validate CVV (3 digits)
 */
export function isValidCVV(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  return /^\d{3}$/.test(value);
}

/**
 * Normalize card number (remove spaces/dashes)
 */
export function normalizeCardNumber(value: string): string {
  if (!value || typeof value !== "string") return "";
  return value.replace(/[\s-]/g, "").slice(0, 16);
}

// =============================================================================
// INDIAN GST NUMBER VALIDATION
// =============================================================================

// GST Format: 15 characters
// State code (2 digits) + PAN (10 chars) + Entity number (3 chars) + Z (1 char) + Check sum (1 char)
// Example: 27AAECS1234F1Z1
// GST validation already exists - keeping existing

export function normalizeGSTNumber(value: string): string {
  if (!value || typeof value !== "string") return "";
  return value.replace(/\s/g, "").toUpperCase().slice(0, 15);
}

// =============================================================================
// PAN NUMBER VALIDATION (India)
// =============================================================================

// PAN Format: 5 letters + 4 digits + 1 letter
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;

export function isValidPANNumber(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  return PAN_REGEX.test(value.toUpperCase());
}

export function normalizePANNumber(value: string): string {
  if (!value || typeof value !== "string") return "";
  return value.replace(/\s/g, "").toUpperCase().slice(0, 10);
}

// =============================================================================
// NAME VALIDATION (No numbers or special characters)
// =============================================================================

const NAME_REGEX = /^[a-zA-Z\s'-]+$/;
const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 100;

export function isValidName(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed.length < NAME_MIN_LENGTH || trimmed.length > NAME_MAX_LENGTH)
    return false;
  return NAME_REGEX.test(trimmed);
}

export function normalizeName(value: string): string {
  if (!value || typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, NAME_MAX_LENGTH);
}

// =============================================================================
// AMOUNT VALIDATION (Only positive numbers)
// =============================================================================

export function isValidAmount(value: any): boolean {
  const num = typeof value === "number" ? value : parseFloat(String(value));
  return !isNaN(num) && num > 0 && isFinite(num);
}

export function normalizeAmount(value: any): number {
  const num = typeof value === "number" ? value : parseFloat(String(value));
  return isFinite(num) ? Math.round(num * 100) / 100 : 0;
}

// =============================================================================
// PINCODE VALIDATION (India - 6 digits)
// =============================================================================

export function isValidPincode(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  return /^\d{6}$/.test(value);
}

// =============================================================================
// USERNAME VALIDATION
// =============================================================================

const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;

export function isValidUsername(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  return USERNAME_REGEX.test(value);
}

// =============================================================================
// PASSWORD VALIDATION (Minimum security)
// =============================================================================

const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$/;

export function isValidPassword(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  return PASSWORD_REGEX.test(value);
}

export const GST_REGEX =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/;

export function isValidGST(value: string): boolean {
  return GST_REGEX.test(
    String(value || "")
      .trim()
      .toUpperCase(),
  );
}

export function validateCardFull(
  cardNumber: string,
  month: string,
  year: string,
  cvv: string,
): boolean {
  const cleanCard = cardNumber.replace(/\\D/g, "");
  return (
    cleanCard.length === 16 &&
    luhnCheck(cleanCard) &&
    isValidCVV(cvv) &&
    isValidCardExpiry(month, year)
  );
}

// =============================================================================
// COMPOSED VALIDATORS FOR FORMS
// =============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateUserForm(data: {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.name || !isValidName(data.name)) {
    errors.name = "Name must be 2-100 characters, letters only";
  }

  if (!data.email || !isValidEmail(data.email)) {
    errors.email = "Please enter a valid email address";
  }

  if (data.phone && !isValidPhoneNumber(data.phone)) {
    errors.phone = "Phone must be exactly 10 digits";
  }

  if (!data.password || !isValidPassword(data.password)) {
    errors.password = "Password must be at least 8 characters";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateClientForm(data: {
  companyName?: string;
  email?: string;
  phone?: string;
  gst?: string;
  pan?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.companyName || !isValidName(data.companyName)) {
    errors.companyName = "Company name is required";
  }

  if (!data.email || !isValidEmail(data.email)) {
    errors.email = "Please enter a valid email";
  }

  if (data.phone && !isValidPhoneNumber(data.phone)) {
    errors.phone = "Phone must be exactly 10 digits";
  }

  if (data.gst && !isValidGST(data.gst)) {
    errors.gst = "Invalid GST number format";
  }

  if (data.pan && !isValidPANNumber(data.pan)) {
    errors.pan = "Invalid PAN number format";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validatePaymentForm(data: {
  cardNumber?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cvv?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.cardNumber || !isValidCardNumber(data.cardNumber)) {
    errors.cardNumber = "Invalid card number";
  }

  if (!data.expiryMonth || !data.expiryYear) {
    errors.expiry = "Expiry date is required";
  } else if (!isValidCardExpiry(data.expiryMonth, data.expiryYear)) {
    errors.expiry = "Card has expired";
  }

  if (!data.cvv || !isValidCVV(data.cvv)) {
    errors.cvv = "CVV must be 3 digits";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
