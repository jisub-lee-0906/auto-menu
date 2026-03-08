# Menu Data Policy

## Purpose

This project follows Korean institutional meal-planning conventions.
Each menu item should be stored in the single category that best matches how a school or cafeteria nutritionist would present it on a real menu board.

## Categories

### `rice`

- Staple grain dishes and rice-based one-bowl dishes
- Examples: `흑미밥`, `비빔밥`, `덮밥`, `볶음밥`, `죽`, `주먹밥`, `김밥`

### `soup`

- Soups, broths, stews, tang, guk, jjigae, noodles served as soup dishes, and soup-style items
- Examples: `미역국`, `된장찌개`, `갈비탕`, `칼국수`, `우동국`, `수제비국`

### `main`

- Main protein dish or dominant entree served as the primary side
- Includes meat, fish, poultry, tofu-based entree, substantial fried or grilled dishes, and entree-style convenience foods
- Examples: `불고기`, `치킨`, `생선까스`, `족발`, `함박스테이크`, `카츠`

### `side`

- Supporting side dishes, vegetable dishes, small plates, light fried items, namul, muchim, jeon, jorim, kim-based dishes, pickles, and snack-like side items
- Examples: `시금치나물`, `감자조림`, `멸치볶음`, `부추전`, `단무지`, `샐러드`, `김자반`

### `kimchi`

- Kimchi, geotjeori, kkakdugi, dongchimi, and kimchi-adjacent fermented vegetable items

### `dessert`

- Fruit, yogurt, milk, beverages, bread/snack dessert, jelly, pudding, ice cream, and sweet items served after the meal

## Decision Rules

1. Prefer how the item is displayed on a real Korean school lunch menu, not just the recipe type.
2. If an item is clearly protein-dominant and can anchor the meal, it belongs in `main`.
3. If an item is vegetable-forward, condiment-like, or plated in a small portion, it belongs in `side`.
4. Drinks, dairy, fruit, sweet breads, and dessert snacks belong in `dessert` even if they are sold as standalone products.
5. Generic ingredient names or truncated labels should not remain in the dataset.

## Exclusion Rules

- Remove entries that are only ingredients, brands, vague labels, or truncated fragments.
- Avoid duplicated entries across categories.
- Prefer fully readable Korean menu names over abbreviations or partial strings.
