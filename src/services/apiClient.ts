import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * A release build must never fall back to localhost: on a user's device that
 * address is their own phone, so every request fails and the app silently
 * degrades into whatever its error paths happen to do.
 *
 * Failing loudly at startup during development is the cheaper mistake.
 */
function resolveApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL;

  if (configured) return configured;

  if (__DEV__) return 'http://localhost:8000/api';

  throw new Error(
    'EXPO_PUBLIC_API_URL is not set. A release build cannot reach the backend without it.'
  );
}

const API_BASE_URL = resolveApiBaseUrl();
const TOKEN_KEY = 'caltrack_auth_token';

/** An HTTP error from the API, carrying the status so callers can branch on it. */
export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }

  /** The account is authenticated but lacks the entitlement for this call. */
  get isNotEntitled(): boolean {
    return this.status === 403;
  }
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.initToken();
  }

  private async initToken() {
    try {
      if (Platform.OS === 'web') {
        this.token = await AsyncStorage.getItem(`@${TOKEN_KEY}`);
      } else {
        this.token = await SecureStore.getItemAsync(TOKEN_KEY);
      }
    } catch (e) {
      console.warn('Failed to load secure auth token', e);
      try {
        this.token = await AsyncStorage.getItem(`@${TOKEN_KEY}`);
      } catch (inner) {}
    }
  }

  public async setToken(token: string | null) {
    this.token = token;
    try {
      if (token) {
        if (Platform.OS === 'web') {
          await AsyncStorage.setItem(`@${TOKEN_KEY}`, token);
        } else {
          await SecureStore.setItemAsync(TOKEN_KEY, token);
        }
      } else {
        if (Platform.OS === 'web') {
          await AsyncStorage.removeItem(`@${TOKEN_KEY}`);
        } else {
          await SecureStore.deleteItemAsync(TOKEN_KEY);
        }
      }
    } catch (e) {
      console.warn('Failed to set secure auth token', e);
    }
  }

  public async getToken(): Promise<string | null> {
    if (!this.token) {
      await this.initToken();
    }
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getToken();

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      // Callers need to tell "you are not entitled" apart from "the network
      // failed" — treating the two alike is how a refused request ends up
      // silently producing a fabricated result.
      throw new ApiError(data.message || `API Error: ${response.statusText}`, response.status);
    }

    return data as T;
  }

  // --- Auth APIs ---
  public async register(payload: any) {
    const data = await this.request<{ success: boolean; token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (data.token) await this.setToken(data.token);
    return data;
  }

  /**
   * The server derives identity from the token's verified claims. Sending an
   * id or email alongside it would have no effect — and used to be enough to
   * sign in as anyone.
   */
  public async loginWithApple(payload: { identity_token: string; name?: string }) {
    const data = await this.request<{ success: boolean; token: string; user: any; is_premium: boolean }>('/auth/apple', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (data.token) await this.setToken(data.token);
    return data;
  }

  public async loginWithGoogle(payload: { id_token: string }) {
    const data = await this.request<{ success: boolean; token: string; user: any; is_premium: boolean }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (data.token) await this.setToken(data.token);
    return data;
  }

  public async getMe() {
    return this.request<{ success: boolean; user: any; is_premium: boolean }>('/me');
  }

  public async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      await this.setToken(null);
    }
  }

  public async deleteAccount() {
    const res = await this.request('/auth/delete-account', { method: 'POST' });
    await this.setToken(null);
    return res;
  }

  // --- Dashboard & Goals ---
  public async getDashboard(date?: string) {
    const query = date ? `?date=${date}` : '';
    return this.request<{ success: boolean; data: any }>(`/dashboard${query}`);
  }

  public async getWeeklyDashboard(startDate?: string) {
    const query = startDate ? `?start_date=${startDate}` : '';
    return this.request<{ success: boolean; data: any }>(`/dashboard/weekly${query}`);
  }

  public async getGoals() {
    return this.request<{ success: boolean; goal: any }>('/goals');
  }

  public async updateGoals(goals: any) {
    return this.request<{ success: boolean; goal: any }>('/goals', {
      method: 'PUT',
      body: JSON.stringify(goals),
    });
  }

  // --- Meal & AI Scanning ---
  public async analyzeMeal(imageBase64: string, mealType: string = 'breakfast', hint?: string) {
    return this.request<{ success: boolean; job_id: number; meal_log: any }>('/meal/analyze', {
      method: 'POST',
      body: JSON.stringify({
        image_base64: imageBase64,
        meal_type: mealType,
        hint,
        async: true,
      }),
    });
  }

  public async getMealJobStatus(jobId: number) {
    return this.request<{ success: boolean; status: string; meal_log: any }>(`/meal/jobs/${jobId}`);
  }

  /**
   * Queue an image for analysis and wait for the worker to finish it.
   *
   * `/meal/analyze` returns as soon as the job is queued, so the meal_log in
   * that first response still has no foods attached. Resolves with the
   * completed meal_log, or null if it never finished in time.
   */
  public async analyzeMealAndWait(
    imageBase64: string,
    mealType: string = 'breakfast',
    hint?: string,
    { attempts = 15, intervalMs = 1000 }: { attempts?: number; intervalMs?: number } = {}
  ): Promise<any | null> {
    const queued = await this.analyzeMeal(imageBase64, mealType, hint);

    // A synchronous queue driver already returns the finished analysis.
    if (queued?.meal_log?.foods?.length) return queued.meal_log;
    if (!queued?.job_id) return null;

    for (let i = 0; i < attempts; i++) {
      await new Promise(resolve => setTimeout(resolve, intervalMs));
      const status = await this.getMealJobStatus(queued.job_id);
      if (status?.status === 'completed' && status.meal_log?.foods?.length) {
        return status.meal_log;
      }
      if (status?.status === 'failed') return null;
    }

    return null;
  }

  public async quickAddMeal(mealData: any) {
    return this.request<{ success: boolean; meal: any }>('/meal/quick-add', {
      method: 'POST',
      body: JSON.stringify(mealData),
    });
  }

  public async getMealsByDate(date: string) {
    return this.request<{ success: boolean; date: string; meals: any[] }>(`/meal?date=${date}`);
  }

  public async deleteMeal(mealId: number) {
    return this.request(`/meal/${mealId}`, { method: 'DELETE' });
  }

  // --- Weight Tracking ---
  public async logWeight(weightData: any) {
    return this.request<{ success: boolean; log: any }>('/weight', {
      method: 'POST',
      body: JSON.stringify(weightData),
    });
  }

  public async getWeightHistory(limit: number = 30) {
    return this.request<{ success: boolean; data: any }>(`/weight/history?limit=${limit}`);
  }

  /**
   * Resolve a scanned barcode. A 404 means the product is not in the database,
   * which is common for Vietnamese products and is an ordinary outcome the
   * caller should offer manual entry for.
   */
  public async lookupBarcode(barcode: string) {
    return this.request<{
      success: boolean;
      food: {
        name: string;
        calories: number;
        protein_g: number;
        carbs_g: number;
        fat_g: number;
        health_score: number;
        grams: number;
        serving_grams: number;
        barcode: string;
        brand: string | null;
        image_url: string | null;
        micronutrients?: Record<string, number>;
      };
    }>(`/food/barcode/${encodeURIComponent(barcode)}`);
  }

  // --- Apple IAP ---
  public async getIapProducts() {
    return this.request<{ success: boolean; products: any[] }>('/iap/products');
  }

  public async verifyIapPurchase(transactionJws: string) {
    return this.request<{ success: boolean; is_premium: boolean; subscription: any }>('/iap/verify', {
      method: 'POST',
      body: JSON.stringify({ transaction_jws: transactionJws }),
    });
  }

  public async restoreIapPurchases(transactions: any[]) {
    return this.request<{ success: boolean; is_premium: boolean }>('/iap/restore', {
      method: 'POST',
      body: JSON.stringify({ transactions }),
    });
  }

  public async getIapStatus() {
    return this.request<{ success: boolean; is_premium: boolean; subscription: any }>('/iap/status');
  }
}

export const apiClient = new ApiClient();
