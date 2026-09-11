export const CATEGORIES = ['rice', 'soup', 'main', 'side', 'kimchi', 'dessert'];
export const PROTEIN_TYPES = ['grain', 'meat', 'seafood', 'egg', 'tofu', 'vegetable', 'fruit', 'dairy', 'mixed', 'other'];
export const COOKING_METHODS = ['rice', 'soup', 'stir-fry', 'fried', 'grilled', 'braised', 'steamed', 'raw', 'salad', 'noodle', 'baked', 'dessert', 'other'];
export const MEAL_WEIGHTS = ['light', 'medium', 'heavy'];

function topLevelObjectKeys(source) {
  const keys = [];
  let depth = 0;
  let index = 0;
  while (index < source.length) {
    if (source[index] === '{') {
      depth += 1;
      index += 1;
      continue;
    }
    if (source[index] === '}') {
      depth -= 1;
      index += 1;
      continue;
    }
    if (source[index] !== '"') {
      index += 1;
      continue;
    }

    const start = index;
    index += 1;
    let escaped = false;
    while (index < source.length) {
      const character = source[index++];
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') break;
    }
    if (depth !== 1) continue;
    let lookahead = index;
    while (/\s/.test(source[lookahead] ?? '')) lookahead += 1;
    if (source[lookahead] === ':') keys.push(JSON.parse(source.slice(start, index)));
  }
  return keys;
}

export function parseAndValidateOverrides(source, rawMenuDb) {
  const declaredKeys = topLevelObjectKeys(source);
  const duplicateKeys = [...new Set(declaredKeys.filter((key, index) => declaredKeys.indexOf(key) !== index))];
  if (duplicateKeys.length) throw new Error(`Duplicate override keys: ${duplicateKeys.join(', ')}`);

  const parsed = JSON.parse(source);
  const sourceKeys = new Set(
    Object.entries(rawMenuDb).flatMap(([category, names]) => names.map((name) => `${category}:${name}`))
  );
  const staleKeys = Object.keys(parsed).filter((key) => !sourceKeys.has(key));
  if (staleKeys.length) throw new Error(`Stale override keys: ${staleKeys.join(', ')}`);

  for (const [key, override] of Object.entries(parsed)) {
    const unknownFields = Object.keys(override).filter((field) => !['protein', 'cookingMethod', 'spicyLevel', 'mealWeight', 'tags'].includes(field));
    if (unknownFields.length) throw new Error(`Unsupported override fields for ${key}: ${unknownFields.join(', ')}`);
    if (override.protein !== undefined && !PROTEIN_TYPES.includes(override.protein)) throw new Error(`Invalid protein for ${key}`);
    if (override.cookingMethod !== undefined && !COOKING_METHODS.includes(override.cookingMethod)) throw new Error(`Invalid cookingMethod for ${key}`);
    if (override.spicyLevel !== undefined && ![0, 1, 2].includes(override.spicyLevel)) throw new Error(`Invalid spicyLevel for ${key}`);
    if (override.mealWeight !== undefined && !MEAL_WEIGHTS.includes(override.mealWeight)) throw new Error(`Invalid mealWeight for ${key}`);
    if (override.tags !== undefined && (!Array.isArray(override.tags) || override.tags.some((tag) => typeof tag !== 'string'))) {
      throw new Error(`Invalid tags for ${key}`);
    }
  }
  return parsed;
}

