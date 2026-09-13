"use client";

import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, BarChart3, BookOpen, Check, CheckCircle2, ChevronLeft, CircleHelp, Clock3, Download, HardDrive, Upload, CornerDownLeft, Crosshair, Flame, History, Infinity as InfinityIcon, Loader2, Play, RotateCcw, SkipForward, Sparkles, Target, Timer, Trophy, X, Zap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createLocalStore, decodeBackup, encodeBackup, MAX_BACKUP_BYTES, mergeRecords, storageScope, validPreferences } from "@/lib/local-data";
import { AnswerChoices } from "@/components/answer-choices";
import { questionChoices } from "@/lib/answer-choices";
import { FocusPicker } from "@/components/focus-picker";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { CATEGORIES, LABELS, LEVELS, MODES, MULTIPLICATION_STAGES, STAGE_LABELS, normalizeConfig, usesChoices, sameAnswerMode, focusCategories, focusLabel, isValidFocus, normalizeFocus, sameFocus, advanceRun, categoryStats, continueAfterExplanation, createRun, expired, finishRun, formatQuestionAnswer, questionExplanation, difficultyDescription, isCurrentGeneration, formatTime, generateQuestion, seededRandom, summarize, unresolvedMistakes, type AnswerMode, type Category, type Config, type Level, type MultiplicationStage, type Mode, type Question, type Run, type Session } from "@/lib/quant-engine";

const DATA_SCOPE = storageScope(new URL("./", document.baseURI).pathname);
const PREFERENCES_KEY = `${DATA_SCOPE}:preferences`;
const localStore = createLocalStore(DATA_SCOPE);
function notifyLocalChange() { try { const channel = new BroadcastChannel(DATA_SCOPE); channel.postMessage("saved"); channel.close(); } catch { /* Cross-tab refresh also runs on focus. */ } }

const QuantLearn = lazy(() => import("@/components/quant-learn"));
const MODE_ICONS = { sprint: Zap, adaptive: Sparkles, challenge: Target, practice: InfinityIcon, review: RotateCcw };
const MODES_LIST: Mode[] = ["sprint", "adaptive", "challenge", "practice"];
const DEFAULT_CONFIG: Config = { mode: "sprint", focus: "mixed", level: 2 };
const dateLabel = (value: number) => new Date(value).toLocaleDateString("en-GB", { month: "short", day: "numeric" });
const pct = (n: number | null) => n === null ? "—" : `${Math.round(n)}%`;
const answerModeLabel = (config: Config) => config.answerMode === "choice" || config.focus === "sequences" ? "Multiple choice" : focusCategories(config.focus).includes("sequences") ? "Typed math + sequence choices" : "Typed answers";
const trainingLabel = (config: Config) => `${config.multiplicationStage ? STAGE_LABELS[config.multiplicationStage] : `${focusLabel(config.focus)} · ${LEVELS[config.level]}`} · ${answerModeLabel(config)}`;
const seconds = (n: number | null) => n === null ? "—" : `${(n / 1000).toFixed(1)}s`;
function mergeSessions(...groups: Session[][]) { return [...new Map(groups.flat().map(s => [s.id, s])).values()].sort((a, b) => b.startedAt - a.startedAt).slice(0, 100); }

