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

const CATEGORY_NAMES: Record<Category, string> = { addition: "加法", subtraction: "减法", multiplication: "整数乘法", division: "整数除法", percentages: "百分比", fractions: "分数", decimals: "小数乘法", decimal_division: "小数除法", sequences: "数列规律" };
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
  return <section className="learn-page" lang="zh-CN">
    <div className="page-heading"><div><span className="eyebrow">Learn the method</span><h1>把心算拆成你能完成的小步。</h1><p className="muted">先看示范，再跟着算，最后独立完成 3 道同类题。全程不计时。</p></div><span className="learn-count"><BookOpen />{LESSONS.length} 节技巧课</span></div>
    <div className="learn-answer-mode"><span id="learn-answer-mode-label">练习作答方式</span><RadioGroup className="levels answer-mode-toggle" value={answerMode} onValueChange={value => setAnswerMode(value as AnswerMode)} aria-labelledby="learn-answer-mode-label">{(["input", "choice"] as AnswerMode[]).map(mode => <label key={mode} className={`level-choice ${answerMode === mode ? "selected" : ""}`}><RadioGroupItem value={mode} />{mode === "input" ? "填空" : "选择题"}</label>)}</RadioGroup><p>用于跟着做和独立练习；选择选项后再确认。</p></div>
    <section className="learning-ladder" aria-label="三位数乘法学习阶梯">
      <div><h2>一步一步，算会三位数 × 三位数</h2><p>建议每阶先独立答对 3 题，再做 20 题专项；能稳定答对 18 题后，进入下一阶。</p></div>
      <nav className="ladder-steps" aria-label="选择学习阶梯">{LESSONS.filter(item => item.multiplicationStage).map((item, index) => <button key={item.id} className={selected === item.id ? "selected" : ""} aria-current={selected === item.id ? "step" : undefined} onClick={() => { setCategory("multiplication"); choose(item.id); }}><span>{String(index + 1).padStart(2, "0")}</span><strong>{["三位数 × 一位数", "三位数 × 两位数", "接近整百的乘法", "一般三位数 × 三位数"][index]}</strong><small>{["拆位与进位", "整十块 + 个位块", "先凑整，再修正", "一块一块更新总数"][index]}</small></button>)}</nav>
    </section>
    <div className="learn-layout">
      <aside className="lesson-library" aria-label="心算技巧目录">
        <div className="lesson-library-heading"><h2>选择技巧</h2><p>一位数乘法还不稳？先学「先练两位数 × 一位数」。</p></div>
        <Select value={category} onValueChange={value => filter(value as Category | "all")}><SelectTrigger aria-label="按题型筛选课程"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">全部技巧</SelectItem>{CATEGORIES.filter(item => LESSONS.some(lesson => lesson.category === item)).map(item => <SelectItem key={item} value={item}>{CATEGORY_NAMES[item]}</SelectItem>)}</SelectContent></Select>
        <nav className="lesson-list" aria-label="技巧课程">{lessons.map(item => <button key={item.id} className={`lesson-link ${item.id === selected ? "selected" : ""}`} aria-current={item.id === selected ? "step" : undefined} onClick={() => choose(item.id)}><span className="lesson-number">{String(LESSONS.indexOf(item) + 1).padStart(2, "0")}</span><span><strong>{item.title}</strong><small>{CATEGORY_NAMES[item.category]}</small></span></button>)}</nav>
      </aside>
      <div ref={headingRef} className="lesson-content"><LessonDetail key={lesson.id} lesson={lesson} active={active} answerMode={answerMode} onPractice={onPractice} onNext={nextLesson ? () => choose(nextLesson.id) : undefined} /></div>
    </div>
  </section>;
}

