import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { CATEGORIES, canonicalName } from './curated-catalog.mjs';

export function validateProvenance(source, ledger, snapshotText) {
  assert.equal(ledger.version, 1, 'Invalid ledger version');
  assert.equal(createHash('sha256').update(snapshotText).digest('hex'), ledger.originalRawSha256, 'Original snapshot hash mismatch');
  const snapshot = JSON.parse(snapshotText);
  assert.deepEqual(Object.keys(snapshot).sort(), [...CATEGORIES].sort(), 'Original snapshot categories mismatch');
  const original = new Map();
  for (const category of CATEGORIES) {
    assert(Array.isArray(snapshot[category]), 'Invalid original category');
    snapshot[category].forEach((name, index) => {
      assert.equal(typeof name, 'string');
      const id = `${category}-${String(index + 1).padStart(4, '0')}`;
      original.set(id, {id, name, category});
    });
  }
  assert.equal(original.size, ledger.originalCount, 'Original count mismatch');
  assert(Array.isArray(ledger.decisions), 'Missing decisions');
  assert.equal(ledger.decisions.length, original.size, 'Decision coverage mismatch');
  const rows = new Map(source.items.map(row => [row.id, row]));
  const targets = new Map(source.items.map(row => [row.name, row]));
  const seen = new Set();
  const codes = new Set(['clear-dish', 'duplicate-alias', 'brand-or-marketing', 'incomplete-or-vague-name', 'unclear-ingredients-or-method', 'questionable-slot', 'outside-reviewed-dish-set', 'non-menu-fragment']);
  for (const d of ledger.decisions) {
    assert(!seen.has(d.id), `Duplicate decision ${d.id}`); seen.add(d.id);
    assert.deepEqual({id:d.id, name:d.name, category:d.category}, original.get(d.id), `Archived identity mismatch ${d.id}`);
    assert(['keep', 'remove'].includes(d.action) && codes.has(d.reasonCode) && typeof d.reason === 'string' && d.reason.trim(), `Invalid decision ${d.id}`);
    const row = rows.get(d.id);
    assert.equal(d.action === 'keep', Boolean(row), `Unreviewed source change ${d.id}`);
    if (row) assert.deepEqual({id:row.id, name:row.name, category:row.category}, {id:d.id, name:d.name, category:d.category}, `Retained identity mismatch ${d.id}`);
    if (d.reasonCode === 'duplicate-alias') {
      assert.equal(d.action, 'remove', `Invalid duplicate action ${d.id}`);
      const target = targets.get(d.duplicateOf);
      assert(target, `Missing duplicate target ${d.id}`);
      assert(typeof d.duplicateGroup === 'string' && canonicalName(d.duplicateGroup) === canonicalName(target.canonicalKey), `Unreviewed duplicate link ${d.id}`);
    } else assert(d.duplicateOf === undefined && d.duplicateGroup === undefined, `Unexpected duplicate link ${d.id}`);
  }
  assert.equal(ledger.decisions.filter(d => d.action === 'keep').length, source.items.length, 'Unrecorded source item');
}
