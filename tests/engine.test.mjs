import test from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORIES, GENERATOR_VERSION, rational, formatAnswer, formatQuestionAnswer, decimalMultiplicationQuestion, decimalDivisionQuestion, isCurrentGeneration, parseAnswer, isCorrect, seededRandom, generateQuestion, createRun, advanceRun, continueAfterExplanation, finishRun, summarize, adaptLevel, chooseCategory, unresolvedMistakes } from '../lib/quant-engine.ts';
import { sessionSchema } from '../lib/session-validation.ts';
import { focusCategories, focusLabel, isValidFocus, normalizeFocus, sameFocus, toggleFocus, questionKey, normalizeConfig, MULTIPLICATION_STAGES, usesChoices, sameAnswerMode } from '../lib/quant-engine.ts';
import { answerChoices, questionChoices } from '../lib/answer-choices.ts';
import { LESSONS } from '../lib/quant-lessons.ts';
import { advanceLearningStep, answerLearningStep, createLearningRound, hintLearningStep, revealLearningStep } from '../lib/learning-round.ts';

function referenceValue(expression, sequenceFamily) {
  if (sequenceFamily) {
    const terms = expression.split(', ').slice(0, -1).map(Number), last = terms.at(-1);
    const differences = terms.slice(1).map((n, i) => n - terms[i]);
    if (sequenceFamily === 'arithmetic') { assert.ok(differences.every(d => d === differences[0])); return last + differences[0]; }
    if (sequenceFamily === 'geometric') { const ratio = terms[1] / terms[0]; assert.ok(terms.slice(1).every((n, i) => n / terms[i] === ratio)); return last * ratio; }
    if (sequenceFamily === 'growing-difference') { const step = differences[1] - differences[0]; assert.ok(step > 0); assert.ok(differences.every((d, i) => d === differences[0] + step * i)); return last + differences.at(-1) + step; }
    if (sequenceFamily === 'alternating') { assert.notEqual(differences[0], differences[1]); assert.ok(differences.every((d, i) => d === differences[i % 2])); return last + differences[differences.length % 2]; }
    if (sequenceFamily === 'multiply-add') { const ratio = differences[1] / differences[0], extra = terms[1] - terms[0] * ratio; assert.ok(extra > 0); assert.ok(terms.slice(1).every((n, i) => n === terms[i] * ratio + extra)); return last * ratio + extra; }
    const odd = terms.filter((_, i) => i % 2 === 0), even = terms.filter((_, i) => i % 2 === 1), oddStep = odd[1] - odd[0], evenStep = even[1] - even[0];
    assert.notEqual(oddStep, evenStep);
    assert.ok(odd.every((n, i) => n === odd[0] + oddStep * i)); assert.ok(even.every((n, i) => n === even[0] + evenStep * i));
    return odd.at(-1) + oddStep;
  }
  const percent = expression.match(/^([\d.]+)% of (\d+)$/);
  if (percent) return Number(percent[1]) * Number(percent[2]) / 100;
  const sumOfFractions = expression.match(/^(\d+)\/(\d+) \+ (\d+)\/(\d+)$/);
  if (sumOfFractions) { const [, a, b, c, d] = sumOfFractions.map(Number); return a / b + c / d; }
  const arithmetic = expression.match(/^(\d+(?:\.\d+)?) ([+−×÷]) (\d+(?:\.\d+)?)$/);
  assert.ok(arithmetic, expression);
  const [, a, operator, b] = arithmetic;
  return operator === '+' ? +a + +b : operator === '−' ? a - b : operator === '×' ? a * b : a / b;
}
for (const category of CATEGORIES) for (const level of [1, 2, 3]) {
  test(`${category}, level ${level}: generated answers match independently evaluated expressions`, () => {
    const random = seededRandom(197);
    for (let i = 0; i < 150; i++) {
      const question = generateQuestion(category, level, random, String(i));
      assert.ok(Math.abs(question.answer.n / question.answer.d - referenceValue(question.expression, question.sequenceFamily)) < 1e-10, question.expression);
      assert.ok(isCorrect(formatAnswer(question.answer), question.answer));
      assert.ok(Number.isSafeInteger(question.answer.n));
      assert.ok(question.answer.d > 0);
    }
  });
}
test('accepts exact decimals, negative answers and equivalent fractions', () => {
  for (const input of ['.75', '0.750000', '3/4', '6/8', ' 9 / 12 ', '-3/-4']) assert.ok(isCorrect(input, rational(3, 4)), input);
  assert.ok(isCorrect('−2.5', rational(-5, 2)));
  assert.ok(isCorrect('-0', rational(0)));
  assert.ok(!isCorrect('0.333333', rational(1, 3)));
  for (const input of ['', ' ', '.', '--2', '1/0', 'NaN', 'Infinity', '1e3', '2+2', '1,2', '3/4/5', '<script>']) assert.equal(parseAnswer(input), null, input);
});
test('a seeded sequence is reproducible', () => {
  const a = seededRandom(42), b = seededRandom(42);
  assert.deepEqual(Array.from({ length: 50 }, () => a()), Array.from({ length: 50 }, () => b()));
});
const config = { mode: 'practice', focus: 'mixed', level: 2 };
const id = '090352fe-7ab5-4a17-af16-2d6439ec85c5';
const startAt = 1_800_000_000_000;
test('free practice completes at exactly 20 and produces a valid stored session', () => {
  let run = createRun(config, id, 42, startAt, []), finished = false;
  for (let i = 1; i <= 20; i++) {
    const step = advanceRun(run, formatAnswer(run.question.answer), false, startAt + i * 2000);
    run = step.run; finished = step.finished;
    assert.equal(finished, i === 20);
  }
  const session = finishRun(run, startAt + 40000, 'complete');
  assert.equal(summarize(session).accuracy, 100);
  assert.equal(summarize(session).cpm, 30);
  assert.equal(summarize(session).avgMs, 2000);
  assert.ok(sessionSchema.safeParse(session).success);
});
test('an answer at or past a deadline cannot be counted, including background-tab expiry', () => {
  const run = createRun({ ...config, mode: 'sprint' }, id, 0, startAt, []);
  for (const offset of [120000, 180000]) {
    const step = advanceRun(run, formatAnswer(run.question.answer), false, startAt + offset);
    assert.equal(step.finished, true); assert.equal(step.expired, true); assert.equal(step.run.attempts.length, 0);
    assert.equal(finishRun(step.run, startAt + offset, 'time').elapsedMs, 120000);
  }
  assert.equal(advanceRun(run, formatAnswer(run.question.answer), false, startAt + 119999).run.attempts.length, 1);
});
test('80 in 8 stops at 80, with separate wrong and skipped scoring', () => {
  let run = createRun({ ...config, mode: 'challenge' }, id, 65, startAt, []);
  for (let i = 1; i <= 80; i++) {
    const skip = i > 60, input = i <= 40 ? formatAnswer(run.question.answer) : '999999999';
    const step = advanceRun(run, input, skip, startAt + i * 2000); run = step.run;
    assert.equal(step.finished, i === 80);
  }
  const s = finishRun(run, startAt + 160000, 'complete'), stats = summarize(s);
  assert.equal(stats.correct, 40); assert.equal(stats.wrong, 20); assert.equal(stats.skipped, 20); assert.equal(stats.score, 20); assert.equal(stats.accuracy, 50);
  assert.ok(sessionSchema.safeParse(s).success);
});
test('invalid input leaves the current question unattempted', () => {
  const run = createRun(config, id, 1, startAt, []);
  assert.throws(() => advanceRun(run, '1/0', false, startAt + 100));
  assert.equal(run.attempts.length, 0);
});
test('adaptive difficulty respects evidence and level boundaries', () => {
  const good = Array.from({ length: 5 }, () => ({ correct: true, ms: 2000 }));
  const poor = Array.from({ length: 5 }, () => ({ correct: false, ms: 2000 }));
  assert.equal(adaptLevel(2, good), 3); assert.equal(adaptLevel(3, good), 3);
  assert.equal(adaptLevel(2, poor), 1); assert.equal(adaptLevel(1, poor), 1);
  assert.equal(adaptLevel(2, good.slice(0, 4)), 2);
  assert.equal(adaptLevel(2, good.map(a => ({ ...a, ms: 10000 }))), 2);
});
test('adaptive sampling allocates more questions to a weaker skill while preserving variety', () => {
  const history = CATEGORIES.flatMap(category => Array.from({ length: 20 }, (_, i) => ({ question: generateQuestion(category, 2, seededRandom(i), String(i)), correct: category !== 'division', skipped: false, input: '0', ms: 2500 })));
  const random = seededRandom(87), counts = Object.fromEntries(CATEGORIES.map(c => [c, 0]));
  for (let i = 0; i < 6000; i++) counts[chooseCategory('mixed', true, history, random)]++;
  assert.ok(counts.division > counts.addition * 2);
  assert.ok(Object.values(counts).every(n => n > 100));
  assert.equal(chooseCategory('fractions', true, history, random), 'fractions');
});
test('retrying a question correctly clears the original mistake; empty queues cannot start', () => {
  const q = generateQuestion('multiplication', 2, seededRandom(1), 'original');
  const bad = { question: q, input: '99999', correct: false, skipped: false, ms: 1000 };
  const original = { id, config, startedAt: startAt, endedAt: startAt + 1000, elapsedMs: 1000, reason: 'ended', seed: 1, attempts: [bad] };
  assert.equal(unresolvedMistakes([original]).length, 1);
  const run = createRun({ ...config, mode: 'review' }, 'retry', 1, startAt + 2000, [bad], [q]);
  const step = advanceRun(run, formatAnswer(q.answer), false, startAt + 3000);
  assert.equal(step.finished, true);
  const review = finishRun(step.run, startAt + 3000, 'complete');
  assert.equal(unresolvedMistakes([review, original]).length, 0);
  assert.throws(() => createRun({ ...config, mode: 'review' }, 'retry', 1, startAt, [], []));
});
test('storage validation rejects inconsistent duration and attempt counts', () => {
  let run = createRun(config, id, 1, startAt, []);
  run = advanceRun(run, formatAnswer(run.question.answer), false, startAt + 1000).run;
  const session = finishRun(run, startAt + 1000, 'ended');
  assert.ok(sessionSchema.safeParse(session).success);
  assert.equal(sessionSchema.safeParse({ ...session, elapsedMs: 500 }).success, false);
  assert.equal(sessionSchema.safeParse({ ...session, attempts: Array.from({ length: 21 }, () => session.attempts[0]) }).success, false);
});

