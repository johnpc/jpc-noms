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
  const s = useStats();
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
        {!s.signedIn ? (
          <IonText color="medium">
            <p data-testid="stats-signin">Sign in to see your dining stats.</p>
          </IonText>
        ) : s.loading ? null : s.stats.decidedCount === 0 ? (
          <IonText color="medium">
            <p data-testid="stats-empty">
              No decisions yet. Pick a restaurant in a nom and it shows up here.
            </p>
          </IonText>
        ) : (
          <>
            <div className="stats-tiles" data-testid="stats-tiles">
              <Tile n={s.stats.decidedCount} label="decided" />
              <Tile n={s.stats.openCount} label="open" />
              <Tile n={s.stats.totalNoms} label="total" />
            </div>
            <IonList>
              <IonListHeader>Where you ended up</IonListHeader>
              {s.stats.history.map((nom) => (
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
