import test from 'node:test';
import assert from 'node:assert/strict';
import { BACKUP_VERSION, createLocalStore, decodeBackup, encodeBackup, mergeRecords, storageScope, validPreferences } from '../lib/local-data.ts';

function session(number = 1, attemptCount = 3) {
  const startedAt = 1_800_000_000_000 + number * 1_000_000;
  const elapsedMs = attemptCount * 50;
  return {
    id: `00000000-0000-4000-8000-${String(number).padStart(12, '0')}`,
    generatorVersion: 3,
    config: { mode: 'sprint', focus: 'mixed', level: 2, answerMode: 'input' },
    startedAt, endedAt: startedAt + elapsedMs, elapsedMs, reason: 'ended', seed: number,
    attempts: Array.from({ length: attemptCount }, (_, index) => ({
      question: {
        id: `question-${index}`, category: 'addition', level: 2,
        expression: `${index} + 2`, answer: { n: index + 2, d: 1 },
        explanation: 'Add two. 加上二。',
      },
      input: index % 3 === 2 ? '' : index % 3 === 1 ? '-1' : String(index + 2),
      correct: index % 3 === 0, skipped: index % 3 === 2, ms: 50,
    })),
  };
}

function envelope(records, overrides = {}) {
  return JSON.stringify({
    format: 'quantgym-backup', version: 1, exportedAt: '2026-09-13T12:00:00.000Z',
    sessions: records, ...overrides,
  });
}

test('backup round-trip preserves all 2,000 attempts, explanations, outcomes and preferences', () => {
  const record = session(1, 2000);
  const preferences = {
    mode: 'practice', focus: 'multiplication', level: 2,
    multiplicationStage: 'triple-double', answerMode: 'choice',
  };
  const decoded = decodeBackup(encodeBackup([record], preferences));
  assert.equal(decoded.format, 'quantgym-backup');
  assert.equal(decoded.version, BACKUP_VERSION);
  assert.ok(Number.isFinite(Date.parse(decoded.exportedAt)));
  assert.deepEqual(decoded.sessions, [record]);
  assert.deepEqual(decoded.preferences, preferences);
  assert.equal(decoded.sessions[0].attempts.at(-1).question.id, 'question-1999');
});

test('backup and record merging retain history beyond the latest 100 displayed sessions', () => {
  const records = Array.from({ length: 137 }, (_, index) => session(index + 1));
  const expectedIds = records.map(record => record.id).reverse();
  const merged = mergeRecords(records.slice(0, 80), records.slice(80));
  assert.equal(merged.length, 137);
  assert.deepEqual(merged.map(record => record.id), expectedIds);
  assert.deepEqual(decodeBackup(encodeBackup(merged)).sessions.map(record => record.id), expectedIds);
  assert.equal(records[0].id, session(1).id, 'sorting must not mutate the caller history');
});

test('identical IDs are idempotent even when object properties were reordered in JSON', () => {
  const original = session();
  const reordered = Object.fromEntries(Object.entries(structuredClone(original)).reverse());
  reordered.config = Object.fromEntries(Object.entries(reordered.config).reverse());
  assert.deepEqual(mergeRecords([original], [reordered], [original]), [original]);
  assert.deepEqual(decodeBackup(envelope([original, reordered, original])).sessions, [original]);
  assert.deepEqual(decodeBackup(encodeBackup([original, reordered])).sessions, [original]);
});

test('a backup can include saved and pending records without dropping pending data or changing callers', () => {
  const saved = [session(1), session(2)];
  const pending = [session(2), session(3), session(4)];
  const snapshot = structuredClone({ saved, pending });
  const decoded = decodeBackup(encodeBackup(mergeRecords(saved, pending)));
  assert.deepEqual(decoded.sessions.map(record => record.id), [4, 3, 2, 1].map(number => session(number).id));
  assert.deepEqual({ saved, pending }, snapshot);
});

