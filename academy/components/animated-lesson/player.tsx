"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ANIMATED_LESSONS } from "./registry";

type Position = { scene: number; step: number };

/**
 * Plays an animated cartoon lesson: scene by scene, each narration step changes the picture to show
 * exactly what is being said. The narrator is the browser's own voice (a Nigerian English voice when
 * the device has one), or a recorded audio file when a step has one. There are no captions on the
 * picture; a transcript is available below it for anyone who needs it.
 */
export function AnimatedLessonPlayer({ lessonId }: { lessonId: string }) {
  const lesson = ANIMATED_LESSONS[lessonId];
  const [pos, setPos] = useState<Position>({ scene: 0, step: 0 });
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [talking, setTalking] = useState(false);
  const [finished, setFinished] = useState(false);
  const [muted, setMuted] = useState(false);
  const [copied, setCopied] = useState(false);
  const frame = useRef<HTMLDivElement>(null);
  const voice = useVoice();

  const scenes = useMemo(() => lesson?.scenes ?? [], [lesson]);
  const scene = scenes[pos.scene];
  const minutes = useMemo(() => {
    const words = scenes.reduce((n, s) => n + s.steps.reduce((m, st) => m + st.say.split(/\s+/).length, 0), 0);
    return Math.max(1, Math.round(words / 150 + scenes.length * 0.1));
  }, [scenes]);

  const next = useCallback(
    (p: Position): Position | null => {
      if (p.step + 1 < scenes[p.scene].steps.length) return { scene: p.scene, step: p.step + 1 };
      if (p.scene + 1 < scenes.length) return { scene: p.scene + 1, step: 0 };
      return null;
    },
    [scenes],
  );
  const previous = useCallback(
    (p: Position): Position => {
      if (p.step > 0) return { scene: p.scene, step: p.step - 1 };
      if (p.scene > 0) return { scene: p.scene - 1, step: scenes[p.scene - 1].steps.length - 1 };
      return p;
    },
    [scenes],
  );

  // Narrate the current step, then move on to the next one.
  useEffect(() => {
    if (!playing || !scene) return;
    const step = scene.steps[pos.step];
    return narrate(step.say, step.audio, muted ? null : voice, setTalking, () => {
      const to = next(pos);
      if (to) setPos(to);
      else {
        setPlaying(false);
        setFinished(true);
      }
    });
  }, [playing, pos, scene, muted, voice, next]);

  useEffect(() => () => stopSpeech(), []);

  if (!lesson || !scene) return null;
  const { Scene } = scene;

  function start() {
    setStarted(true);
    setFinished(false);
    setPlaying(true);
  }
  function jump(to: Position) {
    setFinished(false);
    setStarted(true);
    setPos(to);
  }
  function toggle() {
    if (!started || finished) {
      if (finished) setPos({ scene: 0, step: 0 });
      start();
      return;
    }
    setPlaying((p) => !p);
  }
  function fullScreen() {
    const el = frame.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  }
  function onKey(e: React.KeyboardEvent) {
    if (e.key === " " || e.key === "k") {
      e.preventDefault();
      toggle();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      const to = next(pos);
      if (to) jump(to);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      jump(previous(pos));
    }
  }
  async function copyPrompt(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the prompt is still on screen to copy by hand */
    }
  }

  return (
    <div className="space-y-3">
      <div
        ref={frame}
        tabIndex={0}
        onKeyDown={onKey}
        className="relative overflow-hidden rounded-card border border-line bg-[#0b1a33] outline-none focus-visible:ring-2 focus-visible:ring-primary [&:fullscreen]:flex [&:fullscreen]:flex-col [&:fullscreen]:justify-center"
        aria-roledescription="animated lesson"
        aria-label={`${lesson.title}, animated lesson`}
      >
        <div className="relative">
        <button type="button" onClick={toggle} className="block w-full cursor-pointer" aria-label={playing ? "Pause" : "Play"} tabIndex={-1}>
          <svg viewBox="0 0 960 540" className="block aspect-video w-full select-none" role="img" aria-label={scene.heading}>
            <g key={pos.scene} className="ac-scene-in">
              <Scene step={pos.step} talking={talking && playing} />
            </g>
          </svg>
        </button>

        {!started && (
          <div className="absolute inset-0 grid place-items-center bg-[#0a1a33]/55 p-4 text-center backdrop-blur-[2px]">
            <div>
              <button type="button" onClick={start} className="mx-auto grid size-20 place-items-center rounded-full bg-primary text-3xl text-white shadow-xl shadow-black/30 transition hover:scale-105 sm:size-24" aria-label="Start the animated lesson">
                ▶
              </button>
              <p className="mt-4 font-display text-xl font-semibold text-white sm:text-2xl">Start the animated lesson</p>
              <p className="mt-1 text-sm text-white/80">
                {scenes.length} scenes · about {minutes} minutes · turn your sound on
              </p>
            </div>
          </div>
        )}
        {finished && (
          <div className="absolute inset-0 grid place-items-center bg-[#0a1a33]/70 p-4 text-center">
            <div>
              <p className="text-4xl">🎉</p>
              <p className="mt-2 font-display text-2xl font-semibold text-white">Lesson complete</p>
              <p className="mt-1 text-sm text-white/80">Mark it done, then try the assignment.</p>
              <button type="button" onClick={toggle} className="btn-secondary mt-4">
                ↺ Watch again
              </button>
            </div>
          </div>
        )}

        </div>

        {/* scene progress */}
        <div className="flex gap-1 bg-[#0b1a33] px-3 pt-3">
          {scenes.map((s, i) => {
            const fill = i < pos.scene ? 100 : i === pos.scene ? ((pos.step + 1) / s.steps.length) * 100 : 0;
            return (
              <button
                key={i}
                type="button"
                onClick={() => jump({ scene: i, step: 0 })}
                className="group h-3 flex-1 py-1"
                aria-label={`Scene ${i + 1}: ${s.heading}`}
                title={s.heading}
              >
                <span className="block h-1 overflow-hidden rounded-full bg-white/20 group-hover:bg-white/35">
                  <span className="block h-full rounded-full bg-[#3b9bff] transition-[width] duration-500" style={{ width: `${fill}%` }} />
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-1 bg-[#0b1a33] px-2 pb-2 text-white sm:gap-2 sm:px-3">
          <IconButton label="Back" onClick={() => jump(previous(pos))}>
            ⏮
          </IconButton>
          <IconButton label={playing ? "Pause" : "Play"} onClick={toggle} big>
            {playing ? "❚❚" : "▶"}
          </IconButton>
          <IconButton
            label="Next"
            onClick={() => {
              const to = next(pos);
              if (to) jump(to);
            }}
          >
            ⏭
          </IconButton>
          <p className="min-w-0 flex-1 truncate px-1 text-xs text-white/85 sm:text-sm">
            <span className="text-white/60">
              {pos.scene + 1}/{scenes.length}
            </span>{" "}
            {scene.heading}
          </p>
          <IconButton label={muted ? "Turn the voice on" : "Turn the voice off"} onClick={() => setMuted((m) => !m)}>
            {muted ? "🔇" : "🔊"}
          </IconButton>
          <IconButton label="Full screen" onClick={fullScreen}>
            ⛶
          </IconButton>
        </div>
      </div>

      {scene.tryIt && (
        <div className="card flex flex-col gap-3 !p-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="eyebrow">Try it yourself</p>
            <p className="mt-1 text-sm text-ink">“{scene.tryIt}”</p>
          </div>
          <button type="button" onClick={() => copyPrompt(scene.tryIt!)} className="btn-secondary btn-sm shrink-0">
            {copied ? "✓ Copied" : "Copy prompt"}
          </button>
        </div>
      )}

      <details className="text-sm text-muted">
        <summary className="cursor-pointer hover:text-primary">Read what the narrator says</summary>
        <ol className="mt-2 space-y-3">
          {scenes.map((s, i) => (
            <li key={i}>
              <button type="button" className="font-semibold text-ink hover:text-primary" onClick={() => jump({ scene: i, step: 0 })}>
                {i + 1}. {s.heading}
              </button>
              <p className="mt-0.5">{s.steps.map((st) => st.say).join(" ")}</p>
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}

function IconButton({ label, onClick, children, big }: { label: string; onClick: () => void; children: React.ReactNode; big?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid shrink-0 place-items-center rounded-full transition hover:bg-white/15 ${big ? "size-11 bg-white/10 text-lg" : "size-9 text-base"}`}
    >
      {children}
    </button>
  );
}

/* ---------- narration ---------- */

const PREFERRED = [/en[-_]NG/i, /nigeria/i, /en[-_]GB.*(female|libby|sonia|serena|martha|kate|hazel)/i, /(libby|sonia|serena|martha|kate|hazel|google uk english female)/i, /en[-_]ZA/i, /en[-_]KE/i, /en[-_]GB/i, /^en/i];

/** Picks the most suitable English voice on this device, preferring Nigerian English. */
function useVoice() {
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const pick = () => {
      const voices = window.speechSynthesis.getVoices();
      for (const re of PREFERRED) {
        const v = voices.find((x) => re.test(x.lang) || re.test(`${x.lang} ${x.name}`));
        if (v) {
          setVoice(v);
          return;
        }
      }
    };
    pick();
    window.speechSynthesis.addEventListener("voiceschanged", pick);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", pick);
  }, []);
  return voice;
}

function stopSpeech() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

/**
 * Says one step and calls `done` a moment after it ends. Falls back to a reading-speed timer when the
 * voice is off or the device can't speak. Returns a function that stops it.
 */
function narrate(text: string, audio: string | undefined, voice: SpeechSynthesisVoice | null | false, setTalking: (t: boolean) => void, done: () => void) {
  let over = false;
  const timers: ReturnType<typeof setTimeout>[] = [];
  const words = text.split(/\s+/).length;
  let player: HTMLAudioElement | null = null;

  const finish = () => {
    if (over) return;
    over = true;
    setTalking(false);
    timers.push(setTimeout(done, 700));
  };
  const byTimer = () => {
    setTalking(true);
    timers.push(setTimeout(finish, words * 390 + 900));
  };

  const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;
  if (voice !== null && audio) {
    player = new Audio(audio);
    player.onplay = () => setTalking(true);
    player.onended = finish;
    player.onerror = byTimer;
    player.play().catch(byTimer);
  } else if (voice !== null && canSpeak) {
    stopSpeech();
    const u = new SpeechSynthesisUtterance(text);
    if (voice) {
      u.voice = voice;
      u.lang = voice.lang;
    } else u.lang = "en-NG";
    u.rate = 0.95;
    u.onstart = () => setTalking(true);
    u.onend = finish;
    u.onerror = (e) => {
      if (e.error !== "interrupted" && e.error !== "canceled") byTimer();
    };
    window.speechSynthesis.speak(u);
    // Some browsers never fire onstart/onend (no voices installed): keep the lesson moving anyway.
    timers.push(setTimeout(() => setTalking(true), 400));
    timers.push(setTimeout(finish, words * 700 + 5000));
  } else {
    byTimer();
  }

  return () => {
    over = true;
    timers.forEach(clearTimeout);
    if (player) player.pause();
    stopSpeech();
    setTalking(false);
  };
}
