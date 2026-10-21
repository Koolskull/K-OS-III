export function unitRaw(unit, decimals) {
  if (!Number.isFinite(unit) || unit < 0) return "0";
  const text = unit.toFixed(Math.min(decimals, 18));
  const [whole, frac = ""] = text.split(".");
  const digits = `${whole}${frac.padEnd(decimals, "0").slice(0, decimals)}`.replace(/^0+/, "");
  return digits || "0";
}

export function priceLabel(unit, symbol) {
  const text = unit.toFixed(8).replace(/\.?0+$/, "");
  return `${text || "0"} ${symbol.toUpperCase()}`;
}