type Sync = "loading" | "saved" | "saving" | "error";
export default function QuantGym() {
  const [tab, setTab] = useState("train");
  const [learnVisited, setLearnVisited] = useState(false);
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [reviewAnswerMode, setReviewAnswerMode] = useState<AnswerMode>("input");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sync, setSync] = useState<Sync>("loading");
  const [pending, setPending] = useState<Session[]>([]);
  const [storageMessage, setStorageMessage] = useState("");
  const [savedCount, setSavedCount] = useState(0);
  const [dataMessage, setDataMessage] = useState("");
  const [dataBusy, setDataBusy] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const [run, setRun] = useState<Run | null>(null);
  const [now, setNow] = useState(0);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<Session | null>(null);
  const [endOpen, setEndOpen] = useState(false);
  const [reviewLimit, setReviewLimit] = useState(20);
  const runRef = useRef<Run | null>(null);
  const answerRef = useRef<HTMLInputElement>(null);
  const continueRef = useRef<HTMLButtonElement>(null);
  const pendingRef = useRef<Session[]>([]);
  const saveChain = useRef<Promise<void>>(Promise.resolve());
  const syncReady = useRef(false);
  const allAttempts = useMemo(() => sessions.slice().reverse().flatMap(s => s.attempts), [sessions]);
  const mistakes = useMemo(() => unresolvedMistakes(sessions), [sessions]);
  const skills = useMemo(() => categoryStats(allAttempts), [allAttempts]);
  const weakest = [...skills].filter(s => s.total >= 3).sort((a, b) => (a.accuracy! - b.accuracy!) || ((b.avgMs ?? 0) - (a.avgMs ?? 0)))[0];
  const totalCorrect = allAttempts.filter(a => a.correct).length;
  const accuracy = allAttempts.length ? totalCorrect / allAttempts.length * 100 : null;
  const totalMinutes = sessions.reduce((sum, s) => sum + s.elapsedMs, 0) / 60000;

  const saveSession = useCallback((session: Session) => {
    pendingRef.current = mergeRecords(pendingRef.current, [session]);
    setPending(pendingRef.current);
    const task = async () => {
      setSync("saving");
      try {
        const result = await localStore.insert([session]);
        pendingRef.current = pendingRef.current.filter(item => item.id !== session.id);
        setPending(pendingRef.current);
        setSavedCount(count => count + result.imported);
        setSync(pendingRef.current.length || !syncReady.current ? "error" : "saved");
        if (syncReady.current) setStorageMessage("");
        notifyLocalChange();
      } catch (error) { setStorageMessage(error instanceof Error ? error.message : "Could not save on this device."); setSync("error"); }
    };
    saveChain.current = saveChain.current.then(task, task);
  }, []);

  const loadHistory = useCallback(async () => {
    setSync("loading");
    try {
      const records = await localStore.all();
      setSessions(previous => mergeSessions(records, previous, pendingRef.current));
      setSavedCount(records.length);
      syncReady.current = true;
      setSync(pendingRef.current.length ? "error" : "saved");
      if (!pendingRef.current.length) setStorageMessage("");
    } catch (error) { syncReady.current = false; setStorageMessage(error instanceof Error ? error.message : "Local history could not be loaded."); setSync("error"); }
  }, []);

  useEffect(() => {
    void loadHistory();
    const refresh = () => { if (document.visibilityState === "visible") void loadHistory(); };
    let channel: BroadcastChannel | undefined;
    try { channel = new BroadcastChannel(DATA_SCOPE); channel.onmessage = refresh; } catch { /* Focus refresh works without BroadcastChannel. */ }
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { channel?.close(); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [loadHistory]);
  useEffect(() => { if (tab === "learn") setLearnVisited(true); }, [tab]);
  useEffect(() => {
    try {
      const saved = validPreferences(JSON.parse(localStorage.getItem(PREFERENCES_KEY) ?? "null"));
      if (saved) { setConfig(saved); setReviewAnswerMode(saved.answerMode ?? "input"); }
    } catch { /* Preference storage is optional. */ }
  }, []);
  function changeConfig(next: Config) {
    next = normalizeConfig(next);
    setConfig(next); setReviewAnswerMode(next.answerMode ?? "input");
    try { localStorage.setItem(PREFERENCES_KEY, JSON.stringify(next)); } catch { /* Keep working when preference storage is disabled. */ }
  }
  const finish = useCallback((active: Run, reason: Session["reason"], at: number) => {
    if (!runRef.current) return;
    runRef.current = null;
    const record = finishRun(active, at, reason);
    setRun(null); setEndOpen(false); setResult(record); setInput(""); setError("");
    if (record.attempts.length) { setSessions(previous => mergeSessions(previous, [record])); saveSession(record); }
  }, [saveSession]);
  useEffect(() => {
    if (!run) return;
    const tick = () => { const at = Date.now(); setNow(at); const current = runRef.current; if (current && expired(current, at)) finish(current, "time", at); };
    const timer = window.setInterval(tick, 100);
    document.addEventListener("visibilitychange", tick);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", tick); };
  }, [!!run, finish]);
  useEffect(() => {
    if (!run && !pending.length) return;
    const prevent = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", prevent);
    return () => window.removeEventListener("beforeunload", prevent);
  }, [!!run, pending.length]);
  useEffect(() => {
    if (run && !endOpen) {
      if (run.awaitingExplanation) continueRef.current?.focus();
      else answerRef.current?.focus();
    }
  }, [run?.question.id, run?.awaitingExplanation, endOpen]);
  useEffect(() => {
    if (!run) return;
    const keyboard = (event: KeyboardEvent) => { if (event.key === "Escape" && !endOpen && !backupOpen) { event.preventDefault(); setEndOpen(true); } };
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  }, [!!run, endOpen, backupOpen]);

  function start(next: Config = config, queue: Question[] = []) {
    if (runRef.current) return;
    const at = Date.now();
    const seed = crypto.getRandomValues(new Uint32Array(1))[0];
    const active = createRun(next, crypto.randomUUID(), seed, at, allAttempts, queue);
    runRef.current = active; setRun(active); setNow(at); setInput(""); setError(""); setResult(null); setTab("train");
  }
  function answer(skip = false, expectedQuestionId?: string) {
    const active = runRef.current;
    if (!active || endOpen || active.awaitingExplanation || (expectedQuestionId && active.question.id !== expectedQuestionId)) return;
    try {
      const at = Date.now(), step = advanceRun(active, input, skip, at);
      runRef.current = step.run; setNow(at); setError(""); setInput("");
      if (step.finished) finish(step.run, step.expired ? "time" : "complete", at);
      else { setRun(step.run); answerRef.current?.focus(); }
    } catch (e) { setError(e instanceof Error ? e.message : "Check your answer."); answerRef.current?.focus(); }
  }
  function continuePractice() {
    const active = runRef.current;
    if (!active?.awaitingExplanation || endOpen) return;
    const at = Date.now(), step = continueAfterExplanation(active, at);
    runRef.current = step.run; setNow(at);
    if (step.finished) finish(step.run, "complete", at);
    else setRun(step.run);
  }
  function retry(queue: Question[], answerMode: AnswerMode = reviewAnswerMode) { if (queue.length) start({ mode: "review", focus: "mixed", level: 2, answerMode }, queue.slice(0, 100)); }
  function drill(category: Category, level: Level = config.level, multiplicationStage?: MultiplicationStage, answerMode: AnswerMode = config.answerMode ?? "input") { changeConfig({ mode: "practice", focus: category, level, multiplicationStage, answerMode }); setResult(null); setTab("train"); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function retrySync() { void loadHistory(); pendingRef.current.forEach(saveSession); }
  async function exportData(recovery = false) {
    setDataBusy(true); setDataMessage("");
    try {
      await saveChain.current;
      const records = recovery ? mergeRecords(sessions, pendingRef.current) : mergeRecords(await localStore.all(), pendingRef.current);
      const text = encodeBackup(records, config), blob = new Blob([text], { type: "application/json" });
      const url = URL.createObjectURL(blob), link = document.createElement("a");
      link.href = url; link.download = `quantgym-${recovery ? "recovery" : "backup"}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      setDataMessage(`${records.length} sessions exported${recovery ? " from this open page only; older stored records may be absent" : ", including any unsaved results"}.`);
    } catch (error) { setDataMessage(error instanceof Error ? error.message : "Could not export a backup."); }
    finally { setDataBusy(false); }
  }
  async function importData(file: File) {
    setDataBusy(true); setDataMessage("");
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new Error("Choose a backup smaller than 50 MB.");
      const backup = decodeBackup(await file.text());
      if (runRef.current) throw new Error("Finish the current session before importing.");
      const result = await localStore.insert(backup.sessions);
      await loadHistory(); notifyLocalChange();
      setDataMessage(`Imported ${result.imported} sessions; ${result.duplicates} already present. Existing records and training settings were kept.`);
    } catch (error) { setDataMessage(error instanceof Error ? error.message : "Import failed. Existing records were kept."); }
    finally { setDataBusy(false); if (importRef.current) importRef.current.value = ""; }
  }
  const agentState = useRef({ config, sessions, tab });
  agentState.current = { config, sessions, tab };
  const agentConfigure = useRef((next: Config) => { changeConfig(next); setTab("train"); setResult(null); });
  agentConfigure.current = next => { changeConfig(next); setTab("train"); setResult(null); };
  useEffect(() => {
    type Registry = { registerTool: (tool: { name: string; description: string; inputSchema: object; annotations: { readOnlyHint: boolean }; execute: (input: unknown) => unknown }, options: { signal: AbortSignal }) => void | Promise<void> };
    const context = (document as Document & { modelContext?: Registry }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = (tool: Parameters<Registry["registerTool"]>[0]) => { try { void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => {}); } catch { /* Optional browser API. */ } };
    register({ name: "get_training_progress", description: "Read saved QuantGym session counts and performance. Does not change training state.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true }, execute: () => {
      const records = agentState.current.sessions;
      return { sessions: records.length, recent: records.slice(0, 5).map(s => ({ mode: s.config.mode, ...summarize(s) })) };
    } });
    register({ name: "configure_training", description: "Choose a QuantGym mode, focus, difficulty, optional answer format and multiplication stage, and show the Train view. Sequence questions always use multiple choice. This does not start a timed session.", inputSchema: { type: "object", properties: { mode: { type: "string", enum: MODES_LIST }, focus: { anyOf: [{ type: "string", enum: ["mixed", ...CATEGORIES] }, { type: "array", items: { type: "string", enum: CATEGORIES }, minItems: 1, maxItems: CATEGORIES.length, uniqueItems: true }] }, level: { type: "integer", enum: [1, 2, 3] }, answerMode: { type: "string", enum: ["input", "choice"] }, multiplicationStage: { type: "string", enum: MULTIPLICATION_STAGES } }, required: ["mode", "focus", "level"], additionalProperties: false }, annotations: { readOnlyHint: false }, execute: async (input: unknown) => {
      if (runRef.current) throw new Error("Finish the active session first.");
      const next = input as Config;
      if (!next || typeof next !== "object" || Object.keys(next).some(k => !["mode", "focus", "level", "answerMode", "multiplicationStage"].includes(k)) || !MODES_LIST.includes(next.mode) || !isValidFocus(next.focus) || ![1, 2, 3].includes(next.level)) throw new Error("Invalid training configuration.");
      if (next.answerMode !== undefined && !["input", "choice"].includes(next.answerMode)) throw new Error("Invalid answer format.");
      if (next.multiplicationStage !== undefined && (!MULTIPLICATION_STAGES.includes(next.multiplicationStage) || next.mode !== "practice" || normalizeFocus(next.focus) !== "multiplication")) throw new Error("A multiplication stage requires Free practice with Multiplication focus.");
      agentConfigure.current(next);
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      return { configured: agentState.current.config, started: false };
    } });
    return () => lifecycle.abort();
  }, []);

  const viewResult = (session: Session) => { setResult(session); setTab("train"); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const sample = useMemo(() => generateQuestion(config.focus === "mixed" ? "decimals" : focusCategories(config.focus)[0], config.level, seededRandom(27), "example", config.multiplicationStage), [config.focus, config.level, config.multiplicationStage]);
  const modeInfo = MODES[config.mode];
  const completeSprints = sessions.filter(s => isCurrentGeneration(s) && s.config.mode === "sprint" && s.reason === "time" && sameFocus(s.config.focus, config.focus) && s.config.level === config.level && sameAnswerMode(s.config, config));
  const bestSprint = completeSprints.length ? Math.max(...completeSprints.map(s => summarize(s).correct)) : null;
  const explanationAttempt = run?.awaitingExplanation ? run.attempts.at(-1)! : null;
  const displayedQuestion = explanationAttempt?.question ?? run?.question;

  return <div className="qg-app">
    <header className="app-header">
      <div className="brand"><div className="brand-mark"><img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" /></div><div>quant<span>gym</span></div></div>
      <div className="header-divider" /><span className="header-caption">The mental math training floor</span>
      <div className="header-right"><div className="sync-badge" aria-live="polite">{sync === "loading" || sync === "saving" ? <Loader2 className="animate-spin" /> : sync === "saved" ? <HardDrive /> : <X />}<span>{sync === "loading" ? "Loading progress" : sync === "saving" ? "Saving session" : sync === "saved" ? "Saved on this device" : "Not saved on this device"}</span></div>
        <Dialog open={backupOpen} onOpenChange={setBackupOpen}><DialogTrigger asChild><button className="text-button"><HardDrive />Local data</button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Your data, on this device</DialogTitle><DialogDescription>History is stored in this browser. Export a backup to move it to another browser or device. No account is needed.</DialogDescription></DialogHeader><div className="local-data-content"><p>{savedCount} saved sessions · {pending.length} waiting to save</p><p>Clearing this site's browser data removes local history. Private browsing may remove it when the window closes. Keep a backup of records you want to retain.</p><div className="local-data-actions"><button className="primary-button" disabled={dataBusy} onClick={() => void exportData()}><Download />Export all history</button><button className="secondary-button" disabled={dataBusy || !!run} onClick={() => importRef.current?.click()}><Upload />Import backup</button></div>{run && <p>Finish the current session before importing.</p>}<input ref={importRef} className="sr-only" type="file" accept=".json,application/json" aria-label="Import QuantGym backup" disabled={!!run || dataBusy} onChange={event => { const file = event.target.files?.[0]; if (file) void importData(file); }} />{sync === "error" && <button className="text-button" disabled={dataBusy} onClick={() => void exportData(true)}>Storage unavailable? Export results from this open page only.</button>}<p role="status" className="local-data-message">{dataBusy ? "Working on your backup…" : dataMessage}</p><p>Imports are checked before saving. Existing sessions are kept; importing the same backup twice does not create duplicates.</p></div></DialogContent></Dialog>
        <Dialog><DialogTrigger asChild><button className="icon-button" aria-label="Training help"><CircleHelp /></button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Find your rhythm</DialogTitle><DialogDescription>A few things to know before your first rep.</DialogDescription></DialogHeader><div className="help-content">
          <p><strong>Answer, then move.</strong> Type your answer and press <kbd>Enter</kbd>. Press <kbd>Shift + Enter</kbd> to skip. Timed sessions keep running when you switch tabs or open a dialog.</p>
          <p><strong>Choose your mix.</strong> Select any combination under Focus. Mixed clears individual selections and includes all skills. Adaptive practice stays within your selected skills.</p>
          <p><strong>Decimal practice.</strong> Choose Decimal multiplication for questions like 28.5 × 24.7, or Decimal division for 84.24 ÷ 2.4. Mid uses tenths; Hard adds hundredths. Easy integer multiplication uses 12–49 × 2–19, Mid uses two-digit factors, and Hard uses three-digit × two-digit. Free practice also offers all four multiplication ladder stages.</p>
          <p><strong>Learn the techniques.</strong> Open Learn for 18 technique lessons, including a four-stage path to three-digit × three-digit multiplication, with worked examples, guided steps, and independent practice. Lesson exercises are untimed. Each ladder stage has its own 20-question practice set.</p>
          <p><strong>Sequence practice & choices.</strong> Choose Sequence practice to find the next number from four options. Other skills support typed answers or multiple choice in every mode, including mistake retries. Select an option, then confirm; A–D also selects. Sprint records keep the two answer formats separate.</p>
          <p><strong>No repeats.</strong> Each session tracks every question, including wrong answers and skips. Swapped factors and equivalent fraction sums count as the same question. If all questions at your selected level are used, the session ends with your results.</p>
          <p><strong>Learn at your pace.</strong> Free practice and mistake retries pause after a wrong or skipped answer to show a worked method. Select Next question when ready. Reading time does not count toward the next answer’s response time.</p>
          <p><strong>Exact answers.</strong> Use numbers, decimals, or fractions like <code>3/4</code>. Equivalent fractions are accepted; repeating decimals need an exact fraction. Use the ± and / buttons on a phone.</p>
          <p><strong>Scoring.</strong> Sprint, adaptive and practice count correct answers. The 80 in 8 preset scores +1 correct, −1 incorrect, 0 skipped. Accuracy includes skipped questions. Average response time uses correct answers only.</p>
          <p><strong>Adaptive practice.</strong> Mistakes and slower answers increase a skill’s frequency. Five fast correct answers raise difficulty; two or fewer correct in a block of five lower it.</p>
          <p><strong>Your progress.</strong> Completed sessions stay in this browser on this device. Analytics show the latest 100; backups include all saved sessions. Use Local data to export or import a backup before moving devices or clearing browser data. Private browsing may discard data when closed.</p>
          <p className="muted small">QuantGym uses original practice questions and its own presets. It is not affiliated with a trading firm or assessment provider.</p>
        </div></DialogContent></Dialog>
      </div>
    </header>

    {sync === "error" && <div className="notice" style={{ marginTop: 20 }} role="status"><span>{pending.length ? `${pending.length} session(s) waiting to save. ` : ""}{storageMessage || "Local history is unavailable. You can still train."}</span><button className="text-button" onClick={retrySync}>Retry <RotateCcw /></button><button className="text-button" onClick={() => setBackupOpen(true)}>Export <Download /></button></div>}


    {run ? <div className="session-surface">
      <div className="session-toolbar"><div><span className="eyebrow">Session in progress</span><h1>{MODES[run.config.mode].name}</h1></div><div className="live-stats"><div className="optional"><span>CORRECT</span><strong className="lime">{run.attempts.filter(a => a.correct).length}</strong></div><div><span>{run.deadline ? "REMAINING" : "ELAPSED"}</span><strong className={run.deadline && run.deadline - now < 15000 ? "clock-warning" : ""}>{formatTime(run.deadline ? run.deadline - now : now - run.startedAt)}</strong></div></div></div>
      <div className="arena live-arena"><Progress className="session-progress" value={run.deadline ? Math.max(0, (run.deadline - now) / (run.deadline - run.startedAt) * 100) : run.attempts.length / (run.target || 20) * 100} aria-label={run.deadline ? "Time remaining" : "Questions completed"} />
        <div className="arena-top"><div className="arena-label"><Crosshair />{LABELS[displayedQuestion!.category]}<span className="muted">/ {run.config.multiplicationStage ? STAGE_LABELS[run.config.multiplicationStage] : LEVELS[displayedQuestion!.level]}</span></div><span className="arena-mode">{String(run.attempts.length + (explanationAttempt ? 0 : 1)).padStart(2, "0")}{run.target ? ` / ${run.target}` : ""}</span></div>
        <div className="arena-center"><span className="sample-label">{explanationAttempt ? "Take a moment to learn" : run.question.category === "sequences" ? "What comes next? Use the simplest pattern." : "Your next rep"}</span><div className={`live-equation ${displayedQuestion!.category === "sequences" ? "sequence-equation" : ""}`} aria-live="polite" aria-atomic="true">{displayedQuestion!.expression}</div>
          {explanationAttempt ? <div className="practice-explanation">
            <div role="status" aria-live="polite"><p className="practice-outcome">{explanationAttempt.skipped ? "Skipped" : `Your answer: ${explanationAttempt.input}`}</p><p className="practice-correction">Correct answer <strong>{formatQuestionAnswer(explanationAttempt.question)}</strong></p><div className="worked-method"><span className="sample-label">One way to solve it</span><p>{questionExplanation(explanationAttempt.question)}</p></div></div>
            <button ref={continueRef} className="primary-button" onClick={continuePractice} onKeyDown={e => { if (e.repeat && (e.key === "Enter" || e.key === " ")) e.preventDefault(); }}>{run.target !== null && run.attempts.length >= run.target ? "View results" : "Next question"}<ArrowRight /></button>
            <p className="practice-note">Read at your pace. The next question’s clock starts when you continue.</p>
          </div> : <>
          {usesChoices(run.config, run.question) ? <AnswerChoices key={run.question.id} choices={questionChoices(run.question)} value={input} onChange={value => { setInput(value); setError(""); }} onSubmit={() => answer(false, run.question.id)} disabled={endOpen} /> : <><form className="answer-form" onSubmit={e => { e.preventDefault(); answer(); }}><label className="sr-only" htmlFor="answer">Your answer</label><input ref={answerRef} id="answer" className="answer-input" value={input} onChange={e => { setInput(e.target.value); setError(""); }} onKeyDown={e => { if (e.repeat && e.key === "Enter") e.preventDefault(); else if (e.key === "Enter" && e.shiftKey) { e.preventDefault(); answer(true); } }} placeholder="Your answer" inputMode="decimal" autoComplete="off" autoCorrect="off" spellCheck={false} maxLength={40} aria-describedby="answer-feedback" /><button className="primary-button submit-button" aria-label="Submit answer" type="submit"><CornerDownLeft /></button></form>
          <div className="answer-extras"><button aria-label="Toggle negative sign" onClick={() => { setInput(v => v.startsWith("-") ? v.slice(1) : `-${v}`); answerRef.current?.focus(); }}>±</button><button aria-label="Insert fraction slash" onClick={() => { setInput(v => v.includes("/") ? v : `${v}/`); answerRef.current?.focus(); }}>/</button><span>Numbers, decimals or fractions</span></div></>}
          <div id="answer-feedback" aria-live="polite" className={`answer-feedback ${error ? "wrong" : run.attempts.at(-1)?.correct ? "correct" : "wrong"}`}>{error ? <><X />{error}</> : run.attempts.length ? <>{run.attempts.at(-1)!.correct ? <><Check />Correct</> : <>{run.attempts.at(-1)!.skipped ? <SkipForward /> : <X />}{run.attempts.at(-1)!.skipped ? "Skipped" : "Not quite"} · {run.attempts.at(-1)!.question.expression} = {formatQuestionAnswer(run.attempts.at(-1)!.question)}</>}</> : null}</div>
          </>}
        </div><div className="arena-bottom">{!explanationAttempt && <button className="text-button" onClick={() => answer(true)}>Skip question <SkipForward /></button>}<span>{explanationAttempt ? "Understand the method, then take another rep." : "Every rep counts. Stay accurate."}</span><button className="text-button muted" onClick={() => setEndOpen(true)}>End session</button></div>
      </div><div className="keyboard-hints">{!explanationAttempt && usesChoices(run.config, run.question) && <span><kbd>A–D</kbd> choose an option</span>}<span><kbd>Enter</kbd> {explanationAttempt ? "continue" : "submit answer"}</span>{!explanationAttempt && !usesChoices(run.config, run.question) && <span><kbd>Shift ↵</kbd> skip question</span>}<span><kbd>Esc</kbd> end session</span></div>
      <Dialog open={endOpen} onOpenChange={setEndOpen}><DialogContent><DialogHeader><DialogTitle>Finish this session?</DialogTitle><DialogDescription>Your completed answers will be saved for review. The timer is still running.</DialogDescription></DialogHeader><DialogFooter><button className="secondary-button" onClick={() => setEndOpen(false)}>Keep training</button><button className="primary-button" onClick={() => { const active = runRef.current; if (active) finish(active, "ended", Date.now()); }}>Finish & review</button></DialogFooter></DialogContent></Dialog>
    </div> : <Tabs value={tab} onValueChange={value => { setTab(value); setResult(null); }}>
      <div className="nav-row"><TabsList className="main-tabs" aria-label="QuantGym views"><TabsTrigger value="train"><Zap />Train</TabsTrigger><TabsTrigger value="learn"><BookOpen />Learn</TabsTrigger><TabsTrigger value="progress"><BarChart3 />Progress</TabsTrigger><TabsTrigger value="review"><RotateCcw />Review{mistakes.length > 0 && <span className="tab-count">{mistakes.length}</span>}</TabsTrigger></TabsList><span className="edition">NEW / SEQUENCES & ANSWER CHOICES</span></div>
      <TabsContent value="train">
        {result ? <SessionResult session={result} onAgain={() => result.config.mode === "review" ? retry(unresolvedMistakes([result]).map(a => a.question), result.config.answerMode) : start(result.config)} onBack={() => setResult(null)} onRetry={() => retry(unresolvedMistakes([result]).map(a => a.question), result.config.answerMode)} /> : <>
          <div className="page-heading"><div><span className="eyebrow">Build speed. Keep accuracy.</span><h1>Time for a few good reps.</h1><p className="muted">Choose your session and get into the numbers.</p><button className="text-button" onClick={() => drill("sequences", 1, undefined, "choice")}>Sequence practice · Multiple choice<ArrowRight /></button></div><span className="muted small">{sessions.length ? `${sessions.length} sessions in the bank` : "Your first session starts here"}</span></div>
          <div className="training-grid"><aside className="setup-panel" aria-label="Training setup"><div className="section-label"><span className="index">01</span> Choose a session</div><RadioGroup value={config.mode} onValueChange={value => changeConfig({ ...config, mode: value as Mode })} className="mode-group" aria-label="Session mode">{MODES_LIST.map(mode => { const Icon = MODE_ICONS[mode]; return <label className={`mode-card ${config.mode === mode ? "selected" : ""}`} key={mode}><span className="mode-icon"><Icon /></span><span className="mode-copy"><strong>{MODES[mode].name}</strong><small>{mode === "sprint" ? "Speed & accuracy" : mode === "adaptive" ? "Train your weak spots" : mode === "challenge" ? "The longer challenge" : "Find your technique"}</small></span><RadioGroupItem value={mode} aria-label={MODES[mode].name} /></label>; })}</RadioGroup>
            <div className="setup-divider" /><div className="section-label"><span className="index">02</span> Make it yours</div><div className="setup-fields"><div className="field-block"><label className="field-label" id="focus-label">Focus</label><FocusPicker value={config.focus} onChange={focus => changeConfig({ ...config, focus })} /></div>{config.mode === "practice" && config.focus === "multiplication" && <div className="field-block stage-picker" lang="en"><label className="field-label" id="stage-label">Learning ladder practice</label><Select value={config.multiplicationStage ?? "standard"} onValueChange={value => changeConfig({ ...config, multiplicationStage: value === "standard" ? undefined : value as MultiplicationStage })}><SelectTrigger aria-labelledby="stage-label"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="standard">Standard difficulty</SelectItem>{MULTIPLICATION_STAGES.map(stage => <SelectItem key={stage} value={stage}>{STAGE_LABELS[stage]}</SelectItem>)}</SelectContent></Select>{config.multiplicationStage && <p className="level-description">20 untimed questions for this stage, with worked steps after mistakes. Aim for at least 18 correct consistently before moving up.</p>}</div>}<div className="field-block answer-mode-field"><label className="field-label" id="answer-mode-label">Answer format</label><RadioGroup className="levels answer-mode-toggle" value={config.answerMode ?? "input"} onValueChange={value => changeConfig({ ...config, answerMode: value as AnswerMode })} aria-labelledby="answer-mode-label">{(["input", "choice"] as AnswerMode[]).map(mode => <label key={mode} className={`level-choice ${(config.answerMode ?? "input") === mode ? "selected" : ""}`}><RadioGroupItem value={mode} disabled={config.focus === "sequences" && mode === "input"} />{mode === "input" ? "Typed answers" : "Multiple choice"}</label>)}</RadioGroup>{focusCategories(config.focus).includes("sequences") && <p className="level-description">Sequences always use four answer choices. This setting applies to other mental math questions.</p>}</div><div className="field-block" hidden={!!config.multiplicationStage} style={{ marginTop: 19 }}><label className="field-label" id="level-label">{config.mode === "adaptive" ? "Starting level" : "Difficulty"}</label><RadioGroup className="levels" value={String(config.level)} onValueChange={value => changeConfig({ ...config, level: Number(value) as Level })} aria-labelledby="level-label">{([1, 2, 3] as Level[]).map(level => <label key={level} className={`level-choice ${config.level === level ? "selected" : ""}`}><RadioGroupItem value={String(level)} aria-label={LEVELS[level]} />{["Easy", "Mid", "Hard"][level - 1]}</label>)}</RadioGroup><p className="level-description">{difficultyDescription(config.focus, config.level)}</p></div></div>
          </aside><div><section className="arena" aria-label="Start a training session"><div className="arena-top"><span className="arena-label"><MODE_ICON mode={config.mode} />{modeInfo.name}</span><span className="arena-mode">{modeInfo.short.toUpperCase()}</span></div><div className="arena-center"><span className="sample-label">{trainingLabel(config)}</span><div className={`sample-equation ${sample.category === "sequences" ? "sequence-equation" : ""}`}>{sample.expression} {sample.category !== "sequences" && <span className="question-mark">= ?</span>}</div><p className="arena-description">{modeInfo.detail}</p><button className="primary-button start-button" onClick={() => start()}><Play size={17} fill="currentColor" />Start training<ArrowRight /></button><span className="muted" style={{ fontSize: 12, marginTop: 12 }}>Example above · no repeated questions within a session</span></div><div className="arena-bottom"><span><CheckCircle2 />{config.mode === "challenge" ? "+1 / −1 scoring" : "Accuracy first"}</span><span><Clock3 />{modeInfo.time ? "Live countdown" : "No time pressure"}</span><span><RotateCcw />Review every answer</span></div></section>
            <div className="stats-strip"><Stat label="Best sprint · new difficulty" value={bestSprint === null ? "—" : bestSprint} unit="correct" icon={<Trophy />} /><Stat label="Overall accuracy" value={pct(accuracy)} icon={<Crosshair />} /><Stat label="Practice logged" value={totalMinutes ? Math.round(totalMinutes) : "—"} unit="min" icon={<Timer />} /></div>
          </div></div>
          <div className="below-grid"><section className="panel"><div className="panel-header"><h2>Recent sessions</h2><button className="text-button" onClick={() => setTab("progress")}>All progress <ArrowUpRight /></button></div>{sessions.length ? <div>{sessions.slice(0, 3).map(s => <div className="recent-item" key={s.id}><div><strong>{MODES[s.config.mode].name}</strong><small>{dateLabel(s.startedAt)} · {trainingLabel(s.config)}</small></div><span className="mono">{summarize(s).correct}<small>correct</small></span><button className="icon-button" aria-label={`Review ${MODES[s.config.mode].name} from ${dateLabel(s.startedAt)}`} onClick={() => viewResult(s)}><ArrowUpRight /></button></div>)}</div> : <div className="empty-compact"><div className="empty-icon"><History /></div><div><strong>A clean slate. A good place to start.</strong><p>Your sessions and scores will appear here.</p></div></div>}</section>
          <section className="panel"><div className="panel-header"><h2>Your next focus</h2><Sparkles size={18} color="#c4f75b" /></div><div className="focus-tip"><strong>{weakest ? LABELS[weakest.category] : "Find your baseline."}</strong><p>{weakest ? `${pct(weakest.accuracy)} accuracy over ${weakest.total} reps${weakest.avgMs !== null ? `, averaging ${seconds(weakest.avgMs)} on correct answers` : ""}. A focused set can help.` : "Start with a mixed sprint. Once you’ve tried a few of each type, your practice will point you toward your next focus."}</p>{weakest && <button className="text-button" style={{ marginTop: 10 }} onClick={() => drill(weakest.category)}>Train {LABELS[weakest.category].toLowerCase()} <ArrowRight /></button>}</div></section></div>
        </>}
      </TabsContent>
      <TabsContent value="learn" forceMount hidden={tab !== "learn"}>{(tab === "learn" || learnVisited) && <Suspense fallback={<div className="panel" role="status">Loading technique lessons…</div>}><QuantLearn active={tab === "learn"} onPractice={drill} /></Suspense>}</TabsContent>
      <TabsContent value="progress"><div className="page-heading"><div><span className="eyebrow">Small reps. Visible progress.</span><h1>Your training, in numbers.</h1><p className="muted">A closer look at your latest {sessions.length || 0} saved sessions.</p></div><button className="secondary-button" onClick={() => setTab("train")}><Zap />Train again</button></div>
        <div className="overview-metrics"><OverviewMetric label="Sessions" value={sessions.length} detail="Latest 100 shown" /><OverviewMetric label="Correct answers" value={totalCorrect} detail={`${allAttempts.length} total attempts`} /><OverviewMetric label="Accuracy" value={pct(accuracy)} detail="Includes skipped questions" /><OverviewMetric label="Practice time" value={`${Math.round(totalMinutes)}m`} detail="Across all modes" /></div>
        <div className="progress-grid"><section className="panel"><div className="panel-header"><h2>Sprint pace</h2><span className="muted small">Correct / minute</span></div><SprintChart sessions={sessions} /><p className="muted" style={{ fontSize: 12, marginTop: 15 }}>Updated difficulty only · completed 2-min mixed, standard sprints · typed answers</p></section><section className="panel"><div className="panel-header"><h2>Skill breakdown</h2><span className="muted small">Accuracy</span></div>{skills.map(skill => <div className="skill-row" key={skill.category}><div className="skill-title"><button className="text-button" onClick={() => drill(skill.category)}>{LABELS[skill.category]}</button><span>{skill.total ? `${pct(skill.accuracy)} · ${skill.total} reps` : "No reps yet"}</span></div><Progress className="skill-progress" value={skill.accuracy ?? 0} aria-label={`${LABELS[skill.category]} accuracy`} /></div>)}</section></div>
        <section className="panel" style={{ marginTop: 24 }}><div className="panel-header"><h2>Session history</h2><span className="muted small">Select a session to review</span></div>{sessions.length ? <Table className="result-table"><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Session</TableHead><TableHead>Correct</TableHead><TableHead>Accuracy</TableHead><TableHead>Duration</TableHead><TableHead><span className="sr-only">Review</span></TableHead></TableRow></TableHeader><TableBody>{sessions.map(s => { const summary = summarize(s); return <TableRow key={s.id}><TableCell>{dateLabel(s.startedAt)}</TableCell><TableCell>{MODES[s.config.mode].name}<div className="muted" style={{ fontSize: 12 }}>{trainingLabel(s.config)}{!isCurrentGeneration(s) ? " · Earlier difficulty" : ""}{s.reason === "ended" ? " · Ended early" : s.reason === "exhausted" ? " · All unique questions used" : ""}</div></TableCell><TableCell className="mono lime">{summary.correct}</TableCell><TableCell className="mono">{pct(summary.accuracy)}</TableCell><TableCell className="mono">{formatTime(s.elapsedMs)}</TableCell><TableCell><button className="text-button" onClick={() => viewResult(s)} aria-label={`Review session from ${dateLabel(s.startedAt)}`}><ArrowUpRight /></button></TableCell></TableRow>; })}</TableBody></Table> : <Empty><EmptyHeader><EmptyMedia variant="icon"><BarChart3 /></EmptyMedia><EmptyTitle>Get your first numbers on the board</EmptyTitle><EmptyDescription>Finish a session to see your accuracy, speed and skill breakdown.</EmptyDescription></EmptyHeader><EmptyContent><button className="primary-button" onClick={() => setTab("train")}>Start training <ArrowRight /></button></EmptyContent></Empty>}</section>
      </TabsContent>
      <TabsContent value="review"><div className="learn-answer-mode"><span id="review-answer-mode-label">Review answer format</span><RadioGroup className="levels answer-mode-toggle" value={reviewAnswerMode} onValueChange={value => setReviewAnswerMode(value as AnswerMode)} aria-labelledby="review-answer-mode-label">{(["input", "choice"] as AnswerMode[]).map(mode => <label key={mode} className={`level-choice ${reviewAnswerMode === mode ? "selected" : ""}`}><RadioGroupItem value={mode} />{mode === "input" ? "Typed answers" : "Multiple choice"}</label>)}</RadioGroup><p>Sequence questions always use multiple choice.</p></div><div className="page-heading"><div><span className="eyebrow">Turn mistakes into muscle memory.</span><h1>Another rep. A better answer.</h1><p className="muted">{mistakes.length ? `${mistakes.length} missed or skipped questions to revisit.` : "Your missed questions and techniques will live here."}</p></div>{mistakes.length > 0 && <button className="primary-button" onClick={() => retry(mistakes.map(a => a.question))}><RotateCcw />Retry {Math.min(mistakes.length, 100)} questions</button>}</div>{mistakes.length ? <><div className="review-grid">{mistakes.slice(0, reviewLimit).map(a => <article className="panel review-card" key={`${a.question.category}:${a.question.expression}`}><div className="review-category"><span>{LABELS[a.question.category]} · {LEVELS[a.question.level]}</span><span>{a.skipped ? "Skipped" : `${(a.ms / 1000).toFixed(1)}s`}</span></div><div className="review-equation">{a.question.expression} <span className="lime">= {formatQuestionAnswer(a.question)}</span></div><p className="review-answer">Your answer: <span style={{ color: "#ffb3a3" }}>{a.skipped ? "Skipped" : a.input}</span> · Correct: <strong>{formatQuestionAnswer(a.question)}</strong></p><p className="review-explanation">{questionExplanation(a.question)}</p><button className="text-button" style={{ marginTop: 12 }} onClick={() => drill(a.question.category)}>Practice this skill <ArrowRight /></button></article>)}</div>{reviewLimit < mistakes.length && <div className="pagination-row"><button className="secondary-button" onClick={() => setReviewLimit(v => v + 20)}>Show 20 more</button></div>}</> : <Empty className="panel large-empty"><EmptyHeader><EmptyMedia variant="icon"><CheckCircle2 /></EmptyMedia><EmptyTitle>{sessions.length ? "All caught up." : "Room to learn."}</EmptyTitle><EmptyDescription>{sessions.length ? "You have no outstanding mistakes in your recent sessions. Keep the momentum going." : "After a session, missed questions appear here with a worked method and a chance to retry."}</EmptyDescription></EmptyHeader><EmptyContent><button className="primary-button" onClick={() => setTab("train")}>Back to training <ArrowRight /></button></EmptyContent></Empty>}</TabsContent>
    </Tabs>}
    <footer className="app-footer"><span>QUANTGYM / PRACTICE WITH INTENTION</span><span>Original practice questions · Independent of trading firms</span></footer>
  </div>;
}

function MODE_ICON({ mode }: { mode: Mode }) { const Icon = MODE_ICONS[mode]; return <Icon />; }
function Stat({ label, value, unit, icon }: { label: string; value: string | number; unit?: string; icon: React.ReactNode }) { return <div className="stat-cell"><span className="stat-label">{icon}{label}</span><strong className="stat-value">{value}{unit && <span className="stat-unit">{unit}</span>}</strong></div>; }
function OverviewMetric({ label, value, detail }: { label: string; value: string | number; detail: string }) { return <div className="overview-metric"><span className="stat-label">{label}</span><strong>{value}</strong><p>{detail}</p></div>; }
function SprintChart({ sessions }: { sessions: Session[] }) {
  const data = sessions.filter(s => isCurrentGeneration(s) && s.config.mode === "sprint" && s.reason === "time" && sameFocus(s.config.focus, "mixed") && s.config.level === 2 && (s.config.answerMode ?? "input") === "input").slice(0, 12).reverse().map((s, i) => ({ session: i + 1, date: dateLabel(s.startedAt), pace: Number(summarize(s).cpm.toFixed(1)) }));
  if (!data.length) return <div className="chart-empty"><div className="empty-icon"><BarChart3 /></div><h3>Your pace starts with a first sprint.</h3><p className="muted">Complete a mixed, standard sprint at the updated difficulty to start this chart. Earlier scores stay in your history.</p></div>;
  return <ChartContainer className="chart-frame" config={{ pace: { label: "Correct / min", color: "#c4f75b" } }}><LineChart data={data} margin={{ left: 0, right: 15, top: 20, bottom: 5 }} accessibilityLayer><CartesianGrid vertical={false} stroke="#343f2b" strokeDasharray="3 5" /><XAxis dataKey="session" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} tickMargin={10} /><YAxis tickLine={false} axisLine={false} width={35} domain={[0, "auto"]} tick={{ fontSize: 12 }} /><ChartTooltip content={<ChartTooltipContent labelFormatter={(_, payload) => `Session ${payload?.[0]?.payload?.session} · ${payload?.[0]?.payload?.date}`} />} /><Line type="linear" dataKey="pace" stroke="#c4f75b" strokeWidth={2.5} dot={{ r: 4, fill: "#c4f75b", strokeWidth: 0 }} activeDot={{ r: 6 }} isAnimationActive={false} /></LineChart></ChartContainer>;
}
function SessionResult({ session, onAgain, onBack, onRetry }: { session: Session; onAgain: () => void; onBack: () => void; onRetry: () => void }) {
  const summary = summarize(session), [onlyMissed, setOnlyMissed] = useState(false);
  const missed = session.attempts.filter(a => !a.correct), attempts = onlyMissed ? missed : session.attempts;
  return <div className="session-surface"><button className="text-button muted" onClick={onBack}><ChevronLeft />Back to training</button><div className="result-heading"><div className="result-icon"><Flame size={27} /></div><span className="eyebrow">{session.reason === "time" ? "Time’s up" : session.reason === "ended" ? "Session ended" : session.reason === "exhausted" ? "All unique questions completed" : "Session complete"}</span><h1>{summary.total ? "Good reps. Now build on them." : "Ready when you are."}</h1><p className="muted">{MODES[session.config.mode].name} · {trainingLabel(session.config)}</p></div>
    <div className="panel result-card"><div className="result-score"><span className="sample-label">{session.config.mode === "challenge" ? "Net score" : "Correct answers"}</span><strong>{summary.score}</strong><span className="muted small">{summary.total} questions attempted</span></div><div className="result-metrics"><div><strong>{pct(summary.accuracy)}</strong><span>Accuracy, including skips</span></div><div><strong>{summary.cpm.toFixed(1)}</strong><span>Correct per minute</span></div><div><strong>{seconds(summary.avgMs)}</strong><span>Average correct answer</span></div><div><strong>{formatTime(session.elapsedMs)}</strong><span>Session duration</span></div></div></div>{session.reason === "exhausted" && <p className="pool-exhausted" role="status">You have used every unique question in the selected skills at this level. Choose another level or start a new session for more practice.</p>}<div className="result-breakdown"><span className="lime">{summary.correct} correct</span><span>{summary.wrong} incorrect</span><span>{summary.skipped} skipped</span></div>
    <div className="result-actions">{session.config.mode !== "review" && <button className="primary-button" onClick={onAgain}><Play />Go again</button>}{missed.length > 0 && <button className="secondary-button" onClick={onRetry}><RotateCcw />Retry mistakes ({unresolvedMistakes([session]).length})</button>}<button className="secondary-button" onClick={onBack}>Change session</button></div>
    {session.attempts.length > 0 && <section className="panel"><div className="panel-header"><h2>Every answer, explained</h2><Tabs value={onlyMissed ? "missed" : "all"} onValueChange={v => setOnlyMissed(v === "missed")}><TabsList><TabsTrigger value="all">All</TabsTrigger><TabsTrigger value="missed">Missed</TabsTrigger></TabsList></Tabs></div><Table className="result-table"><TableHeader><TableRow><TableHead>Question</TableHead><TableHead>Your answer</TableHead><TableHead>Result</TableHead><TableHead>Time</TableHead></TableRow></TableHeader><TableBody>{attempts.map((a, i) => <TableRow key={`${a.question.id}:${i}`}><TableCell><div className="equation-cell">{a.question.expression} = <span className="lime">{formatQuestionAnswer(a.question)}</span></div>{!a.correct && <p className="muted" style={{ fontSize: 13, lineHeight: 1.65, marginTop: 8, maxWidth: 430 }}>{questionExplanation(a.question)}</p>}</TableCell><TableCell className="mono">{a.skipped ? "—" : a.input}</TableCell><TableCell><span className={`outcome ${a.correct ? "correct" : "wrong"}`}>{a.correct ? <Check /> : a.skipped ? <SkipForward /> : <X />}{a.correct ? "Correct" : a.skipped ? "Skipped" : "Incorrect"}</span></TableCell><TableCell className="mono">{seconds(a.ms)}</TableCell></TableRow>)}</TableBody></Table>{!attempts.length && <p className="muted small" style={{ padding: 18 }}>No missed answers in this session.</p>}</section>}
  </div>;
}
