import './auth-module.element.js';
import type { SinghaAuth } from './auth-module.element.js';

const init = async () => {
  try {
    const res = await fetch('/assets/config/config.json');
    const config = await res.json();

    const authEl = document.querySelector<SinghaAuth>('singha-auth');
    if (!authEl) {
      console.warn('[Dev] <singha-auth> element not found in DOM');
      return;
    }

    authEl.addEventListener('singha-auth-ready', (e) => {
      const user = (e as CustomEvent<{ user: unknown }>).detail?.user;
      console.log('[Dev] Auth ready — user:', user ?? 'not signed in');
    });

    authEl.addEventListener('singha-auth-login', (e) => {
      const user = (e as CustomEvent<{ user: { name?: string } }>).detail?.user;
      console.log('[Dev] Logged in:', user?.name);
    });

    authEl.addEventListener('singha-auth-logout', () => {
      console.log('[Dev] Logged out');
    });

    authEl.addEventListener('singha-auth-error', (e) => {
      console.error('[Dev] Auth error:', (e as CustomEvent<{ error: unknown }>).detail?.error);
    });

    await authEl.init(config);
  } catch (error) {
    console.error('[Dev] Init failed:', error);
  }
};

init();
