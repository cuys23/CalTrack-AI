import { apiClient } from './apiClient';
import { FoodItem, IngredientItem, MicroNutrients, MacroNutrients, NutrientSource } from '../types';

/** Macros are shown to one decimal; more digits imply precision the data lacks. */
const round1 = (n: number): number => Math.round(n * 10) / 10;

export interface FkbFoodEntry {
  fkbId: string;
  name: string;
  aliases: string[];
  category: 'vietnamese' | 'western' | 'asian' | 'drink' | 'ingredient';
  source: 'VN_FCT' | 'USDA' | 'CURATED';
  sourceLabel: string;
  // Standard per 100g nutrition values
  per100g: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
    cholesterol?: number;
    potassium?: number;
    calcium?: number;
    iron?: number;
    vitaminC?: number;
  };
  defaultGrams: number;
  defaultUnit: string;
  healthScore: number;
  imageUrl: string;
  ingredients?: Array<{ name: string; grams: number; fkbId?: string }>;
  tags: string[];
}

// Food Knowledge Base (FKB) - Dữ liệu dinh dưỡng chuẩn 100g từ Viện Dinh Dưỡng VN & USDA
export const FKB_DATABASE: FkbFoodEntry[] = [
  {
    fkbId: 'vn_fct_pho_bo',
    name: 'Phở Bò Tái Nạm',
    aliases: ['pho bo', 'phở tái', 'phở nạm', 'pho'],
    category: 'vietnamese',
    source: 'VN_FCT',
    sourceLabel: 'Viện Dinh Dưỡng Quốc Gia (VN FCT)',
    per100g: {
      calories: 104,
      protein: 6.4,
      carbs: 13.6,
      fat: 2.8,
      fiber: 0.6,
      sugar: 0.8,
      sodium: 284,
      cholesterol: 12,
      potassium: 96,
      calcium: 13,
      iron: 1.0,
      vitaminC: 2.4
    },
    defaultGrams: 500, // 1 bát tiêu chuẩn 500g -> ~520 kcal
    defaultUnit: 'bát',
    healthScore: 8.5,
    imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=800&q=80',
    tags: ['pho', 'pho bo', 'bò', 'noodles', 'soup'],
    ingredients: [
      { name: 'Bánh phở tươi', grams: 180 },
      { name: 'Thịt bò tái & nạm', grams: 120 },
      { name: 'Nước dùng ninh xương & gia vị', grams: 350 },
      { name: 'Hành hoa, giá đỗ, rau thơm', grams: 50 }
    ]
  },
  {
    fkbId: 'vn_fct_com_tam',
    name: 'Cơm Tấm Sườn Bì Chả',
    aliases: ['com tam', 'cơm sườn', 'com tam suon bi cha'],
    category: 'vietnamese',
    source: 'VN_FCT',
    sourceLabel: 'Viện Dinh Dưỡng Quốc Gia (VN FCT)',
    per100g: {
      calories: 165,
      protein: 9.3,
      carbs: 19.6,
      fat: 5.3,
      fiber: 0.6,
      sugar: 2.1,
      sodium: 367,
      cholesterol: 41,
      potassium: 120,
      calcium: 18,
      iron: 0.9,
      vitaminC: 1.8
    },
    defaultGrams: 450, // 1 đĩa 450g -> ~740 kcal
    defaultUnit: 'đĩa',
    healthScore: 6.8,
    imageUrl: 'https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&w=800&q=80',
    tags: ['com tam', 'suon', 'rice', 'pork'],
    ingredients: [
      { name: 'Cơm tấm trắng', grams: 200 },
      { name: 'Sườn heo nướng mật ong', grams: 130 },
      { name: 'Chả trứng hấp', grams: 60 },
      { name: 'Bì heo & mỡ hành', grams: 40 }
    ]
  },
  {
    fkbId: 'vn_fct_bun_bo_hue',
    name: 'Bún Bò Huế Đặc Biệt',
    aliases: ['bun bo hue', 'bun bo', 'bún bò'],
    category: 'vietnamese',
    source: 'VN_FCT',
    sourceLabel: 'Viện Dinh Dưỡng Quốc Gia (VN FCT)',
    per100g: {
      calories: 124,
      protein: 7.2,
      carbs: 14.4,
      fat: 4.2,
      fiber: 0.7,
      sugar: 1.0,
      sodium: 378,
      cholesterol: 16,
      potassium: 102,
      calcium: 22,
      iron: 1.0,
      vitaminC: 3.0
    },
    defaultGrams: 500, // 500g -> ~620 kcal
    defaultUnit: 'bát',
    healthScore: 7.9,
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
    tags: ['bun bo', 'bun bo hue', 'soup'],
    ingredients: [
      { name: 'Bún sợi to', grams: 180 },
      { name: 'Thịt bò bắp & gân', grams: 90 },
      { name: 'Chả cua & móng giò', grams: 80 },
      { name: 'Nước dùng sả ruốc ớt', grams: 350 }
    ]
  },
  {
    fkbId: 'vn_fct_banh_mi',
    name: 'Bánh Mì Thịt Nướng Pate',
    aliases: ['banh mi', 'bánh mì thịt', 'banh mi pate'],
    category: 'vietnamese',
    source: 'VN_FCT',
    sourceLabel: 'Viện Dinh Dưỡng Quốc Gia (VN FCT)',
    per100g: {
      calories: 230,
      protein: 10.5,
      carbs: 27.0,
      fat: 9.0,
      fiber: 1.9,
      sugar: 3.1,
      sodium: 490,
      cholesterol: 22,
      potassium: 160,
      calcium: 22,
      iron: 1.4,
      vitaminC: 7.0
    },
    defaultGrams: 200, // 200g -> ~460 kcal
    defaultUnit: 'cái',
    healthScore: 7.2,
    imageUrl: 'https://images.unsplash.com/photo-1626804475297-41608ea09aeb?auto=format&fit=crop&w=800&q=80',
    tags: ['banh mi', 'bread', 'sandwich'],
    ingredients: [
      { name: 'Ổ bánh mì giòn', grams: 90 },
      { name: 'Thịt heo ướp nướng', grams: 70 },
      { name: 'Pate gan & bơ trứng', grams: 25 },
      { name: 'Đồ chua & dưa leo', grams: 40 }
    ]
  },
  {
    fkbId: 'usda_171077_salmon_salad',
    name: 'Salad Cá Hồi Áp Chảo Bơ',
    aliases: ['salmon salad', 'salad ca hoi', 'ca hoi bo'],
    category: 'western',
    source: 'USDA',
    sourceLabel: 'USDA FoodData Central (Mỹ)',
    per100g: {
      calories: 137,
      protein: 10.8,
      carbs: 4.6,
      fat: 8.3,
      fiber: 2.1,
      sugar: 0.9,
      sodium: 137,
      cholesterol: 18,
      potassium: 254,
      calcium: 27,
      iron: 0.7,
      vitaminC: 10.0
    },
    defaultGrams: 350, // 350g -> ~480 kcal
    defaultUnit: 'đĩa',
    healthScore: 9.8,
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    tags: ['salad', 'salmon', 'avocado', 'healthy', 'keto'],
    ingredients: [
      { name: 'Cá hồi Na Uy áp chảo', grams: 150 },
      { name: 'Quả bơ sáp cắt lát', grams: 70 },
      { name: 'Rau xà lách & cà chua bi', grams: 120 },
      { name: 'Sốt chanh leo dầu olive', grams: 20 }
    ]
  }
];

