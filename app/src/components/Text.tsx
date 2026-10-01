// The app's Text and TextInput. Phones set to very large text would push words onto two lines
// and break buttons and chips, so text grows with the phone's setting only up to 15%.
import { ComponentProps } from 'react';
import { Text as RNText, TextInput as RNTextInput } from 'react-native';

const MAX_GROW = 1.15;

export function Text(props: ComponentProps<typeof RNText>) {
  return <RNText maxFontSizeMultiplier={MAX_GROW} {...props} />;
}

export function TextInput(props: ComponentProps<typeof RNTextInput>) {
  return <RNTextInput maxFontSizeMultiplier={MAX_GROW} {...props} />;
}
