/**
 * Pure decision for the Tesla nav hand-off — no I/O, unit-tested. Mirrors the
 * recovered jpc-eats sendToTesla gate, adapted to the Nom model: fire only when
 * `selectedPlaceId` changes to a real value AND the nom's members are within the
 * allowed household (ALLOWED_OWNERS). Returns the place id to route to, or null.
 */
export interface NavImage {
  members?: string[];
  selectedPlaceId?: string;
  status?: string;
}

/**
 * @param allowedOwners subs permitted to drive the car nav (empty = allow any
 *        member — the sandbox default; prod sets the household's two subs).
 */
export function decideNav(
  eventName: string,
  newImage: NavImage | undefined,
  oldImage: NavImage | undefined,
  allowedOwners: string[],
): string | null {
  if (!newImage) return null;
  if (eventName !== 'INSERT' && eventName !== 'MODIFY') return null;

  const selected = newImage.selectedPlaceId;
  if (!selected || selected === 'NONE') return null;
  if (selected === oldImage?.selectedPlaceId) return null; // unchanged

  const members = newImage.members ?? [];
  const allowed = allowedOwners.length === 0 || members.some((m) => allowedOwners.includes(m));
  if (!allowed) return null;

  return selected;
}