const vegetableTokens = ['감자', '고구마', '가지', '버섯', '연근', '우엉', '나물', '샐러드', '숙주', '시금치', '깻잎', '무', '배추', '상추', '토마토', '브로콜리', '케일', '도라지', '콩나물', '궁채', '오이', '양배추', '청경채'];
const mixedTokens = ['떡', '만두', '라면', '라멘', '우동', '국수', '쫄면', '짜장', '짬뽕', '파스타', '스파게티', '피자', '버거', '샌드', '토스트', '그라탕', '도리아', '핫도그', '고로케', '크로켓', '롤', '산도', '브레드', '빵', '카레', '난', '또띠아', '떡볶이', '잡채'];
const meatTokens = ['가라아게', '함박', '너비아니', '떡갈비', '동그랑땡', '완자', '산적', '소시지', '갈비', '불고기', '제육', '삼겹', '족발', '돼지', '소고기', '쇠고기', '닭', '치킨', '훈제', '햄', '베이컨', '오리', '돈가스', '돈까스'];
const seafoodTokens = ['어묵', '가마보꼬', '핫바', '고등어', '가자미', '갈치', '삼치', '오징어', '주꾸미', '쭈꾸미', '낙지', '새우', '꽃게', '대게', '홍게', '게살', '크랩', '굴', '조개', '해물', '연어', '명태', '동태', '코다리', '아귀', '대구', '바지락', '홍합', '전복', '문어', '멸치', '참치', '장어'];
const eggTokens = ['계란', '달걀', '메추리알', '스크램블', '오믈렛'];
const tofuTokens = ['두부', '콩'];
const fruitTokens = ['사과', '배', '포도', '딸기', '망고', '오렌지', '귤', '키위', '수박', '멜론', '메론', '과일', '복숭아', '바나나', '자몽', '체리', '감귤'];
const dairyTokens = ['우유', '요거트', '요구르트', '요플레', '치즈', '라떼', '푸딩', '아이스크림', '크림'];
const grainTokens = ['밥', '덮밥', '볶음밥', '비빔밥', '죽', '김밥', '주먹밥'];

const hasAny = (name, tokens) => tokens.some((token) => name.includes(token));

export function containsSeafood(name) {
  return hasAny(name, seafoodTokens);
}

export function containsDairy(name) {
  return hasAny(name, dairyTokens);
}

export function inferProtein(name, category) {
  if (category === 'kimchi') return 'vegetable';

  const present = {
    meat: hasAny(name, meatTokens),
    seafood: containsSeafood(name),
    egg: hasAny(name, eggTokens),
    tofu: hasAny(name, tofuTokens),
  };
  const explicitMainProteins = Object.entries(present).filter(([, found]) => found).map(([protein]) => protein);
  if (category === 'main' && explicitMainProteins.length > 1) return 'mixed';
  if (present.meat) return 'meat';
  if (present.seafood) return 'seafood';
  if (present.egg) return 'egg';
  if (present.tofu) return 'tofu';
  if (hasAny(name, mixedTokens)) return 'mixed';
  if (hasAny(name, vegetableTokens)) return 'vegetable';
  if (hasAny(name, fruitTokens)) return 'fruit';
  if (containsDairy(name)) return 'dairy';
  if (hasAny(name, ['나물', '샐러드', '무침', '생채', '장아찌', '김치', '겉절이'])) return 'vegetable';
  if (hasAny(name, grainTokens)) return 'grain';

  if (category === 'rice') return 'grain';
  if (category === 'side') return 'vegetable';
  return 'mixed';
}

const cookingRules = [
  { tokens: ['볶음', '볶이', '잡채'], method: 'stir-fry' },
  { tokens: ['튀김', '강정', '까스', '카츠', '돈가스', '돈까스', '탕수', '전병', '부침', '지짐', '튀각', '부각', '고로케', '크로켓', '커틀렛', '커틀릿', '너겟', '가라아게'], suffixes: ['전'], method: 'fried' },
  { tokens: ['구이', '바베큐', '스테이크'], method: 'grilled' },
  { tokens: ['조림', '장조림'], method: 'braised' },
  { tokens: ['찜', '수육', '편육', '백숙', '만두', '딤섬', '순대'], method: 'steamed' },
  { tokens: ['무침', '생채', '숙회', '냉채', '쌈', '피클', '장아찌', '절임'], method: 'raw' },
  { tokens: ['샐러드'], method: 'salad' },
  { tokens: ['찌개', '전골', '장국', '칼국수', '우동', '수제비', '짬뽕'], suffixes: ['국', '탕'], method: 'soup' },
  { tokens: ['파스타', '스파게티', '라면', '라멘', '우동', '국수', '쫄면', '짜장면', '짬뽕', '소바', '냉면', '막국수', '밀면', '팟타이'], method: 'noodle' },
  { tokens: ['피자', '빵', '토스트', '샌드', '버거', '파이', '도넛', '케이크', '쿠키', '크로와상', '와플', '마들렌', '머핀', '만쥬'], method: 'baked' },
  { tokens: ['떡', '젤리', '푸딩', '주스', '우유', '요거트', '과일', '아이스', '에이드', '스무디', '샤베트', '슬러쉬', '초콜릿'], method: 'dessert' },
  { tokens: grainTokens, method: 'rice' },
];

