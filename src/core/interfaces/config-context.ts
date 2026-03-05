import { createContext } from '@lit/context';
import { type PublicClientApplication } from '@azure/msal-browser';

export interface AppConfig {
  // MSAL
  MSAL_CLIENT_ID: string;
  MICROSOFT_TENANT: string;

  // API
  DISABLE_INTERCEPTOR: boolean;

  // App info
  version: string;
  NODE_ENV?: string;
}

export interface AppContext {
  config: AppConfig;
  msalInstance: PublicClientApplication;
}

export const appContext = createContext<AppContext | undefined>(Symbol('app-context'));
