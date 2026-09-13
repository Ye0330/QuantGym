import { formatAnswer, parseAnswer, rational, seededRandom, type Question, type Rational } from "./quant-engine.ts";

/** Stable, shuffled options without consuming the session's question RNG. */
export function answerChoices(answer: Rational, identity: string, style?: "decimal", suggestions: Rational[] = []): string[] {
  let seed = 2166136261;
  for (const character of identity) seed = Math.imul(seed ^ character.charCodeAt(0), 16777619);
  const random = seededRandom(seed), correct = rational(answer.n, answer.d), values = [correct];
  const seen = new Set([`${correct.n}/${correct.d}`]);
  const add = (candidate: Rational) => {
    const reduced = rational(candidate.n, candidate.d), key = `${reduced.n}/${reduced.d}`;
    if (correct.d === 1 && reduced.d !== 1) return;
    if (!seen.has(key) && parseAnswer(formatAnswer(reduced, style))) { seen.add(key); values.push(reduced); }
  };
  const unit = correct.d === 1 ? Math.max(1, 10 ** Math.max(0, Math.floor(Math.log10(Math.max(1, Math.abs(correct.n)))) - 1)) : 1;
  for (const suggestion of suggestions) { if (values.length === 4) break; add(suggestion); }
  const candidates = [
    rational(correct.n + unit * correct.d, correct.d), rational(correct.n - unit * correct.d, correct.d),
    rational(correct.n + 1, correct.d), rational(correct.n - 1, correct.d),
    rational(correct.n * 10, correct.d), rational(correct.n, correct.d * 10),
    rational(correct.n + 2 * unit * correct.d, correct.d), rational(correct.n - 2 * unit * correct.d, correct.d)];
  // Vary distractors as well as answer placement; exact rational identity forbids equivalent duplicates.
  for (let i = candidates.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [candidates[i], candidates[j]] = [candidates[j], candidates[i]]; }
  for (const candidate of candidates) { if (values.length === 4) break; add(candidate); }
  for (let offset = 1; values.length < 4; offset++) add(rational(correct.n + offset * correct.d, correct.d));
  for (let i = values.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [values[i], values[j]] = [values[j], values[i]]; }
  return values.map(value => formatAnswer(value, style));
}

export function questionChoices(question: Question): string[] {
  const terms = question.category === "sequences" ? question.expression.split(", ").slice(0, -1).map(Number) : [];
  const last = terms.at(-1), previous = terms.at(-2), before = terms.at(-3), answer = question.answer.n / question.answer.d;
  let candidates: number[] = [];
  if (last !== undefined && previous !== undefined && before !== undefined) {
    const difference = last - previous;
    switch (question.sequenceFamily) {
      case "arithmetic": candidates = [last + difference * 2, answer - 1, answer + 1]; break;
      case "geometric": { const ratio = last / previous; candidates = [last + ratio, last + difference, last * ratio ** 2]; break; }
      case "growing-difference": { const increase = difference - (previous - before); candidates = [last + difference, last + difference + 2 * increase, last + increase]; break; }
      case "alternating": candidates = [last + difference, answer - 1, answer + 1]; break;
      case "multiply-add": { const ratio = difference / (previous - before), extra = last - ratio * previous; candidates = [ratio * last, ratio * last - extra, ratio * (last + extra)]; break; }
      case "interleaved": { const evenStep = terms[3] - terms[1]; candidates = [terms[4], terms[4] + evenStep, terms[5] + evenStep]; break; }
    }
  }
  const suggestions = candidates.filter(Number.isSafeInteger).map(n => rational(n));
  return answerChoices(question.answer, `${question.id}:${question.expression}`, question.answerFormat, suggestions);
}
