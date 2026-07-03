import { IonText } from '@ionic/react';

/** A muted, testable one-line message (empty/sign-in/unpaired states). */
export function Prompt({ children, testid }: { children: React.ReactNode; testid: string }) {
  return (
    <IonText color="medium">
      <p data-testid={testid}>{children}</p>
    </IonText>
  );
}
