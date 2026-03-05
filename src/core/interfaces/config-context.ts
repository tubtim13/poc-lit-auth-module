import { createContext } from '@lit/context';
import { type PublicClientApplication } from '@azure/msal-browser';

export interface AppConfig {
  // MSAL
  MSAL_CLIENT_ID: string;
  MICROSOFT_TENANT: string;

  // API
  DISABLE_INTERCEPTOR: boolean;

  //app info
  version: string;
}

export interface AppContext {
  config: AppConfig;
  msalInstance: PublicClientApplication;
}

export const appContext = createContext<AppContext | undefined>(Symbol('app-context'));

/** @deprecated Use appContext instead */
export const configContext = createContext<AppConfig | undefined>(Symbol('app-config'));
