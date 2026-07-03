/**
 * Pure decision for pairing push — no I/O, unit-tested. When a Pairing becomes
 * ACTIVE (a scan connected two people), notify BOTH members that they're paired.
 * The scanner isn't recorded, so both get "You're paired!" — friendly + correct.
 */
export interface PairingImage {
  members?: string[];
  inviterEmail?: string;
  inviteeEmail?: string;
  status?: string;
}

export interface PairingNotification {
  recipientSubs: string[];
  title: string;
  body: string;
}

const isActive = (p: PairingImage | undefined): boolean => p?.status === 'ACTIVE';

/** Fire on the transition into ACTIVE (INSERT active, or MODIFY pending→active). */
export function decidePairingNotification(
  eventName: string,
  newImage: PairingImage | undefined,
  oldImage: PairingImage | undefined,
): PairingNotification | null {
  if (!newImage) return null;
  if (eventName !== 'INSERT' && eventName !== 'MODIFY') return null;
  if (!isActive(newImage) || isActive(oldImage)) return null;

  const recipientSubs = (newImage.members ?? []).filter(Boolean);
  if (recipientSubs.length === 0) return null;

  return { recipientSubs, title: 'Noms', body: "You're paired — start nominating together! 🍽️" };
}
