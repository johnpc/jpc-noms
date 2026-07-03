import { Redirect, Route } from 'react-router-dom';
import { IonRouterOutlet } from '@ionic/react';
import { Home } from './features/home/Home';
import { SignIn } from './features/auth/SignIn';
import { SignUp } from './features/auth/SignUp';
import { SearchPage } from './features/search/SearchPage';
import { RotationPage } from './features/rotation/RotationPage';
import { PairingPage } from './features/pairing/PairingPage';
import { NomsPage } from './features/noms/NomsPage';
import { NomDetail } from './features/noms/NomDetail';

/**
 * App routes. Home is the shell; pairing/noms land in their own slices and
 * register their routes here as they arrive.
 */
export function AppRoutes() {
  return (
    <IonRouterOutlet>
      <Route exact path="/home">
        <Home />
      </Route>
      <Route exact path="/search">
        <SearchPage />
      </Route>
      <Route exact path="/rotation">
        <RotationPage />
      </Route>
      <Route exact path="/partner">
        <PairingPage />
      </Route>
      <Route exact path="/noms">
        <NomsPage />
      </Route>
      <Route exact path="/noms/:id">
        <NomDetail />
      </Route>
      <Route exact path="/signin">
        <SignIn />
      </Route>
      <Route exact path="/signup">
        <SignUp />
      </Route>
      <Route exact path="/">
        <Redirect to="/home" />
      </Route>
    </IonRouterOutlet>
  );
}
