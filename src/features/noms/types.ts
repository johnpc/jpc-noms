/** Shared types for collaborative noms. */

export interface Nom {
  id: string;
  pairingId: string;
  members: string[];
  title?: string | null;
  optionPlaceIds: string[];
  selectedPlaceId?: string | null;
  selectedBy?: string | null;
  status?: 'OPEN' | 'SELECTED' | null;
}