test('conflicting data for an existing UUID is rejected without mutating either record', () => {
  const existing = session();
  const conflicting = { ...structuredClone(existing), seed: 999 };
  const snapshot = structuredClone([existing, conflicting]);
  assert.throws(() => mergeRecords([existing], [conflicting]), /Conflicting versions of session/);
  assert.throws(() => encodeBackup([existing, conflicting]), /Conflicting versions of session/);
  assert.throws(() => decodeBackup(envelope([existing, conflicting])), /invalid or conflicting sessions/);
  assert.deepEqual([existing, conflicting], snapshot);
});

test('older generator versions and omitted optional fields remain intact in backups', () => {
  const older = session(1);
  older.generatorVersion = 1;
  const legacy = session(2);
  delete legacy.generatorVersion;
  delete legacy.config.answerMode;
  const decoded = decodeBackup(encodeBackup([older, legacy]));
  assert.deepEqual(decoded.sessions, [legacy, older]);
  assert.equal(Object.hasOwn(decoded.sessions[0], 'generatorVersion'), false);
  assert.equal(Object.hasOwn(decoded.sessions[0].config, 'answerMode'), false);
});

test('malformed, unrelated, unsupported and incomplete backup envelopes are rejected', () => {
  const invalid = [
    '{', 'null', '42', '"text"', '[]', '{}',
    envelope([], { format: 'another-app' }),
    envelope([], { version: 2 }),
    envelope([], { version: '1' }),
    envelope([], { exportedAt: 'not-a-date' }),
    envelope([], { exportedAt: undefined }),
    envelope([], { sessions: null }),
    envelope([], { sessions: {} }),
  ];
  for (const value of invalid) assert.throws(() => decodeBackup(value), Error, value);
});

test('one invalid session rejects the whole backup instead of silently importing a partial history', () => {
  const valid = session(1);
  const invalidRecords = [
    { ...session(2), id: 'not-a-uuid' },
    { ...session(2), generatorVersion: 4 },
    { ...session(2), elapsedMs: 1 },
    { ...session(2), attempts: [] },
    session(2, 2001),
    { ...session(2), config: { mode: 'practice', focus: 'multiplication', level: 1, multiplicationStage: 'triple-double' } },
  ];
  for (const invalid of invalidRecords) {
    assert.throws(() => decodeBackup(envelope([valid, invalid])), /invalid or conflicting sessions/);
  }
});

test('oversized record-count imports reject before accepting duplicate records', () => {
  const record = session();
  assert.throws(() => decodeBackup(envelope(Array(10001).fill(record))), /incomplete or too large/);
});

test('empty backups are valid and malformed optional preferences do not invalidate valid records', () => {
  assert.deepEqual(decodeBackup(encodeBackup([])).sessions, []);
  const decoded = decodeBackup(envelope([session()], { preferences: { mode: 'review', focus: 'mixed', level: 2 } }));
  assert.deepEqual(decoded.sessions, [session()]);
  assert.equal(decoded.preferences, undefined);
  for (const invalid of [null, 'text', {}, { mode: 'sprint', focus: 'unknown', level: 2 }, { mode: 'sprint', focus: 'mixed', level: 4 }]) {
    assert.equal(validPreferences(invalid), undefined);
  }
});

test('GitHub Pages projects have distinct storage scopes and optional trailing slashes are equivalent', () => {
  assert.equal(storageScope('/QuantGym'), storageScope('/QuantGym/'));
  assert.notEqual(storageScope('/QuantGym/'), storageScope('/OtherProject/'));
  assert.notEqual(storageScope('/'), storageScope('/QuantGym/'));
  assert.notEqual(storageScope('/team/QuantGym/'), storageScope('/QuantGym/'));
});

test('unavailable IndexedDB reports a recoverable failure while backup export remains usable', async () => {
  const store = createLocalStore(storageScope('/unavailable-test/'), undefined);
  await assert.rejects(store.all(), /cannot save local history/);
  await assert.rejects(store.insert([session()]), /cannot save local history/);
  assert.deepEqual(decodeBackup(encodeBackup([session()])).sessions, [session()]);
  await store.close();
});
