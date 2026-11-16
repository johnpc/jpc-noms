import {
  IonButton,
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
import { SearchResult } from './SearchResult';
import { SearchSuggestions } from './SearchSuggestions';
import { useSearch } from './useSearch';

/** Guest-browsable restaurant search. Saving to rotation routes guests to sign-in. */
export function SearchPage() {
  const s = useSearch();
  const { results } = s;
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
        {results.kind === 'loading' && <IonSpinner data-testid="search-spinner" />}
        {results.kind === 'empty' && (
          <IonText color="medium">
            <p data-testid="search-empty">No restaurants found. Try another search.</p>
          </IonText>
        )}
        {results.kind === 'error' && (
          <IonText color="danger">
            <p data-testid="search-error">{results.message}</p>
            <IonButton size="small" fill="outline" onClick={s.retry} data-testid="search-retry">
              Try again
            </IonButton>
          </IonText>
        )}
        <div data-testid="search-results">
          {results.kind === 'ready' &&
            results.places.map((place) => (
              <SearchResult
                key={place.id}
                place={place}
                saved={s.savedIds.has(place.id)}
                adding={s.adding}
                addingNom={s.addingNom}
                nominated={s.nominatedIds.has(place.id)}
                onAdd={() => s.add(place.id)}
                onNom={() => s.addNom(place.id)}
              />
            ))}
        </div>
      </IonContent>
    </IonPage>
  );
}