export const FOOD_DATABASE = FKB_DATABASE;

export class AiFoodEngine {
  // 1. Matcher: Tìm kiếm món ăn trong Food Knowledge Base (FKB)
  public static matchFkb(query: string): FkbFoodEntry | null {
    const q = query.toLowerCase().trim();
    return (
      FKB_DATABASE.find(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.aliases.some((a) => q.includes(a) || a.includes(q)) ||
          f.tags.some((t) => q.includes(t))
      ) || null
    );
  }

  // 2. Tính toán hàm lượng theo công thức chuẩn: nutrient = per100g * (grams / 100)
  public static calculateNutritionFromGrams(entry: FkbFoodEntry, grams: number): {
    calories: number;
    macros: MacroNutrients;
    micros: MicroNutrients;
  } {
    const ratio = Math.max(0.01, grams / 100.0);
    const { per100g } = entry;

    return {
      calories: Math.round(per100g.calories * ratio),
      macros: {
        protein: Math.round(per100g.protein * ratio),
        carbs: Math.round(per100g.carbs * ratio),
        fat: Math.round(per100g.fat * ratio)
      },
      micros: {
        fiber: +(per100g.fiber * ratio).toFixed(1),
        sugar: +(per100g.sugar * ratio).toFixed(1),
        sodium: Math.round(per100g.sodium * ratio),
        cholesterol: per100g.cholesterol ? Math.round(per100g.cholesterol * ratio) : undefined,
        potassium: per100g.potassium ? Math.round(per100g.potassium * ratio) : undefined,
        calcium: per100g.calcium ? Math.round(per100g.calcium * ratio) : undefined,
        iron: per100g.iron ? +(per100g.iron * ratio).toFixed(1) : undefined,
        vitaminC: per100g.vitaminC ? +(per100g.vitaminC * ratio).toFixed(1) : undefined
      }
    };
  }

  // 3. AI Vision Analysis Simulation & FKB Matching
  public static async analyzeImage(imageUri: string): Promise<FoodItem> {
    await new Promise((resolve) => setTimeout(resolve, 1800));

    const randomIndex = Math.floor(Math.random() * FKB_DATABASE.length);
    const entry = FKB_DATABASE[randomIndex];
    return this.createFoodItemFromFkb(entry, entry.defaultGrams, imageUri, 'verified');
  }

