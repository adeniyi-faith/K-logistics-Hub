import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

/** Asks whether to use the camera or a picture already in the phone's gallery. null = cancelled. */
function askWhere(): Promise<'camera' | 'library' | null> {
  return new Promise((done) =>
    Alert.alert(
      'Add a photo',
      undefined,
      [
        { text: 'Take a photo', onPress: () => done('camera') },
        { text: 'Choose from gallery', onPress: () => done('library') },
        { text: 'Cancel', style: 'cancel', onPress: () => done(null) },
      ],
      { cancelable: true, onDismiss: () => done(null) },
    ),
  );
}

/**
 * Opens the camera or the gallery (a file picker in the browser) and returns a smaller copy of the photo.
 * asDataUri: return the picture inside the text itself (used in demo mode, where photos stay on the phone).
 * Returns null if the person cancels, or a message if the camera isn't allowed.
 */
export async function takeDeliveryPhoto(
  asDataUri: boolean,
  what = 'delivery photos',
  /** ask: let the person choose camera or gallery. library: gallery only (used for the logo). */
  from: 'ask' | 'camera' | 'library' = 'ask',
): Promise<{ uri: string } | { error: string } | null> {
  if (from === 'ask' && Platform.OS !== 'web') {
    const where = await askWhere();
    if (!where) return null;
    from = where;
  }
  let result: ImagePicker.ImagePickerResult;
  if (Platform.OS === 'web' || from === 'library') {
    result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
  } else {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return { error: `Allow the camera for K-logistics Hub in your phone settings to take ${what}.` };
    result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 });
  }
  if (result.canceled || !result.assets?.[0]) return null;

  // About 1080 pixels wide is plenty to see the goods and the place, and keeps uploads small.
  const small = await manipulateAsync(result.assets[0].uri, [{ resize: { width: 1080 } }], {
    compress: 0.6,
    format: SaveFormat.JPEG,
    base64: asDataUri,
  });
  return { uri: asDataUri && small.base64 ? `data:image/jpeg;base64,${small.base64}` : small.uri };
}
