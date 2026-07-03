import {
  IonButtons,
  IonBackButton,
  IonContent,
  IonHeader,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useParams } from 'react-router-dom';
import { useNomDetail } from './useNomDetail';
import { NomOptionCard } from './NomOptionCard';
import { isSelected } from './nom';

/** One shared nom: its options (either partner can select) + your rotation to add from. */
export function NomDetail() {
  const { id } = useParams<{ id: string }>();
  const d = useNomDetail(id);

  if (!d.signedIn || d.loading || !d.nom) {
    return (
      <Shell title="Nom">
        {!d.signedIn && <p data-testid="nom-signin">Sign in to view this nom.</p>}
      </Shell>
    );
  }
  const nom = d.nom;
  const selected = isSelected(nom);

  return (
    <Shell title={nom.title || 'Nom'}>
      {selected && (
        <IonText color="success">
          <p data-testid="nom-selected">Selected — navigation sent to the car 🚗</p>
        </IonText>
      )}
      <h2 className="nom-section">Options</h2>
      {nom.optionPlaceIds.length === 0 ? (
        <IonText color="medium">
          <p data-testid="nom-no-options">No options yet — add one from your rotation below.</p>
        </IonText>
      ) : (
        <div data-testid="nom-options">
          {nom.optionPlaceIds.map((pid) => (
            <NomOptionCard
              key={pid}
              googlePlaceId={pid}
              actionLabel={nom.selectedPlaceId === pid ? 'Selected ✓' : 'Select'}
              disabled={selected || d.selecting}
              onAction={() => d.select(pid)}
            />
          ))}
        </div>
      )}
      {!selected && d.addable.length > 0 && (
        <>
          <h2 className="nom-section">Add from your rotation</h2>
          <div data-testid="nom-addable">
            {d.addable.map((pid) => (
              <NomOptionCard
                key={pid}
                googlePlaceId={pid}
                actionLabel="Add to nom"
                disabled={d.adding}
                onAction={() => d.add(pid)}
              />
            ))}
          </div>
        </>
      )}
    </Shell>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/noms" />
          </IonButtons>
          <IonTitle>{title}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">{children}</IonContent>
    </IonPage>
  );
}
