# singha-auth-module

A headless Microsoft Azure AD authentication library built on MSAL Browser. Framework-agnostic — works with Angular, Vue, React, or any web project.

## How it works

A single `<singha-auth>` custom element handles MSAL initialization and the OAuth redirect lifecycle. Your framework calls `login()` / `logout()` on it and listens to auth events, or subscribes to `userService` for reactive state updates.

---

## Installation

```bash
npm install singha-auth-module
```

---

## Config

Place a `config.json` in your public directory (or build it into your environment):

```json
{
  "MSAL_CLIENT_ID": "your-client-id",
  "MICROSOFT_TENANT": "your-tenant-id",
  "DISABLE_INTERCEPTOR": false,
  "version": "1.0.0"
}
```

---

## API

### Element: `<singha-auth>`

| Member | Type | Description |
|---|---|---|
| `init(config)` | `Promise<void>` | Initialize MSAL and handle any pending redirect. Call once on app start. |
| `login(scopes?)` | `Promise<void>` | Redirect to Microsoft login. Default scopes: `openid`, `profile`, `User.Read`. |
| `logout()` | `Promise<void>` | Sign out and redirect back to app origin. |
| `user` | `AccountInfo \| null` | Currently authenticated user. |
| `isAuthenticated` | `boolean` | `true` if a user is signed in. |

### Events

All events bubble and are composed (cross shadow DOM boundaries).

| Event | `detail` | When |
|---|---|---|
| `singha-auth-ready` | `{ user: AccountInfo \| null }` | MSAL initialized (fires even if no user is signed in) |
| `singha-auth-login` | `{ user: AccountInfo }` | User successfully authenticated |
| `singha-auth-logout` | `null` | User signed out |
| `singha-auth-error` | `{ error: unknown }` | Any MSAL error |

### `userService` (programmatic subscription)

```ts
import { userService } from 'singha-auth-module';

const unsubscribe = userService.subscribe((user) => {
  // user: AccountInfo | null
  // called immediately with current value, then on every change
});

// later:
unsubscribe();
```

---

## Usage by framework

### Angular

**`app.component.html`**
```html
<singha-auth
  #auth
  (singha-auth-login)="onLogin($event)"
  (singha-auth-logout)="onLogout()"
></singha-auth>
```

**`app.component.ts`**
```ts
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import type { SinghaAuth } from 'singha-auth-module';

@Component({ selector: 'app-root', templateUrl: './app.component.html' })
export class AppComponent implements OnInit {
  @ViewChild('auth') authEl!: ElementRef<SinghaAuth>;

  async ngOnInit() {
    const config = await fetch('/assets/config/config.json').then(r => r.json());
    await this.authEl.nativeElement.init(config);
  }

  login()  { this.authEl.nativeElement.login(); }
  logout() { this.authEl.nativeElement.logout(); }

  onLogin(event: CustomEvent) {
    console.log('Signed in:', event.detail.user.name);
  }

  onLogout() {
    console.log('Signed out');
  }
}
```

**`app.module.ts`** — allow the custom element:
```ts
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import 'singha-auth-module'; // registers <singha-auth>

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  // ...
})
export class AppModule {}
```

---

### Vue

**`App.vue`**
```vue
<script setup lang="ts">
import { onMounted, useTemplateRef } from 'vue';
import type { SinghaAuth } from 'singha-auth-module';
import 'singha-auth-module';

const auth = useTemplateRef<SinghaAuth>('auth');

onMounted(async () => {
  const config = await fetch('/assets/config/config.json').then(r => r.json());
  await auth.value?.init(config);
});

const login  = () => auth.value?.login();
const logout = () => auth.value?.logout();

function onLogin(event: CustomEvent) {
  console.log('Signed in:', event.detail.user.name);
}
</script>

<template>
  <singha-auth
    ref="auth"
    @singha-auth-login="onLogin"
    @singha-auth-logout="() => console.log('Signed out')"
  />

  <button @click="login">Sign In</button>
  <button @click="logout">Sign Out</button>
</template>
```

**`vite.config.ts`** — tell Vue to treat `singha-auth` as a custom element:
```ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === 'singha-auth',
        },
      },
    }),
  ],
});
```

---

### React

**`main.tsx`**
```tsx
import 'singha-auth-module'; // registers <singha-auth>
```

