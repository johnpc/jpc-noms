import {
  IonButtons,
  IonBackButton,
  IonContent,
  IonHeader,
  IonPage,
  IonSearchbar,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { PlaceCard } from './PlaceCard';
import { SearchSuggestions } from './SearchSuggestions';
import { useSearch } from './useSearch';

/** Guest-browsable restaurant search. Saving to rotation routes guests to sign-in. */
export function SearchPage() {
  const s = useSearch();
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Find a restaurant</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonSearchbar
          value={s.term}
          debounce={400}
          placeholder="Tacos, sushi, pizza…"
          onIonInput={(e) => s.setTerm(e.detail.value ?? '')}
          data-testid="search-input"
        />
        <SearchSuggestions suggestions={s.suggestions} onPick={s.setTerm} />
        {s.isLoading && <IonSpinner data-testid="search-spinner" />}
        {!s.isLoading && s.term.trim() && s.places.length === 0 && (
          <IonText color="medium">
            <p>No restaurants found. Try another search.</p>
          </IonText>
        )}
        <div data-testid="search-results">
          {s.places.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              actionLabel={s.savedIds.has(place.id) ? 'In rotation ✓' : 'Add to rotation'}
              actionDisabled={s.savedIds.has(place.id) || s.adding}
              onAction={() => s.add(place.id)}
            />
          ))}
        </div>
      </IonContent>
    </IonPage>
  );
}
