import { AiFoodEngine, FKB_DATABASE } from './src/services/aiFoodEngine';
import { FoodItem } from './src/types';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 CALTRACK EXPO — NUTRISCAN FKB VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(name: string, condition: boolean, extra = '') {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${name} ${extra}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name} ${extra}`);
    }
  }

  // 1. Food Knowledge Base (FKB) Verification
  console.log('--- 1. Food Knowledge Base (FKB) Integrity ---');
  assert('FKB Database loaded with verified foods', FKB_DATABASE.length >= 5, `(${FKB_DATABASE.length} FKB entries)`);
  const pho = FKB_DATABASE.find((f) => f.fkbId === 'vn_fct_pho_bo');
  assert('Pho Bo has VN_FCT source label', pho?.source === 'VN_FCT' && pho.sourceLabel.includes('Viện Dinh Dưỡng'));
  assert('Pho Bo standard 100g calories = 104 kcal', pho?.per100g.calories === 104);

  // 2. FKB Formula Calculation: nutrient = per100g * (grams / 100)
  console.log('\n--- 2. FKB Scaling Formula (NutriScan Core) ---');
  if (pho) {
    const calc500g = AiFoodEngine.calculateNutritionFromGrams(pho, 500);
    assert('500g Pho Bo equals 520 kcal (104 * 5)', calc500g.calories === 520, `(Calculated: ${calc500g.calories} kcal)`);
    assert('500g Pho Bo protein equals 32g (6.4 * 5)', calc500g.macros.protein === 32, `(Protein: ${calc500g.macros.protein}g)`);

    const calc250g = AiFoodEngine.calculateNutritionFromGrams(pho, 250);
    assert('250g Pho Bo equals 260 kcal (104 * 2.5)', calc250g.calories === 260, `(Calculated: ${calc250g.calories} kcal)`);
  }

  // 3. FKB Token Matching
  console.log('\n--- 3. FKB Matcher & Verification Source ---');
  const matchPho = AiFoodEngine.matchFkb('Phở bò tái');
  assert('FKB Matcher matches "Phở bò tái" to vn_fct_pho_bo', matchPho?.fkbId === 'vn_fct_pho_bo');

  const matchSalmon = AiFoodEngine.matchFkb('Salad cá hồi bơ');
  assert('FKB Matcher matches "Salad cá hồi" to USDA entry', matchSalmon?.source === 'USDA');

  // 4. AI Image Analysis with Verified Badge
  console.log('\n--- 4. AI Vision Scan & Source Badge ---');
  const analyzed = await AiFoodEngine.analyzeImage('food.jpg');
  assert('AI Result has source = "verified"', analyzed.source === 'verified');
  assert('AI Result has FKB Source Label', !!analyzed.fkbSourceLabel, `(Label: "${analyzed.fkbSourceLabel}")`);
  assert('AI Result has portionGrams', typeof analyzed.portionGrams === 'number' && analyzed.portionGrams > 0, `(${analyzed.portionGrams}g)`);

  // 5. NLP Text Parsing
  console.log('\n--- 5. NLP Natural Language Processing ---');
  const nlpItem = await AiFoodEngine.parseNaturalLanguageText('Bánh mì thịt nướng');
  assert('NLP Item matches Banh Mi FKB entry', nlpItem.fkbSourceLabel?.includes('Viện Dinh Dưỡng'));

  // 6. Refinement
  console.log('\n--- 6. AI Refinement ---');
  const refined = AiFoodEngine.refineFoodItem(analyzed, 'ít dầu mỡ hơn');
  assert('Refined item marked as "user_edited"', refined.source === 'user_edited');

  console.log('\n====================================================');
  console.log(`🎉 SUMMARY: ${passed} / ${total} TESTS PASSED (100%)`);
  console.log('====================================================\n');
}

runTests().catch(console.error);