**`App.tsx`**
```tsx
import { useEffect, useRef } from 'react';
import type { SinghaAuth } from 'singha-auth-module';

export function App() {
  const authRef = useRef<SinghaAuth>(null);

  useEffect(() => {
    const el = authRef.current;
    if (!el) return;

    fetch('/assets/config/config.json')
      .then(r => r.json())
      .then(config => el.init(config));

    const onLogin  = (e: Event) => console.log('Signed in:', (e as CustomEvent).detail.user.name);
    const onLogout = () => console.log('Signed out');

    el.addEventListener('singha-auth-login', onLogin);
    el.addEventListener('singha-auth-logout', onLogout);

    return () => {
      el.removeEventListener('singha-auth-login', onLogin);
      el.removeEventListener('singha-auth-logout', onLogout);
    };
  }, []);

  const login  = () => authRef.current?.login();
  const logout = () => authRef.current?.logout();

  return (
    <>
      {/* @ts-expect-error — custom element not in React's intrinsic types */}
      <singha-auth ref={authRef} />

      <button onClick={login}>Sign In</button>
      <button onClick={logout}>Sign Out</button>
    </>
  );
}
```

> **React 19+**: use `ref` directly on custom elements — no `@ts-expect-error` needed.

---

## Using `userService` with a framework store

If you manage auth state in a store (NgRx, Pinia, Zustand, etc.), subscribe directly — no DOM event listeners required:

**Angular service**
```ts
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { userService, type AppConfig } from 'singha-auth-module';
import type { AccountInfo } from '@azure/msal-browser';

@Injectable({ providedIn: 'root' })
export class AuthStateService implements OnDestroy {
  readonly user$ = new BehaviorSubject<AccountInfo | null>(null);
  private readonly _unsub = userService.subscribe(u => this.user$.next(u));
  ngOnDestroy() { this._unsub(); }
}
```

**Pinia store (Vue)**
```ts
import { defineStore } from 'pinia';
import { userService } from 'singha-auth-module';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(userService.getUser());
  userService.subscribe(u => { user.value = u; });
  return { user };
});
```

**Zustand store (React)**
```ts
import { create } from 'zustand';
import { userService } from 'singha-auth-module';
import type { AccountInfo } from '@azure/msal-browser';

interface AuthState { user: AccountInfo | null }

export const useAuthStore = create<AuthState>(() => ({ user: userService.getUser() }));

userService.subscribe((user) => useAuthStore.setState({ user }));
```

---

## Build

```bash
npm run build             # library build → dist/
npm run build:federation  # federation build → dist-federation/
npm run dev               # dev server on port 4000
npm run dev:federation    # federation dev server on port 4001
```

---

## Deployment

Two strategies depending on how the shell projects consume the module.

---

### Option A — Web Component via CDN / Static Hosting

The simplest approach. Build the library, host the JS file, shell apps load it as a `<script>` tag or dynamic import. No build-time coupling between projects.

**1. Build**
```bash
npm run build
# → dist/singha-auth-module.js  (ES module)
# → dist/singha-auth-module.umd.cjs  (UMD fallback)
```

**2. Deploy** `dist/` to any static host — S3, Azure Blob, Netlify, Nginx, etc.

**3. Shell app — load the script once** (e.g. in `index.html` or `main.ts`):
```html
<script type="module" src="https://cdn.example.com/singha-auth/singha-auth-module.js"></script>
```
or via dynamic import in TypeScript:
```ts
await import('https://cdn.example.com/singha-auth/singha-auth-module.js');
```

**4. Use** — same `<singha-auth>` API as shown in the framework sections above. Because it's a Web Component, the element is globally registered the moment the script loads. No npm install needed in the shell project.

---

### Option B — Module Federation (Micro-Frontend)

Loads the auth module remotely at **runtime** without an npm install. The shell and the remote are deployed independently and can be updated separately.

**Architecture**
```
Shell App (host)          singha-auth-module (remote)
──────────────────        ──────────────────────────
  Vite + MF plugin   ←──   Vite + @module-federation/vite
  runs on port 4200         runs on port 4001
                             exposes: ./auth
```

#### Setup on singha-auth-module (remote)

**1. Install the plugin**
```bash
npm install --save-dev @module-federation/vite
```

**2. Use the ready-made config** (`vite.config.federation.ts` is already in the project):
```ts
// vite.config.federation.ts  — already committed
federation({
  name: 'singhaAuthModule',
  filename: 'remoteEntry.js',
  exposes: {
    './auth': './src/auth-module.element.ts',
  },
  shared: {
    '@azure/msal-browser': { singleton: true, requiredVersion: '^5.4.0' },
  },
})
```

