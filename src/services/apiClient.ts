import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';
const TOKEN_KEY = 'caltrack_auth_token';

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
      throw new Error(data.message || `API Error: ${response.statusText}`);
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
