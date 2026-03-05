import { LitElement, html, css } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { provide } from '@lit/context';
import { type AccountInfo } from '@azure/msal-browser';
import { appContext, type AppContext } from './core/interfaces/config-context';
import { tokens } from './styles/tokens';
import './components/navigation-bar.element';
import './components/user-info.element';
import { userService } from './services/user-service';


/**
 * <auth-module> — shell component, mounts to index.html
 */
@customElement('auth-module')
export class AuthModule extends LitElement {
  @property({ type: Object })
  set appData(data: AppContext) {
    this._contextData = data;
    this.config = data.config;
    this._handleMsalRedirect();
  }

  @state() private _account: AccountInfo | null = null;

  @provide({ context: appContext })
  @state()
  private _contextData?: AppContext;

  async connectedCallback() {
    super.connectedCallback();
    console.log('AuthModule context initialized:', !!this._contextData);
  }

  private async _handleMsalRedirect() {
    if (!this._contextData?.msalInstance) return;
    try {
      await this._contextData.msalInstance.handleRedirectPromise();
      const accounts = this._contextData.msalInstance.getAllAccounts();
      console.log('MSAL Accounts:', accounts);
      if (accounts.length > 0) {
        this._account = accounts[0];
        userService.setUser(this._account);
      }
    } catch (error) {
      console.error('MSAL Redirect Error:', error);
    }
  }

  private async _login() {
    if (!this._contextData?.msalInstance) return;
    await this._contextData.msalInstance.loginRedirect({
      scopes: ['openid', 'profile', 'User.Read']
    }).then((result) => {
      console.error('MSAL Login Success:', result);
    }).catch((error) => {
      console.error('MSAL Login Error:', error);
    });
  }

  @state()
  config?: AppContext['config'];

  @state() private _theme: 'dark' | 'light' = 'dark';

  static styles = [
    tokens,
    css`
      :host {
        display: block;
        min-height: 100vh;
        background: var(--color-bg);
        font-family: var(--font-sans);
      }

      nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 40px;
        border-bottom: 1px solid var(--color-border);
      }

      .logo {
        font-family: var(--font-display);
        font-size: 1.1rem;
        color: var(--color-text);
        letter-spacing: -0.02em;
      }
      .logo span { color: var(--color-accent); }

      .nav-actions { display: flex; gap: 12px; align-items: center; }

      .theme-btn {
        background: none;
        border: 1px solid var(--color-border);
        color: var(--color-muted);
        border-radius: var(--radius-sm);
        padding: 6px 12px;
        font-size: 0.8rem;
        cursor: pointer;
        font-family: var(--font-sans);
        transition: color 0.2s, border-color 0.2s;
      }
      .theme-btn:hover { color: var(--color-accent); border-color: var(--color-accent); }

      main {
        max-width: 640px;
        margin: 60px auto;
        padding: 0 24px;
        color: var(--color-text);
      }

      .login-card {
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        padding: 40px;
        text-align: center;
        margin-top: 40px;
      }

      .btn-primary {
        background: var(--color-accent);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: var(--radius-sm);
        font-family: var(--font-sans);
        font-weight: 500;
        cursor: pointer;
        transition: opacity 0.2s;
      }
      .btn-primary:hover { opacity: 0.9; }

      .btn-primary:hover { opacity: 0.9; }
    `,
  ];

  render() {
    return html`
      <nav>
        <div class="logo">lit<span>·</span>app</div>
        <div class="nav-actions">
          ${this._account ? html`
            <navigation-bar .account=${this._account}></navigation-bar>
          ` : ''}
          <button class="theme-btn" @click=${() =>
            this._theme = this._theme === 'dark' ? 'light' : 'dark'}>
            ${this._theme === 'dark' ? '☀ light' : '☾ dark'}
          </button>
        </div>
      </nav>

      <main>
        <h1>Welcome to Auth Module ${this.config?.version ? html`<span style="font-size: 0.4em; color: var(--color-muted); font-family: var(--font-sans); vertical-align: middle; margin-left: 8px;">v${this.config.version}</span>` : ''}</h1>
        ${this._account ? html`
          <user-info></user-info>
          <task-list></task-list>
        ` : html`
          <div class="login-card">
            <h2 style="margin-bottom: 16px;">Secure Access</h2>
            <p style="color: var(--color-muted); margin-bottom: 24px;">Please sign in with your corporate account to continue.</p>
            <button class="btn-primary" @click=${this._login}>Sign In with Microsoft</button>
          </div>
        `}
      </main>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'auth-module': AuthModule; }
}
