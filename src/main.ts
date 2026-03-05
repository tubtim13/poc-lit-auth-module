import { initMsal } from './services/auth-service.js';

const initApp = async () => {
  try {
    const response = await fetch('/assets/config/config.json');
    const config = await response.json();
    console.log('App Config fetched:', config);

    // Initialize MSAL
    const msalInstance = await initMsal(config);
    console.log('MSAL Initialized');
    
    // We import the module which registers the custom element
    await import('./auth-module.element.ts');
    
    // Find the element and set the appData property
    const authModule = document.querySelector('auth-module');
    if (authModule) {
      (authModule as any).appData = { config, msalInstance };
    } else {
      console.warn('auth-module element not found in DOM');
    }

  } catch (error) {
    console.error('Initialization error:', error);
    await import('./auth-module.element.ts');
  }
};

initApp();