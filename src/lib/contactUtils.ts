import { BusinessContact } from '../shared/types.ts';

export const DEFAULT_WHATSAPP_MESSAGE =
  'Hi VSHN Builders, I am interested in building my dream home. Please share the details.';

/**
 * Initial business contact configuration for VSHN Builders.
 * 1. +91 70925 07374 — Primary contact
 * 2. +91 86681 81232 — Secondary contact
 * 3. +91 89395 38014 — Additional contact
 */
export const INITIAL_BUSINESS_CONTACTS: BusinessContact[] = [
  {
    id: 'contact-primary',
    label: 'Primary Contact',
    phoneNumber: '+917092507374',
    displayPhone: '+91 70925 07374',
    isWhatsAppEnabled: true,
    isCallEnabled: true,
    isPrimary: true,
    displayOrder: 1,
    isActive: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'contact-secondary',
    label: 'Secondary Contact',
    phoneNumber: '+918668181232',
    displayPhone: '+91 86681 81232',
    isWhatsAppEnabled: true,
    isCallEnabled: true,
    isPrimary: false,
    displayOrder: 2,
    isActive: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'contact-additional',
    label: 'Additional Contact',
    phoneNumber: '+918939538014',
    displayPhone: '+91 89395 38014',
    isWhatsAppEnabled: true,
    isCallEnabled: true,
    isPrimary: false,
    displayOrder: 3,
    isActive: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
];

/**
 * Normalizes any entered phone string to standard international format (e.g. +917092507374)
 */
export function normalizePhoneNumber(raw: string): string {
  if (!raw) return '+917092507374';
  const trimmed = raw.trim();
  const digitsOnly = trimmed.replace(/\D/g, '');

  // 10 digits Indian mobile number (e.g. 7092507374 or 07092507374)
  if (digitsOnly.length === 10) {
    return `+91${digitsOnly}`;
  }
  if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    return `+91${digitsOnly.slice(1)}`;
  }
  // 12 digits starting with 91 (e.g. 917092507374)
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    return `+${digitsOnly}`;
  }

  // Already prefixed with + and valid length
  if (trimmed.startsWith('+') && digitsOnly.length >= 10) {
    return `+${digitsOnly}`;
  }

  // Default fallback to +91 + digits
  return `+${digitsOnly.length > 0 ? digitsOnly : '917092507374'}`;
}

/**
 * Formats a normalized phone number into a clean, human-readable display string.
 * Example: "+917092507374" -> "+91 70925 07374"
 */
export function formatDisplayPhone(normalizedPhone: string): string {
  if (!normalizedPhone) return '+91 70925 07374';
  const clean = normalizedPhone.replace(/\s+/g, '');

  // Format +91XXXXXXXXXX
  if (clean.startsWith('+91') && clean.length === 13) {
    const p1 = clean.slice(3, 8);
    const p2 = clean.slice(8);
    return `+91 ${p1} ${p2}`;
  }

  // 12 digits starting with 91 without plus
  if (clean.startsWith('91') && clean.length === 12) {
    const p1 = clean.slice(2, 7);
    const p2 = clean.slice(7);
    return `+91 ${p1} ${p2}`;
  }

  // 10 digit plain number
  if (/^\d{10}$/.test(clean)) {
    return `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`;
  }

  return normalizedPhone;
}

/**
 * Generates an authentic WhatsApp link without plus sign, spaces, or hyphens.
 * Format: https://wa.me/919999999999?text=...
 */
export function getWhatsAppUrl(phoneNumber: string, customMessage?: string): string {
  // Strip all non-digits (removes +, spaces, hyphens)
  let digits = (phoneNumber || '7092507374').replace(/\D/g, '');

  // Ensure country code 91 is present for Indian numbers
  if (digits.length === 10) {
    digits = `91${digits}`;
  }

  const message = customMessage || DEFAULT_WHATSAPP_MESSAGE;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/**
 * Generates a clean tel: link with normalized format.
 * Format: tel:+919999999999 (no spaces, no hyphens)
 */
export function getCallUrl(phoneNumber: string): string {
  const norm = normalizePhoneNumber(phoneNumber);
  return `tel:${norm}`;
}

/**
 * Returns the active primary contact from a list of contacts.
 * Ensures safe fallback so the website never crashes or has broken links.
 */
export function getPrimaryContact(contacts?: BusinessContact[]): BusinessContact {
  if (!Array.isArray(contacts) || contacts.length === 0) {
    return INITIAL_BUSINESS_CONTACTS[0];
  }

  // 1. Look for active contact explicitly marked as primary
  const primaryActive = contacts.find((c) => c && c.isActive !== false && c.isPrimary);
  if (primaryActive) return primaryActive;

  // 2. Look for any active contact
  const firstActive = contacts.find((c) => c && c.isActive !== false);
  if (firstActive) return { ...firstActive, isPrimary: true };

  // 3. Look for contact marked primary even if inactive
  const anyPrimary = contacts.find((c) => c && c.isPrimary);
  if (anyPrimary) return anyPrimary;

  // 4. Safe fallback
  return INITIAL_BUSINESS_CONTACTS[0];
}

/**
 * Returns only active contacts sorted by displayOrder.
 * Guarantees exactly one contact is treated as primary.
 */
export function getActiveContacts(contacts?: BusinessContact[]): BusinessContact[] {
  if (!Array.isArray(contacts) || contacts.length === 0) {
    return INITIAL_BUSINESS_CONTACTS;
  }

  const active = contacts
    .filter((c) => c && c.isActive !== false)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  if (active.length === 0) {
    return INITIAL_BUSINESS_CONTACTS;
  }

  // Ensure at least one is flagged as primary
  const hasPrimary = active.some((c) => c.isPrimary);
  if (!hasPrimary && active.length > 0) {
    active[0] = { ...active[0], isPrimary: true };
  }

  return active;
}

/**
 * Validates a business contact before saving, preventing invalid numbers and duplicate active numbers.
 */
export function validateBusinessContact(
  contact: Partial<BusinessContact>,
  existingContacts: BusinessContact[],
  editingId?: string
): { valid: boolean; error?: string } {
  if (!contact.label || !contact.label.trim()) {
    return { valid: false, error: 'Contact label or name is required (e.g. "Primary Contact" or "Sales Desk").' };
  }

  if (!contact.phoneNumber || !contact.phoneNumber.trim()) {
    return { valid: false, error: 'Phone number is required.' };
  }

  const digits = contact.phoneNumber.replace(/\D/g, '');
  if (digits.length < 10) {
    return { valid: false, error: 'Phone number must contain at least 10 digits.' };
  }

  const normalized = normalizePhoneNumber(contact.phoneNumber);

  // Check for duplicate active number (excluding the current contact being edited)
  const isDuplicate = existingContacts.some((c) => {
    if (editingId && c.id === editingId) return false;
    if (c.isActive === false) return false;
    return normalizePhoneNumber(c.phoneNumber) === normalized;
  });

  if (isDuplicate) {
    return { valid: false, error: `A contact with phone number ${formatDisplayPhone(normalized)} already exists.` };
  }

  return { valid: true };
}
