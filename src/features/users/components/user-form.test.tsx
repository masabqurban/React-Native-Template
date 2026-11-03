import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { db } from '@/mocks/db';
import { renderWithProviders, signInAsDemo } from '@/test/utils';

import { UserForm } from './user-form';

describe('UserForm', () => {
  beforeEach(signInAsDemo);

  it('creates a user with the chosen role', async () => {
    const onSaved = jest.fn();
    await renderWithProviders(<UserForm onSaved={onSaved} />);

    await fireEvent.changeText(screen.getByLabelText('Full name'), 'Grace Hopper');
    await fireEvent.changeText(screen.getByLabelText('Email'), 'grace@example.com');
    await fireEvent.press(screen.getByRole('radio', { name: 'Editor' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Add user' }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Grace Hopper', role: 'editor' }),
      );
    });
    expect(db.users[0]).toMatchObject({ email: 'grace@example.com', status: 'invited' });
  });

  it('shows a server conflict on the email field', async () => {
    await renderWithProviders(<UserForm onSaved={jest.fn()} />);

    await fireEvent.changeText(screen.getByLabelText('Full name'), 'Someone Else');
    await fireEvent.changeText(screen.getByLabelText('Email'), 'demo@example.com');
    await fireEvent.press(screen.getByRole('button', { name: 'Add user' }));

    expect(await screen.findByText('Another account already uses this email.')).toBeOnTheScreen();
  });

  it('marks the selected role for screen readers', async () => {
    await renderWithProviders(<UserForm onSaved={jest.fn()} />);
    expect(screen.getByRole('radio', { name: 'Viewer' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Admin' })).not.toBeChecked();
  });
});
