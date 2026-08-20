import * as AppleAuthentication from 'expo-apple-authentication';
import {
  GoogleSignin,
  isCancelledResponse,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import { apiClient } from './apiClient';

/**
 * Provider sign-in, in one place.
 *
 * Two screens offer these buttons. Keeping one implementation means a fix to
 * the security-sensitive part cannot land in one copy and miss the other.
 */

/** Apple raises this when the user dismisses the sheet — a normal outcome. */
const APPLE_CANCELED = 'ERR_REQUEST_CANCELED';

export type AuthResult = { success: boolean; token: string; user: any; is_premium: boolean };

/** Distinguishes "the user changed their mind" from "something went wrong". */
export const CANCELED = Symbol('sign-in canceled');

export type SignInOutcome = AuthResult | typeof CANCELED;

export function wasCanceled(outcome: SignInOutcome): outcome is typeof CANCELED {
  return outcome === CANCELED;
}

export async function signInWithApple(): Promise<SignInOutcome> {
  let credential: AppleAuthentication.AppleAuthenticationCredential;

  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
  } catch (e: any) {
    if (e?.code === APPLE_CANCELED) return CANCELED;
    throw e;
  }

  if (!credential.identityToken) {
    throw new Error('Apple không trả về mã xác thực.');
  }

  // Apple sends the name only on the first authorization, so it is forwarded
  // when present and never invented when absent.
  const fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
    .filter(Boolean)
    .join(' ');

  return apiClient.loginWithApple({
    identity_token: credential.identityToken,
    name: fullName || undefined,
  });
}

/**
 * Google requires one-time configuration before any sign-in call. Doing it here
 * keeps it beside the only code that depends on it, and guarantees it has run.
 */
let googleConfigured = false;

function configureGoogle(): void {
  if (googleConfigured) return;

  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  if (!iosClientId) {
    throw new Error(
      'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID is not set. Google sign-in cannot be configured.'
    );
  }

  GoogleSignin.configure({ iosClientId, webClientId });
  googleConfigured = true;
}

export async function signInWithGoogle(): Promise<SignInOutcome> {
  configureGoogle();
  await GoogleSignin.hasPlayServices();
  const response = await GoogleSignin.signIn();

  if (isCancelledResponse(response)) return CANCELED;

  if (!isSuccessResponse(response) || !response.data.idToken) {
    throw new Error('Google không trả về mã xác thực.');
  }

  // Only the signed token travels to the server. The profile fields Google
  // returns beside it are display data; identity comes from the token's claims.
  return apiClient.loginWithGoogle({ id_token: response.data.idToken });
}

/**
 * Copy the server's view of the account into local state.
 */
export function applyAuthResult(
  res: AuthResult,
  setUserProfile: (fn: (prev: any) => any) => void,
  setUserGoals: (fn: (prev: any) => any) => void,
  setIsPremium?: (value: boolean) => void
): void {
  if (!res.user) return;

  setUserProfile((prev) => ({
    ...prev,
    name: res.user.name || prev.name,
    avatarUrl: res.user.avatar_url || prev.avatarUrl,
  }));

  const goal = res.user.daily_goal;
  if (goal) {
    setUserGoals((prev) => ({
      ...prev,
      targetCalories: goal.target_calories || prev.targetCalories,
      targetProtein: goal.protein_g || prev.targetProtein,
      targetCarbs: goal.carbs_g || prev.targetCarbs,
      targetFat: goal.fat_g || prev.targetFat,
    }));
  }

  // The server is the authority on entitlement; this mirrors its answer.
  if (setIsPremium) setIsPremium(Boolean(res.is_premium));
}
