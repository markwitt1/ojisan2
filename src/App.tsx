import {useEffect, useMemo, useRef, useState} from 'react';

const TOTAL = 16;
const LAUGH_VIDEO = '/assets/laugh_from_frame003_alpha_2p7_to_8.webm';
const OJISAN_IMAGES = [
  '/assets/ojisan_frames/frame_01.png',
  '/assets/ojisan_frames/frame_02.png',
  '/assets/ojisan_frames/frame_03.png',
  '/assets/ojisan_frames/frame_04.png',
  '/assets/ojisan_frames/frame_05.png',
  '/assets/ojisan_frames/frame_06.png',
  '/assets/ojisan_frames/frame_07.png',
  '/assets/ojisan_frames/frame_08.png',
] as const;

type Phase = 'playing' | 'won';

type Round = {
  winner: number;
  removed: Set<number>;
  faces: string[];
};

const pickRandomFace = (): string =>
  OJISAN_IMAGES[Math.floor(Math.random() * OJISAN_IMAGES.length)] ?? OJISAN_IMAGES[0];

const newRound = (): Round => ({
  winner: Math.floor(Math.random() * TOTAL),
  removed: new Set<number>(),
  faces: Array.from({length: TOTAL}, () => pickRandomFace()),
});

function App() {
  const [phase, setPhase] = useState<Phase>('playing');
  const [round, setRound] = useState<Round>(() => newRound());
  const [fading, setFading] = useState<Set<number>>(new Set<number>());
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const visible = TOTAL - round.removed.size;

  const title = useMemo(() => {
    if (phase === 'won') {
      return 'Lachen Onkel erscheint!';
    }
    if (visible === TOTAL) {
      return 'Es gibt nur einen lachenden Onkel!';
    }
    return `Noch ${visible} Onkel`;
  }, [phase, visible]);

  const getAudioContext = () => {
    if (audioCtxRef.current) {
      return audioCtxRef.current;
    }

    const Ctx =
      window.AudioContext ||
      (window as Window & {webkitAudioContext?: typeof AudioContext}).webkitAudioContext;

    if (!Ctx) {
      return null;
    }

    const ctx = new Ctx();
    audioCtxRef.current = ctx;
    return ctx;
  };

  const playTapSound = () => {
    const ctx = getAudioContext();
    if (!ctx) {
      return;
    }

    if (ctx.state === 'suspended') {
      void ctx.resume();
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.12);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.145);
  };

  const resetRound = () => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
    setPhase('playing');
    setFading(new Set<number>());
    setRound(newRound());
  };

  useEffect(() => {
    if (phase !== 'won') {
      return;
    }

    const video = videoRef.current;
    if (!video) {
      return;
    }

    video.currentTime = 0;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Some browsers can still block playback until the next direct gesture.
      });
    }
  }, [phase]);

  const onTap = (idx: number) => {
    if (phase !== 'playing' || round.removed.has(idx)) {
      return;
    }

    playTapSound();

    if (idx === round.winner) {
      setPhase('won');
      return;
    }

    setFading((curr) => new Set(curr).add(idx));

    window.setTimeout(() => {
      setRound((curr) => {
        if (curr.removed.has(idx) || curr.winner === idx) {
          return curr;
        }
        const nextRemoved = new Set(curr.removed);
        nextRemoved.add(idx);
        return {...curr, removed: nextRemoved};
      });

      setFading((curr) => {
        const next = new Set(curr);
        next.delete(idx);
        return next;
      });
    }, 130);
  };

  return (
    <main className="min-h-[100dvh] bg-[repeating-linear-gradient(12deg,#9e673f_0,#9e673f_12px,#b4794c_12px,#b4794c_24px,#945f38_24px,#945f38_36px)] px-3 py-4 text-amber-50 sm:px-5 sm:py-6">
      <section className="mx-auto flex w-full max-w-[560px] flex-col gap-3">
        <header className="rounded-xl border border-black/40 bg-black/25 px-3 py-2 text-center shadow-lg backdrop-blur-[1px]">
          <h1 className="text-sm font-bold tracking-wide sm:text-base">{title}</h1>
        </header>

        <div className="relative aspect-square w-full rounded-2xl border border-black/45 bg-black/15 p-1 shadow-[0_14px_36px_rgba(0,0,0,0.35)]">
          {phase === 'won' ? (
            <>
              <div className="absolute inset-0 p-1">
                <video
                  ref={videoRef}
                  src={LAUGH_VIDEO}
                  className="h-full w-full object-contain"
                  playsInline
                  preload="auto"
                  onEnded={resetRound}
                />
              </div>

              <button
                type="button"
                onClick={resetRound}
                className="absolute right-3 top-3 z-10 rounded-md border border-amber-100/60 bg-black/55 px-3 py-1 text-xs font-bold tracking-wide text-amber-100 backdrop-blur hover:bg-black/70 active:translate-y-px"
              >
                Retry
              </button>
            </>
          ) : (
            <div className="grid h-full w-full grid-cols-4 grid-rows-4 gap-1 sm:gap-1.5" role="grid" aria-label="16 Ojisan grid">
              {Array.from({length: TOTAL}, (_, idx) => {
                const hidden = round.removed.has(idx);
                const isFading = fading.has(idx);

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onTap(idx)}
                    disabled={hidden}
                    aria-label={`Ojisan ${idx + 1}`}
                    className={[
                      'transition duration-150 ease-out',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300',
                      hidden ? 'pointer-events-none opacity-0' : 'opacity-100',
                      isFading ? 'scale-75 opacity-0' : 'scale-100 active:scale-95',
                    ].join(' ')}
                  >
                    <img
                      src={round.faces[idx]}
                      alt="Ojisan"
                      draggable={false}
                      className="h-full w-full select-none object-contain"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default App;