  // 4. Barcode Scan Matcher
  /**
   * Resolve a scanned barcode against the product database (decision 0004).
   *
   * Returns null when the product is unknown or the lookup fails. Vietnamese
   * coverage in Open Food Facts is thin, so this happens often and the caller
   * must offer manual entry — the previous version returned a fixed food no
   * matter what was scanned, which quietly logged the wrong product.
   */
  public static async scanBarcode(code: string): Promise<FoodItem | null> {
    try {
      const res = await apiClient.lookupBarcode(code);
      const f = res.food;
      const now = new Date();

      return {
        id: `barcode-${code}-${now.getTime()}`,
        name: f.name,
        mealType: 'snack',
        time: now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        date: now.toISOString().split('T')[0],
        // Nutrition is published per 100g; the portion starts at the serving
        // size on the package and the user adjusts from there.
        calories: Math.round((f.calories * f.serving_grams) / 100),
        portion: 1,
        portionUnit: 'phần',
        portionGrams: f.serving_grams,
        macros: {
          protein: round1((f.protein_g * f.serving_grams) / 100),
          carbs: round1((f.carbs_g * f.serving_grams) / 100),
          fat: round1((f.fat_g * f.serving_grams) / 100),
        },
        // The app scores out of 10; the API scores out of 100.
        healthScore: Math.round(f.health_score / 10),
        confidence: 'high',
        source: 'verified',
        fkbSourceLabel: 'Open Food Facts',
        imageUrl: f.image_url ?? undefined,
        barcode: f.barcode,
      };
    } catch {
      return null;
    }
  }

  // 5. Natural Language NLP Parser
  public static async parseNaturalLanguageText(text: string): Promise<FoodItem> {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const match = this.matchFkb(text);

    if (match) {
      const item = this.createFoodItemFromFkb(match, match.defaultGrams, undefined, 'verified');
      item.name = text.length > 35 ? text.slice(0, 35) + '...' : text;
      return item;
    }

    // Fallback to estimated
    const fallbackEntry = FKB_DATABASE[0];
    const item = this.createFoodItemFromFkb(fallbackEntry, 300, undefined, 'estimated');
    item.name = text.length > 35 ? text.slice(0, 35) + '...' : text;
    item.fkbSourceLabel = 'Ước lượng AI Vision';
    return item;
  }

  // 6. Refinement Engine
  public static refineFoodItem(item: FoodItem, feedback: string): FoodItem {
    const updated = { ...item, macros: { ...item.macros } };
    const lower = feedback.toLowerCase();

    if (lower.includes('ít dầu') || lower.includes('ít mỡ')) {
      updated.macros.fat = Math.max(2, Math.round(updated.macros.fat * 0.6));
      updated.calories = Math.round(updated.macros.protein * 4 + updated.macros.carbs * 4 + updated.macros.fat * 9);
      updated.healthScore = Math.min(10, +(updated.healthScore + 0.8).toFixed(1));
      updated.source = 'user_edited';
      updated.fkbSourceLabel = 'Đã chỉnh sửa bởi bạn';
    } else if (lower.includes('lớn hơn') || lower.includes('nhiều hơn')) {
      updated.portion = +(updated.portion * 1.4).toFixed(1);
      if (updated.portionGrams) updated.portionGrams = Math.round(updated.portionGrams * 1.4);
      updated.calories = Math.round(updated.calories * 1.4);
      updated.macros.protein = Math.round(updated.macros.protein * 1.4);
      updated.macros.carbs = Math.round(updated.macros.carbs * 1.4);
      updated.macros.fat = Math.round(updated.macros.fat * 1.4);
      updated.source = 'user_edited';
    }
    return updated;
  }

  // 7. Tạo FoodItem từ FKB Entry
  public static createFoodItemFromFkb(
    entry: FkbFoodEntry,
    grams: number,
    customImage?: string,
    source: NutrientSource = 'verified'
  ): FoodItem {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;
    const dateStr = now.toISOString().split('T')[0];

    let mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' = 'lunch';
    const h = now.getHours();
    if (h >= 5 && h < 11) mealType = 'breakfast';
    else if (h >= 11 && h < 16) mealType = 'lunch';
    else if (h >= 16 && h < 21) mealType = 'dinner';
    else mealType = 'snack';

    const calculated = this.calculateNutritionFromGrams(entry, grams);

    const ingredients: IngredientItem[] = (entry.ingredients || []).map((ing, idx) => ({
      id: `ing-${idx + 1}`,
      name: ing.name,
      amount: `${ing.grams}g`,
      grams: ing.grams,
      calories: Math.round(entry.per100g.calories * (ing.grams / 100)),
      macros: {
        protein: Math.round(entry.per100g.protein * (ing.grams / 100)),
        carbs: Math.round(entry.per100g.carbs * (ing.grams / 100)),
        fat: Math.round(entry.per100g.fat * (ing.grams / 100))
      }
    }));

    return {
      id: 'food-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      name: entry.name,
      mealType,
      time: timeStr,
      date: dateStr,
      calories: calculated.calories,
      portion: 1,
      portionUnit: entry.defaultUnit,
      portionGrams: grams,
      macros: calculated.macros,
      micros: calculated.micros,
      healthScore: entry.healthScore,
      confidence: 'high',
      source,
      fkbSourceLabel: entry.sourceLabel,
      imageUrl: customImage || entry.imageUrl,
      ingredients,
      isFavorite: false
    };
  }
}