function LessonDetail({ lesson, active, answerMode, onPractice, onNext }: { lesson: Lesson; active: boolean; answerMode: AnswerMode; onPractice: PracticeAction; onNext?: () => void }) {
  const [stage, setStage] = useState("example");
  const [visibleSteps, setVisibleSteps] = useState(1);
  const allShown = visibleSteps >= lesson.example.steps.length;
  const drills: LessonStep[] = lesson.drills.map((item, index) => ({ title: `独立练习 ${index + 1}`, calculation: item.expression, answer: item.answer, explanation: item.explanation }));
  return <>
    <div className="lesson-intro"><span className="eyebrow">{CATEGORY_NAMES[lesson.category]} / {String(LESSONS.indexOf(lesson) + 1).padStart(2, "0")}</span><h2>{lesson.title}</h2><p>{lesson.summary}</p></div>
    <div className="lesson-principle"><div><span>什么时候用</span><p>{lesson.when}</p></div><div><span>为什么成立</span><p>{lesson.rule}</p></div></div>
    <Tabs value={stage} onValueChange={setStage} className="lesson-workspace">
      <TabsList className="lesson-stages" aria-label="学习阶段"><TabsTrigger value="example">1 · 看示范</TabsTrigger><TabsTrigger value="guided">2 · 跟着做</TabsTrigger><TabsTrigger value="practice">3 · 独立练习</TabsTrigger></TabsList>
      <TabsContent value="example" forceMount hidden={stage !== "example"}>
        <div className="lesson-example"><span className="lesson-question-label">这一题怎么在脑中完成？</span><div className="lesson-equation">{lesson.example.expression}<span className="lime"> = ?</span></div>
          <ol className="lesson-steps" aria-live="polite" aria-relevant="additions">{lesson.example.steps.slice(0, visibleSteps).map((item, index) => <li key={index}><span className="lesson-step-number">{index + 1}</span><div><h3>{item.title}</h3><div className="lesson-step-equation">{item.calculation} = <strong>{item.answer}</strong></div><p>{item.explanation}</p></div></li>)}</ol>
          {allShown ? <div className="lesson-answer"><CheckCircle2 /><span>{lesson.example.expression} = <strong>{lesson.example.answer}</strong></span></div> : <p className="lesson-next-note">先在脑中试一下下一步，再展开。</p>}
          <div className="lesson-actions">{!allShown ? <button className="primary-button" onClick={() => setVisibleSteps(count => count + 1)}>显示下一步<ArrowRight /></button> : <button className="primary-button" onClick={() => setStage("guided")}>换一道，跟着做<ArrowRight /></button>}{visibleSteps > 1 && <button className="text-button muted" onClick={() => setVisibleSteps(1)}><RotateCcw />重新演示</button>}</div>
        </div>
      </TabsContent>
      <TabsContent value="guided" forceMount hidden={stage !== "guided"}><LearningExercise answerMode={answerMode} title="跟着做" items={lesson.guided.steps} wholeExpression={lesson.guided.expression} wholeAnswer={lesson.guided.answer} active={active && stage === "guided"} guided onDone={() => setStage("practice")} /></TabsContent>
      <TabsContent value="practice" forceMount hidden={stage !== "practice"}><LearningExercise answerMode={answerMode} title="独立练习" items={drills} active={active && stage === "practice"} onDone={() => onPractice(lesson.category, lesson.level, lesson.multiplicationStage, answerMode)} /></TabsContent>
    </Tabs>
    <div className="lesson-tips"><div><Lightbulb /><div><h3>脑中怎么记</h3><p>{lesson.memory}</p></div></div><div><span className="lesson-caution">!</span><div><h3>容易错在哪里</h3><p>{lesson.pitfall}</p></div></div></div>
    <div className="lesson-footer"><p>课程内练习用于理解方法，不计入冲刺成绩。</p>{lesson.multiplicationStage && <button className="text-button" onClick={() => onPractice(lesson.category, lesson.level, lesson.multiplicationStage, answerMode)}>本阶 20 题专项<ArrowRight /></button>}{onNext && <button className="text-button" onClick={onNext}>下一技巧<ArrowRight /></button>}</div>
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
    catch (error) { setError(error instanceof Error ? error.message : "检查一下输入。"); }
  }
  function advance() { setRound(state => advanceLearningStep(state, items.length)); setInput(""); setError(""); }
  function restart() { setRound(createLearningRound()); setInput(""); setError(""); }
  if (round.complete) {
    const independent = round.responses.filter(response => response.independent).length;
    return <div className="lesson-round-complete"><CheckCircle2 className="lesson-complete-icon" /><h3>{guided ? "步骤已经走通了。" : independent === items.length ? "这轮全部独立答对。" : "这一轮完成，再巩固一下。"}</h3>
      {guided ? <p className="lesson-step-equation">{wholeExpression} = <strong>{wholeAnswer}</strong></p> : <p>首次作答正确且未用提示：<strong className="lime">{independent} / {items.length}</strong> 题。</p>}
      <p className="muted">{guided ? "接下来隐藏拆步提示，试着自己选方法。" : independent === items.length ? "可以进入自由练习，继续巩固这一类题。" : "看过提示的题，试着再独立算一遍。"}</p>
      <div className="lesson-recap">{items.map((question, index) => <div key={index}><span className={`lesson-recap-mark ${round.responses[index].independent ? "lime" : "muted"}`}>{round.responses[index].independent ? <Check /> : <Lightbulb />}</span><div><strong>{question.calculation} = {question.answer}</strong><p>{question.explanation}</p></div></div>)}</div>
      <div className="lesson-actions"><button ref={nextRef} className="primary-button" onClick={onDone} onKeyDown={event => { if (event.repeat && (event.key === "Enter" || event.key === " ")) event.preventDefault(); }}>{guided ? "开始独立练习" : "进入同类自由练习"}<ArrowRight /></button><button className="text-button" onClick={restart}><RotateCcw />再做一遍</button></div>
    </div>;
  }
  return <div className="lesson-exercise">
    <div className="lesson-exercise-top"><span>{title} · {round.index + 1} / {items.length}</span><span>不计时 · {answerMode === "choice" ? "选择题" : "填空"}</span></div>
    <Progress value={round.index / items.length * 100} aria-label={guided ? "引导步骤进度" : "独立练习进度"} />
    {guided && <><p className="lesson-whole">原题：{wholeExpression} = ?</p>{round.index > 0 && <ol className="lesson-completed-steps">{items.slice(0, round.index).map((previous, index) => <li key={index}><Check />{previous.calculation} = {previous.answer}</li>)}</ol>}</>}
    <h3>{item.title}</h3><div className="lesson-equation">{item.calculation}<span className="lime"> = ?</span></div>
    {ready ? <div className="lesson-step-result" role="status"><p>{round.feedback === "correct" ? "答对了" : "这一步的答案"}：<strong>{item.answer}</strong></p><p>{item.explanation}</p><button ref={nextRef} className="primary-button" onClick={advance} onKeyDown={event => { if (event.repeat && (event.key === "Enter" || event.key === " ")) event.preventDefault(); }}>{round.index === items.length - 1 ? "查看本轮结果" : guided ? "继续下一步" : "下一题"}<ArrowRight /></button></div> : <>
      {answerMode === "choice" ? <AnswerChoices choices={answerChoices(parseAnswer(item.answer)!, `${answerId}:${round.index}:${item.calculation}`, item.answer.includes(".") ? "decimal" : undefined)} value={input} onChange={value => { setInput(value); setError(""); }} onSubmit={submit} active={active} label="选择这一步的答案" submitLabel="检查答案" /> : <><form className="lesson-answer-form" onSubmit={event => { event.preventDefault(); submit(); }}><label htmlFor={answerId} className="sr-only">{guided ? "这一步的答案" : "你的答案"}</label><input id={answerId} ref={inputRef} value={input} onChange={event => { setInput(event.target.value); setError(""); }} onKeyDown={event => { if (event.key === "Enter" && event.repeat) event.preventDefault(); }} placeholder={guided ? "只填这一步的答案" : "输入答案"} inputMode="decimal" autoComplete="off" maxLength={40} aria-describedby={`${answerId}-feedback`} /><button type="submit" className="primary-button">检查<Check /></button></form>
      <div className="lesson-input-tools"><button className="text-button" aria-label="输入负号" onClick={() => { setInput(value => value.startsWith("-") ? value.slice(1) : `-${value}`); inputRef.current?.focus(); }}>±</button><button className="text-button" aria-label="输入分数线" onClick={() => { setInput(value => value.includes("/") ? value : `${value}/`); inputRef.current?.focus(); }}>/</button><span>支持精确小数和分数，例如 3/4</span></div></>}
      <p id={`${answerId}-feedback`} className="lesson-error" role="status">{error || (round.feedback === "incorrect" ? "还没算对，再试一次；也可以展开提示。" : "")}</p>
      {round.helped && <div className="lesson-hint" role="status"><Lightbulb /><p>{item.explanation}</p></div>}
      <div className="lesson-assistance"><button className="text-button" disabled={round.helped} onClick={() => setRound(hintLearningStep)}><Lightbulb />给我一个提示</button><button className="text-button muted" onClick={() => { setRound(revealLearningStep); setError(""); }}>查看这一步答案</button></div>
    </>}
  </div>;
}
