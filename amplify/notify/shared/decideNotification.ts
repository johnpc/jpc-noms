/**
 * Pure decision logic for nom push notifications — no I/O, fully unit-tested.
 * Given the before/after of a Nom row, decide whether to notify, which member
 * subs to notify (everyone except the actor), and what the message says.
 */
export interface NomImage {
  members: string[];
  optionPlaceIds: string[];
  status?: string;
  selectedPlaceId?: string;
  lastActorSub?: string;
  lastActionText?: string;
}

export interface Notification {
  recipientSubs: string[];
  title: string;
  body: string;
}

/**
 * Decide the push for a stream event. Fires when an option was added
 * (optionPlaceIds grew) or the nom became selected — and only to members other
 * than the actor. Returns null when nothing noteworthy changed.
 */
export function decideNotification(
  eventName: string,
  newImage: NomImage | undefined,
  oldImage: NomImage | undefined,
): Notification | null {
  if (!newImage) return null;
  if (eventName !== 'INSERT' && eventName !== 'MODIFY') return null;

  const becameSelected = justSelected(newImage, oldImage);
  const optionAdded = countOf(newImage) > countOf(oldImage);
  if (!becameSelected && !optionAdded) return null;

  const recipientSubs = (newImage.members ?? []).filter((m) => m && m !== newImage.lastActorSub);
  if (recipientSubs.length === 0) return null;

  return { recipientSubs, title: 'Noms', body: bodyText(newImage, becameSelected) };
}

const countOf = (img: NomImage | undefined): number => img?.optionPlaceIds?.length ?? 0;

const justSelected = (n: NomImage, o: NomImage | undefined): boolean =>
  n.status === 'SELECTED' && o?.status !== 'SELECTED' && !!n.selectedPlaceId;

function bodyText(img: NomImage, selected: boolean): string {
  const who = img.lastActionText?.trim();
  const prefix = who ? `${who} ` : '';
  const verb = selected ? 'picked where to eat' : 'added a spot to your nom';
  return `${prefix}${verb}`.trim();
}
