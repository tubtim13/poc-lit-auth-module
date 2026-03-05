import { type AccountInfo } from '@azure/msal-browser';

export type UserSubscription = (account: AccountInfo | null) => void;

class UserService {
  private _account: AccountInfo | null = null;
  private readonly _subscriptions: Set<UserSubscription> = new Set();

  setUser(account: AccountInfo | null) {
    this._account = account;
    this._notifySubscriptions();
  }

  getUser(): AccountInfo | null {
    return this._account;
  }

  subscribe(callback: UserSubscription): () => void {
    this._subscriptions.add(callback);
    // Immediate call with current value
    callback(this._account);
    
    return () => {
      this._subscriptions.delete(callback);
    };
  }

  private _notifySubscriptions() {
    this._subscriptions.forEach(callback => callback(this._account));
  }
}

export const userService = new UserService();
