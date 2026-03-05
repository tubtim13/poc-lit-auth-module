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
npm run build   # outputs to dist/
npm run dev     # dev server on port 4000
```
