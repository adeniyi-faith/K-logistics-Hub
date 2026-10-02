import { Alert, Platform } from 'react-native';

/** Asks "are you sure?" before something that can't be undone. Resolves true when the person agrees. */
export function confirm(title: string, message: string, yes = 'Delete'): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  return new Promise((done) =>
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => done(false) },
        { text: yes, style: 'destructive', onPress: () => done(true) },
      ],
      { cancelable: true, onDismiss: () => done(false) },
    ),
  );
}