test('the reference image is graded and explained exactly: 28.5 × 24.7 = 703.95', () => {
  const q = decimalMultiplicationQuestion(285, 1, 247, 1, 2, 'reference-image');
  assert.equal(q.expression, '28.5 × 24.7');
  assert.equal(formatQuestionAnswer(q), '703.95');
  for (const input of ['703.95', '703.950000', '70395/100', '14079/20']) assert.ok(isCorrect(input, q.answer), input);
  assert.equal(isCorrect('703.9', q.answer), false);
  assert.equal(isCorrect('704', q.answer), false);
  assert.match(q.explanation, /712\.5 − 8\.55 = 703\.95/);
});
test('integer multiplication meets the new digit ranges throughout generated sets', () => {
  for (const level of [2, 3]) {
    const random = seededRandom(751);
    for (let i = 0; i < 200; i++) {
      const q = generateQuestion('multiplication', level, random, String(i));
      const [a, b] = q.expression.split(' × ').map(Number);
      assert.ok(a >= (level === 2 ? 12 : 100) && a <= (level === 2 ? 99 : 999));
      assert.ok(b >= 12 && b <= 99);
    }
  }
});
test('decimal difficulty produces noninteger factors with exact, round-trippable answers', () => {
  for (const level of [1, 2, 3]) {
    const random = seededRandom(915);
    for (let i = 0; i < 200; i++) {
      const q = generateQuestion('decimals', level, random, String(i));
      const [a, b] = q.expression.split(' × ');
      assert.match(a, /^\d+\.\d$/);
      assert.match(b, level === 1 ? /^\d+$/ : level === 2 ? /^\d+\.\d$/ : /^\d+\.\d{2}$/);
      const expectedPlaces = (a.split('.')[1]?.length ?? 0) + (b.split('.')[1]?.length ?? 0);
      const numerator = BigInt(a.replace('.', '')) * BigInt(b.replace('.', ''));
      assert.equal(BigInt(q.answer.n) * 10n ** BigInt(expectedPlaces), numerator * BigInt(q.answer.d));
      assert.ok(isCorrect(formatQuestionAnswer(q), q.answer));
      assert.ok(!formatQuestionAnswer(q).includes('/'));
    }
  }
  assert.equal(formatAnswer(rational(1, 3), 'decimal'), '1/3');
  assert.equal(formatAnswer(rational(-1, 8), 'decimal'), '-0.125');
  assert.equal(formatAnswer(rational(3, 4)), '3/4');
});
test('decimal sessions persist their answer format and difficulty version; old records still validate', () => {
  let run = createRun({ ...config, focus: 'decimals' }, id, 37, startAt, []);
  run = advanceRun(run, formatQuestionAnswer(run.question), false, startAt + 1000).run;
  const session = finishRun(run, startAt + 1000, 'ended');
  const parsed = sessionSchema.parse(session);
  assert.equal(parsed.generatorVersion, GENERATOR_VERSION);
  assert.equal(parsed.attempts[0].question.answerFormat, 'decimal');
  assert.ok(isCurrentGeneration(session));
  const old = { ...session, generatorVersion: undefined };
  assert.ok(sessionSchema.safeParse(old).success);
  assert.equal(isCurrentGeneration(old), false);
});

