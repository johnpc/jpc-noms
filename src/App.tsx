import { IonApp, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './features/auth/AuthProvider';
import { AppRoutes } from './AppRoutes';
import { usePushRegistration } from './features/push/usePushRegistration';
import { useTheme } from './features/settings/useTheme';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Dark mode is class-toggled (.ion-palette-dark on <html>) so it's
 * configurable in Settings — see features/settings/useTheme. */
import '@ionic/react/css/palettes/dark.class.css';

/* Brand fonts (bundled) + design tokens */
import './theme/fonts';
import './theme/variables.css';

setupIonicReact();

/** Applies the saved theme (and registers push once signed in). Renders nothing. */
const AppEffects: React.FC = () => {
  useTheme();
  usePushRegistration();
  return null;
};

const App: React.FC = () => (
  <IonApp>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppEffects />
        <IonReactRouter>
          <AppRoutes />
        </IonReactRouter>
      </AuthProvider>
    </QueryClientProvider>
  </IonApp>
);

export default App;
