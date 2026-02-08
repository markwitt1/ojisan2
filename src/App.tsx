import {useEffect, useMemo, useRef, useState} from 'react';
import './App.css';

const TOTAL = 16;

type Phase = 'playing' | 'won';

type Round = {
  winner: number;
  removed: Set<number>;
};

const newRound = (): Round => ({
  winner: Math.floor(Math.random() * TOTAL),
  removed: new Set<number>(),
});

function App() {
  const [phase, setPhase] = useState<Phase>('playing');
  const [round, setRound] = useState<Round>(() => newRound());
  const [fading, setFading] = useState<Set<number>>(new Set<number>());
  const videoRef = useRef<HTMLVideoElement | null>(null);

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

  const resetRound = () => {
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
    const p = video.play();
    if (p !== undefined) {
      p.catch(() => {
        // User gesture restrictions may block autoplay on some browsers.
      });
    }
  }, [phase]);

  const onTap = (idx: number) => {
    if (phase !== 'playing' || round.removed.has(idx)) {
      return;
    }

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
    <main className="page">
      <section className="phone" aria-label="Laugh Ojisan">
        <div className="edge edge-top" />

        <div className="wood">
          <header className="title">
            <h1>{title}</h1>
          </header>

          <div className="cabinet">
            <div className="stage">
              {phase === 'won' ? (
                <div className="video-wrap">
                  <video
                    ref={videoRef}
                    src="/assets/laugh_from_frame003.webm"
                    playsInline
                    preload="auto"
                    onEnded={resetRound}
                  />
                </div>
              ) : (
                <div className="grid" role="grid" aria-label="16 Ojisan grid">
                  {Array.from({length: TOTAL}, (_, idx) => {
                    const hidden = round.removed.has(idx);
                    const isFading = fading.has(idx);
                    return (
                      <button
                        key={idx}
                        type="button"
                        className={`tile${hidden ? ' hidden' : ''}${isFading ? ' fading' : ''}`}
                        onClick={() => onTap(idx)}
                        disabled={hidden}
                        aria-label={`Ojisan ${idx + 1}`}
                      >
                        <img src="/assets/ojisan.png" alt="Ojisan" draggable={false} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <footer className="controls">
            <button type="button" onClick={resetRound} className="start-btn">
              ANFANG
            </button>
          </footer>
        </div>

        <div className="edge edge-bottom" />
      </section>
    </main>
  );
}

export default App;