const dessertPreferred = ['피자', '빵', '토스트', '샌드', '버거', '파이', '도넛', '케이크', '쿠키', '크로와상', '와플', '마들렌', '머핀', '만쥬', '젤리', '푸딩', '주스', '우유', '요거트', '요구르트', '과일', '아이스', '차', '에이드', '스무디', '샤베트', '슬러쉬', '초콜릿', '맛탕', '사탕'];
const noodlePreferred = ['파스타', '스파게티', '라면', '라멘', '우동', '국수', '쫄면', '짜장면', '짬뽕', '소바', '냉면', '막국수', '밀면', '팟타이'];

export function inferCookingMethod(name, category) {
  if (category === 'kimchi') return 'raw';
  if (category === 'dessert' && hasAny(name, dessertPreferred)) return 'dessert';
  if ((category === 'main' || category === 'side') && hasAny(name, noodlePreferred)) return 'noodle';

  for (const rule of cookingRules) {
    if (hasAny(name, rule.tokens) || rule.suffixes?.some((suffix) => name.endsWith(suffix))) return rule.method;
  }

  if (category === 'dessert') return 'dessert';
  if (category === 'rice') return 'rice';
  if (category === 'soup') return 'soup';
  return 'other';
}

export function inferSpicyLevel(name) {
  if (name.includes('백김치') || name.includes('동치미')) return 0;
  if (hasAny(name, ['마라', '불닭', '짬뽕'])) return 2;
  return hasAny(name, ['매운', '매콤', '제육', '김치', '고추', '떡볶이', '비빔']) ? 1 : 0;
}

export function inferMealWeight(category, protein, cookingMethod) {
  if (category === 'dessert' || category === 'soup' || category === 'kimchi') return 'light';
  if (category === 'rice') return 'medium';
  if (cookingMethod === 'baked' || cookingMethod === 'noodle') return 'medium';
  if (protein === 'meat' || cookingMethod === 'fried') return 'heavy';
  if (cookingMethod === 'salad' || protein === 'fruit' || protein === 'vegetable') return 'light';
  return 'medium';
}

const koreanStyleTokens = ['찌개', '볶음', '조림', '나물', '무침', '비빔', '김치', '된장', '청국장', '밥', '죽', '갈비', '불고기'];
const foreignStyleTokens = ['중국식', '중화', '일본식', '태국식', '베트남식', '멕시칸', '이탈리안'];

export function inferTags(name, category, protein, cookingMethod, spicyLevel) {
  const tags = new Set([category, protein, cookingMethod]);
  if (spicyLevel > 0) tags.add('spicy');
  if (!hasAny(name, foreignStyleTokens) && (hasAny(name, koreanStyleTokens) || cookingMethod === 'soup')) tags.add('korean');
  if (protein === 'meat' || protein === 'seafood' || name.includes('카츠') || name.includes('까스')) tags.add('student-favorite');
  if (protein === 'mixed') tags.add('mixed');
  if (hasAny(name, ['피자', '파스타', '스파게티', '버거', '샌드', '토스트', '그라탕', '도리아'])) tags.add('western');
  if (hasAny(name, ['샐러드', '나물', '무침'])) tags.add('light');
  if (containsDairy(name)) tags.add('dairy');
  if (containsSeafood(name)) tags.add('seafood');
  return [...tags].sort();
}
