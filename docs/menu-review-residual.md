# Residual Review Notes

The dataset has been cleaned for:

- duplicate entries within categories
- overlaps across categories
- broken or truncated menu names
- clearly misplaced dessert, side, and kimchi items

## Remaining Gray Area

These families are still inherently subjective and can vary by site policy:

- `전` dishes
- `튀김` dishes
- `카츠` or `까스` dishes
- `샐러드` dishes with meat or seafood
- `버거`, `핫도그`, `토스트`, `샌드위치`
- `떡볶이`, `잡채`, `만두`

## Recommended Rule

Use this tie-breaker:

- If the item can reasonably act as the meal's main protein or centerpiece, keep it in `main`.
- If the item is usually plated as a supporting dish or side portion, keep it in `side`.
- If the item is sweet, drinkable, dairy-based, fruit-based, or bakery/snack style, keep it in `dessert`.

## Current Status

- Cross-category overlaps: none
- Intra-category duplicates: none
- Broken naming artifacts: cleaned to the current policy level
