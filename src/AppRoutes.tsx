import { Redirect, Route } from 'react-router-dom';
import { IonRouterOutlet } from '@ionic/react';
import { Home } from './features/home/Home';
import { SignIn } from './features/auth/SignIn';
import { SignUp } from './features/auth/SignUp';

/**
 * App routes. Home is the shell; search/rotation/noms/pairing land in their own
 * slices and register their routes here as they arrive.
 */
export function AppRoutes() {
  return (
    <IonRouterOutlet>
      <Route exact path="/home">
        <Home />
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
