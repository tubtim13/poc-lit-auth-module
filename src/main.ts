import { initMsal } from './services/auth-service.js';
import { type AuthModule } from './auth-module.element.js';

const initApp = async () => {
  try {
    const response = await fetch('/assets/config/config.json');
    const config = await response.json();

    const msalInstance = await initMsal(config);

    await import('./auth-module.element.js');

    const authModule = document.querySelector<AuthModule>('auth-module');
    if (authModule) {
      authModule.appData = { config, msalInstance };
    } else {
      console.warn('auth-module element not found in DOM');
    }
  } catch (error) {
    console.error('Initialization error:', error);
    await import('./auth-module.element.js');
  }
};

initApp();
