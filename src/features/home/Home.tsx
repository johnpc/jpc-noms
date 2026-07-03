import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { Link } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../auth/useAuth';
import './home.css';

/**
 * Noms Home — the landing shell. Anyone can browse; the primary calls to action
 * route into search (find restaurants) and the shared noms list. Signed-out
 * visitors get a sign-in prompt instead of the noms link.
 */
export function Home() {
  const { status } = useAuth();
  // "Get the app" only makes sense on the web build — hide it inside the app.
  const showDownload = !Capacitor.isNativePlatform();

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
            <>
              <Link className="home-card" to="/rotation" data-testid="home-rotation">
                <span className="home-card__emoji" aria-hidden="true">
                  ⭐
                </span>
                <span className="home-card__name">Your rotation</span>
              </Link>
              <Link className="home-card" to="/partner" data-testid="home-partner">
                <span className="home-card__emoji" aria-hidden="true">
                  👫
                </span>
                <span className="home-card__name">Your partner</span>
              </Link>
              <Link className="home-card" to="/noms" data-testid="home-noms">
                <span className="home-card__emoji" aria-hidden="true">
                  🍽️
                </span>
                <span className="home-card__name">Our noms</span>
              </Link>
              <Link className="home-card" to="/stats" data-testid="home-stats">
                <span className="home-card__emoji" aria-hidden="true">
                  📊
                </span>
                <span className="home-card__name">Stats</span>
              </Link>
            </>
          ) : (
            <Link className="home-card" to="/signin" data-testid="home-signin">
              <span className="home-card__emoji" aria-hidden="true">
                👋
              </span>
              <span className="home-card__name">Sign in to nominate</span>
            </Link>
          )}
          <Link className="home-card" to="/settings" data-testid="home-settings">
            <span className="home-card__emoji" aria-hidden="true">
              ⚙️
            </span>
            <span className="home-card__name">Settings</span>
          </Link>
          {showDownload && (
            <Link className="home-card" to="/download" data-testid="home-download">
              <span className="home-card__emoji" aria-hidden="true">
                📲
              </span>
              <span className="home-card__name">Get the app</span>
            </Link>
          )}
        </nav>
      </IonContent>
    </IonPage>
  );
}
