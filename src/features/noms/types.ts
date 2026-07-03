/** Shared types for collaborative noms. */

export interface Nom {
  id: string;
  pairingId: string;
  members: string[];
  /** ISO timestamp the nom was created — a nom is identified by its date, not a name. */
  createdAt?: string | null;
  optionPlaceIds: string[];
  selectedPlaceId?: string | null;
  selectedBy?: string | null;
  status?: 'OPEN' | 'SELECTED' | null;
}
