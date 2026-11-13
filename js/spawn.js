// Pure spawn logic (unit-tested in test/spawn.test.mjs). No React, no three.
export const SCALE_MIN = 0.4;
export const SCALE_MAX = 2.5;
export const clampScale = (s) => Math.min(SCALE_MAX, Math.max(SCALE_MIN, Number.isFinite(+s) ? +s : 1));
export const clampPos = (v, lim = 9) => Math.min(lim, Math.max(-lim, v));

// Spawn `product` into the void: returns a NEW items array with one more item, placed on a spiral so repeats do not overlap.
export function spawnItem(items, product, counter = items.length) {
  if (!product || !product.id || !product.title) throw new Error("spawnItem: product needs id and title");
  const n = counter;
  const ang = n * 2.399963; // golden angle
  const r = n === 0 ? 0 : 1.6 + 0.45 * Math.sqrt(n);
  return [...items, {
    uid: `${product.id}#${n}`, productId: product.id,
    x: clampPos(Math.cos(ang) * r), z: clampPos(Math.sin(ang) * r - 0.5),
    scale: 1, rotY: (-ang * 0.12) % 0.6,
  }];
}
export const removeItem = (items, uid) => items.filter((i) => i.uid !== uid);
export const moveItem = (items, uid, x, z) => items.map((i) => (i.uid === uid ? { ...i, x: clampPos(x), z: clampPos(z) } : i));
export const scaleItem = (items, uid, s) => items.map((i) => (i.uid === uid ? { ...i, scale: clampScale(s) } : i));
