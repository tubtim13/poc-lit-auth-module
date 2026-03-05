import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { type AccountInfo } from '@azure/msal-browser';
import { userService } from '../services/user-service';

@customElement('user-info')
export class UserInfo extends LitElement {
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

  static readonly styles = css`
    :host {
      display: block;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 24px;
      margin-bottom: 24px;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
    }

    .avatar {
      width: 48px;
      height: 48px;
      background: var(--color-accent-dim);
      color: var(--color-accent);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 1.2rem;
    }

    .user-name {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--color-text);
    }

    .info-grid {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 8px 16px;
      font-size: 0.85rem;
    }

    .label {
      color: var(--color-muted);
    }

    .value {
      color: var(--color-text);
      word-break: break-all;
    }
  `;

  render() {
    if (!this._account) return html``;

    return html`
      <div class="header">
        <div class="avatar">${this._account.name?.charAt(0) || 'U'}</div>
        <div class="user-name">${this._account.name}</div>
      </div>

      <div class="info-grid">
        <div class="label">Username:</div>
        <div class="value">${this._account.username}</div>

        <div class="label">Tenant ID:</div>
        <div class="value">${this._account.tenantId}</div>

        <div class="label">Environment:</div>
        <div class="value">${this._account.environment}</div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'user-info': UserInfo;
  }
}
