/**
 * Lazy-load alertifyjs for notifications (avoids SSR issues).
 * Use from client components and actions only.
 */
export async function getAlertify() {
  if (typeof window === 'undefined') return null;
  const mod = await import('alertifyjs');
  return mod?.default ?? mod;
}
