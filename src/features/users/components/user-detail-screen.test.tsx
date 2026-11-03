import { screen } from '@testing-library/react-native';

import { renderWithProviders, signInAsDemo } from '@/test/utils';

import { UserDetailScreen } from './user-detail-screen';

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}));

describe('UserDetailScreen', () => {
  beforeEach(signInAsDemo);

  it('shows the user and management actions for admins', async () => {
    await renderWithProviders(<UserDetailScreen id="usr_0002" canManage />);

    expect(await screen.findByRole('header', { name: 'Ava Turner' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Edit user' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Delete user' })).toBeOnTheScreen();
  });

  it('hides management actions from other roles', async () => {
    await renderWithProviders(<UserDetailScreen id="usr_0002" canManage={false} />);

    await screen.findByRole('header', { name: 'Ava Turner' });
    expect(screen.queryByRole('button', { name: 'Delete user' })).not.toBeOnTheScreen();
  });

  it('explains a missing user', async () => {
    await renderWithProviders(<UserDetailScreen id="usr_missing" canManage />);
    expect(await screen.findByText('User not found.')).toBeOnTheScreen();
  });
});
