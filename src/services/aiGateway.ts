/**
 * AI Gateway Client (NutriScan Architecture)
 * Hỗ trợ kết nối trực tiếp với backend Cloud Functions / Serverless Proxy hoặc gọi model Vision AI
 */

export interface AiVisionResult {
  food_name: string;
  portion_grams: number;
  confidence: number;
  fkb_hint?: string;
  is_food: boolean;
  notes?: string;
}

export class AiGatewayClient {
  private static backendUrl: string = 'https://api.caltrack.ai/v1/scan'; // URL backend proxy nếu có
  private static groqApiKey?: string; // Khuyến nghị đặt ở backend Secret Manager

  public static configure(options: { backendUrl?: string; groqApiKey?: string }) {
    if (options.backendUrl) this.backendUrl = options.backendUrl;
    if (options.groqApiKey) this.groqApiKey = options.groqApiKey;
  }

  /**
   * Phân tích ảnh qua AI Vision Gateway
   */
  public static async analyzeImage(base64Image: string): Promise<AiVisionResult> {
    // Nếu có backend proxy:
    // const response = await fetch(this.backendUrl, { method: 'POST', body: JSON.stringify({ image: base64Image }) });
    // return await response.json();

    // Mặc định: Giả lập pipeline AI Gateway chuẩn
    await new Promise((r) => setTimeout(r, 1500));
    return {
      food_name: 'Phở Bò Tái Nạm',
      portion_grams: 500,
      confidence: 0.96,
      fkb_hint: 'vn_fct_pho_bo',
      is_food: true,
      notes: 'Bánh phở tươi, thịt bò tái, hành ngò'
    };
  }
}
