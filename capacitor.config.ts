import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.growthvault.app',
  appName: 'GrowthVault',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
};

export default config;