**3. Build and deploy `dist-federation/`**
```bash
npm run build:federation
# Deploy dist-federation/ to https://auth.example.com/
# Key file: https://auth.example.com/remoteEntry.js
```

---

#### Shell: Angular (with `@angular-architects/native-federation`)

```bash
npm install @angular-architects/native-federation
npx ng add @angular-architects/native-federation --project shell --type dynamic-host
```

**`module-federation.manifest.json`** (in `assets/`)
```json
{
  "singhaAuthModule": "https://auth.example.com/remoteEntry.js"
}
```

**`app.config.ts`**
```ts
import { initFederation } from '@angular-architects/native-federation';

initFederation('/assets/module-federation.manifest.json')
  .catch(err => console.error(err))
  .then(() => import('./bootstrap'))
  .catch(err => console.error(err));
```

**`app.component.ts`**
```ts
import { loadRemoteModule } from '@angular-architects/native-federation';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

@Component({ selector: 'app-root', template: `<singha-auth #auth></singha-auth>` })
export class AppComponent implements OnInit {
  @ViewChild('auth') authEl!: ElementRef;

  async ngOnInit() {
    // Loads the remote JS and registers <singha-auth>
    await loadRemoteModule({ remoteName: 'singhaAuthModule', exposedModule: './auth' });

    const config = await fetch('/assets/config/config.json').then(r => r.json());
    await this.authEl.nativeElement.init(config);
  }

  login()  { this.authEl.nativeElement.login(); }
  logout() { this.authEl.nativeElement.logout(); }
}
```

**`app.module.ts`**
```ts
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
@NgModule({ schemas: [CUSTOM_ELEMENTS_SCHEMA] })
export class AppModule {}
```

---

#### Shell: Vue (with `@module-federation/vite`)

```bash
npm install --save-dev @module-federation/vite
```

**`vite.config.ts`** (shell)
```ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import federation from '@module-federation/vite';

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: { isCustomElement: (tag) => tag === 'singha-auth' },
      },
    }),
    federation({
      name: 'shell',
      remotes: {
        singhaAuthModule: 'https://auth.example.com/remoteEntry.js',
      },
      shared: {
        '@azure/msal-browser': { singleton: true },
      },
    }),
  ],
  build: { target: 'esnext' },
});
```

**`App.vue`**
```vue
<script setup lang="ts">
import { onMounted, useTemplateRef } from 'vue';

const auth = useTemplateRef('auth');

onMounted(async () => {
  // Load remote → registers <singha-auth>
  await import('singhaAuthModule/auth');

  const config = await fetch('/assets/config/config.json').then(r => r.json());
  await (auth.value as any).init(config);
});
</script>

<template>
  <singha-auth ref="auth" @singha-auth-login="onLogin" @singha-auth-logout="onLogout" />
  <button @click="(auth as any).login()">Sign In</button>
  <button @click="(auth as any).logout()">Sign Out</button>
</template>
```

---

#### Shell: React (with `@module-federation/vite`)

**`vite.config.ts`** (shell) — same federation config as Vue above, change `name: 'react-shell'`.

**`App.tsx`**
```tsx
import { useEffect, useRef, useState } from 'react';

export function App() {
  const authRef = useRef<HTMLElement & { init: Function; login: Function; logout: Function }>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Load remote → registers <singha-auth>
    import('singhaAuthModule/auth').then(async () => {
      const config = await fetch('/assets/config/config.json').then(r => r.json());
      await authRef.current?.init(config);
      setReady(true);
    });
  }, []);

  return (
    <>
      {/* @ts-expect-error — custom element, typed via ref above */}
      <singha-auth ref={authRef} />
      {ready && <button onClick={() => authRef.current?.login()}>Sign In</button>}
      {ready && <button onClick={() => authRef.current?.logout()}>Sign Out</button>}
    </>
  );
}
```

---

### Comparison

| | Web Component (CDN) | Module Federation |
|---|---|---|
| **Shell install** | `<script>` tag or dynamic import | `@module-federation/vite` plugin |
| **Deploy coupling** | None — load from any URL | Shell references the remote URL |
| **Shared dependencies** | Each app bundles its own | `shared` config deduplicates |
| **Runtime updates** | Immediate on deploy | Immediate on deploy |
| **Best for** | Simple integration, any stack | Micro-frontend architecture |
