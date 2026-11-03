import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import { sessionStore } from '@/features/auth';

/**
 * Integration test over the real route files in src/app. It lives outside
 * src/app on purpose: every file in there becomes a route and gets bundled.
 * Covers: auth guards,
 * sign-in, tabs and the users list, all against the in-app mock API.
 */
describe('app navigation', () => {
  afterEach(async () => {
    await sessionStore.signOut();
  });

  it('sends signed-out users to sign-in, then into the app', async () => {
    await renderRouter('./src/app', { initialUrl: '/' });

    expect(await screen.findByRole('header', { name: 'Sign in' })).toBeOnTheScreen();
    expect(screen).toHavePathname('/sign-in');

    await fireEvent.changeText(screen.getByLabelText('Email'), 'demo@example.com');
    await fireEvent.changeText(screen.getByLabelText('Password'), 'password123');
    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));

    // The guard flips and Expo Router redirects to the dashboard.
    expect(await screen.findByText(/Welcome back, Demo/)).toBeOnTheScreen();
    expect(screen).toHavePathname('/');
  });

  it('keeps signed-in users out of the sign-in screen and lists users', async () => {
    await renderRouter('./src/app', { initialUrl: '/' });
    await fireEvent.changeText(await screen.findByLabelText('Email'), 'demo@example.com');
    await fireEvent.changeText(screen.getByLabelText('Password'), 'password123');
    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
    await screen.findByText(/Welcome back/);

    // Tab items are buttons labelled "Users, tab, 2 of 3" for screen readers.
    await fireEvent.press(screen.getByRole('button', { name: /^Users, tab/ }));
    await waitFor(() => {
      expect(screen).toHavePathname('/users');
    });
    // Newest first: the most recently created seed user heads the list.
    expect(await screen.findByRole('button', { name: /^Ava Turner/ })).toBeOnTheScreen();
  });
});