test('decimal division has exact terminating answers and a correct decimal-shift method', () => {
  const example = decimalDivisionQuestion(24, 1, 351, 1, 2, 'decimal-division');
  assert.equal(example.expression, '84.24 ÷ 2.4');
  assert.equal(formatQuestionAnswer(example), '35.1');
  assert.match(example.explanation, /842\.4 ÷ 24 = 35\.1/);
  assert.ok(isCorrect('351/10', example.answer));
  for (const level of [1, 2, 3]) {
    const random = seededRandom(506);
    for (let i = 0; i < 200; i++) {
      const q = generateQuestion('decimal_division', level, random, String(i));
      const [a, b] = q.expression.split(' ÷ ');
      const aPlaces = a.split('.')[1]?.length ?? 0, bPlaces = b.split('.')[1]?.length ?? 0;
      const aInt = BigInt(a.replace('.', '')), bInt = BigInt(b.replace('.', ''));
      assert.equal(BigInt(q.answer.n) * bInt * 10n ** BigInt(aPlaces), BigInt(q.answer.d) * aInt * 10n ** BigInt(bPlaces));
      assert.match(formatQuestionAnswer(q), level === 3 ? /^\d+\.\d{2}$/ : /^\d+\.\d$/);
      assert.ok(isCorrect(formatQuestionAnswer(q), q.answer));
      assert.match(b, level === 1 ? /^\d+$/ : /^\d+\.\d$/);
      if (level === 1) assert.ok(+b >= 3 && +b <= 12);
    }
    let run = createRun({ ...config, focus: 'decimal_division', level }, id, 506, startAt, []);
    run = advanceRun(run, formatQuestionAnswer(run.question), false, startAt + 1000).run;
    assert.ok(sessionSchema.safeParse(finishRun(run, startAt + 1000, 'ended')).success);
  }
});

