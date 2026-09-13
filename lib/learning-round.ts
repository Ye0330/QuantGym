import { isCorrect, parseAnswer } from "./quant-engine.ts";

export type LearningResponse = { input: string; correct: boolean; independent: boolean };
export type LearningRound = {
  index: number; complete: boolean; feedback: "none" | "incorrect" | "correct" | "revealed";
  input: string; mistakes: number; helped: boolean; responses: LearningResponse[];
};
export function createLearningRound(): LearningRound {
  return { index: 0, complete: false, feedback: "none", input: "", mistakes: 0, helped: false, responses: [] };
}
export function answerLearningStep(state: LearningRound, input: string, expected: string): LearningRound {
  if (state.complete || state.feedback === "correct" || state.feedback === "revealed") return state;
  if (!parseAnswer(input)) throw new Error("输入一个数或精确分数，例如 3/4。");
  const answer = parseAnswer(expected);
  if (!answer) throw new Error("This lesson answer is invalid.");
  const correct = isCorrect(input, answer);
  return { ...state, input: input.trim(), feedback: correct ? "correct" : "incorrect", mistakes: state.mistakes + (correct ? 0 : 1) };
}
export function hintLearningStep(state: LearningRound): LearningRound {
  if (state.complete || state.feedback === "correct" || state.feedback === "revealed") return state;
  return { ...state, helped: true };
}
export function revealLearningStep(state: LearningRound): LearningRound {
  if (state.complete || state.feedback === "correct" || state.feedback === "revealed") return state;
  return { ...state, helped: true, feedback: "revealed" };
}
export function advanceLearningStep(state: LearningRound, total: number): LearningRound {
  if (state.complete || (state.feedback !== "correct" && state.feedback !== "revealed")) return state;
  const correct = state.feedback === "correct";
  const responses = [...state.responses, { input: state.input, correct, independent: correct && !state.helped && state.mistakes === 0 }];
  return { ...createLearningRound(), index: state.index + 1, complete: responses.length >= total, responses };
}
