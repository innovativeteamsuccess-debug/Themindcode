"use client";

/* ============================================================
   LESSON MODE — the player engine.

   Executes a LessonPlan like a teacher running a live class:
     for each step: SAY (TTS + subtitle) while DOING (board actions
     animate with ink timing) → dwell → optional question → wait
     for the student → respond turn (correct/clarify/celebrate)
     → continue. Student utterances at any moment become soft
     interrupts handled between steps.
   ============================================================ */

import { useCallback, useEffect, useRef } from "react";
import { useStudio } from "../store";
import type { LessonConfig, StudentModel, TeachStep, TeachTurn } from "./types";
import { emptyStudentModel } from "./types";
import { animateCamera, animateInk, boardSnapshot, interpret } from "./interpreter";
import { speak, stopSpeaking, warmVoice } from "./voice";

const STUDENT_KEY = "tmc-student-model-v1";
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function loadStudent(): StudentModel {
  if (typeof window === "undefined") return emptyStudentModel();
  try {
    const raw = window.localStorage.getItem(STUDENT_KEY);
    if (raw) return { ...emptyStudentModel(), ...(JSON.parse(raw) as StudentModel) };
  } catch { /* noop */ }
  return emptyStudentModel();
}

function saveStudent(s: StudentModel) {
  try {
    window.localStorage.setItem(STUDENT_KEY, JSON.stringify(s));
  } catch { /* noop */ }
}

