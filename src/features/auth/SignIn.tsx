import {
  IonButtons,
  IonBackButton,
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { AuthField } from './AuthField';
import { useSignInForm } from './useSignInForm';
import './auth.css';

/** Email/password sign-in for returning users. */
export function SignIn() {
  const history = useHistory();
  const f = useSignInForm();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="auth">
        <div className="auth__body">
          <h1 className="auth__title sp-heading">Welcome back</h1>
          <p className="auth__subtext sp-muted">Sign in to nominate restaurants together.</p>
          <AuthField
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={f.email}
            onChange={f.setEmail}
          />
          <AuthField
            label="Password"
            type="password"
            autoComplete="current-password"
            value={f.password}
            onChange={f.setPassword}
          />
          {f.error && <p className="auth__error">{f.error}</p>}
          <button type="button" className="auth__cta" disabled={f.busy} onClick={f.submit}>
            {f.busy ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="auth__alt">
            New to Noms?{' '}
            <a className="auth__alt-link" onClick={() => history.replace('/signup')}>
              Create an account
            </a>
          </p>
        </div>
      </IonContent>
    </IonPage>
  );
}
