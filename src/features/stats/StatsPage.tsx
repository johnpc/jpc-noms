import {
  IonButtons,
  IonBackButton,
  IonButton,
  IonContent,
  IonHeader,
  IonList,
  IonListHeader,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useStats } from './useStats';
import { HistoryRow } from './HistoryRow';
import './stats.css';

/** Dining stats + history: how many noms you've decided, and where you ended up. */
export function StatsPage() {
  const { screen } = useStats();
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Stats</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {screen.kind === 'signed-out' && (
          <IonText color="medium">
            <p data-testid="stats-signin">Sign in to see your dining stats.</p>
          </IonText>
        )}
        {screen.kind === 'empty' && (
          <IonText color="medium">
            <p data-testid="stats-empty">
              No decisions yet. Pick a restaurant in a nom and it shows up here.
            </p>
          </IonText>
        )}
        {screen.kind === 'ready' && (
          <>
            <div className="stats-tiles" data-testid="stats-tiles">
              <Tile n={screen.stats.decidedCount} label="decided" />
              <Tile n={screen.stats.openCount} label="open" />
              <Tile n={screen.stats.totalNoms} label="total" />
            </div>
            <IonList>
              <IonListHeader>Where you ended up</IonListHeader>
              {screen.stats.history.map((nom) => (
                <HistoryRow key={nom.id} nom={nom} />
              ))}
            </IonList>
            <IonButton expand="block" fill="clear" routerLink="/noms" data-testid="stats-all-noms">
              See all noms
            </IonButton>
          </>
        )}
      </IonContent>
    </IonPage>
  );
}

function Tile({ n, label }: { n: number; label: string }) {
  return (
    <div className="stats-tile">
      <span className="stats-tile__n">{n}</span>
      <span className="stats-tile__label">{label}</span>
    </div>
  );
}
