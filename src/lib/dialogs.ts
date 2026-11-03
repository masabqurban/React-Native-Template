import { Alert, Platform } from 'react-native';

/*
 * React Native's Alert is a no-op on web, so confirmations would silently do
 * nothing there. These helpers use the native dialog on iOS and Android and the
 * browser's dialog on web.
 */

type ConfirmOptions = {
  title: string;
  message?: string;
  confirmText: string;
  /** Styles the confirm button as destructive (red on iOS). */
  destructive?: boolean;
};

/** Resolves true if the user confirms. */
export function confirm({ title, message, confirmText, destructive }: ConfirmOptions) {
  if (Platform.OS === 'web') {
    return Promise.resolve(globalThis.confirm([title, message].filter(Boolean).join('\n\n')));
  }
  return new Promise<boolean>((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        {
          text: confirmText,
          style: destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

/** A short message with an OK button. */
export function notify(title: string, message?: string) {
  if (Platform.OS === 'web') {
    globalThis.alert([title, message].filter(Boolean).join('\n\n'));
    return;
  }
  Alert.alert(title, message);
}