test('untimed mistakes pause for explanations without counting reading time in the next response', () => {
  const initial = createRun(config, id, 18, startAt, []);
  const mistake = advanceRun(initial, '999999999', false, startAt + 3000);
  assert.equal(mistake.run.awaitingExplanation, true);
  assert.equal(mistake.finished, false);
  assert.equal(mistake.run.attempts.length, 1);
  const duplicate = advanceRun(mistake.run, '0', false, startAt + 4000);
  assert.equal(duplicate.run, mistake.run);
  const continued = continueAfterExplanation(mistake.run, startAt + 63000);
  assert.equal(continued.finished, false);
  assert.equal(continued.run.awaitingExplanation, false);
  const correct = advanceRun(continued.run, formatQuestionAnswer(continued.run.question), false, startAt + 66000);
  const session = finishRun(correct.run, startAt + 66000, 'ended');
  assert.equal(session.elapsedMs, 66000);
  assert.deepEqual(session.attempts.map(a => a.ms), [3000, 3000]);
  assert.equal(summarize(session).avgMs, 3000);
  assert.ok(sessionSchema.safeParse(session).success);
});

test('the final practice mistake and a skipped review question show methods before results', () => {
  let run = createRun(config, id, 19, startAt, []);
  for (let i = 1; i < 20; i++) run = advanceRun(run, formatQuestionAnswer(run.question), false, startAt + i * 1000).run;
  const last = advanceRun(run, '999999999', false, startAt + 20000);
  assert.equal(last.run.attempts.length, 20);
  assert.equal(last.finished, false);
  assert.equal(last.run.awaitingExplanation, true);
  const complete = continueAfterExplanation(last.run, startAt + 50000);
  assert.equal(complete.finished, true);
  assert.ok(sessionSchema.safeParse(finishRun(complete.run, startAt + 50000, 'complete')).success);
  const review = createRun({ ...config, mode: 'review' }, id, 20, startAt, [], [run.question]);
  const skipped = advanceRun(review, '', true, startAt + 1000);
  assert.equal(skipped.finished, false);
  assert.equal(skipped.run.awaitingExplanation, true);
  assert.equal(skipped.run.attempts[0].skipped, true);
  assert.equal(continueAfterExplanation(skipped.run, startAt + 8000).finished, true);
});

test('timed modes advance immediately after mistakes and keep their original deadline', () => {
  for (const mode of ['sprint', 'adaptive', 'challenge']) {
    const run = createRun({ ...config, mode }, id, 21, startAt, []);
    const wrong = advanceRun(run, '999999999', false, startAt + 1000);
    assert.equal(wrong.run.awaitingExplanation, false);
    assert.equal(wrong.run.deadline, run.deadline);
    const continued = continueAfterExplanation(wrong.run, startAt + 61000);
    assert.equal(continued.run, wrong.run);
    assert.equal(continued.run.questionAt, startAt + 1000);
  }
});

test('Mixed is exclusive with individual choices and the final deselection restores Mixed', () => {
  let focus = toggleFocus('mixed', 'multiplication');
  assert.equal(focus, 'multiplication');
  focus = toggleFocus(focus, 'decimals');
  assert.deepEqual(focusCategories(focus), ['multiplication', 'decimals']);
  focus = toggleFocus(focus, 'multiplication');
  assert.equal(focus, 'decimals');
  focus = toggleFocus(focus, 'decimal_division');
  assert.deepEqual(focusCategories(focus), ['decimals', 'decimal_division']);
  assert.equal(toggleFocus(focus, 'mixed'), 'mixed');
  assert.equal(toggleFocus('decimals', 'decimals'), 'mixed');
  assert.equal(toggleFocus('mixed', 'mixed'), 'mixed');
  let all = 'mixed';
  for (const category of CATEGORIES) all = toggleFocus(all, category);
  assert.ok(Array.isArray(all));
  assert.equal(all.includes('mixed'), false);
  assert.ok(sameFocus(all, 'mixed'));
});

