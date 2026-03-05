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
