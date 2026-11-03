import { useSyncExternalStore } from 'react';

import { refreshSession, tokenStore } from '@/lib/api';

import { fetchMe, signOutRemote } from './api';
import type { SessionUser } from './schemas';

export type SessionState =
  { status: 'loading' } | { status: 'signed-out' } | { status: 'signed-in'; user: SessionUser };

/*
 * The session lives outside React: any module can read it, and screens
 * subscribe with useSyncExternalStore (no provider, no re-render cascade).
 */
let state: SessionState = { status: 'loading' };
const listeners = new Set<() => void>();

function setState(next: SessionState) {
  state = next;
  listeners.forEach((listener) => {
    listener();
  });
}

export const sessionStore = {
  get: () => state,

  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  /**
   * Called once at launch while the splash screen is visible: restores the
   * session from the keychain's refresh token, if there is a valid one.
   */
  async restore() {
    try {
      if (await refreshSession()) {
        setState({ status: 'signed-in', user: await fetchMe() });
        return;
      }
    } catch {
      await tokenStore.clear();
    }
    setState({ status: 'signed-out' });
  },

  /** After a successful sign-in, or when the user edits their own profile. */
  setUser(user: SessionUser) {
    setState({ status: 'signed-in', user });
  },

  async signOut() {
    const refreshToken = await tokenStore.getRefresh();
    await tokenStore.clear();
    setState({ status: 'signed-out' });
    // Best effort: the session is already gone on this device.
    if (refreshToken) await signOutRemote(refreshToken).catch(() => undefined);
  },
};

export function useSession(): SessionState {
  return useSyncExternalStore(sessionStore.subscribe, sessionStore.get);
}

/** The signed-in user. Only call it on screens behind the auth guard. */
export function useCurrentUser(): SessionUser {
  const session = useSession();
  if (session.status !== 'signed-in')
    throw new Error('useCurrentUser requires a signed-in session');
  return session.user;
}
