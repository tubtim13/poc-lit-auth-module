import { css } from 'lit';

export const tokens = css`
  :host {
    --color-bg: #0f0f0f;
    --color-surface: #1a1a1a;
    --color-border: #2a2a2a;
    --color-text: #f0ece0;
    --color-muted: #666;
    --color-accent: #c9a84c;
    --color-accent-dim: #c9a84c22;
    --color-danger: #e05c5c;
    --color-success: #5ce07a;

    --radius-sm: 6px;
    --radius-md: 10px;
    --radius-lg: 16px;

    --font-sans: 'DM Mono', monospace;
    --font-display: 'Playfair Display', serif;

    --shadow-sm: 0 1px 3px #0006;
    --shadow-md: 0 4px 16px #0008;
  }
`;

export const baseButton = css`
  button {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    color: var(--color-text);
    font-family: var(--font-sans);
    font-size: 0.8rem;
    letter-spacing: 0.06em;
    padding: 8px 18px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
  }
  button:hover {
    border-color: var(--color-accent);
    background: var(--color-accent-dim);
  }
  button:active { transform: scale(0.97); }
`;
