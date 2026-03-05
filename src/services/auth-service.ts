import { PublicClientApplication, type Configuration } from '@azure/msal-browser';
import { type AppConfig } from '../core/interfaces/config-context.js';

let msalInstance: PublicClientApplication | null = null;

export const initMsal = async (config: AppConfig) => {
  const msalConfig: Configuration = {
    auth: {
      clientId: config.MSAL_CLIENT_ID,
      authority: `https://login.microsoftonline.com/${config.MICROSOFT_TENANT}`,
      redirectUri: globalThis.location.origin,
    },
    cache: {
      cacheLocation: 'localStorage',
    }
  };

  msalInstance = new PublicClientApplication(msalConfig);
  await msalInstance.initialize();
  return msalInstance;
};

export const getMsalInstance = () => {
  if (!msalInstance) {
    throw new Error('MSAL not initialized. Call initMsal first.');
  }
  return msalInstance;
};
