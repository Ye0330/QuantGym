export const GENERATOR_VERSION = 3;
export const CATEGORIES = ["addition", "subtraction", "multiplication", "division", "percentages", "fractions", "decimals", "decimal_division", "sequences"] as const;
export type Category = (typeof CATEGORIES)[number];
export type Focus = Category | "mixed" | Category[];
export type Level = 1 | 2 | 3;
export const MULTIPLICATION_STAGES = ["triple-single", "triple-double", "triple-near-hundred", "triple-general"] as const;
export type MultiplicationStage = (typeof MULTIPLICATION_STAGES)[number];
export const STAGE_LABELS: Record<MultiplicationStage, string> = {
  "triple-single": "1 · 3-digit × 1-digit", "triple-double": "2 · 3-digit × 2-digit",
  "triple-near-hundred": "3 · Near a multiple of 100", "triple-general": "4 · 3-digit × 3-digit",
};
export function isMultiplicationStage(value: unknown): value is MultiplicationStage { return MULTIPLICATION_STAGES.includes(value as MultiplicationStage); }
export type Mode = "sprint" | "adaptive" | "challenge" | "practice" | "review";
export type AnswerMode = "input" | "choice";
export type SequenceFamily = "arithmetic" | "geometric" | "growing-difference" | "alternating" | "multiply-add" | "interleaved";
export type Rational = { n: number; d: number };
export type Question = { id: string; category: Category; level: Level; expression: string; answer: Rational; answerFormat?: "decimal"; explanation: string; sequenceFamily?: SequenceFamily };
export type Attempt = { question: Question; input: string; correct: boolean; skipped: boolean; ms: number };
export type Config = { mode: Mode; focus: Focus; level: Level; multiplicationStage?: MultiplicationStage; answerMode?: AnswerMode };
export type Session = { id: string; config: Config; startedAt: number; endedAt: number; elapsedMs: number; reason: "complete" | "time" | "ended" | "exhausted"; seed: number; generatorVersion?: number; attempts: Attempt[] };
export type Run = {
  id: string; config: Config; seed: number; generatorVersion: number; startedAt: number; deadline: number | null;
  questionAt: number; question: Question; attempts: Attempt[]; level: Level; awaitingExplanation: boolean;
  random: () => number; history: Attempt[]; queue: Question[]; target: number | null;
  seen: Set<string>; exhausted: boolean;
};
export const LABELS: Record<Category | "mixed", string> = { mixed: "Mixed practice", addition: "Addition", subtraction: "Subtraction", multiplication: "Multiplication", division: "Division", percentages: "Percentages", fractions: "Fractions", decimals: "Decimal multiplication", decimal_division: "Decimal division", sequences: "Sequence practice" };
export function isValidFocus(value: unknown): value is Focus {
  if (typeof value === "string") return value === "mixed" || CATEGORIES.includes(value as Category);
  return Array.isArray(value) && value.length > 0 && value.length <= CATEGORIES.length && new Set(value).size === value.length && value.every(item => CATEGORIES.includes(item));
}
export function focusCategories(focus: Focus): Category[] {
  return focus === "mixed" ? [...CATEGORIES] : CATEGORIES.filter(category => Array.isArray(focus) ? focus.includes(category) : category === focus);
}
export function normalizeFocus(focus: Focus): Focus {
  if (!isValidFocus(focus)) throw new Error("Choose at least one valid skill.");
  if (focus === "mixed") return focus;
  const selected = focusCategories(focus);
  return selected.length === 1 ? selected[0] : selected;
}
export function toggleFocus(focus: Focus, option: Category | "mixed"): Focus {
  if (option === "mixed") return "mixed";
  const selected = focus === "mixed" ? [] : focusCategories(focus);
  const next = selected.includes(option) ? selected.filter(category => category !== option) : [...selected, option];
  return next.length ? normalizeFocus(next) : "mixed";
}
export function focusLabel(focus: Focus, compact = false): string {
  if (!Array.isArray(focus)) return LABELS[focus];
  const selected = focusCategories(focus);
  return compact && selected.length > 1 ? `${selected.length} skills selected` : selected.map(category => LABELS[category]).join(" + ");
}
export function sameFocus(a: Focus, b: Focus): boolean { return focusCategories(a).join(",") === focusCategories(b).join(","); }
export const LEVELS: Record<Level, string> = { 1: "Foundation", 2: "Standard", 3: "Advanced" };
export const MODES: Record<Mode, { name: string; time: number | null; target: number | null; detail: string; short: string }> = {
  sprint: { name: "Quick sprint", time: 120, target: null, detail: "Two minutes. As many correct answers as you can.", short: "2 min" },
  adaptive: { name: "Adaptive", time: 180, target: null, detail: "More reps on weaker skills. Difficulty adjusts every 5 questions.", short: "3 min" },
  challenge: { name: "80 in 8", time: 480, target: 80, detail: "80 questions. +1 correct, −1 incorrect, 0 for a skip.", short: "8 min" },
  practice: { name: "Free practice", time: null, target: 20, detail: "20 questions. No time limit, with a worked method after each mistake.", short: "Untimed" },
  review: { name: "Mistake retry", time: null, target: null, detail: "Take another shot at your missed questions.", short: "Untimed" },
};
function gcd(a: number, b: number): number { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a || 1; }
export function rational(n: number, d = 1): Rational {
  if (!Number.isSafeInteger(n) || !Number.isSafeInteger(d) || d === 0) throw new Error("Invalid rational");
  const divisor = gcd(n, d) * (d < 0 ? -1 : 1); return { n: n / divisor, d: d / divisor };
}
export function formatAnswer(a: Rational, style?: "decimal"): string {
  if (a.d === 1) return String(a.n);
  if (style === "decimal") {
    // Integer long division avoids binary floating-point display artifacts.
    const magnitude = Math.abs(a.n), whole = Math.floor(magnitude / a.d);
    let remainder = magnitude % a.d, digits = "";
    while (remainder && digits.length < 6) {
      remainder *= 10;
      digits += Math.floor(remainder / a.d);
      remainder %= a.d;
    }
    if (!remainder) return `${a.n < 0 ? "-" : ""}${whole}.${digits}`;
  }
  return `${a.n}/${a.d}`;
}
export function formatQuestionAnswer(question: Question): string { return formatAnswer(question.answer, question.answerFormat); }
/** Translate legacy display text without changing saved records or backup identities. */
export function questionExplanation(question: Question): string {
  if (!/\p{Script=Han}/u.test(question.explanation)) return question.explanation;
  const fallback = `The expected answer is ${formatQuestionAnswer(question)}. Open Learn to review a worked method for this skill.`;
  if (question.category !== "sequences") return fallback;
  const parts = question.expression.split(",").map(part => part.trim());
  if (parts.pop() !== "?" || parts.length < 5 || parts.some(part => !/^[-+]?\d+$/.test(part))) return fallback;
  const terms = parts.map(Number), last = terms.at(-1)!, next = question.answer.n / question.answer.d;
  const differences = terms.slice(1).map((term, index) => term - terms[index]);
  const families = question.sequenceFamily ? [question.sequenceFamily] : ["arithmetic", "geometric", "growing-difference", "alternating", "multiply-add", "interleaved"];
  for (const family of families) {
    const first = differences[0];
    if (family === "arithmetic" && differences.every(value => value === first) && next === last + first) {
      return `Add ${first} each time. Continue with the same difference: ${last} + ${first} = ${next}.`;
    }
    if (family === "geometric") {
      const ratio = terms[1] / terms[0];
      if (Number.isFinite(ratio) && terms.slice(1).every((term, index) => term === terms[index] * ratio) && next === last * ratio) return `Multiply each term by ${ratio}: ${last} × ${ratio} = ${next}.`;
    }
    if (family === "growing-difference") {
      const increase = differences[1] - first, step = differences.at(-1)! + increase;
      if (increase > 0 && differences.every((value, index) => value === first + index * increase) && next === last + step) return `Look at the differences: ${differences.join(", ")}. Each difference increases by ${increase}, so the next difference is ${step}. Therefore, ${last} + ${step} = ${next}.`;
    }
    if (family === "alternating") {
      const second = differences[1], step = differences[differences.length % 2];
      if (first !== second && differences.every((value, index) => value === differences[index % 2]) && next === last + step) return `Alternate between adding ${first} and adding ${second}. The last step added ${differences.at(-1)!}, so add ${step} next: ${last} + ${step} = ${next}.`;
    }
    if (family === "multiply-add") {
      const ratio = differences[1] / first, extra = terms[1] - terms[0] * ratio;
      if (Number.isFinite(ratio) && terms.slice(1).every((term, index) => term === terms[index] * ratio + extra) && next === last * ratio + extra) return `Multiply by ${ratio}, then add ${extra} each time. For example, ${terms[0]} × ${ratio} + ${extra} = ${terms[1]}. Apply the same rule: ${last} × ${ratio} + ${extra} = ${next}.`;
    }
    if (family === "interleaved" && terms.length === 6) {
      const oddStep = terms[2] - terms[0], evenStep = terms[3] - terms[1];
      if (terms[4] === terms[2] + oddStep && terms[5] === terms[3] + evenStep && next === terms[4] + oddStep) return `Separate the odd and even positions. Terms 1, 3 and 5 are ${terms[0]}, ${terms[2]} and ${terms[4]}, increasing by ${oddStep}. Terms 2, 4 and 6 increase by ${evenStep}. Term 7 continues the first group: ${terms[4]} + ${oddStep} = ${next}.`;
    }
  }
  return fallback;
}
export function isCurrentGeneration(session: Session): boolean { return session.generatorVersion === GENERATOR_VERSION; }
export function difficultyDescription(focus: Focus, level: Level): string {
  if (focus === "sequences") return ["Find the next term: constant additions or multiplications. Always four choices.", "Increasing differences and alternating steps. Always four choices.", "Multiply-then-add rules and interleaved sequences. Always four choices."][level - 1];
  if (Array.isArray(focus)) return `${focus.length} selected skills. ${["Build fluency with smaller numbers.", "Standard difficulty in each selected skill.", "Advanced difficulty in each selected skill."][level - 1]}`;
  if (focus === "decimals") return ["Decimals up to 29.9 × an integer from 3 to 15.", "Two decimal operands, such as 28.5 × 24.7.", "Larger operands and two decimal places."][level - 1];
  if (focus === "decimal_division") return ["A decimal ÷ a small integer.", "Decimal divisors, such as 84.24 ÷ 2.4.", "Larger dividends and answers to two decimal places."][level - 1];
  if (focus === "multiplication") return ["12–49 × 2–19: single-digit and smaller two-digit multipliers.", "Two-digit × two-digit, up to 99 × 99.", "Three-digit × two-digit, up to 999 × 99. For three-digit × three-digit, choose a learning stage in Free practice."][level - 1];
  if (focus === "addition") return ["Two-digit addition from 20 to 99, including carrying.", "Two- and three-digit numbers, up to 499 each.", "Larger numbers, up to 1,999 each."][level - 1];
  if (focus === "subtraction") return ["Two-digit subtraction from 20 to 99, including borrowing.", "Numbers up to 499, with regrouping.", "Numbers up to 1,999, including negative answers."][level - 1];
  if (focus === "division") return ["Exact division by 3–12, with quotients from 12 to 30.", "Two-digit divisors from 12 to 35.", "Divisors up to 99 and larger whole-number quotients."][level - 1];
  if (focus === "percentages") return ["Build percentages from 5%, 10%, 15%, 20%, 25% and 50%.", "More percentage steps, including 40% and 75%.", "Fractional percentages and percentages above 100%."][level - 1];
  if (focus === "fractions") return ["Add familiar fractions, including thirds, sixths and eighths.", "Mixed denominators, including eighths and tenths.", "Less familiar common denominators; exact answers."][level - 1];
  return ["Build fluency with smaller numbers.", "Larger integers, two-digit products and decimals.", "Three-digit products, decimals and harder division."][level - 1];
}
export function parseAnswer(raw: string): Rational | null {
  const input = raw.trim().replaceAll("−", "-");
  if (input.length > 40) return null;
  const fraction = input.match(/^([+-]?\d{1,9})\s*\/\s*([+-]?\d{1,9})$/);
  if (fraction) return Number(fraction[2]) === 0 ? null : rational(Number(fraction[1]), Number(fraction[2]));
  if (!/^[+-]?(?:\d{1,9}(?:\.\d{0,6})?|\.\d{1,6})$/.test(input)) return null;
  const places = input.split(".")[1]?.length ?? 0, denominator = 10 ** places;
  return rational(Math.round(Number(input) * denominator), denominator);
}
export function isCorrect(input: string, answer: Rational): boolean { const parsed = parseAnswer(input); return parsed !== null && parsed.n === answer.n && parsed.d === answer.d; }
/** Deterministic generation keeps questions reproducible in tests. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => { state = (state + 0x6d2b79f5) | 0; let t = Math.imul(state ^ (state >>> 15), 1 | state); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
type ChoiceRandom = (() => number) & { choose?: (size: number) => number };
function integer(random: ChoiceRandom, low: number, high: number) { return low + (random.choose ? random.choose(high - low + 1) : Math.floor(random() * (high - low + 1))); }
function pick<T>(random: () => number, items: readonly T[]): T { return items[integer(random, 0, items.length - 1)]; }
function decimalText(n: number, places: number): string {
  if (places === 0) return String(n);
  const text = String(n).padStart(places + 1, "0");
  return `${text.slice(0, -places)}.${text.slice(-places)}`;
}
/** Operands are scaled integers: 285 at one decimal place represents 28.5. */
export function decimalMultiplicationQuestion(a: number, aPlaces: number, b: number, bPlaces: number, level: Level, id: string): Question {
  const aScale = 10 ** aPlaces, bScale = 10 ** bPlaces;
  const aText = decimalText(a, aPlaces), bText = decimalText(b, bPlaces);
  const answer = rational(a * b, aScale * bScale);
  const rounded = Math.ceil(b / bScale), difference = rounded * bScale - b;
  const main = rational(a * rounded, aScale), correction = rational(a * difference, aScale * bScale);
  const method = difference
    ? `Round ${bText} up to ${rounded}: ${aText} × ${rounded} − ${aText} × ${formatAnswer(rational(difference, bScale), "decimal")} = ${formatAnswer(main, "decimal")} − ${formatAnswer(correction, "decimal")} = ${formatAnswer(answer, "decimal")}.`
    : `Multiply as integers: ${a} × ${b} = ${a * b}. Divide by ${aScale * bScale} to restore ${aPlaces + bPlaces} decimal place${aPlaces + bPlaces === 1 ? "" : "s"}: ${formatAnswer(answer, "decimal")}.`;
  return { id, category: "decimals", level, expression: `${aText} × ${bText}`, answer, answerFormat: "decimal", explanation: method };
}
/** Build terminating decimal division from scaled divisor and quotient integers. */
export function decimalDivisionQuestion(divisor: number, divisorPlaces: number, quotient: number, quotientPlaces: number, level: Level, id: string): Question {
  const divisorScale = 10 ** divisorPlaces, quotientScale = 10 ** quotientPlaces;
  const dividend = rational(divisor * quotient, divisorScale * quotientScale), answer = rational(quotient, quotientScale);
  const dividendText = formatAnswer(dividend, "decimal"), divisorText = decimalText(divisor, divisorPlaces), answerText = formatAnswer(answer, "decimal");
  const shifted = formatAnswer(rational(divisor * quotient, quotientScale), "decimal");
  const method = divisorPlaces ? `Multiply both numbers by ${divisorScale}: ${dividendText} ÷ ${divisorText} = ${shifted} ÷ ${divisor} = ${answerText}. Check: ${divisorText} × ${answerText} = ${dividendText}.`
    : `Use whole numbers first: ${divisor * quotient} ÷ ${divisor} = ${quotient}. Divide by ${quotientScale} to restore the decimal: ${answerText}. Check: ${divisorText} × ${answerText} = ${dividendText}.`;
  return { id, category: "decimal_division", level, expression: `${dividendText} ÷ ${divisorText}`, answer, answerFormat: "decimal", explanation: method };
}
function multiplicationQuestion(a: number, b: number, level: Level, id: string, useCompensation = true): Question {
  const rounded = Math.round(b / 100) * 100;
  let explanation: string;
  if (useCompensation && b >= 100 && Math.abs(rounded - b) <= 9 && rounded !== b) {
    const difference = Math.abs(rounded - b), sign = rounded > b ? "−" : "+";
    explanation = `Use ${b} = ${rounded} ${sign} ${difference}: ${a} × ${rounded} = ${a * rounded}; ${a} × ${difference} = ${a * difference}. Keep one running total: ${a * rounded} ${sign} ${a * difference} = ${a * b}.`;
  } else {
    const parts = b < 10 ? [Math.floor(a / 100) * 100, Math.floor(a % 100 / 10) * 10, a % 10] : [Math.floor(b / 100) * 100, Math.floor(b % 100 / 10) * 10, b % 10];
    const factor = b < 10 ? b : a, nonzero = parts.filter(Boolean);
    let subtotal = 0;
    explanation = `Split ${b < 10 ? a : b} into ${nonzero.join(" + ")}. ` + nonzero.map(part => {
      const product = factor * part, previous = subtotal; subtotal += product;
      return `${factor} × ${part} = ${product}. ${previous ? `Running total: ${previous} + ${product} = ${subtotal}.` : `Keep ${subtotal}.`}`;
    }).join(" ");
  }
  return { id, category: "multiplication", level, expression: `${a} × ${b}`, answer: rational(a * b), explanation };
}
function sequenceQuestion(level: Level, random: () => number, id: string): Question {
  const family = pick<SequenceFamily>(random, level === 1 ? ["arithmetic", "geometric"] : level === 2 ? ["growing-difference", "alternating"] : ["multiply-add", "interleaved"]);
  const terms: number[] = []; let explanation: string;
  if (family === "arithmetic") {
    const start = integer(random, 2, 80), difference = integer(random, 2, 18);
    for (let i = 0; i < 6; i++) terms.push(start + difference * i);
    explanation = `Add ${difference} each time. Continue with the same difference: ${terms[4]} + ${difference} = ${terms[5]}.`;
  } else if (family === "geometric") {
    const start = integer(random, 2, 12), ratio = integer(random, 2, 4);
    for (let i = 0; i < 6; i++) terms.push(start * ratio ** i);
    explanation = `Multiply each term by ${ratio}: ${terms[4]} × ${ratio} = ${terms[5]}.`;
  } else if (family === "growing-difference") {
    const start = integer(random, 2, 40), first = integer(random, 2, 12), increase = integer(random, 1, 6);
    terms.push(start);
    for (let i = 0; i < 5; i++) terms.push(terms.at(-1)! + first + i * increase);
    explanation = `Look at the differences: ${Array.from({ length: 4 }, (_, i) => first + i * increase).join(", ")}. Each difference increases by ${increase}, so the next difference is ${first + 4 * increase}. Therefore, ${terms[4]} + ${first + 4 * increase} = ${terms[5]}.`;
  } else if (family === "alternating") {
    const start = integer(random, 10, 80), first = integer(random, 2, 16), second = first + integer(random, 2, 9);
    terms.push(start);
    for (let i = 0; i < 6; i++) terms.push(terms.at(-1)! + (i % 2 ? second : first));
    explanation = `Alternate between adding ${first} and adding ${second}. The last step added ${first}, so add ${second} next: ${terms[5]} + ${second} = ${terms[6]}.`;
  } else if (family === "multiply-add") {
    const start = integer(random, 2, 12), ratio = integer(random, 2, 3), extra = integer(random, 1, 9);
    terms.push(start);
    for (let i = 0; i < 5; i++) terms.push(terms.at(-1)! * ratio + extra);
    explanation = `Multiply by ${ratio}, then add ${extra} each time. For example, ${terms[0]} × ${ratio} + ${extra} = ${terms[1]}. Apply the same rule: ${terms[4]} × ${ratio} + ${extra} = ${terms[5]}.`;
  } else {
    const odd = integer(random, 5, 60), even = integer(random, 100, 180), oddStep = integer(random, 2, 15), evenStep = oddStep + integer(random, 2, 8);
    for (let i = 0; i < 7; i++) terms.push(i % 2 ? even + Math.floor(i / 2) * evenStep : odd + Math.floor(i / 2) * oddStep);
    explanation = `Separate the odd and even positions. Terms 1, 3 and 5 are ${terms[0]}, ${terms[2]} and ${terms[4]}, increasing by ${oddStep}. Terms 2, 4 and 6 increase by ${evenStep}. Term 7 continues the first group: ${terms[4]} + ${oddStep} = ${terms[6]}.`;
  }
  return { id, category: "sequences", level, sequenceFamily: family, expression: `${terms.slice(0, -1).join(", ")}, ?`, answer: rational(terms.at(-1)!), explanation };
}
export function generateQuestion(category: Category, level: Level, random: () => number, id: string, stage?: MultiplicationStage): Question {
  if (category === "sequences") return sequenceQuestion(level, random, id);
  if (stage && category === "multiplication") {
    const a = integer(random, 100, 999);
    const b = stage === "triple-single" ? integer(random, 2, 9) : stage === "triple-double" ? integer(random, 12, 99)
      : stage === "triple-near-hundred" ? integer(random, 2, 9) * 100 + pick(random, [-9, -8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9]) : integer(random, 100, 999);
    return multiplicationQuestion(a, b, level, id, stage === "triple-near-hundred");
  }
  let expression: string, answer: Rational, explanation: string;
  const max = level === 1 ? 99 : level === 2 ? 499 : 1999;
  let a = 0, b = 0;
  if (category === "addition" || category === "subtraction") { a = integer(random, 20, max); b = integer(random, 20, max); }
  switch (category) {
    case "addition": {
      answer = rational(a + b); expression = `${a} + ${b}`; const rounded = Math.ceil(b / 10) * 10;
      explanation = `Round ${b} up to ${rounded}, then compensate: ${a} + ${rounded} − ${rounded - b} = ${a + b}.`; break;
    }
    case "subtraction": {
      if (level < 3 && a < b) [a, b] = [b, a];
      answer = rational(a - b); expression = `${a} − ${b}`; const rounded = Math.ceil(b / 10) * 10;
      explanation = `Subtract ${rounded}, then add back ${rounded - b}: ${a} − ${rounded} + ${rounded - b} = ${a - b}.`; break;
    }
    case "multiplication": {
      a = integer(random, level === 3 ? 100 : 12, level === 1 ? 49 : level === 2 ? 99 : 999);
      b = integer(random, level === 1 ? 2 : 12, level === 1 ? 19 : 99);
      return multiplicationQuestion(a, b, level, id);
    }
    case "division": {
      b = integer(random, level === 1 ? 3 : 12, level === 1 ? 12 : level === 2 ? 35 : 99); const quotient = integer(random, 12, level === 1 ? 30 : level === 2 ? 60 : 150);
      a = b * quotient; answer = rational(quotient); expression = `${a} ÷ ${b}`;
      explanation = `Reverse the multiplication: ${b} × ${quotient} = ${a}, so ${a} ÷ ${b} = ${quotient}.`; break;
    }
    case "percentages": {
      const percent = pick(random, level === 1 ? [5, 10, 15, 20, 25, 50] : level === 2 ? [5, 10, 15, 20, 25, 40, 75] : [2.5, 7.5, 12.5, 17.5, 35, 65, 125]);
      a = integer(random, 2, level === 1 ? 40 : 50) * 10;
      expression = `${percent}% of ${a}`; answer = rational(percent * 10 * a, 1000); const ratio = rational(percent * 10, 1000);
      explanation = `${percent}% = ${formatAnswer(ratio)}. Calculate (${a} × ${ratio.n}) ÷ ${ratio.d} = ${formatAnswer(answer)}.`; break;
    }
    case "fractions": {
      const d1 = pick(random, level === 1 ? [2, 3, 4, 5, 6, 8] : level === 2 ? [2, 4, 5, 8, 10] : [3, 4, 6, 8, 12]);
      const d2 = pick(random, level < 3 ? [2, 4, 5, 8] : [3, 5, 6, 12]);
      const n1 = integer(random, 1, d1 - 1), n2 = integer(random, 1, d2 - 1), common = d1 * d2 / gcd(d1, d2);
      expression = `${n1}/${d1} + ${n2}/${d2}`; answer = rational(n1 * d2 + n2 * d1, d1 * d2);
      explanation = `Use denominator ${common}: ${n1 * (common / d1)}/${common} + ${n2 * (common / d2)}/${common} = ${formatAnswer(answer)}. Give an exact fraction or exact decimal.`; break;
    }
    case "decimals": {
      a = integer(random, level === 1 ? 5 : 10, level === 1 ? 29 : level === 2 ? 99 : 199) * 10 + integer(random, 1, 9);
      if (level === 1) return decimalMultiplicationQuestion(a, 1, integer(random, 3, 15), 0, level, id);
      if (level === 2) {
        b = integer(random, 10, 49) * 10 + integer(random, 1, 9);
        return decimalMultiplicationQuestion(a, 1, b, 1, level, id);
      }
      b = integer(random, 1, 29) * 100 + integer(random, 0, 9) * 10 + integer(random, 1, 9);
      return decimalMultiplicationQuestion(a, 1, b, 2, level, id);
    }
    case "decimal_division": {
      if (level === 1) return decimalDivisionQuestion(integer(random, 3, 12), 0, integer(random, 5, 29) * 10 + integer(random, 1, 9), 1, level, id);
      const divisor = integer(random, 1, level === 2 ? 9 : 29) * 10 + integer(random, 1, 9);
      if (level === 2) return decimalDivisionQuestion(divisor, 1, integer(random, 10, 49) * 10 + integer(random, 1, 9), 1, level, id);
      const quotient = integer(random, 1, 99) * 100 + integer(random, 0, 9) * 10 + integer(random, 1, 9);
      return decimalDivisionQuestion(divisor, 1, quotient, 2, level, id);
    }
  }
  return { id, category, level, expression, answer, explanation };
}
export function categoryStats(attempts: Attempt[]) {
  return CATEGORIES.map(category => {
    const items = attempts.filter(x => x.question.category === category), correct = items.filter(x => x.correct);
    return { category, total: items.length, correct: correct.length, accuracy: items.length ? correct.length / items.length * 100 : null,
      avgMs: correct.length ? correct.reduce((n, a) => n + a.ms, 0) / correct.length : null };
  });
}
export function chooseCategory(focus: Focus, adaptive: boolean, history: Attempt[], random: () => number): Category {
  const allowed = focusCategories(focus);
  if (!allowed.length) throw new Error("Choose at least one skill.");
  if (allowed.length === 1) return allowed[0];
  if (!adaptive || history.length < 6) return pick(random, allowed);
  const weights = categoryStats(history.slice(-240)).filter(x => allowed.includes(x.category)).map(x => 1 + (x.total ? (1 - x.correct / x.total) * 3 : 1) + Math.min(2, (x.avgMs ?? 0) / 7000));
  let choice = random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < allowed.length; i++) { choice -= weights[i]; if (choice < 0) return allowed[i]; }
  return allowed[allowed.length - 1];
}
export function adaptLevel(current: Level, lastFive: Attempt[]): Level {
  if (lastFive.length < 5) return current;
  const correct = lastFive.filter(x => x.correct), mean = correct.length ? correct.reduce((s, a) => s + a.ms, 0) / correct.length : Infinity;
  if (correct.length === 5 && mean <= 6500) return Math.min(3, current + 1) as Level;
  if (correct.length <= 2) return Math.max(1, current - 1) as Level;
  return current;
}
/** Numeric operands, not IDs or answers: commuted products/sums and equivalent fraction spellings share a key. */
export function questionKey(question: Question): string {
  const match = question.expression.match(/^(.+?) (×|\+|−|÷) (.+)$/);
  if (!match) return question.expression.trim().replace(/\s+/g, " ");
  const operands = [match[1], match[3]].map(text => {
    const value = parseAnswer(text);
    return value ? `${value.n}/${value.d}` : text.trim();
  });
  if (match[2] === "×" || match[2] === "+") operands.sort();
  return `${match[2]}:${operands.join(":")}`;
}
/** Walk the generator's finite choice tree exactly; no large pool needs to be allocated. */
function* enumerateQuestions(category: Category, level: Level, id: string, stage?: MultiplicationStage): Generator<Question> {
  const choices: number[] = [];
  while (true) {
    const sizes: number[] = [];
    const random: ChoiceRandom = () => { throw new Error("Question choices must use integer()"); };
    random.choose = size => { const index = sizes.length; sizes.push(size); return choices[index] ?? 0; };
    const question = generateQuestion(category, level, random, id, stage);
    yield question;
    let index = sizes.length - 1;
    for (; index >= 0; index--) {
      choices[index] = (choices[index] ?? 0) + 1;
      if (choices[index] < sizes[index]) { choices.length = index + 1; break; }
      choices[index] = 0;
    }
    if (index < 0) return;
  }
}
function unseenQuestion(category: Category, level: Level, random: () => number, id: string, seen: Set<string>, stage?: MultiplicationStage): Question | null {
  for (let tries = 0; tries < 48; tries++) {
    const question = generateQuestion(category, level, random, id, stage);
    if (!seen.has(questionKey(question))) return question;
  }
  // Guaranteed fallback, even with a constant RNG or a nearly exhausted small pool.
  for (const question of enumerateQuestions(category, level, id, stage)) if (!seen.has(questionKey(question))) return question;
  return null;
}
export function normalizeConfig(config: Config): Config {
  const normalized = { ...config, focus: normalizeFocus(config.focus) };
  normalized.answerMode = normalized.focus === "sequences" || config.answerMode === "choice" ? "choice" : "input";
  if (normalized.mode !== "practice" || normalized.focus !== "multiplication" || !isMultiplicationStage(normalized.multiplicationStage)) delete normalized.multiplicationStage;
  if (normalized.multiplicationStage) normalized.level = normalized.multiplicationStage === "triple-single" ? 1 : normalized.multiplicationStage === "triple-double" ? 2 : 3;
  return normalized;
}
export function usesChoices(config: Config, question?: Question): boolean { return config.answerMode === "choice" || config.focus === "sequences" || question?.category === "sequences"; }
export function sameAnswerMode(a: Config, b: Config): boolean { return (a.answerMode ?? "input") === (b.answerMode ?? "input"); }
export function createRun(config: Config, id: string, seed: number, now: number, history: Attempt[], queue: Question[] = []): Run {
  const queued = new Set<string>();
  queue = queue.filter(question => { const key = questionKey(question); if (queued.has(key)) return false; queued.add(key); return true; });
  if (config.mode === "review" && queue.length === 0) throw new Error("No mistakes to retry");
  config = normalizeConfig(config);
  const random = seededRandom(seed), mode = MODES[config.mode], category = chooseCategory(config.focus, config.mode === "adaptive", history, random);
  const question = config.mode === "review" ? queue[0] : generateQuestion(category, config.level, random, `${id}:0`, config.multiplicationStage);
  return { id, config: { ...config }, seed, generatorVersion: GENERATOR_VERSION, startedAt: now, deadline: mode.time ? now + mode.time * 1000 : null,
    questionAt: now, question, seen: new Set([questionKey(question)]), exhausted: false,
    attempts: [], level: config.level, awaitingExplanation: false, random, history, queue, target: config.mode === "review" ? queue.length : mode.target };
}
export function expired(run: Run, now: number) { return run.deadline !== null && now >= run.deadline; }
/** Enforce the deadline on submission too, even when a background tab suspended the timer. */
export function advanceRun(run: Run, input: string, skipped: boolean, now: number): { run: Run; finished: boolean; expired: boolean } {
  if (expired(run, now)) return { run, finished: true, expired: true };
  if (run.awaitingExplanation) return { run, finished: false, expired: false };
  if (run.exhausted || (run.target !== null && run.attempts.length >= run.target)) return { run, finished: true, expired: false };
  if (!skipped && !parseAnswer(input)) throw new Error("Enter a number or a fraction, such as 3/4.");
  const attempt: Attempt = { question: run.question, input: skipped ? "" : input.trim(), correct: !skipped && isCorrect(input, run.question.answer), skipped, ms: Math.max(0, now - run.questionAt) };
  const attempts = [...run.attempts, attempt]; let level = run.level;
  if (run.config.mode === "adaptive" && attempts.length % 5 === 0) level = adaptLevel(level, attempts.slice(-5));
  let finished = run.target !== null && attempts.length >= run.target, exhausted = false;
  let question = run.question;
  const seen = new Set(run.seen);
  if (!finished) {
    if (run.config.mode === "review") question = run.queue[attempts.length];
    else {
      const category = chooseCategory(run.config.focus, run.config.mode === "adaptive", [...run.history, ...attempts], run.random);
      const allowed = [category, ...focusCategories(run.config.focus).filter(item => item !== category)];
      let next: Question | null = null;
      for (const candidate of allowed) {
        next = unseenQuestion(candidate, level, run.random, `${run.id}:${attempts.length}`, seen, run.config.multiplicationStage);
        if (next) break;
      }
      if (next) question = next;
      else { exhausted = true; finished = true; }
    }
    if (!exhausted) seen.add(questionKey(question));
  }
  const awaitingExplanation = run.deadline === null && !attempt.correct;
  return { run: { ...run, attempts, question, questionAt: now, level, awaitingExplanation, seen, exhausted }, finished: finished && !awaitingExplanation, expired: false };
}
export function continueAfterExplanation(run: Run, now: number): { run: Run; finished: boolean } {
  if (!run.awaitingExplanation) return { run, finished: false };
  // Reading a method belongs to session duration, but not to the next answer's response time.
  return { run: { ...run, awaitingExplanation: false, questionAt: now }, finished: run.exhausted || (run.target !== null && run.attempts.length >= run.target) };
}
export function finishRun(run: Run, now: number, reason: Session["reason"]): Session {
  const endedAt = Math.max(run.startedAt, Math.min(now, run.deadline ?? now));
  return { id: run.id, config: run.config, seed: run.seed, generatorVersion: run.generatorVersion, startedAt: run.startedAt, endedAt, elapsedMs: endedAt - run.startedAt, reason: run.exhausted ? "exhausted" : reason, attempts: run.attempts };
}
export function summarize(session: Pick<Session, "attempts" | "elapsedMs" | "config">) {
  const correct = session.attempts.filter(x => x.correct), skipped = session.attempts.filter(x => x.skipped).length, wrong = session.attempts.length - correct.length - skipped;
  return { correct: correct.length, wrong, skipped, total: session.attempts.length,
    score: correct.length - (session.config.mode === "challenge" ? wrong : 0), accuracy: session.attempts.length ? correct.length / session.attempts.length * 100 : 0,
    cpm: session.elapsedMs >= 1000 ? correct.length * 60000 / session.elapsedMs : 0,
    avgMs: correct.length ? correct.reduce((s, a) => s + a.ms, 0) / correct.length : null };
}
export function unresolvedMistakes(sessions: Session[]): Attempt[] {
  const pending = new Map<string, Attempt>();
  for (const session of [...sessions].sort((a, b) => a.startedAt - b.startedAt)) for (const a of session.attempts) {
    const key = questionKey(a.question);
    if (a.correct) pending.delete(key); else pending.set(key, a);
  }
  return [...pending.values()].reverse();
}
export function formatTime(ms: number) { const seconds = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`; }
