// Connection details come from app/.env.local (see app/.env.example).
// When they are missing, the app runs in demo mode with sample data on the phone.
import { Platform } from 'react-native';

export const config = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  powersyncUrl: process.env.EXPO_PUBLIC_POWERSYNC_URL ?? '',
};

export const hasLiveConfig = Boolean(config.supabaseUrl && config.supabaseAnonKey && config.powersyncUrl);

/** The real (synced) app runs on Android and iPhone. The browser version stays in demo mode for now. */
export const liveAvailable = hasLiveConfig && Platform.OS !== 'web';
