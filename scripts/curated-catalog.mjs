// The operating catalog is explicit reviewed data, never substring-generated metadata.
export const CATEGORIES = ['rice', 'soup', 'main', 'side', 'kimchi', 'dessert'];
export const PROTEINS = ['grain', 'meat', 'seafood', 'egg', 'tofu', 'vegetable', 'fruit', 'dairy', 'mixed'];
export const METHODS = ['rice', 'soup', 'stir-fry', 'fried', 'grilled', 'braised', 'steamed', 'raw', 'salad', 'noodle', 'baked', 'dessert', 'seasoned', 'boiled', 'fermented', 'smoked'];
const FIELDS = ['id', 'name', 'category', 'tags', 'protein', 'cookingMethod', 'spicyLevel', 'mealWeight', 'canonicalKey', 'reviewBasis'];
const TAGS = new Set([...CATEGORIES, ...PROTEINS, ...METHODS, 'korean', 'spicy']);

export function canonicalName(name) {
  return name.normalize('NFKC').replace(/\s+/g, '').replaceAll('쭈꾸미', '주꾸미').replaceAll('메론', '멜론').replaceAll('자장', '짜장').replaceAll('크로와상', '크루아상').replaceAll('크로아상', '크루아상');
}

export function validateCurated(source) {
  if (source?.version !== 1 || source?.basis !== 'menu-name-review-not-recipe' || !Array.isArray(source.items)) throw new Error('Invalid curated source envelope');
  const ids = new Set(), names = new Set(), keys = new Set();
  const catalog = Object.fromEntries(CATEGORIES.map(category => [category, []]));
  for (const row of source.items) {
    const fail = reason => { throw new Error(`${row?.id ?? 'unknown'}: ${reason}`); };
    if (!row || typeof row !== 'object' || Object.keys(row).length !== FIELDS.length || FIELDS.some(key => !(key in row))) fail('Invalid reviewed fields');
    if (!CATEGORIES.includes(row.category) || typeof row.id !== 'string' || !new RegExp(`^${row.category}-\\d{4}$`).test(row.id)) fail('Invalid identity');
    if (typeof row.name !== 'string' || !row.name.trim() || row.name !== row.name.trim() || row.name.length > 60) fail('Invalid name');
    if (typeof row.canonicalKey !== 'string' || !row.canonicalKey.trim() || typeof row.reviewBasis !== 'string' || !row.reviewBasis.trim()) fail('Missing review provenance');
    if (!PROTEINS.includes(row.protein) || !METHODS.includes(row.cookingMethod)) fail('Unresolved or invalid metadata');
    if (![0, 1, 2].includes(row.spicyLevel) || !['light', 'medium', 'heavy'].includes(row.mealWeight)) fail('Invalid meal hints');
    if (!Array.isArray(row.tags) || row.tags.some(tag => !TAGS.has(tag)) || new Set(row.tags).size !== row.tags.length) fail('Invalid/unsupported tags');
    for (const tag of [row.category, row.protein, row.cookingMethod]) if (!row.tags.includes(tag)) fail(`Missing tag ${tag}`);
    if (row.tags.includes('spicy') !== (row.spicyLevel > 0)) fail('Inconsistent spicy hint');
    if (/우유|요구르트|요거트|치즈|버터|크림(?!슨)|라떼/.test(row.name) && !row.tags.includes('dairy')) fail('Missing explicit dairy hint');
    if (/새우|오징어|주꾸미|쭈꾸미|낙지|바지락|홍합|전복|멸치|참치|해물|게살|어묵|고등어|가자미|갈치|삼치|동태|명태|대구|연어|문어|장어|꽃게|홍게|대게|코다리|아귀|꼬막|가리비|다슬기|우렁|북어|황태|굴(?!레|림)/.test(row.name) && !row.tags.includes('seafood')) fail('Missing explicit seafood hint');
    const normalized = canonicalName(row.name), key = canonicalName(row.canonicalKey);
    if (ids.has(row.id) || names.has(normalized) || keys.has(key)) fail('Duplicate identity/name/canonical key');
    ids.add(row.id); names.add(normalized); keys.add(key);
    // Provenance stays in the editable source, not in the client bundle.
    const item = Object.fromEntries(FIELDS.filter(key => !['canonicalKey', 'reviewBasis'].includes(key)).map(key => [key, row[key]]));
    catalog[row.category].push(item);
  }
  for (const category of CATEGORIES) if (catalog[category].length < (category === 'side' ? 2 : 1)) throw new Error(`Insufficient ${category} catalog`);
  return catalog;
}
