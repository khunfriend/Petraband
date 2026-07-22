"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

// Time signatures — each defines beat count + optional grouping for visual accents
type Sig = "4/4" | "3/4" | "6/8" | "12/8" | "7/8";

type SigDef = {
  label: string;
  beats: number;
  groups: number[]; // sizes of accent groups, sum === beats
};

const SIGS: Record<Sig, SigDef> = {
  "4/4": { label: "4/4",  beats: 4,  groups: [4] },
  "3/4": { label: "3/4",  beats: 3,  groups: [3] },
  "6/8": { label: "6/8",  beats: 6,  groups: [3, 3] },
  "12/8":{ label: "12/8", beats: 12, groups: [3, 3, 3, 3] },
  "7/8": { label: "7/8",  beats: 7,  groups: [3, 2, 2] },
};

const CLICK_FREQ = 900;
const CLICK_GAIN = 0.4;

type Props = {
  initialBpm?: number | null;
  initialSig?: Sig | null;
};

export function Metronome({ initialBpm, initialSig }: Props = {}) {
  const [sig, setSig] = useState<Sig>(initialSig ?? "4/4");
  const [bpm, setBpm] = useState(initialBpm ?? 90);
  const [playing, setPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const beatIndexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bpmRef = useRef(bpm);
  const sigRef = useRef(sig);
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { sigRef.current = sig; }, [sig]);

  const scheduleClick = useCallback((time: number) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const startAt = Math.max(time, ctx.currentTime + 0.005);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = CLICK_FREQ;
    g.gain.setValueAtTime(0.0001, startAt);
    g.gain.exponentialRampToValueAtTime(CLICK_GAIN, startAt + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.05);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(startAt);
    osc.stop(startAt + 0.06);
  }, []);

  const stop = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setPlaying(false);
    setCurrentBeat(0);
    beatIndexRef.current = 0;
  }, []);

  const start = useCallback(() => {
    if (playing) return;
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AC();
    }
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    // Safari/iOS unlock: silent buffer in user gesture
    try {
      const buf = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
    } catch { /* ignore */ }

    ctx.resume().catch(() => {});
    beatIndexRef.current = 0;
    nextNoteTimeRef.current = ctx.currentTime + 0.15;
    setPlaying(true);
    // Scheduler: look 100ms ahead every 25ms
    timerRef.current = setInterval(() => {
      const ac = audioCtxRef.current;
      if (!ac) return;
      const lookahead = ac.currentTime + 0.1;
      while (nextNoteTimeRef.current < lookahead) {
        const beats = SIGS[sigRef.current].beats;
        const idx = beatIndexRef.current % beats;
        scheduleClick(nextNoteTimeRef.current);
        const beatToShow = idx;
        const timeUntil = nextNoteTimeRef.current - ac.currentTime;
        setTimeout(() => setCurrentBeat(beatToShow), Math.max(0, timeUntil * 1000));
        nextNoteTimeRef.current += 60 / bpmRef.current;
        beatIndexRef.current++;
      }
    }, 25);
  }, [playing, scheduleClick]);

  // Reset counter when time signature changes while playing
  useEffect(() => {
    if (playing) {
      beatIndexRef.current = 0;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentBeat(0);
    }
  }, [sig, playing]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearInterval(timerRef.current);
    };
  }, []);

  const def = SIGS[sig];
  // Compute which beat indices are the first of their group (visual accent)
  const groupStarts = new Set<number>();
  let acc = 0;
  for (const g of def.groups) {
    groupStarts.add(acc);
    acc += g;
  }

  return (
    <div className="flex flex-col gap-3 border border-hairline-soft rounded-[var(--radius-md)] bg-surface-soft px-4 py-3">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-bold tracking-[1.5px] uppercase text-muted">Metronome</span>

        {/* Time signature buttons */}
        <div className="flex gap-1" role="tablist" aria-label="จังหวะ">
          {(Object.keys(SIGS) as Sig[]).map((s) => (
            <button
              key={s}
              role="tab"
              aria-selected={s === sig}
              onClick={() => setSig(s)}
              className={`px-2 py-1 text-xs font-semibold rounded-[var(--radius-sm)] border transition-colors ${
                s === sig
                  ? "bg-coral border-coral text-white"
                  : "bg-canvas border-hairline text-ink hover:border-coral"
              }`}
            >
              {SIGS[s].label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <label className="text-xs text-muted" htmlFor="metronome-bpm">BPM</label>
          <input
            id="metronome-bpm"
            type="number"
            min={30}
            max={240}
            value={bpm}
            onChange={(e) => setBpm(Math.max(30, Math.min(240, parseInt(e.target.value) || 90)))}
            className="w-16 text-sm border border-hairline rounded-[var(--radius-sm)] px-2 py-1 bg-canvas text-ink outline-none focus:border-coral"
          />
          <input
            type="range"
            min={30}
            max={240}
            value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value))}
            className="w-32 accent-coral"
            aria-label="BPM slider"
          />
          {playing ? (
            <Button variant="secondary" size="sm" onClick={stop}>■ หยุด</Button>
          ) : (
            <Button variant="coral" size="sm" onClick={start}>▶ เริ่ม</Button>
          )}
        </div>
      </div>

      {/* Beat dots with group separators */}
      <div className="flex items-end gap-1 flex-wrap">
        {Array.from({ length: def.beats }).map((_, i) => {
          const isGroupStart = groupStarts.has(i);
          const active = playing && currentBeat === i;
          const size = isGroupStart ? "w-4 h-4" : "w-3 h-3";
          return (
            <div key={i} className="flex items-end">
              {i > 0 && isGroupStart && (
                <span className="mx-1 text-muted-soft text-xs select-none" aria-hidden>·</span>
              )}
              <div className="flex flex-col items-center gap-0.5">
                <div
                  className={`${size} rounded-full border transition-transform duration-100 ${
                    active
                      ? "bg-coral border-coral scale-125"
                      : isGroupStart
                        ? "bg-coral/20 border-coral/40"
                        : "bg-canvas border-hairline"
                  }`}
                />
                <span className="text-[10px] text-muted-soft leading-none">{i + 1}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
