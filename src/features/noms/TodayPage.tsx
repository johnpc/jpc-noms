import {
  IonButtons,
  IonBackButton,
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useToday } from './useToday';
import { NomOptionsSection } from './NomOptionsSection';
import { NomFooterActions } from './NomFooterActions';
import { PreviousPick } from './PreviousPick';
import { Prompt } from './Prompt';
import { isSelected, selectedByLabel } from './nom';

/**
 * Today's nom — the app's primary screen. Shows the previous pick for
 * reference, then today's options (build by adding from search/rotation; no
 * create button — the nom is created lazily on first add). Removing the last
 * option clears the nom. The full noms history lives under Stats.
 */
export function TodayPage() {
  const d = useToday();
  if (!d.signedIn)
    return <Shell body={<Prompt testid="today-signin">Sign in to start today’s nom.</Prompt>} />;

  const nom = d.nom;
  const selected = !!nom && isSelected(nom);

  return (
    <Shell
      body={
        <>
          {d.previous && <PreviousPick nom={d.previous} />}

          {!nom || nom.optionPlaceIds.length === 0 ? (
            <div data-testid="today-empty">
              <Prompt testid="today-empty-msg">
                No nom yet today — find a restaurant and tap “➕ Nom” to start one.
              </Prompt>
              <IonButton expand="block" routerLink="/search" data-testid="today-find">
                Find a restaurant
              </IonButton>
            </div>
          ) : (
            <>
              {selected && (
                <IonText color="success">
                  <p data-testid="today-selected">
                    Selected — navigation sent to the car 🚗
                    {selectedByLabel(nom) && <span> · {selectedByLabel(nom)}</span>}
                  </p>
                </IonText>
              )}
              <NomOptionsSection
                nom={nom}
                selected={selected}
                addable={d.addable}
                busy={d.busy}
                onSelect={d.select}
                onRemove={d.remove}
                onAdd={d.add}
              />
              <NomFooterActions
                selected={selected}
                hasOptions={nom.optionPlaceIds.length > 0}
                busy={d.busy}
                onDecide={d.decideForUs}
                onReopen={d.reopen}
                onDelete={d.del}
              />
            </>
          )}
        </>
      }
    />
  );
}

function Shell({ body }: { body: React.ReactNode }) {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Today’s nom</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">{body}</IonContent>
    </IonPage>
  );
}
