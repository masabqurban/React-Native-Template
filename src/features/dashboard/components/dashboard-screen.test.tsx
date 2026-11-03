import { screen } from '@testing-library/react-native';

import { renderWithProviders, signInAsDemo } from '@/test/utils';

import { DashboardScreen } from './dashboard-screen';

describe('DashboardScreen', () => {
  it('shows stats with readable labels for screen readers', async () => {
    await signInAsDemo();
    await renderWithProviders(<DashboardScreen firstName="Demo" />);

    expect(await screen.findByText(/Welcome back, Demo/)).toBeOnTheScreen();
    expect(
      screen.getByLabelText(/^Total users: 48, \+12\.4% versus last month$/),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText(/^New signups per month\. Jun: 42/)).toBeOnTheScreen();
  });

  it('offers a retry when loading fails', async () => {
    // No session: the API answers 401 and the refresh has nothing to use.
    await renderWithProviders(<DashboardScreen firstName="Demo" />);

    expect(await screen.findByText('Something went wrong')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeOnTheScreen();
  });
});
