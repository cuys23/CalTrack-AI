import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { apiClient } from './apiClient';

/** Sign in with Apple is an iOS-only capability. */
export const isAppleSignInSupported = Platform.OS === 'ios';

/**
 * Runs the native Apple sheet and exchanges the signed identityToken for a
 * CalTrack session. Returns null when the user dismisses the sheet.
 */
export async function signInWithApple() {
  let credential: AppleAuthentication.AppleAuthenticationCredential;

  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
  } catch (e: any) {
    if (e?.code === 'ERR_REQUEST_CANCELED') return null;
    throw e;
  }

  if (!credential.identityToken) {
    throw new Error('Apple không trả về identity token.');
  }

  // Apple only exposes the full name on the very first authorization, so we
  // forward it when present and let the backend keep whatever it already has.
  const name = [credential.fullName?.givenName, credential.fullName?.familyName]
    .filter(Boolean)
    .join(' ');

  return apiClient.loginWithApple({
    identity_token: credential.identityToken,
    name: name || undefined,
  });
}
