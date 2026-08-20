import {
  GoogleSignin,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import { apiClient } from './apiClient';

// The native SDK mints the id_token for the *web* OAuth client, which is the
// audience the backend checks. Set it in .env before shipping.
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

let configured = false;

function ensureConfigured() {
  if (configured) return;

  if (!WEB_CLIENT_ID) {
    throw new Error('Thiếu EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID trong cấu hình ứng dụng.');
  }

  GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
  configured = true;
}

/**
 * Runs the native Google account picker and exchanges the signed id_token for a
 * CalTrack session. Returns null when the user dismisses the picker.
 */
export async function signInWithGoogle() {
  ensureConfigured();

  // No-op on iOS; on Android it surfaces the Play Services update prompt.
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  const response = await GoogleSignin.signIn();
  if (!isSuccessResponse(response)) return null;

  const idToken = response.data.idToken;
  if (!idToken) {
    throw new Error('Google không trả về id_token.');
  }

  return apiClient.loginWithGoogle({ id_token: idToken });
}
