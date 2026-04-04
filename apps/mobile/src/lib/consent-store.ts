// Simple in-memory consent store for scroll-to-bottom tracking
const scrolledConsents = new Set<string>();

export function markConsentScrolled(key: string): void {
  scrolledConsents.add(key);
}

export function hasConsentScrolled(key: string): boolean {
  return scrolledConsents.has(key);
}

export function clearConsentScrolled(key: string): void {
  scrolledConsents.delete(key);
}
