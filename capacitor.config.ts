import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Ships through the existing eats App Store listing (John retired eats and
  // replaced it with Noms; history was migrated). Bundle id stays eats; the
  // on-screen name is jpc.noms.
  appId: 'com.johncorser.eats',
  appName: 'jpc.noms',
  webDir: 'dist',
};

export default config;
