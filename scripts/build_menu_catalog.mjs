import rawMenuDb from '../data/menu_db.json' with { type: 'json' };
import fs from 'node:fs';
import path from 'node:path';

const outputPath = path.resolve('data/menu_catalog.json');
const overridesPath = path.resolve('data/menu_catalog_overrides.json');
const overrides = JSON.parse(fs.readFileSync(overridesPath, 'utf8'));

const proteinRules = [
  { tokens: ['감자', '고구마', '가지', '버섯', '연근', '우엉', '나물', '샐러드', '숙주', '시금치', '깻잎', '무', '배추', '상추', '토마토', '브로콜리', '케일', '도라지', '콩나물', '궁채', '오이', '양배추', '청경채'], protein: 'vegetable' },
  { tokens: ['떡', '만두', '라면', '라멘', '우동', '국수', '쫄면', '짜장', '짬뽕', '파스타', '스파게티', '피자', '버거', '샌드', '토스트', '그라탕', '도리아', '핫도그', '고로케', '크로켓', '롤', '산도', '브레드', '빵'], protein: 'mixed' },
  { tokens: ['함박', '너비아니', '떡갈비', '동그랑땡', '완자', '산적', '핫도그', '소시지'], protein: 'meat' },
  { tokens: ['갈비', '불고기', '제육', '삼겹', '족발', '돈', '돼지', '소고기', '쇠고기', '닭', '치킨', '훈제', '햄', '베이컨', '오리'], protein: 'meat' },
  { tokens: ['어묵', '가마보꼬', '핫바'], protein: 'seafood' },
  { tokens: ['고등어', '가자미', '갈치', '삼치', '오징어', '주꾸미', '쭈꾸미', '낙지', '새우', '게', '굴', '조개', '해물', '연어', '명태', '동태', '코다리', '아귀', '대구', '바지락', '홍합'], protein: 'seafood' },
  { tokens: ['계란', '달걀', '알'], protein: 'egg' },
  { tokens: ['두부', '콩'], protein: 'tofu' },
  { tokens: ['만두', '딤섬', '버거', '샌드', '토스트', '피자', '파스타', '스파게티', '라면', '라멘', '우동', '국수', '쫄면', '짜장', '짬뽕', '도리아', '그라탕', '카레', '난', '또띠아', '떡볶이', '잡채'], protein: 'mixed' },
  { tokens: ['사과', '배', '포도', '딸기', '망고', '오렌지', '귤', '키위', '수박', '멜론', '과일', '복숭아', '바나나', '자몽', '체리', '감귤'], protein: 'fruit' },
  { tokens: ['우유', '요거트', '요구르트', '요플레', '치즈', '라떼', '푸딩', '아이스크림'], protein: 'dairy' },
  { tokens: ['나물', '샐러드', '무침', '생채', '장아찌', '김치', '겉절이'], protein: 'vegetable' },
  { tokens: ['밥', '덮밥', '볶음밥', '비빔밥', '죽', '김밥', '주먹밥'], protein: 'grain' },
];

const cookingRules = [
  { tokens: ['볶음', '볶이', '잡채'], method: 'stir-fry' },
  { tokens: ['튀김', '강정', '까스', '카츠', '돈가스', '돈까스', '탕수', '전', '전병', '부침', '지짐', '튀각', '부각', '고로케', '크로켓', '커틀렛', '커틀릿', '너겟'], method: 'fried' },
  { tokens: ['구이', '바베큐', '스테이크'], method: 'grilled' },
  { tokens: ['조림', '장조림'], method: 'braised' },
  { tokens: ['찜', '수육', '편육', '백숙', '만두', '딤섬', '순대'], method: 'steamed' },
  { tokens: ['무침', '생채', '숙회', '냉채', '쌈', '피클', '장아찌', '절임'], method: 'raw' },
  { tokens: ['샐러드'], method: 'salad' },
  { tokens: ['국', '탕', '찌개', '전골', '장국', '칼국수', '우동', '수제비', '짬뽕', '국수', '소바'], method: 'soup' },
  { tokens: ['파스타', '스파게티', '라면', '라멘', '우동', '국수', '쫄면', '짜장면', '짬뽕', '소바', '냉면', '막국수', '밀면', '팟타이'], method: 'noodle' },
  { tokens: ['피자', '빵', '토스트', '샌드', '버거', '파이', '도넛', '케이크', '쿠키', '크로와상', '와플', '마들렌', '머핀', '만쥬'], method: 'baked' },
  { tokens: ['떡', '젤리', '푸딩', '주스', '우유', '요거트', '과일', '아이스', '차', '에이드', '스무디', '샤베트', '슬러쉬', '초콜릿'], method: 'dessert' },
  { tokens: ['밥', '덮밥', '볶음밥', '비빔밥', '죽', '김밥', '주먹밥'], method: 'rice' },
];

