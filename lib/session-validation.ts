import { z } from "zod";
const category = z.enum(["addition", "subtraction", "multiplication", "division", "percentages", "fractions", "decimals", "decimal_division", "sequences"]);
const focus = z.union([category, z.literal("mixed"), z.array(category).min(1).max(9).refine(items => new Set(items).size === items.length, "Duplicate skills")]);
const level = z.union([z.literal(1), z.literal(2), z.literal(3)]);
export const sessionSchema = z.object({
  id: z.string().uuid(),
  generatorVersion: z.number().int().min(1).max(3).optional(),
  config: z.object({ mode: z.enum(["sprint", "adaptive", "challenge", "practice", "review"]), focus, level,
    multiplicationStage: z.enum(["triple-single", "triple-double", "triple-near-hundred", "triple-general"]).optional(),
    answerMode: z.enum(["input", "choice"]).optional(),
  }).refine(config => !config.multiplicationStage || (config.mode === "practice" && config.focus === "multiplication" && config.level === (config.multiplicationStage === "triple-single" ? 1 : config.multiplicationStage === "triple-double" ? 2 : 3)), "Invalid multiplication stage"),
  startedAt: z.number().int().positive().max(10_000_000_000_000), endedAt: z.number().int().positive().max(10_000_000_000_000),
  elapsedMs: z.number().int().min(0).max(604_800_000), reason: z.enum(["complete", "time", "ended", "exhausted"]), seed: z.number().int().min(0).max(4_294_967_295),
  attempts: z.array(z.object({
    question: z.object({ id: z.string().min(1).max(100), category, level, expression: z.string().min(1).max(100),
      sequenceFamily: z.enum(["arithmetic", "geometric", "growing-difference", "alternating", "multiply-add", "interleaved"]).optional(),
      answer: z.object({ n: z.number().int().min(-1_000_000_000).max(1_000_000_000), d: z.number().int().min(1).max(1_000_000_000) }), answerFormat: z.literal("decimal").optional(), explanation: z.string().max(1000) }),
    input: z.string().max(40), correct: z.boolean(), skipped: z.boolean(), ms: z.number().int().min(0).max(604_800_000),
  })).min(1).max(2000),
}).superRefine((session, ctx) => {
  if (session.endedAt < session.startedAt || session.elapsedMs !== session.endedAt - session.startedAt) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Inconsistent session duration" });
  const limit = { sprint: 120_000, adaptive: 180_000, challenge: 480_000, practice: null, review: null }[session.config.mode];
  if (limit !== null && session.elapsedMs > limit) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Session exceeds its time limit" });
  const target = session.config.mode === "challenge" ? 80 : session.config.mode === "practice" ? 20 : session.config.mode === "review" ? 100 : 2000;
  if (session.attempts.length > target || session.attempts.reduce((n, a) => n + a.ms, 0) > session.elapsedMs) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid session attempts" });
});
