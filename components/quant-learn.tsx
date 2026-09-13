"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, BookOpen, Check, CheckCircle2, Lightbulb, RotateCcw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AnswerChoices } from "@/components/answer-choices";
import { answerChoices } from "@/lib/answer-choices";
import { Progress } from "@/components/ui/progress";
import { CATEGORIES, parseAnswer, type AnswerMode, type Category, type Level, type MultiplicationStage } from "@/lib/quant-engine";
import { LESSONS, type Lesson, type LessonStep } from "@/lib/quant-lessons";
import { advanceLearningStep, answerLearningStep, createLearningRound, hintLearningStep, revealLearningStep } from "@/lib/learning-round";

const CATEGORY_NAMES: Record<Category, string> = { addition: "Addition", subtraction: "Subtraction", multiplication: "Multiplication", division: "Division", percentages: "Percentages", fractions: "Fractions", decimals: "Decimal multiplication", decimal_division: "Decimal division", sequences: "Sequences" };
type PracticeAction = (category: Category, level: Level, multiplicationStage?: MultiplicationStage, answerMode?: AnswerMode) => void;

export default function QuantLearn({ active, onPractice }: { active: boolean; onPractice: PracticeAction }) {
  const [answerMode, setAnswerMode] = useState<AnswerMode>("input");
  const [category, setCategory] = useState<Category | "all">("all");
  const [selected, setSelected] = useState(LESSONS[0].id);
  const headingRef = useRef<HTMLDivElement>(null);
  const lessons = category === "all" ? LESSONS : LESSONS.filter(lesson => lesson.category === category);
  const lesson = LESSONS.find(item => item.id === selected)!;
  function choose(id: string) {
    setSelected(id);
    headingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function filter(value: Category | "all") {
    setCategory(value);
    if (value !== "all" && lesson.category !== value) setSelected(LESSONS.find(item => item.category === value)!.id);
  }
  const nextLesson = lessons[lessons.findIndex(item => item.id === selected) + 1];
  return <section className="learn-page" lang="en">
    <div className="page-heading"><div><span className="eyebrow">Learn the method</span><h1>Build confidence, one step at a time.</h1><p className="muted">Watch an example, follow the steps, then solve 3 questions on your own. Take as much time as you need.</p></div><span className="learn-count"><BookOpen />{LESSONS.length} technique lessons</span></div>
    <div className="learn-answer-mode"><span id="learn-answer-mode-label">Answer format</span><RadioGroup className="levels answer-mode-toggle" value={answerMode} onValueChange={value => setAnswerMode(value as AnswerMode)} aria-labelledby="learn-answer-mode-label">{(["input", "choice"] as AnswerMode[]).map(mode => <label key={mode} className={`level-choice ${answerMode === mode ? "selected" : ""}`}><RadioGroupItem value={mode} />{mode === "input" ? "Typed answers" : "Multiple choice"}</label>)}</RadioGroup><p>Applies to guided and independent practice. With multiple choice, select an answer, then confirm.</p></div>
    <section className="learning-ladder" aria-label="Multiplication learning ladder">
      <div><h2>Your path to 3-digit × 3-digit multiplication</h2><p>For each stage, solve 3 questions independently, then try the 20-question practice set. Move on when you can consistently get at least 18 correct.</p></div>
      <nav className="ladder-steps" aria-label="Choose a learning stage">{LESSONS.filter(item => item.multiplicationStage).map((item, index) => <button key={item.id} className={selected === item.id ? "selected" : ""} aria-current={selected === item.id ? "step" : undefined} onClick={() => { setCategory("multiplication"); choose(item.id); }}><span>{String(index + 1).padStart(2, "0")}</span><strong>{["3-digit × 1-digit", "3-digit × 2-digit", "Near a multiple of 100", "3-digit × 3-digit"][index]}</strong><small>{["Split by place value and carry", "Multiply by the tens, then the units", "Round first, then adjust", "Keep a running total"][index]}</small></button>)}</nav>
    </section>
    <div className="learn-layout">
      <aside className="lesson-library" aria-label="Mental math techniques">
        <div className="lesson-library-heading"><h2>Choose a technique</h2><p>Need a stronger foundation? Start with 2-digit × 1-digit multiplication.</p></div>
        <Select value={category} onValueChange={value => filter(value as Category | "all")}><SelectTrigger aria-label="Filter lessons by topic"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All techniques</SelectItem>{CATEGORIES.filter(item => LESSONS.some(lesson => lesson.category === item)).map(item => <SelectItem key={item} value={item}>{CATEGORY_NAMES[item]}</SelectItem>)}</SelectContent></Select>
        <nav className="lesson-list" aria-label="Technique lessons">{lessons.map(item => <button key={item.id} className={`lesson-link ${item.id === selected ? "selected" : ""}`} aria-current={item.id === selected ? "step" : undefined} onClick={() => choose(item.id)}><span className="lesson-number">{String(LESSONS.indexOf(item) + 1).padStart(2, "0")}</span><span><strong>{item.title}</strong><small>{CATEGORY_NAMES[item.category]}</small></span></button>)}</nav>
      </aside>
      <div ref={headingRef} className="lesson-content"><LessonDetail key={lesson.id} lesson={lesson} active={active} answerMode={answerMode} onPractice={onPractice} onNext={nextLesson ? () => choose(nextLesson.id) : undefined} /></div>
    </div>
  </section>;
}

function LessonDetail({ lesson, active, answerMode, onPractice, onNext }: { lesson: Lesson; active: boolean; answerMode: AnswerMode; onPractice: PracticeAction; onNext?: () => void }) {
  const [stage, setStage] = useState("example");
  const [visibleSteps, setVisibleSteps] = useState(1);
  const allShown = visibleSteps >= lesson.example.steps.length;
  const drills: LessonStep[] = lesson.drills.map((item, index) => ({ title: `Independent practice ${index + 1}`, calculation: item.expression, answer: item.answer, explanation: item.explanation }));
  return <>
    <div className="lesson-intro"><span className="eyebrow">{CATEGORY_NAMES[lesson.category]} / {String(LESSONS.indexOf(lesson) + 1).padStart(2, "0")}</span><h2>{lesson.title}</h2><p>{lesson.summary}</p></div>
    <div className="lesson-principle"><div><span>When to use it</span><p>{lesson.when}</p></div><div><span>Why it works</span><p>{lesson.rule}</p></div></div>
    <Tabs value={stage} onValueChange={setStage} className="lesson-workspace">
      <TabsList className="lesson-stages" aria-label="Learning stages"><TabsTrigger value="example">1 · Example</TabsTrigger><TabsTrigger value="guided">2 · Guided</TabsTrigger><TabsTrigger value="practice">3 · Independent</TabsTrigger></TabsList>
      <TabsContent value="example" forceMount hidden={stage !== "example"}>
        <div className="lesson-example"><span className="lesson-question-label">How would you work this out mentally?</span><div className="lesson-equation">{lesson.example.expression}<span className="lime"> = ?</span></div>
          <ol className="lesson-steps" aria-live="polite" aria-relevant="additions">{lesson.example.steps.slice(0, visibleSteps).map((item, index) => <li key={index}><span className="lesson-step-number">{index + 1}</span><div><h3>{item.title}</h3><div className="lesson-step-equation">{item.calculation} = <strong>{item.answer}</strong></div><p>{item.explanation}</p></div></li>)}</ol>
          {allShown ? <div className="lesson-answer"><CheckCircle2 /><span>{lesson.example.expression} = <strong>{lesson.example.answer}</strong></span></div> : <p className="lesson-next-note">Try the next step mentally before revealing it.</p>}
          <div className="lesson-actions">{!allShown ? <button className="primary-button" onClick={() => setVisibleSteps(count => count + 1)}>Show next step<ArrowRight /></button> : <button className="primary-button" onClick={() => setStage("guided")}>Try a guided example<ArrowRight /></button>}{visibleSteps > 1 && <button className="text-button muted" onClick={() => setVisibleSteps(1)}><RotateCcw />Restart example</button>}</div>
        </div>
      </TabsContent>
      <TabsContent value="guided" forceMount hidden={stage !== "guided"}><LearningExercise answerMode={answerMode} title="Guided practice" items={lesson.guided.steps} wholeExpression={lesson.guided.expression} wholeAnswer={lesson.guided.answer} active={active && stage === "guided"} guided onDone={() => setStage("practice")} /></TabsContent>
      <TabsContent value="practice" forceMount hidden={stage !== "practice"}><LearningExercise answerMode={answerMode} title="Independent practice" items={drills} active={active && stage === "practice"} onDone={() => onPractice(lesson.category, lesson.level, lesson.multiplicationStage, answerMode)} /></TabsContent>
    </Tabs>
    <div className="lesson-tips"><div><Lightbulb /><div><h3>What to keep in mind</h3><p>{lesson.memory}</p></div></div><div><span className="lesson-caution">!</span><div><h3>Common mistakes</h3><p>{lesson.pitfall}</p></div></div></div>
    <div className="lesson-footer"><p>Lesson exercises help you understand the method and do not count toward sprint results.</p>{lesson.multiplicationStage && <button className="text-button" onClick={() => onPractice(lesson.category, lesson.level, lesson.multiplicationStage, answerMode)}>Practice this stage · 20 questions<ArrowRight /></button>}{onNext && <button className="text-button" onClick={onNext}>Next technique<ArrowRight /></button>}</div>
  </>;
}

function LearningExercise({ title, items, active, answerMode, guided = false, wholeExpression, wholeAnswer, onDone }: { title: string; items: LessonStep[]; active: boolean; answerMode: AnswerMode; guided?: boolean; wholeExpression?: string; wholeAnswer?: string; onDone: () => void }) {
  const [round, setRound] = useState(createLearningRound);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const answerId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const ready = round.feedback === "correct" || round.feedback === "revealed";
  const item = items[round.index];
  useEffect(() => { setInput(""); setError(""); }, [answerMode]);
  useEffect(() => {
    if (!active) return;
    if (round.complete || ready) nextRef.current?.focus();
    else inputRef.current?.focus();
  }, [active, round.index, round.complete, ready]);
  function submit() {
    if (round.complete || ready) return;
    try { setRound(answerLearningStep(round, input, item.answer)); setError(""); }
    catch (error) { setError(error instanceof Error ? error.message : "Check your answer format."); }
  }
  function advance() { setRound(state => advanceLearningStep(state, items.length)); setInput(""); setError(""); }
  function restart() { setRound(createLearningRound()); setInput(""); setError(""); }
  if (round.complete) {
    const independent = round.responses.filter(response => response.independent).length;
    return <div className="lesson-round-complete"><CheckCircle2 className="lesson-complete-icon" /><h3>{guided ? "You have worked through every step." : independent === items.length ? "Every answer correct, all on your own." : "Round complete. Keep building confidence."}</h3>
      {guided ? <p className="lesson-step-equation">{wholeExpression} = <strong>{wholeAnswer}</strong></p> : <p>Correct on the first try, without hints: <strong className="lime">{independent} / {items.length}</strong> questions.</p>}
      <p className="muted">{guided ? "Next, try choosing the method yourself, without the guided steps." : independent === items.length ? "You are ready to practice this technique in a free practice session." : "Try the questions you needed help with again, this time on your own."}</p>
      <div className="lesson-recap">{items.map((question, index) => <div key={index}><span className={`lesson-recap-mark ${round.responses[index].independent ? "lime" : "muted"}`}>{round.responses[index].independent ? <Check /> : <Lightbulb />}</span><div><strong>{question.calculation} = {question.answer}</strong><p>{question.explanation}</p></div></div>)}</div>
      <div className="lesson-actions"><button ref={nextRef} className="primary-button" onClick={onDone} onKeyDown={event => { if (event.repeat && (event.key === "Enter" || event.key === " ")) event.preventDefault(); }}>{guided ? "Start independent practice" : "Practice this technique"}<ArrowRight /></button><button className="text-button" onClick={restart}><RotateCcw />Try again</button></div>
    </div>;
  }
  return <div className="lesson-exercise">
    <div className="lesson-exercise-top"><span>{title} · {round.index + 1} / {items.length}</span><span>Untimed · {answerMode === "choice" ? "Multiple choice" : "Typed answers"}</span></div>
    <Progress value={round.index / items.length * 100} aria-label={guided ? "Guided practice progress" : "Independent practice progress"} />
    {guided && <><p className="lesson-whole">Full question: {wholeExpression} = ?</p>{round.index > 0 && <ol className="lesson-completed-steps">{items.slice(0, round.index).map((previous, index) => <li key={index}><Check />{previous.calculation} = {previous.answer}</li>)}</ol>}</>}
    <h3>{item.title}</h3><div className="lesson-equation">{item.calculation}<span className="lime"> = ?</span></div>
    {ready ? <div className="lesson-step-result" role="status"><p>{round.feedback === "correct" ? "Correct" : "Answer to this step"}:{" "}<strong>{item.answer}</strong></p><p>{item.explanation}</p><button ref={nextRef} className="primary-button" onClick={advance} onKeyDown={event => { if (event.repeat && (event.key === "Enter" || event.key === " ")) event.preventDefault(); }}>{round.index === items.length - 1 ? "See results" : guided ? "Next step" : "Next question"}<ArrowRight /></button></div> : <>
      {answerMode === "choice" ? <AnswerChoices choices={answerChoices(parseAnswer(item.answer)!, `${answerId}:${round.index}:${item.calculation}`, item.answer.includes(".") ? "decimal" : undefined)} value={input} onChange={value => { setInput(value); setError(""); }} onSubmit={submit} active={active} label="Choose the answer to this step" submitLabel="Check answer" /> : <><form className="lesson-answer-form" onSubmit={event => { event.preventDefault(); submit(); }}><label htmlFor={answerId} className="sr-only">{guided ? "Answer to this step" : "Your answer"}</label><input id={answerId} ref={inputRef} value={input} onChange={event => { setInput(event.target.value); setError(""); }} onKeyDown={event => { if (event.key === "Enter" && event.repeat) event.preventDefault(); }} placeholder={guided ? "Answer this step" : "Enter your answer"} inputMode="decimal" autoComplete="off" maxLength={40} aria-describedby={`${answerId}-feedback`} /><button type="submit" className="primary-button">Check<Check /></button></form>
      <div className="lesson-input-tools"><button className="text-button" aria-label="Toggle minus sign" onClick={() => { setInput(value => value.startsWith("-") ? value.slice(1) : `-${value}`); inputRef.current?.focus(); }}>±</button><button className="text-button" aria-label="Insert fraction slash" onClick={() => { setInput(value => value.includes("/") ? value : `${value}/`); inputRef.current?.focus(); }}>/</button><span>Enter an exact decimal or fraction, such as 3/4.</span></div></>}
      <p id={`${answerId}-feedback`} className="lesson-error" role="status">{error || (round.feedback === "incorrect" ? "Not quite. Try again, or reveal a hint." : "")}</p>
      {round.helped && <div className="lesson-hint" role="status"><Lightbulb /><p>{item.explanation}</p></div>}
      <div className="lesson-assistance"><button className="text-button" disabled={round.helped} onClick={() => setRound(hintLearningStep)}><Lightbulb />Show hint</button><button className="text-button muted" onClick={() => { setRound(revealLearningStep); setError(""); }}>Reveal answer</button></div>
    </>}
  </div>;
}
