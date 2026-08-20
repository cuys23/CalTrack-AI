import { Platform } from 'react-native';
import {
  isHealthDataAvailableAsync,
  requestAuthorization,
  queryQuantitySamples,
  saveQuantitySample,
} from '@kingstinct/react-native-healthkit';

/**
 * Apple Health integration.
 *
 * Scope is fixed here rather than left open, because Guideline 5.1.3 judges what
 * an app asks for against what it actually needs:
 *
 *   Read  — step count and active energy burned. Both feed the daily calorie
 *           budget, which is the whole reason to connect Health at all.
 *   Write — body mass, so a weight logged here appears in Health too.
 *
 * Nothing else is requested. In particular no heart rate, sleep, or workout
 * detail: the app has no use for them, and asking for data you do not use is a
 * review finding on its own.
 *
 * Health data is never sent to our servers, never used for advertising, and
 * never written to iCloud — all three are prohibited by 5.1.3.
 */

const READ_TYPES = [
  'HKQuantityTypeIdentifierStepCount',
  'HKQuantityTypeIdentifierActiveEnergyBurned',
] as const;

const WRITE_TYPES = ['HKQuantityTypeIdentifierBodyMass'] as const;

export type HealthSummary = {
  steps: number;
  activeCalories: number;
};

/** HealthKit exists on iPhone only; iPad and Android have no Health app. */
export async function isHealthAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  return isHealthDataAvailableAsync();
}

/**
 * Ask for the scopes above.
 *
 * iOS deliberately does not reveal whether the user granted read access, so a
 * resolved promise means the sheet was shown and dismissed — not that data will
 * arrive. Callers must treat an empty result as "no data", never as an error.
 */
export async function requestHealthAccess(): Promise<boolean> {
  if (!(await isHealthAvailable())) return false;

  try {
    await requestAuthorization({
      toRead: [...READ_TYPES],
      toShare: [...WRITE_TYPES],
    });
    return true;
  } catch {
    return false;
  }
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Today's steps and active calories.
 *
 * Returns zeroes when Health is unavailable or the user withheld access, which
 * is indistinguishable from a genuinely inactive day — and that is fine, since
 * both mean "nothing to add to the budget".
 */
export async function fetchTodaySummary(): Promise<HealthSummary> {
  if (!(await isHealthAvailable())) {
    return { steps: 0, activeCalories: 0 };
  }

  // `limit: 0` returns every sample in the window; HealthKit reports activity in
  // many short intervals, so a capped query would silently undercount.
  const options = {
    filter: { date: { startDate: startOfToday(), endDate: new Date() } },
    limit: 0,
  };

  try {
    const [steps, energy] = await Promise.all([
      queryQuantitySamples(READ_TYPES[0], { ...options, unit: 'count' as const }),
      queryQuantitySamples(READ_TYPES[1], { ...options, unit: 'kcal' as const }),
    ]);

    return {
      steps: Math.round(sumQuantities(steps)),
      activeCalories: Math.round(sumQuantities(energy)),
    };
  } catch {
    return { steps: 0, activeCalories: 0 };
  }
}

/**
 * Mirror a weight entry into Health.
 *
 * Failure is reported rather than swallowed, so the caller can tell the user the
 * value stayed local instead of implying a sync that never happened.
 */
export async function writeWeight(weightKg: number, when: Date = new Date()): Promise<boolean> {
  if (!(await isHealthAvailable())) return false;

  try {
    await saveQuantitySample(WRITE_TYPES[0], 'kg', weightKg, when, when);
    return true;
  } catch {
    return false;
  }
}

/** HealthKit returns one sample per interval; the daily figure is their sum. */
function sumQuantities(samples: readonly { quantity: number }[] | undefined): number {
  if (!samples?.length) return 0;
  return samples.reduce((total, s) => total + (s.quantity ?? 0), 0);
}
