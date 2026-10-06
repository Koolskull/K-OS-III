/*
 *   Safe arithmetic for the K-OS shell.
 *   Functions use radians. No eval.
 */

const FUNCS: Record<string, (value: number) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  sqrt: Math.sqrt,
  abs: Math.abs,
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
  log: Math.log10,
  ln: Math.log,
};

const CONSTS: Record<string, number> = {
  pi: Math.PI,
  e: Math.E,
  tau: Math.PI * 2,
};

const KNOWN = new Set([...Object.keys(FUNCS), ...Object.keys(CONSTS)]);

type Token =
  | { t: "num"; v: number }
  | { t: "id"; v: string }
  | { t: "op"; v: "+" | "-" | "*" | "/" | "%" | "^" }
  | { t: "lp" }
  | { t: "rp" };

export type MathRead =
  | { ok: true; value: string }
  | { ok: false; reason: "not-math" | "bad" };

export function readMath(input: string): MathRead {
  const src = input.trim();
  if (!src) return { ok: false, reason: "not-math" };

  const tokens: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === " " || c === "\t") {
      i += 1;
      continue;
    }
    if (c === "*" && src[i + 1] === "*") {
      tokens.push({ t: "op", v: "^" });
      i += 2;
      continue;
    }
    if (c === "×") {
      tokens.push({ t: "op", v: "*" });
      i += 1;
      continue;
    }
    if (c === "÷") {
      tokens.push({ t: "op", v: "/" });
      i += 1;
      continue;
    }
    if (c === "−") {
      tokens.push({ t: "op", v: "-" });
      i += 1;
      continue;
    }
    if (c === "+" || c === "-" || c === "*" || c === "/" || c === "%" || c === "^") {
      tokens.push({ t: "op", v: c });
      i += 1;
      continue;
    }
    if (c === "(") {
      tokens.push({ t: "lp" });
      i += 1;
      continue;
    }
    if (c === ")") {
      tokens.push({ t: "rp" });
      i += 1;
      continue;
    }
    if ((c >= "0" && c <= "9") || (c === "." && src[i + 1] >= "0" && src[i + 1] <= "9")) {
      let j = i;
      let dots = 0;
      while (j < src.length && ((src[j] >= "0" && src[j] <= "9") || src[j] === ".")) {
        if (src[j] === ".") dots += 1;
        j += 1;
      }
      if (dots > 1) return { ok: false, reason: "bad" };
      const value = Number(src.slice(i, j));
      if (!Number.isFinite(value)) return { ok: false, reason: "bad" };
      tokens.push({ t: "num", v: value });
      i = j;
      continue;
    }
    if (/[a-z]/i.test(c)) {
      let j = i;
      while (j < src.length && /[a-z]/i.test(src[j])) j += 1;
      const word = src.slice(i, j).toLowerCase();
      if (!KNOWN.has(word)) return { ok: false, reason: "not-math" };
      tokens.push({ t: "id", v: word });
      i = j;
      continue;
    }
    return { ok: false, reason: "not-math" };
  }

  if (tokens.length === 0) return { ok: false, reason: "not-math" };
  const hasValue = tokens.some((token) => token.t === "num" || token.t === "id");
  if (!hasValue) return { ok: false, reason: "not-math" };

  try {
    const value = new Parser(tokens).parse();
    if (!Number.isFinite(value)) return { ok: true, value: "UNDEFINED" };
    return { ok: true, value: formatNum(value) };
  } catch {
    return { ok: false, reason: "bad" };
  }
}

function formatNum(value: number): string {
  const rounded = Math.round(value * 1e12) / 1e12;
  if (Object.is(rounded, -0)) return "0";
  return String(rounded);
}

class Parser {
  private index = 0;

  constructor(private readonly tokens: Token[]) {}

  parse(): number {
    const value = this.expr();
    if (this.peek()) throw new Error("trailing");
    return value;
  }

  private peek(): Token | undefined {
    return this.tokens[this.index];
  }

  private eat(): Token | undefined {
    const token = this.tokens[this.index];
    this.index += 1;
    return token;
  }

  private expr(): number {
    let value = this.term();
    for (;;) {
      const op = this.peek();
      if (op?.t !== "op" || (op.v !== "+" && op.v !== "-")) break;
      this.eat();
      const right = this.term();
      value = op.v === "+" ? value + right : value - right;
    }
    return value;
  }

  private term(): number {
    let value = this.power();
    for (;;) {
      const op = this.peek();
      if (op?.t !== "op" || (op.v !== "*" && op.v !== "/" && op.v !== "%")) break;
      this.eat();
      const right = this.power();
      if ((op.v === "/" || op.v === "%") && right === 0) return NaN;
      if (op.v === "*") value *= right;
      else if (op.v === "/") value /= right;
      else value %= right;
    }
    return value;
  }

  private power(): number {
    const base = this.unary();
    const op = this.peek();
    if (op?.t === "op" && op.v === "^") {
      this.eat();
      return Math.pow(base, this.power());
    }
    return base;
  }

  private unary(): number {
    const op = this.peek();
    if (op?.t === "op" && (op.v === "+" || op.v === "-")) {
      this.eat();
      const value = this.unary();
      return op.v === "-" ? -value : value;
    }
    return this.implicit(this.primary());
  }

  private implicit(left: number): number {
    const next = this.peek();
    if (!next) return left;
    if (next.t === "num" || next.t === "lp" || next.t === "id") {
      return left * this.implicit(this.primary());
    }
    return left;
  }

  private primary(): number {
    const token = this.peek();
    if (!token) throw new Error("end");
    if (token.t === "num") {
      this.eat();
      return token.v;
    }
    if (token.t === "lp") {
      this.eat();
      const value = this.expr();
      const close = this.eat();
      if (close?.t !== "rp") throw new Error("paren");
      return value;
    }
    if (token.t === "id") {
      this.eat();
      if (this.peek()?.t === "lp") {
        const fn = FUNCS[token.v];
        if (!fn) throw new Error("fn");
        this.eat();
        const arg = this.expr();
        const close = this.eat();
        if (close?.t !== "rp") throw new Error("paren");
        return fn(arg);
      }
      if (token.v in CONSTS) return CONSTS[token.v];
      throw new Error("name");
    }
    throw new Error("tok");
  }
}
