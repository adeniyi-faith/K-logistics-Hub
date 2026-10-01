// Browser version: the phone database (expo-sqlite) is not used on the web, so there is no live engine.
// Android and iPhone use engine.native.ts instead (the bundler picks it by the ".native" name).
import { LiveEngine } from './types';

export function createLiveEngine(): LiveEngine {
  throw new Error('The synced app runs on Android and iPhone only.');
}
