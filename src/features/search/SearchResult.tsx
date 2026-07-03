import { PlaceCard } from './PlaceCard';
import type { Place } from './types';

interface Props {
  place: Place;
  saved: boolean;
  adding: boolean;
  addingNom: boolean;
  nominated: boolean;
  onAdd: () => void;
  onNom: () => void;
}

/** One search result: a place card wired to add-to-rotation + ➕ Nom. Extracted
 * from SearchPage so that screen stays a thin, low-complexity composition. */
export function SearchResult({ place, saved, adding, addingNom, nominated, onAdd, onNom }: Props) {
  return (
    <PlaceCard
      place={place}
      actionLabel={saved ? 'In rotation ✓' : 'Add to rotation'}
      actionDisabled={saved || adding}
      onAction={onAdd}
      onNom={onNom}
      nomDisabled={addingNom}
      nominated={nominated}
    />
  );
}
