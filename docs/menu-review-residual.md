# Residual Review Notes

The dataset has already been cleaned for:

- duplicate entries within categories
- overlaps across categories
- broken or truncated menu names
- clearly misplaced dessert, side, and kimchi items

## Remaining Gray Areas

These families are still somewhat subjective and may vary by site policy:

- `떡` 계열 메뉴
- `튀김` 계열 메뉴
- `카츠`, `까스` 계열 메뉴
- 고기나 해산물이 들어간 `샐러드`
- `버거`, `핫도그`, `토스트`, `샌드위치`
- `떡볶이`, `잡채`, `만두`

## Recommended Tie-Breaker

- If the item can reasonably act as the meal's main protein or centerpiece, keep it in `main`.
- If the item is usually plated as a supporting dish or side portion, keep it in `side`.
- If the item is sweet, drinkable, dairy-based, fruit-based, or bakery/snack style, keep it in `dessert`.

## Current Status

- Cross-category overlaps: none
- Intra-category duplicates: none
- Broken naming artifacts: cleaned to the current policy level
