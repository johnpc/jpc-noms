import { IonChip, IonLabel } from '@ionic/react';
import './place.css';

interface Props {
  suggestions: readonly string[];
  onPick: (term: string) => void;
}

/** A horizontal row of tappable cuisine chips that each run a search. */
export function SearchSuggestions({ suggestions, onPick }: Props) {
  return (
    <div className="search-suggestions" data-testid="search-suggestions">
      {suggestions.map((s) => (
        <IonChip key={s} onClick={() => onPick(s)} data-testid={`suggestion-${s}`}>
          <IonLabel>{s}</IonLabel>
        </IonChip>
      ))}
    </div>
  );
}
