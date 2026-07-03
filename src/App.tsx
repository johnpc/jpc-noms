import { IonApp, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './features/auth/AuthProvider';
import { AppRoutes } from './AppRoutes';
import { usePushRegistration } from './features/push/usePushRegistration';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Dark mode follows the system setting */
import '@ionic/react/css/palettes/dark.system.css';

/* Brand fonts (bundled) + design tokens */
import './theme/fonts';
import './theme/variables.css';

setupIonicReact();

/** Registers this device for push once signed in (native only). Renders nothing. */
const PushRegistrar: React.FC = () => {
  usePushRegistration();
  return null;
};

const App: React.FC = () => (
  <IonApp>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PushRegistrar />
        <IonReactRouter>
          <AppRoutes />
        </IonReactRouter>
      </AuthProvider>
    </QueryClientProvider>
  </IonApp>
);

export default App;