test('custom focus sampling stays in the selection even when another skill is much weaker', () => {
  const focus = ['multiplication', 'decimals'];
  const history = Array.from({ length: 100 }, (_, i) => ({ question: generateQuestion('division', 2, seededRandom(i), String(i)), correct: false, skipped: false, input: '0', ms: 12000 }));
  for (const adaptive of [false, true]) {
    const random = seededRandom(107), seen = new Set();
    for (let i = 0; i < 800; i++) {
      const category = chooseCategory(focus, adaptive, history, random);
      assert.ok(focus.includes(category));
      seen.add(category);
    }
    assert.equal(seen.size, 2);
  }
  let run = createRun({ ...config, focus }, id, 57, startAt, history);
  focus.push('addition');
  for (let i = 1; i <= 20; i++) {
    assert.ok(['multiplication', 'decimals'].includes(run.question.category));
    run = advanceRun(run, formatQuestionAnswer(run.question), false, startAt + i * 1000).run;
  }
  const saved = sessionSchema.parse(finishRun(run, startAt + 20000, 'complete'));
  assert.deepEqual(saved.config.focus, ['multiplication', 'decimals']);
});

test('focus normalization preserves legacy settings and compares sets without order dependence', () => {
  assert.equal(normalizeFocus(['decimals']), 'decimals');
  assert.deepEqual(normalizeFocus(['decimals', 'addition']), ['addition', 'decimals']);
  assert.ok(sameFocus(['decimals', 'addition'], ['addition', 'decimals']));
  assert.ok(sameFocus('addition', ['addition']));
  assert.equal(sameFocus('addition', ['addition', 'decimals']), false);
  assert.equal(focusLabel(['addition', 'decimals']), 'Addition + Decimal multiplication');
  assert.equal(focusLabel(['addition', 'decimals'], true), '2 skills selected');
  const run = advanceRun(createRun(config, id, 8, startAt, []), '999999999', false, startAt + 1000).run;
  const saved = finishRun(run, startAt + 1000, 'ended');
  for (const focus of ['mixed', 'multiplication', ['multiplication', 'decimals']]) {
    assert.ok(isValidFocus(focus));
    assert.ok(sessionSchema.safeParse({ ...saved, config: { ...config, focus } }).success);
  }
  for (const focus of [[], ['mixed', 'multiplication'], ['addition', 'addition'], ['unknown'], null, 2, {}]) {
    assert.equal(isValidFocus(focus), false);
    assert.equal(sessionSchema.safeParse({ ...saved, config: { ...config, focus } }).success, false);
  }
});

function evaluateLessonCalculation(expression) {
  const percent = expression.match(/^(\d+(?:\.\d+)?)% of (\d+(?:\.\d+)?)$/);
  if (percent) return Number(percent[1]) / 100 * Number(percent[2]);
  const arithmetic = expression.replaceAll('×', '*').replaceAll('÷', '/').replaceAll('−', '-');
  // Only trusted, checked-in numeric lesson expressions are evaluated by this test.
  assert.match(arithmetic, /^[\d\s.+*/()-]+$/);
  return Function(`"use strict"; return (${arithmetic});`)();
}
test('every lesson, worked step and independent exercise is mathematically correct', () => {
  assert.equal(new Set(LESSONS.map(lesson => lesson.id)).size, LESSONS.length);
  assert.deepEqual(new Set(LESSONS.map(lesson => lesson.category)), new Set(CATEGORIES.filter(category => category !== 'sequences')));
  for (const lesson of LESSONS) {
    assert.equal(lesson.drills.length, 3);
    for (const problem of [lesson.example, lesson.guided, ...lesson.drills, ...lesson.example.steps.map(step => ({ expression: step.calculation, answer: step.answer })), ...lesson.guided.steps.map(step => ({ expression: step.calculation, answer: step.answer }))]) {
      const answer = parseAnswer(problem.answer);
      assert.ok(answer, `${lesson.id}: ${problem.answer}`);
      assert.ok(Math.abs(evaluateLessonCalculation(problem.expression) - answer.n / answer.d) < 1e-9, `${lesson.id}: ${problem.expression} = ${problem.answer}`);
    }
  }
});

test('guided learning accepts exact answers and never consumes a blank, wrong or repeated submission', () => {
  const initial = createLearningRound();
  assert.throws(() => answerLearningStep(initial, '', '703.95'));
  const wrong = answerLearningStep(initial, '703.9', '703.95');
  assert.equal(wrong.index, 0);
  assert.equal(wrong.feedback, 'incorrect');
  assert.equal(advanceLearningStep(wrong, 3), wrong);
  const correct = answerLearningStep(wrong, '14079/20', '703.95');
  assert.equal(correct.feedback, 'correct');
  assert.equal(answerLearningStep(correct, '703.95', '703.95'), correct);
  const next = advanceLearningStep(correct, 3);
  assert.equal(next.index, 1);
  assert.equal(next.responses[0].correct, true);
  assert.equal(next.responses[0].independent, false);
  assert.equal(advanceLearningStep(next, 3), next);
});

test('lesson results distinguish independent success, hints and revealed answers', () => {
  let round = answerLearningStep(createLearningRound(), '6/8', '3/4');
  round = advanceLearningStep(round, 3);
  round = answerLearningStep(hintLearningStep(round), '42', '42');
  round = advanceLearningStep(round, 3);
  round = revealLearningStep(round);
  assert.equal(answerLearningStep(round, '35.1', '35.1'), round);
  round = advanceLearningStep(round, 3);
  assert.equal(round.complete, true);
  assert.deepEqual(round.responses.map(answer => [answer.correct, answer.independent]), [[true, true], [true, false], [false, false]]);
  assert.equal(advanceLearningStep(round, 3), round);
  assert.equal(round.responses.filter(answer => answer.independent).length, 1);
});

