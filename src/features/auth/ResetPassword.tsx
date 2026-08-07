import {
  IonButtons,
  IonBackButton,
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
} from '@ionic/react';
import { AuthField } from './AuthField';
import { useResetPasswordForm } from './useResetPasswordForm';
import './auth.css';

/** Forgot-password: request an emailed code, then set a new password. */
export function ResetPassword() {
  const f = useResetPasswordForm();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/signin" />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="auth">
        <div className="auth__body">
          {f.phase === 'request' ? (
            <>
              <h1 className="auth__title sp-heading">Reset your password</h1>
              <p className="auth__subtext sp-muted">
                Enter your email and we'll send you a reset code.
              </p>
              <AuthField
                label="Email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={f.email}
                onChange={f.setEmail}
              />
              {f.error && <p className="auth__error">{f.error}</p>}
              <button type="button" className="auth__cta" disabled={f.busy} onClick={f.submitEmail}>
                {f.busy ? 'Sending…' : 'Send reset code'}
              </button>
            </>
          ) : (
            <>
              <h1 className="auth__title sp-heading">Check your email</h1>
              <p className="auth__subtext sp-muted">
                Enter the code we sent to {f.email} and choose a new password.
              </p>
              <AuthField
                label="Reset code"
                type="text"
                inputMode="numeric"
                value={f.code}
                onChange={f.setCode}
              />
              <AuthField
                label="New password"
                type="password"
                autoComplete="new-password"
                value={f.password}
                onChange={f.setPassword}
              />
              {f.error && <p className="auth__error">{f.error}</p>}
              <button type="button" className="auth__cta" disabled={f.busy} onClick={f.submitReset}>
                {f.busy ? 'Resetting…' : 'Reset password'}
              </button>
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
}