const koreanStyleTokens = ['국', '탕', '찌개', '볶음', '조림', '나물', '무침', '비빔', '김치', '된장', '청국장', '밥', '죽', '갈비', '불고기'];
const spicyTokens = ['매운', '매콤', '불', '짬뽕', '마라', '제육', '김치', '고추', '떡볶이', '비빔'];

function inferProtein(name, category) {
  if (category === 'kimchi') return 'vegetable';

  for (const rule of proteinRules) {
    if (rule.tokens.some((token) => name.includes(token))) {
      return rule.protein;
    }
  }

  if (category === 'rice') return 'grain';
  if (category === 'dessert') return 'mixed';
  if (category === 'soup') return 'mixed';
  if (category === 'main') return 'mixed';
  if (category === 'side') return 'vegetable';
  return 'mixed';
}

function inferCookingMethod(name, category) {
  if (category === 'kimchi') return 'raw';

  const dessertPreferred = ['피자', '빵', '토스트', '샌드', '버거', '파이', '도넛', '케이크', '쿠키', '크로와상', '와플', '마들렌', '머핀', '만쥬', '젤리', '푸딩', '주스', '우유', '요거트', '과일', '아이스', '차', '에이드', '스무디', '샤베트', '슬러쉬', '초콜릿', '맛탕'];
  const noodlePreferred = ['파스타', '스파게티', '라면', '라멘', '우동', '국수', '쫄면', '짜장면', '짬뽕', '소바', '냉면', '막국수', '밀면', '팟타이'];

  if (category === 'dessert') {
    if (dessertPreferred.some((token) => name.includes(token))) return 'dessert';
  }

  if (category === 'main' || category === 'side') {
    if (noodlePreferred.some((token) => name.includes(token))) return 'noodle';
  }

  for (const rule of cookingRules) {
    if (rule.tokens.some((token) => name.includes(token))) {
      return rule.method;
    }
  }

  if (category === 'dessert') return 'dessert';
  if (category === 'rice') return 'rice';
  if (category === 'soup') return 'soup';
  if (category === 'main') return 'grilled';
  if (category === 'side') return 'raw';
  return 'other';
}

function inferSpicyLevel(name) {
  if (!spicyTokens.some((token) => name.includes(token))) {
    return 0;
  }

  if (name.includes('마라') || name.includes('불닭') || name.includes('짬뽕')) {
    return 2;
  }

  return 1;
}

function inferMealWeight(category, protein, cookingMethod) {
  if (category === 'dessert') return 'light';
  if (category === 'soup' || category === 'kimchi') return 'light';
  if (category === 'rice') return 'medium';
  if (cookingMethod === 'baked' || cookingMethod === 'noodle') return 'medium';
  if (protein === 'meat' || cookingMethod === 'fried') return 'heavy';
  if (cookingMethod === 'salad' || protein === 'fruit' || protein === 'vegetable') return 'light';
  return 'medium';
}

function inferTags(name, category, protein, cookingMethod, spicyLevel) {
  const tags = new Set([category, protein, cookingMethod]);

  if (spicyLevel > 0) tags.add('spicy');
  if (koreanStyleTokens.some((token) => name.includes(token))) tags.add('korean');
  if (protein === 'meat' || protein === 'seafood' || name.includes('카츠') || name.includes('까스')) {
    tags.add('student-favorite');
  }
  if (protein === 'mixed') tags.add('mixed');
  if (['피자', '파스타', '스파게티', '버거', '샌드', '토스트', '그라탕', '도리아'].some((token) => name.includes(token))) {
    tags.add('western');
  }
  if (name.includes('샐러드') || name.includes('나물') || name.includes('무침')) tags.add('light');
  if (name.includes('우유') || name.includes('요거트') || name.includes('요구르트') || name.includes('요플레')) {
    tags.add('dairy');
  }
  if (protein === 'seafood') tags.add('seafood');

  return [...tags].sort();
}

function applyOverrides(item) {
  const key = `${item.category}:${item.name}`;
  const override = overrides[key];
  if (!override) return item;

  return {
    ...item,
    ...override,
    tags: override.tags ? [...new Set(override.tags)].sort() : item.tags,
  };
}

const structuredCatalog = Object.fromEntries(
  Object.entries(rawMenuDb).map(([category, items]) => {
    const structuredItems = items.map((name, index) => {
      const protein = inferProtein(name, category);
      const cookingMethod = inferCookingMethod(name, category);
      const spicyLevel = inferSpicyLevel(name);
      const mealWeight = inferMealWeight(category, protein, cookingMethod);

      const item = {
        id: `${category}-${String(index + 1).padStart(4, '0')}`,
        name,
        category,
        tags: inferTags(name, category, protein, cookingMethod, spicyLevel),
        protein,
        cookingMethod,
        spicyLevel,
        mealWeight,
      };

      return applyOverrides(item);
    });

    return [category, structuredItems];
  })
);

fs.writeFileSync(outputPath, `${JSON.stringify(structuredCatalog, null, 2)}\n`, 'utf8');

console.log(`Structured menu catalog written to ${outputPath}`);
