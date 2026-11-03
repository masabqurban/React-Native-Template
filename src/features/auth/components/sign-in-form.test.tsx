import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { tokenStore } from '@/lib/api';
import { renderWithProviders } from '@/test/utils';

import { sessionStore } from '../session-store';
import { SignInForm } from './sign-in-form';

describe('SignInForm', () => {
  it('validates before calling the API', async () => {
    await renderWithProviders(<SignInForm />);
    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Enter a valid email address.')).toBeOnTheScreen();
    expect(screen.getByText('Enter your password.')).toBeOnTheScreen();
  });

  it('explains wrong credentials and clears the password', async () => {
    await renderWithProviders(<SignInForm />);
    await fireEvent.changeText(screen.getByLabelText('Email'), 'demo@example.com');
    await fireEvent.changeText(screen.getByLabelText('Password'), 'wrong-password');
    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect email or password.');
    expect(screen.getByLabelText('Password')).toHaveDisplayValue('');
  });

  it('signs in and stores the refresh token in the keychain', async () => {
    await renderWithProviders(<SignInForm />);
    await fireEvent.changeText(screen.getByLabelText('Email'), 'Demo@Example.com');
    await fireEvent.changeText(screen.getByLabelText('Password'), 'password123');
    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(sessionStore.get()).toMatchObject({
        status: 'signed-in',
        user: { email: 'demo@example.com', role: 'admin' },
      });
    });
    expect(await tokenStore.getRefresh()).toMatch(/^mock-refresh\./);
  });
});