test('Easy bridges to Mid with multi-digit operands, carrying and smaller two-digit products', () => {
  const random = seededRandom(96), widths = new Set();
  for (let i = 0; i < 200; i++) {
    const multiplication = generateQuestion('multiplication', 1, random, String(i));
    const [a, b] = multiplication.expression.split(' × ').map(Number);
    assert.ok(a >= 12 && a <= 49 && b >= 2 && b <= 19);
    widths.add(String(b).length);
    for (const category of ['addition', 'subtraction']) {
      const numbers = generateQuestion(category, 1, random, String(i)).expression.split(/ [＋+−] /).map(Number);
      assert.ok(numbers.every(number => number >= 20 && number <= 99));
    }
  }
  assert.deepEqual([...widths].sort(), [1, 2]);
});

test('identity ignores IDs, levels, operand order for sums/products and fraction spelling, but not distinct problems', () => {
  const key = expression => questionKey({ expression });
  assert.equal(key('24 × 18'), key('18 × 24'));
  assert.equal(key('28.5 × 24.7'), key('24.70 × 28.50'));
  assert.equal(key('1/2 + 2/4'), key('3/6 + 4/8'));
  assert.equal(key('1/3 + 2/5'), key('2/5 + 1/3'));
  assert.notEqual(key('20 − 10'), key('10 − 20'));
  assert.notEqual(key('20 ÷ 10'), key('10 ÷ 20'));
  assert.notEqual(key('24 × 18'), key('12 × 36')); // Same answer is allowed.
  const q = generateQuestion('addition', 1, seededRandom(1), 'one');
  assert.equal(questionKey(q), questionKey({ ...q, id: 'two', level: 3 }));
});

test('all categories and levels complete 80-question sessions with no repeated problems, including mistakes and skips', () => {
  for (const category of CATEGORIES) for (const level of [1, 2, 3]) {
    let run = createRun({ mode: 'challenge', focus: category, level }, id, 87, startAt, []);
    const seen = new Set();
    for (let i = 0; i < 80; i++) {
      const key = questionKey(run.question);
      assert.ok(!seen.has(key), `${category}/${level}: ${run.question.expression}`);
      seen.add(key);
      const step = advanceRun(run, i % 3 === 0 ? '999999999' : formatQuestionAnswer(run.question), i % 3 === 1, startAt + (i + 1) * 100);
      run = step.run;
      assert.equal(step.finished, i === 79);
    }
    assert.equal(run.exhausted, false);
    assert.equal(run.attempts.length, 80);
  }
});

function easyFractionKeys() {
  const keys = new Set();
  for (const d1 of [2, 3, 4, 5, 6, 8]) for (const d2 of [2, 4, 5, 8])
    for (let n1 = 1; n1 < d1; n1++) for (let n2 = 1; n2 < d2; n2++) keys.add(questionKey({ expression: `${n1}/${d1} + ${n2}/${d2}` }));
  return keys;
}
test('a constant RNG still visits every distinct small-pool question exactly once, then ends cleanly', () => {
  let run = createRun({ mode: 'sprint', focus: 'fractions', level: 1 }, id, 0, startAt, []);
  run.random = () => 0;
  const actual = new Set(), expected = easyFractionKeys();
  assert.equal(expected.size, 110);
  let finished = false;
  for (let i = 0; i < 300 && !finished; i++) {
    const key = questionKey(run.question);
    assert.ok(!actual.has(key), run.question.expression);
    actual.add(key);
    const step = advanceRun(run, formatQuestionAnswer(run.question), false, startAt + i + 1);
    run = step.run; finished = step.finished;
  }
  assert.equal(finished, true);
  assert.equal(run.exhausted, true);
  assert.deepEqual(actual, expected);
  const session = finishRun(run, startAt + 110, 'complete');
  assert.equal(session.reason, 'exhausted');
  assert.ok(sessionSchema.safeParse(session).success);
  assert.equal(advanceRun(run, '0', true, startAt + 111).run.attempts.length, 110);
});

test('an exhausted selected skill falls through only to other selected skills', () => {
  let run = createRun({ mode: 'sprint', focus: ['percentages', 'fractions'], level: 1 }, id, 0, startAt, []);
  run.random = () => 0;
  const seen = new Set();
  let finished = false;
  for (let i = 0; i < 500 && !finished; i++) {
    assert.ok(['percentages', 'fractions'].includes(run.question.category));
    const key = questionKey(run.question);
    assert.ok(!seen.has(key)); seen.add(key);
    const step = advanceRun(run, '999999999', false, startAt + i + 1);
    run = step.run; finished = step.finished;
  }
  assert.equal(finished, true);
  assert.equal(run.exhausted, true);
  assert.equal(run.attempts.filter(a => a.question.category === 'percentages').length, 6 * 39);
  assert.equal(run.attempts.filter(a => a.question.category === 'fractions').length, 110);
});

