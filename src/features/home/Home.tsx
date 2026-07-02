import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import './home.css';

/**
 * Noms Home — the landing shell. Anyone can browse; the primary calls to action
 * route into search (find restaurants) and the shared noms list. Signed-out
 * visitors get a sign-in prompt instead of the noms link.
 */
export function Home() {
  const { status } = useAuth();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Noms</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <header className="home-hero">
          <h1 className="home-hero__title">Noms</h1>
          <p className="home-hero__sub">Pick where to eat, together.</p>
        </header>
        <nav className="home-actions" data-testid="home-actions">
          <Link className="home-card" to="/search" data-testid="home-search">
            <span className="home-card__emoji" aria-hidden="true">
              🔍
            </span>
            <span className="home-card__name">Find a restaurant</span>
          </Link>
          {status === 'authenticated' ? (
            <Link className="home-card" to="/noms" data-testid="home-noms">
              <span className="home-card__emoji" aria-hidden="true">
                🍽️
              </span>
              <span className="home-card__name">Our noms</span>
            </Link>
          ) : (
            <Link className="home-card" to="/signin" data-testid="home-signin">
              <span className="home-card__emoji" aria-hidden="true">
                👋
              </span>
              <span className="home-card__name">Sign in to nominate</span>
            </Link>
          )}
        </nav>
      </IonContent>
    </IonPage>
  );
}
