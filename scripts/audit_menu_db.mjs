import menuDb from "../data/menu_db.json" with { type: "json" };

const categoryOrder = ["rice", "soup", "main", "side", "kimchi", "dessert"];

function countDuplicates(items) {
  return items.length - new Set(items).size;
}

function findCrossCategoryOverlaps(db) {
  const overlaps = [];

  for (let i = 0; i < categoryOrder.length; i += 1) {
    for (let j = i + 1; j < categoryOrder.length; j += 1) {
      const left = categoryOrder[i];
      const right = categoryOrder[j];
      const rightSet = new Set(db[right]);
      const shared = [...new Set(db[left].filter((item) => rightSet.has(item)))];

      if (shared.length > 0) {
        overlaps.push({ left, right, count: shared.length, items: shared });
      }
    }
  }

  return overlaps;
}

console.log("Menu DB audit");
console.log("");

for (const category of categoryOrder) {
  const items = menuDb[category];
  console.log(
    `${category}: total=${items.length}, unique=${new Set(items).size}, duplicate_entries=${countDuplicates(items)}`
  );
}

console.log("");
console.log("Cross-category overlaps");

const overlaps = findCrossCategoryOverlaps(menuDb);

if (overlaps.length === 0) {
  console.log("none");
} else {
  for (const overlap of overlaps) {
    console.log(`${overlap.left} <-> ${overlap.right}: ${overlap.count}`);
    for (const item of overlap.items.slice(0, 20)) {
      console.log(`- ${item}`);
    }
  }
}
