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
import { useSignUpForm } from './useSignUpForm';
import './auth.css';

/** Cognito email sign-up: collect details, then confirm the emailed code. */
export function SignUp() {
  const history = useHistory();
  const f = useSignUpForm();

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
          {f.phase === 'collect' ? (
            <>
              <h1 className="auth__title sp-heading">Create your account</h1>
              <p className="auth__subtext sp-muted">
                Pair with your partner and nominate restaurants together.
              </p>
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
                autoComplete="new-password"
                value={f.password}
                onChange={f.setPassword}
              />
              {f.error && <p className="auth__error">{f.error}</p>}
              <button
                type="button"
                className="auth__cta"
                disabled={f.busy}
                onClick={f.submitDetails}
              >
                {f.busy ? 'Creating…' : 'Create account'}
              </button>
              <p className="auth__alt">
                Already have an account?{' '}
                <a className="auth__alt-link" onClick={() => history.replace('/signin')}>
                  Sign in
                </a>
              </p>
            </>
          ) : (
            <>
              <h1 className="auth__title sp-heading">Check your email</h1>
              <p className="auth__subtext sp-muted">Enter the code we sent to {f.email}.</p>
              <AuthField
                label="Confirmation code"
                type="text"
                inputMode="numeric"
                value={f.code}
                onChange={f.setCode}
              />
              {f.error && <p className="auth__error">{f.error}</p>}
              <button type="button" className="auth__cta" disabled={f.busy} onClick={f.submitCode}>
                {f.busy ? 'Confirming…' : 'Confirm'}
              </button>
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
}