export function useLesson() {
  const pauseRef = useRef(false);
  const stopRef = useRef(false);
  const answerResolve = useRef<((msg: string) => void) | null>(null);
  const interrupts = useRef<string[]>([]);
  const speakingRef = useRef<{ cancel: () => void } | null>(null);

  /* warm TTS voices once */
  useEffect(() => {
    warmVoice();
    /* hydrate the student model into the store */
    useStudio.getState().lessonPatch({ student: loadStudent() });
  }, []);

  const patch = useCallback((p: Parameters<typeof useStudio.getState>[0] extends never ? never : Record<string, unknown>) => {
    (useStudio.getState() as unknown as { lessonPatch: (x: Record<string, unknown>) => void }).lessonPatch(p);
  }, []);

  /* ---------------- low-level runners ---------------- */

  const waitForAnswer = useCallback(
    () => new Promise<string>((resolve) => { answerResolve.current = resolve; }),
    []
  );

  const waitIfPaused = useCallback(async () => {
    while (pauseRef.current && !stopRef.current) await sleep(220);
  }, []);

  const runActions = useCallback(
    async (actions: TeachStep["actions"]) => {
      const st = useStudio.getState();
      const reduce = st.settings.reduceMotion;
      let lastCenter: { x: number; y: number } | null = null;

      for (const action of actions) {
        if (stopRef.current) return;
        await waitIfPaused();

        const r = interpret(action);

        if (r.eraseIds.length) {
          st.removeObjects(r.eraseIds);
        }
        if (r.camera) {
          await animateCamera(r.camera, reduce);
        }
        if (r.checkpointName) {
          useStudio.getState().pushCheckpoint(r.checkpointName);
        }
        if (r.objects.length) {
          const prepared = r.objects.map((o) => {
            const id = st.addObject({ ...o.input, ink: 0 } as never);
            return { id, drawMs: o.drawMs };
          });
          st.persistNow();
          await animateInk(prepared, reduce);
          const last = r.objects[r.objects.length - 1].input as { x?: number; y?: number; w?: number; h?: number };
          lastCenter = { x: (last.x ?? 0) + (last.w ?? 0) / 2, y: (last.y ?? 0) + (last.h ?? 0) / 2 };
        }

        /* keep the newest content comfortably in view */
        if (lastCenter && !reduce) {
          const s2 = useStudio.getState();
          const cam = s2.camera;
          const viewW = s2.viewport.w / cam.z;
          const viewH = s2.viewport.h / cam.z;
          const left = -cam.x / cam.z;
          const top = -cam.y / cam.z;
          const inside =
            lastCenter.x > left + 60 && lastCenter.x < left + viewW - 60 &&
            lastCenter.y > top + 60 && lastCenter.y < top + viewH - 60;
          if (!inside) {
            const target = {
              x: s2.viewport.w / 2 - lastCenter.x * cam.z,
              y: s2.viewport.h / 2 - lastCenter.y * cam.z,
              z: cam.z,
            };
            await animateCamera(target, reduce);
          }
        }
      }
    },
    [waitIfPaused]
  );

  const speakAndDo = useCallback(
    async (say: string, actions: TeachStep["actions"], voice: boolean) => {
      patch({ say });
      const spoken = voice ? speak(say) : null;
      speakingRef.current = spoken;
      /* teacher starts writing shortly after beginning the sentence */
      const actionsDone = (async () => {
        await sleep(500);
        await runActions(actions);
      })();
      await Promise.all([spoken ? spoken.done : sleep(Math.min(9000, Math.max(1500, say.length * 52))), actionsDone]);
    },
    [patch, runActions]
  );

  /* ---------------- teacher turn (respond) ---------------- */

  const handleTurn = useCallback(
    async (message: string, config: LessonConfig, plan: TeachStep[], stepIndex: number) => {
      const st = useStudio.getState();
      patch({ phase: "teaching", verdict: null });
      let res: Response;
      try {
        res = await fetch("/api/studio/teach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "respond",
            config,
            student: st.lesson.student,
            lesson: {
              title: st.lesson.title || config.topic,
              done: plan.slice(0, stepIndex).map((s) => ({ phase: s.phase, say: s.say })),
              next: plan[stepIndex] ? { phase: plan[stepIndex].phase, say: plan[stepIndex].say } : null,
            },
            board: boardSnapshot(),
            message,
          }),
        });
      } catch {
        patch({ say: "The connection dropped for a second — say that again?", phase: "teaching" });
        return;
      }
      if (res.status === 401) {
        patch({ authRequired: true, phase: "error" });
        return;
      }
      if (!res.ok) {
        patch({ say: "I lost my chalk for a second — try again in a moment.", phase: "teaching" });
        return;
      }
      const data = (await res.json()) as { ok: boolean; turn?: TeachTurn };
      const turn = data.turn;
      if (!data.ok || !turn) {
        patch({ say: "Hmm — give me that one more time.", phase: "teaching" });
        return;
      }

      useStudio.getState().applyStudent({
        understandingDelta: turn.understandingDelta ?? 0,
        pace: turn.pace ?? undefined,
        verdict: turn.verdict ?? null,
      });
      patch({ verdict: turn.verdict ?? null });
      saveStudent(useStudio.getState().lesson.student);

      await speakAndDo(turn.say, turn.actions, config.voice);

      if (turn.question) {
        patch({ phase: "question", question: turn.question.text });
        const answer = await waitForAnswer();
        patch({ phase: "teaching", question: null });
        await handleTurn(answer, config, plan, stepIndex);
      }
    },
    [handleTurn, patch, speakAndDo, waitForAnswer]
  );

  /* ensure stable identity for the recursive callback */
  const handleTurnRef = useRef(handleTurn);
  handleTurnRef.current = handleTurn;

  /* ---------------- one teaching step ---------------- */

  const runStep = useCallback(
    async (step: TeachStep, index: number, config: LessonConfig, plan: TeachStep[]) => {
      patch({ stepIndex: index, phase: "teaching", say: step.say });
      await speakAndDo(step.say, step.actions, config.voice);
      if (step.pauseMs) await sleep(Math.min(step.pauseMs, 4000));

      if (step.question) {
        patch({ phase: "question", question: step.question.text });
        const answer = await waitForAnswer();
        patch({ phase: "teaching", question: null });
        await handleTurnRef.current(answer, config, plan, index + 1);
      }
    },
    [patch, speakAndDo, waitForAnswer]
  );

  /* ---------------- public API ---------------- */

  const start = useCallback(
    async (config: LessonConfig) => {
      const st = useStudio.getState();
      stopRef.current = false;
      pauseRef.current = false;
      interrupts.current = [];

      /* fresh board for the lesson */
      const id = st.createBoard(null, config.topic.slice(0, 60));
      useStudio.getState().openBoard(id);
      const s2 = useStudio.getState();
      /* frame the 1600×1000 teaching area */
      const z = Math.min(1.05, Math.max(0.32, Math.min(s2.viewport.w / 1700, s2.viewport.h / 1120)));
      s2.setCamera({ x: s2.viewport.w / 2 - 800 * z, y: s2.viewport.h / 2 - 520 * z, z });

      patch({
        phase: "planning",
        config,
        plan: null,
        stepIndex: 0,
        stepTotal: 0,
        say: "Give me a moment — I'm planning today's lesson…",
        question: null,
        verdict: null,
        authRequired: false,
        error: null,
        checkpoints: [],
        voice: config.voice,
        title: config.topic,
      });

      let res: Response;
      try {
        res = await fetch("/api/studio/teach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "plan", config, student: useStudio.getState().lesson.student }),
        });
      } catch {
        patch({ phase: "error", error: "Couldn't reach the teaching engine. Check the connection and try again." });
        return;
      }
      if (res.status === 401) {
        patch({ phase: "error", authRequired: true });
        return;
      }
      if (!res.ok) {
        patch({ phase: "error", error: "The lesson plan didn't load. Try again in a moment." });
        return;
      }
      const data = (await res.json()) as { ok: boolean; plan?: { title: string; steps: TeachStep[] }; error?: string };
      if (!data.ok || !data.plan?.steps?.length) {
        patch({ phase: "error", error: data.error ?? "The lesson plan didn't load. Try again." });
        return;
      }

      const plan = data.plan.steps;
      useStudio.getState().renameBoard(useStudio.getState().activeBoardId, data.plan.title);
      patch({ phase: "teaching", plan: data.plan, title: data.plan.title, stepTotal: plan.length });

      for (let i = 0; i < plan.length; i++) {
        if (stopRef.current) return;
        /* soft interrupts land between steps */
        if (interrupts.current.length) {
          const msg = interrupts.current.shift()!;
          await handleTurnRef.current(msg, config, plan, i);
          if (stopRef.current) return;
        }
        await waitIfPaused();
        if (stopRef.current) return;
        await runStep(plan[i], i, config, plan);
      }

      /* drain late interrupts after the plan */
      while (interrupts.current.length && !stopRef.current) {
        const msg = interrupts.current.shift()!;
        await handleTurnRef.current(msg, config, plan, plan.length);
      }

      if (!stopRef.current) {
        patch({ phase: "done", say: "That's the lesson. Stay on the board, revise anything, or start a new topic." });
      }
    },
    [handleTurnRef, patch, runStep, waitIfPaused]
  );

  const answer = useCallback(
    (msg: string) => {
      const m = msg.trim();
      if (!m) return;
      const resolve = answerResolve.current;
      if (resolve) {
        answerResolve.current = null;
        resolve(m);
      } else if (useStudio.getState().lesson.phase === "teaching" || useStudio.getState().lesson.phase === "paused" || useStudio.getState().lesson.phase === "done") {
        interrupts.current.push(m);
      }
    },
    []
  );

  const pause = useCallback(() => {
    pauseRef.current = true;
    stopSpeaking();
    patch({ phase: "paused" });
  }, [patch]);

  const resume = useCallback(() => {
    pauseRef.current = false;
    patch({ phase: "teaching" });
  }, [patch]);

  const end = useCallback(() => {
    stopRef.current = true;
    pauseRef.current = false;
    answerResolve.current = null;
    stopSpeaking();
    speakingRef.current?.cancel();
    patch({ phase: "done", question: null });
  }, [patch]);

  const setVoice = useCallback(
    (v: boolean) => {
      patch({ voice: v });
      if (!v) stopSpeaking();
      const cfg = useStudio.getState().lesson.config;
      if (cfg) useStudio.getState().lessonPatch({ config: { ...cfg, voice: v } });
    },
    [patch]
  );

  const reset = useCallback(() => {
    end();
    patch({
      phase: "idle", config: null, plan: null, stepIndex: 0, stepTotal: 0,
      say: "", question: null, verdict: null, error: null, authRequired: false, checkpoints: [],
    });
  }, [end, patch]);

  return { start, answer, ask: answer, pause, resume, end, setVoice, reset };
}