test('adaptive changes retain the entire seen set when returning to an earlier level', () => {
  let run = createRun({ mode: 'adaptive', focus: ['fractions', 'percentages'], level: 1 }, id, 16, startAt, []);
  run.random = () => 0;
  const seen = new Set(), levels = new Set();
  for (let i = 0; i < 150; i++) {
    levels.add(run.level);
    const key = questionKey(run.question);
    assert.ok(!seen.has(key), run.question.expression); seen.add(key);
    const input = Math.floor(i / 5) % 2 === 0 ? formatQuestionAnswer(run.question) : '999999999';
    const step = advanceRun(run, input, false, startAt + (i + 1) * 100);
    assert.equal(step.finished, false); run = step.run;
  }
  assert.deepEqual([...levels].sort(), [1, 2]);
});

test('untimed wrong answers and skips stay seen across explanation pauses; a new session resets the set', () => {
  let run = createRun({ mode: 'practice', focus: 'fractions', level: 1 }, id, 55, startAt, []);
  const first = run.question.expression, seen = new Set();
  run.random = () => 0;
  for (let i = 0; i < 20; i++) {
    const key = questionKey(run.question);
    assert.ok(!seen.has(key)); seen.add(key);
    const step = advanceRun(run, '999999999', i % 2 === 0, startAt + i * 100 + 1);
    assert.equal(step.finished, false);
    const next = continueAfterExplanation(step.run, startAt + i * 100 + 90);
    run = next.run; assert.equal(next.finished, i === 19);
  }
  assert.equal(run.attempts.length, 20);
  const restarted = createRun({ mode: 'practice', focus: 'fractions', level: 1 }, id, 55, startAt, run.attempts);
  assert.equal(restarted.question.expression, first);
  assert.equal(restarted.seen.size, 1);
});

test('review queues collapse swapped/equivalent problems while preserving different questions with equal answers', () => {
  const q = generateQuestion('multiplication', 2, seededRandom(7), 'a');
  const queue = ['24 × 18', '18 × 24', '24 × 18', '12 × 36'].map((expression, i) => ({ ...q, id: `review-${i}`, expression, answer: rational(432) }));
  let run = createRun({ ...config, mode: 'review' }, id, 0, startAt, [], queue);
  assert.equal(run.target, 2);
  assert.deepEqual(run.queue.map(q => q.expression), ['24 × 18', '12 × 36']);
  run = advanceRun(run, '432', false, startAt + 1000).run;
  const done = advanceRun(run, '432', false, startAt + 2000);
  assert.equal(done.finished, true);
  const history = [{ ...finishRun(done.run, startAt + 2000, 'complete'), attempts: queue.map((question, i) => ({ question, input: '0', correct: i === 1, skipped: false, ms: 0 })) }];
  assert.equal(unresolvedMistakes(history).length, 2); // A later incorrect attempt reopens a problem.
});

for (const stage of MULTIPLICATION_STAGES) test(`${stage}: lessons link to a correct, distinct 20-question stage and save the stage identity`, () => {
  const lesson = LESSONS.find(item => item.multiplicationStage === stage);
  assert.ok(lesson);
  assert.equal(lesson.drills.length, 3);
  const cfg = normalizeConfig({ mode: 'practice', focus: 'multiplication', level: 3, multiplicationStage: stage });
  assert.equal(cfg.level, lesson.level);
  let run = createRun(cfg, id, 62, startAt, []);
  const seen = new Set();
  for (let i = 0; i < 20; i++) {
    const q = run.question, [a, b] = q.expression.split(' × ').map(Number);
    assert.ok(a >= 100 && a <= 999);
    if (stage === 'triple-single') assert.ok(b >= 2 && b <= 9);
    else if (stage === 'triple-double') assert.ok(b >= 12 && b <= 99);
    else {
      assert.ok(b >= 100 && b <= 999);
      if (stage === 'triple-near-hundred') assert.ok(Math.abs(b - Math.round(b / 100) * 100) >= 1 && Math.abs(b - Math.round(b / 100) * 100) <= 9);
    }
    assert.equal(q.answer.n / q.answer.d, a * b);
    assert.ok(!seen.has(questionKey(q))); seen.add(questionKey(q));
    const step = advanceRun(run, String(a * b), false, startAt + (i + 1) * 1000);
    run = step.run; assert.equal(step.finished, i === 19);
  }
  const session = sessionSchema.parse(finishRun(run, startAt + 20000, 'complete'));
  assert.equal(session.config.multiplicationStage, stage);
});

test('stage-specific practice cannot leak into other modes/skills, and older saved sessions remain valid', () => {
  for (const patch of [{ mode: 'sprint' }, { mode: 'adaptive' }, { focus: 'mixed' }, { focus: ['addition', 'multiplication'] }]) {
    assert.equal(normalizeConfig({ mode: 'practice', focus: 'multiplication', level: 3, multiplicationStage: 'triple-general', ...patch }).multiplicationStage, undefined);
  }
  let run = createRun(config, id, 1, startAt, []);
  run = advanceRun(run, '0', true, startAt + 1000).run;
  const session = finishRun(run, startAt + 1000, 'ended');
  for (const generatorVersion of [undefined, 1, 2, 3]) assert.ok(sessionSchema.safeParse({ ...session, generatorVersion }).success);
  assert.equal(sessionSchema.safeParse({ ...session, config: { mode: 'sprint', focus: 'multiplication', level: 3, multiplicationStage: 'triple-general' } }).success, false);
});

