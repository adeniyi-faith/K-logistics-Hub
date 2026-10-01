import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

/**
 * Opens the camera (or a file picker in the browser) and returns a smaller copy of the photo.
 * asDataUri: return the picture inside the text itself (used in demo mode, where photos stay on the phone).
 * Returns null if the person cancels, or a message if the camera isn't allowed.
 */
export async function takeDeliveryPhoto(
  asDataUri: boolean,
  what = 'delivery photos',
): Promise<{ uri: string } | { error: string } | null> {
  let result: ImagePicker.ImagePickerResult;
  if (Platform.OS === 'web') {
    result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
  } else {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return { error: `Allow the camera for K-Logistics Hub in your phone settings to take ${what}.` };
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
