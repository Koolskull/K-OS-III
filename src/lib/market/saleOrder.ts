/** Group for-sale tiles by collection, cheapest ask first inside each type. */

export function compareAsks(a: { currency: string; raw: string }, b: { currency: string; raw: string }): number {
  if (a.currency !== b.currency) return a.currency < b.currency ? -1 : 1;
  let av: bigint;
  let bv: bigint;
  try {
    av = BigInt(a.raw);
    bv = BigInt(b.raw);
  } catch {
    return 0;
  }
  if (av === bv) return 0;
  return av < bv ? -1 : 1;
}

export function groupByCollection<T extends { collectionId: string }>(
  tiles: readonly T[],
  order: readonly string[],
  compare: (a: T, b: T) => number,
): { collectionId: string; tiles: T[] }[] {
  const known = new Set(order);
  const groups = order.map((collectionId) => ({
    collectionId,
    tiles: tiles.filter((tile) => tile.collectionId === collectionId).slice().sort(compare),
  }));
  const rest = tiles.filter((tile) => !known.has(tile.collectionId));
  if (rest.length) groups.push({ collectionId: "", tiles: rest.slice().sort(compare) });
  return groups.filter((group) => group.tiles.length > 0);
}