test('four-choice options are stable, numerically distinct and have exactly one correct answer for every category', () => {
  const positions = new Set();
  for (const category of CATEGORIES) for (const level of [1, 2, 3]) {
    const random = seededRandom(38);
    for (let i = 0; i < 80; i++) {
      const q = generateQuestion(category, level, random, `choices-${i}`), choices = questionChoices(q);
      assert.equal(choices.length, 4);
      assert.deepEqual(choices, questionChoices(q));
      assert.equal(new Set(choices.map(value => JSON.stringify(parseAnswer(value)))).size, 4);
      assert.equal(choices.filter(value => isCorrect(value, q.answer)).length, 1);
      positions.add(choices.findIndex(value => isCorrect(value, q.answer)));
      assert.ok(choices.every(value => parseAnswer(value) !== null));
      if (category === 'sequences') assert.ok(choices.every(value => Number.isSafeInteger(+value) && +value >= 0));
    }
  }
  assert.deepEqual([...positions].sort(), [0, 1, 2, 3]);
});

test('all learning examples, guided steps and drills can offer exact, unique choices', () => {
  for (const lesson of LESSONS) for (const item of [...lesson.example.steps, ...lesson.guided.steps, ...lesson.drills]) {
    const answer = parseAnswer(item.answer), choices = answerChoices(answer, `${lesson.id}:${item.answer}`, item.answer.includes('.') ? 'decimal' : undefined);
    assert.equal(choices.length, 4);
    assert.equal(choices.filter(value => isCorrect(value, answer)).length, 1);
    assert.equal(new Set(choices.map(value => JSON.stringify(parseAnswer(value)))).size, 4);
  }
});

test('Sequence practice always uses choices, including mixed typed sessions and legacy review questions', () => {
  const sequence = generateQuestion('sequences', 1, seededRandom(1), 'sequence');
  assert.equal(normalizeConfig({ ...config, focus: 'sequences', answerMode: 'input' }).answerMode, 'choice');
  assert.equal(usesChoices(config, sequence), true);
  assert.equal(usesChoices({ ...config, mode: 'review' }, sequence), true);
  const math = generateQuestion('multiplication', 2, seededRandom(1), 'math');
  assert.equal(usesChoices(config, math), false);
  assert.equal(usesChoices({ ...config, answerMode: 'choice' }, math), true);
  assert.equal(sameAnswerMode(config, { ...config, answerMode: 'input' }), true);
  assert.equal(sameAnswerMode(config, { ...config, answerMode: 'choice' }), false);
});

test('choice mode preserves the question stream and saves selected values, format and sequence metadata', () => {
  for (const focus of ['mixed', 'sequences', 'decimals']) {
    let typed = createRun({ ...config, focus, answerMode: 'input' }, id, 49, startAt, []);
    let choices = createRun({ ...config, focus, answerMode: 'choice' }, id, 49, startAt, []);
    for (let i = 0; i < 20; i++) {
      assert.equal(typed.question.expression, choices.question.expression);
      const q = choices.question;
      const selected = questionChoices(q).find(value => isCorrect(value, q.answer));
      choices = advanceRun(choices, selected, false, startAt + (i + 1) * 1000).run;
      typed = advanceRun(typed, formatQuestionAnswer(typed.question), false, startAt + (i + 1) * 1000).run;
    }
    const stored = sessionSchema.parse(finishRun(choices, startAt + 20000, 'complete'));
    assert.equal(stored.config.answerMode, 'choice');
    assert.equal(summarize(stored).correct, 20);
    if (focus === 'sequences') assert.ok(stored.attempts.every(a => a.question.sequenceFamily));
  }
});

test('sequence family variety, visible-term rules, and constant-RNG no-repeat fallback are preserved', () => {
  for (const level of [1, 2, 3]) {
    const families = new Set(), random = seededRandom(63);
    for (let i = 0; i < 200; i++) {
      const q = generateQuestion('sequences', level, random, `s-${i}`);
      families.add(q.sequenceFamily);
      assert.equal(referenceValue(q.expression, q.sequenceFamily), q.answer.n);
    }
    assert.equal(families.size, 2);
    let run = createRun({ mode: 'challenge', focus: 'sequences', level, answerMode: 'choice' }, id, 21, startAt, []);
    run.random = () => 0;
    const seen = new Set();
    for (let i = 0; i < 80; i++) {
      assert.ok(!seen.has(run.question.expression)); seen.add(run.question.expression);
      const step = advanceRun(run, formatQuestionAnswer(run.question), false, startAt + i + 1);
      run = step.run; assert.equal(step.finished, i === 79);
    }
  }
});
