import { initMsal, getMsalInstance } from './services/auth-service.js';
import { userService } from './services/user-service.js';
import type { AppConfig } from './core/interfaces/config-context.js';
import type { AccountInfo } from '@azure/msal-browser';

export type { AppConfig } from './core/interfaces/config-context.js';
export { userService } from './services/user-service.js';
export type { UserSubscription } from './services/user-service.js';

/**
 * Headless `<singha-auth>` web component.
 *
 * Place once in your app root, then call `init()` to bootstrap MSAL.
 * Use `login()` / `logout()` from any framework by getting a reference
 * to the element, or subscribe to auth state changes via `userService`.
 *
 * @fires singha-auth-ready  - MSAL initialized; detail: `{ user: AccountInfo | null }`
 * @fires singha-auth-login  - user authenticated; detail: `{ user: AccountInfo }`
 * @fires singha-auth-logout - user signed out
 * @fires singha-auth-error  - error occurred; detail: `{ error: unknown }`
 *
 * @example Angular
 * ```html
 * <!-- app.component.html -->
 * <singha-auth #auth (singha-auth-login)="onLogin($event)"></singha-auth>
 * ```
 * ```ts
 * @ViewChild('auth') auth!: ElementRef<SinghaAuth>;
 * async ngOnInit() { await this.auth.nativeElement.init(this.config); }
 * login() { this.auth.nativeElement.login(); }
 * ```
 *
 * @example Vue
 * ```html
 * <singha-auth ref="auth" @singha-auth-login="onLogin"></singha-auth>
 * ```
 * ```ts
 * const auth = useTemplateRef<SinghaAuth>('auth');
 * onMounted(() => auth.value?.init(config));
 * const login = () => auth.value?.login();
 * ```
 *
 * @example React
 * ```tsx
 * const auth = useRef<SinghaAuth>(null);
 * useEffect(() => { auth.current?.init(config); }, []);
 * return <singha-auth ref={auth} onSinghaAuthLogin={onLogin} />;
 * ```
 */
export class SinghaAuth extends HTMLElement {
  private _initialized = false;

  /** The currently authenticated user, or `null` if not signed in. */
  get user(): AccountInfo | null {
    return userService.getUser();
  }

  /** `true` if a user is currently signed in. */
  get isAuthenticated(): boolean {
    return this.user !== null;
  }

  /**
   * Initialize MSAL and handle any pending redirect response.
   * Must be called once before `login()` or `logout()`.
   */
  async init(config: AppConfig): Promise<void> {
    if (this._initialized) return;
    this._initialized = true;

    try {
      const msalInstance = await initMsal(config);
      await msalInstance.handleRedirectPromise();

      const accounts = msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        userService.setUser(accounts[0]);
        this._emit('singha-auth-login', { user: accounts[0] });
      }

      this._emit('singha-auth-ready', { user: accounts[0] ?? null });
    } catch (error) {
      console.error('[SinghaAuth] init error:', error);
      this._emit('singha-auth-error', { error });
    }
  }

  /**
   * Trigger a Microsoft login redirect.
   * @param scopes - OAuth scopes to request (default: openid, profile, User.Read)
   */
  async login(scopes = ['openid', 'profile', 'User.Read']): Promise<void> {
    try {
      const msal = getMsalInstance();
      await msal.loginRedirect({ scopes });
    } catch (error) {
      console.error('[SinghaAuth] login error:', error);
      this._emit('singha-auth-error', { error });
    }
  }

  /** Sign out the current user and redirect to the app origin. */
  async logout(): Promise<void> {
    try {
      const msal = getMsalInstance();
      userService.setUser(null);
      this._emit('singha-auth-logout', null);
      await msal.logoutRedirect({ postLogoutRedirectUri: globalThis.location.origin });
    } catch (error) {
      console.error('[SinghaAuth] logout error:', error);
      this._emit('singha-auth-error', { error });
    }
  }

  private _emit<T>(name: string, detail: T): void {
    this.dispatchEvent(
      new CustomEvent<T>(name, { bubbles: true, composed: true, detail })
    );
  }
}

customElements.define('singha-auth', SinghaAuth);

declare global {
  interface HTMLElementTagNameMap {
    'singha-auth': SinghaAuth;
  }
}
