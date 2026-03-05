import { LitElement, html, css } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { type AccountInfo } from '@azure/msal-browser';
import { appContext, type AppContext } from '../core/interfaces/config-context';
import { userService } from '../services/user-service';

@customElement('navigation-bar')
export class NavigationBar extends LitElement {
  @consume({ context: appContext, subscribe: true })
  @property({ type: Object })
  private readonly _contextData?: AppContext;

  @state()
  private _account: AccountInfo | null = null;

  private _cleanup?: () => void;

  connectedCallback() {
    super.connectedCallback();
    this._cleanup = userService.subscribe((account) => {
      this._account = account;
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._cleanup?.();
  }

  private async _logout() {
    if (!this._contextData?.msalInstance) return;
    await this._contextData.msalInstance.logoutRedirect({
      postLogoutRedirectUri: globalThis.location.origin
    });
    userService.setUser(null);
  }

  static readonly styles = css`
    :host {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.9rem;
      color: var(--color-text);
    }

    .avatar {
      width: 32px;
      height: 32px;
      background: var(--color-accent-dim);
      color: var(--color-accent);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 0.8rem;
    }

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

    .theme-btn:hover {
      color: var(--color-accent);
      border-color: var(--color-accent);
    }
  `;

  render() {
    if (!this._account) return html``;

    return html`
      <div class="avatar">${this._account.name?.charAt(0) || 'U'}</div>
      <span>${this._account.name}</span>
      <button class="theme-btn" @click=${this._logout}>Sign Out</button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'navigation-bar': NavigationBar;
  }
}
