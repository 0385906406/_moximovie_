import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const QUOTES = [
  '"Tôi sẽ quay lại." — The Terminator',
  '"Hãy chiếu nó cho tôi xem, Sam." — Casablanca',
  '"Tôi thấy người chết." — The Sixth Sense',
  '"Sức mạnh hãy ở cùng bạn." — Star Wars',
  '"Cuộc sống giống như một hộp sô-cô-la." — Forrest Gump',
  '"Không có gì là không thể." — Mission Impossible',
];

export default function NotFoundPage() {
  const [quoteIdx, setQuoteIdx]     = useState(0);
  const [glitch, setGlitch]         = useState(false);
  const [mouse, setMouse]           = useState({ x: 0.5, y: 0.5 });
  const [tick, setTick]             = useState(0);
  const [particles, setParticles]   = useState<{ x: number; y: number; s: number; d: number; o: number }[]>([]);
  const rafRef                      = useRef<number | null>(null);

  /* quotes */
  useEffect(() => {
    const id = setInterval(() => setQuoteIdx(i => (i + 1) % QUOTES.length), 4000);
    return () => clearInterval(id);
  }, []);

  /* glitch */
  useEffect(() => {
    const id = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 220);
    }, 3200);
    return () => clearInterval(id);
  }, []);

  /* tick for film counter */
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60);
    return () => clearInterval(id);
  }, []);

  /* floating particles */
  useEffect(() => {
    setParticles(
      Array.from({ length: 28 }, (_, i) => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        s: Math.random() * 3 + 1,
        d: Math.random() * 20 + 12,
        o: Math.random() * 0.4 + 0.1,
      }))
    );
  }, []);

  /* mouse parallax */
  useEffect(() => {
    const fn = (e: MouseEvent) =>
      setMouse({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    window.addEventListener('mousemove', fn);
    return () => window.removeEventListener('mousemove', fn);
  }, []);

  const px = (mouse.x - 0.5) * 28;
  const py = (mouse.y - 0.5) * 18;
  const frameNum = String((tick % 404) + 1).padStart(4, '0');

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600&display=swap');

        .nf-root {
          width: 100%;
          min-height: 100vh;
          background: #0c0e17;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
        }

        /* ── Ambient BG ── */
        .nf-orb1, .nf-orb2 {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          pointer-events: none;
          z-index: 0;
        }
        .nf-orb1 {
          width: 520px; height: 520px;
          background: radial-gradient(circle, rgba(74,222,128,0.08) 0%, transparent 70%);
          top: -120px; left: 50%;
          transform: translateX(-50%);
          animation: orbPulse1 7s ease-in-out infinite;
        }
        .nf-orb2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%);
          bottom: -80px; right: 10%;
          animation: orbPulse2 9s ease-in-out infinite;
        }
        @keyframes orbPulse1 {
          0%,100% { opacity: 0.7; transform: translateX(-50%) scale(1); }
          50%      { opacity: 1;   transform: translateX(-50%) scale(1.12); }
        }
        @keyframes orbPulse2 {
          0%,100% { opacity: 0.5; transform: scale(1); }
          50%      { opacity: 0.9; transform: scale(1.1); }
        }

        /* ── Film perforations ── */
        .nf-perf {
          position: absolute;
          top: 0; bottom: 0;
          width: 48px;
          display: flex;
          flex-direction: column;
          justify-content: space-around;
          align-items: center;
          z-index: 5;
          padding: 12px 0;
          gap: 0;
        }
        .nf-perf-left  { left: 0;  border-right: 1px solid rgba(74,222,128,0.07); background: rgba(74,222,128,0.02); }
        .nf-perf-right { right: 0; border-left:  1px solid rgba(74,222,128,0.07); background: rgba(74,222,128,0.02); }
        .nf-hole {
          width: 26px; height: 18px;
          border: 1.5px solid rgba(74,222,128,0.18);
          border-radius: 3px;
          background: #090b13;
          flex-shrink: 0;
        }

        /* ── Grain ── */
        .nf-grain {
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          opacity: 0.025;
          pointer-events: none;
          z-index: 2;
          mix-blend-mode: overlay;
          animation: grainDrift 0.2s steps(1) infinite;
        }
        @keyframes grainDrift {
          0%   { transform: translate(0,0); }
          25%  { transform: translate(-4px,3px); }
          50%  { transform: translate(3px,-3px); }
          75%  { transform: translate(-2px,4px); }
          100% { transform: translate(3px,-2px); }
        }

        /* ── Scanline ── */
        .nf-scanlines {
          position: absolute; inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent 0px, transparent 2px,
            rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 4px
          );
          pointer-events: none; z-index: 3;
        }

        /* ── Vignette ── */
        .nf-vignette {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(0,0,0,0.82) 100%);
          pointer-events: none; z-index: 4;
        }

        /* ── Page flicker ── */
        .nf-root { animation: pageFlicker 10s infinite; }
        @keyframes pageFlicker {
          0%,96%,100%   { opacity: 1; }
          97%            { opacity: 0.91; }
          97.5%          { opacity: 1; }
          98%            { opacity: 0.94; }
        }

        /* ── Content ── */
        .nf-content {
          position: relative; z-index: 10;
          display: flex; flex-direction: column;
          align-items: center; text-align: center;
          gap: 0;
          padding: 0 72px;
          transition: transform 0.12s ease-out;
          max-width: 700px;
        }

        /* ── Eyebrow ── */
        .nf-eyebrow {
          font-size: 10px; font-weight: 600;
          letter-spacing: 0.32em; text-transform: uppercase;
          color: rgba(74,222,128,0.5);
          margin-bottom: 20px;
          display: flex; align-items: center; gap: 10px;
        }
        .nf-eyebrow::before, .nf-eyebrow::after {
          content: '';
          display: block; height: 1px; width: 36px;
          background: linear-gradient(90deg, transparent, rgba(74,222,128,0.35));
        }
        .nf-eyebrow::after { transform: scaleX(-1); }

        /* ── Big 404 ── */
        .nf-big {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(130px, 20vw, 260px);
          line-height: 0.88;
          color: #ffffff;
          letter-spacing: -0.02em;
          position: relative;
          background: linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.55) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 0 60px rgba(74,222,128,0.15));
        }
        .nf-big.glitch {
          animation: glitchBig 0.22s steps(3) forwards;
        }
        @keyframes glitchBig {
          0%   { clip-path: inset(15% 0 55% 0); transform: translate(-6px,0); filter: drop-shadow(0 0 20px rgba(255,60,80,0.6)); }
          33%  { clip-path: inset(55% 0 10% 0); transform: translate(6px,0);  filter: drop-shadow(0 0 20px rgba(60,220,255,0.6)); }
          66%  { clip-path: inset(35% 0 35% 0); transform: translate(-3px,2px); }
          100% { clip-path: none; transform: translate(0); filter: drop-shadow(0 0 60px rgba(74,222,128,0.15)); }
        }

        /* ── Green underline divider ── */
        .nf-divider {
          width: 52px; height: 2px;
          background: linear-gradient(90deg, transparent, #4ade80, transparent);
          border-radius: 1px;
          margin: 14px auto 22px;
          box-shadow: 0 0 12px rgba(74,222,128,0.5);
        }

        /* ── Headline ── */
        .nf-headline {
          font-size: clamp(16px, 2.5vw, 22px);
          font-weight: 600;
          color: #ffffff;
          letter-spacing: -0.01em;
          margin-bottom: 8px;
          line-height: 1.3;
        }
        .nf-sub {
          font-size: 13px; font-weight: 400;
          color: rgba(255,255,255,0.3);
          letter-spacing: 0.04em;
          margin-bottom: 36px;
        }

        /* ── Quote box ── */
        .nf-quote {
          background: rgba(74,222,128,0.05);
          border: 1px solid rgba(74,222,128,0.14);
          border-left: 2.5px solid rgba(74,222,128,0.55);
          border-radius: 6px;
          padding: 14px 20px;
          max-width: 440px;
          width: 100%;
          margin-bottom: 40px;
          position: relative;
          backdrop-filter: blur(4px);
        }
        .nf-quote-icon {
          position: absolute; top: -11px; left: 16px;
          background: #0c0e17;
          padding: 0 6px;
          font-size: 18px;
          line-height: 1;
        }
        .nf-quote-text {
          font-size: 12.5px; font-style: italic;
          color: rgba(74,222,128,0.8);
          letter-spacing: 0.02em;
          line-height: 1.6;
          opacity: 0;
          animation: quoteIn 4s ease infinite;
        }
        @keyframes quoteIn {
          0%,5%    { opacity: 0; transform: translateY(5px); }
          15%,82%  { opacity: 1; transform: translateY(0);   }
          95%,100% { opacity: 0; transform: translateY(-5px);}
        }

        /* ── CTA ── */
        .nf-cta {
          display: inline-flex; align-items: center; gap: 10px;
          background: #4ade80;
          color: #0c0e17;
          font-weight: 700; font-size: 13px;
          letter-spacing: 0.1em; text-transform: uppercase;
          padding: 14px 34px;
          border-radius: 4px;
          text-decoration: none;
          box-shadow: 0 4px 24px rgba(74,222,128,0.32);
          transition: background 0.2s, box-shadow 0.2s, transform 0.15s;
        }
        .nf-cta:hover {
          background: #86efac;
          box-shadow: 0 8px 36px rgba(74,222,128,0.5);
          transform: translateY(-2px) scale(1.02);
        }
        .nf-cta svg { flex-shrink: 0; }

        /* ── Film footer bar ── */
        .nf-footer {
          position: absolute; bottom: 0;
          left: 48px; right: 48px;
          height: 30px;
          border-top: 1px solid rgba(74,222,128,0.07);
          display: flex; align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          font-size: 9px; letter-spacing: 0.22em;
          color: rgba(74,222,128,0.2);
          z-index: 10;
          font-family: 'Courier New', monospace;
        }

        /* ── Top bar ── */
        .nf-topbar {
          position: absolute; top: 0;
          left: 48px; right: 48px; height: 28px;
          border-bottom: 1px solid rgba(74,222,128,0.07);
          display: flex; align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          font-size: 9px; letter-spacing: 0.22em;
          color: rgba(74,222,128,0.2);
          z-index: 10;
          font-family: 'Courier New', monospace;
        }

        @media (max-width: 600px) {
          .nf-perf { display: none; }
          .nf-content { padding: 0 24px; }
          .nf-footer, .nf-topbar { left: 0; right: 0; }
        }
      `}</style>

      <div className="nf-root">
        {/* Ambient orbs */}
        <div className="nf-orb1" />
        <div className="nf-orb2" />

        {/* Film perforations */}
        <div className="nf-perf nf-perf-left">
          {Array.from({ length: 20 }).map((_, i) => <div key={i} className="nf-hole" />)}
        </div>
        <div className="nf-perf nf-perf-right">
          {Array.from({ length: 20 }).map((_, i) => <div key={i} className="nf-hole" />)}
        </div>

        {/* Floating particles */}
        {particles.map((p, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.s}px`,
              height: `${p.s}px`,
              borderRadius: '50%',
              background: '#4ade80',
              opacity: p.o,
              pointerEvents: 'none',
              zIndex: 1,
              animation: `particleFloat${i % 3} ${p.d}s ease-in-out infinite`,
            }}
          />
        ))}

        {/* Effects layers */}
        <div className="nf-grain" />
        <div className="nf-scanlines" />
        <div className="nf-vignette" />

        {/* Top bar */}
        <div className="nf-topbar">
          <span>MOXIFILM · CODEC H.265</span>
          <span>◈ REEL {frameNum} / 0404 ◈</span>
          <span>RESOLUTION 4K · HDR10</span>
        </div>

        {/* Main content */}
        <div
          className="nf-content"
          style={{ transform: `translate(${px}px, ${py}px)` }}
        >
          <div className="nf-eyebrow">Lỗi phát sóng</div>

          <div className={`nf-big${glitch ? ' glitch' : ''}`}>404</div>

          <div className="nf-divider" />

          <div className="nf-headline">Trang bạn tìm đã rời khỏi rạp chiếu</div>
          <div className="nf-sub">Không tìm thấy · Đã xóa · Chưa bao giờ tồn tại</div>

          <div className="nf-quote">
            <span className="nf-quote-icon">🎬</span>
            <div className="nf-quote-text" key={quoteIdx}>
              {QUOTES[quoteIdx]}
            </div>
          </div>

          <Link to="/phimhay" className="nf-cta">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5l11 7-11 7z" />
            </svg>
            Về trang chủ
          </Link>
        </div>

        {/* Footer */}
        <div className="nf-footer">
          <span>EASTMAN · ASA 500</span>
          <span>◈ SCENE CUT · KHÔNG TÌM THẤY ◈</span>
          <span>FRAME {frameNum} / 0404</span>
        </div>

        <style>{`
          @keyframes particleFloat0 { 0%,100%{transform:translateY(0) translateX(0)} 50%{transform:translateY(-18px) translateX(6px)} }
          @keyframes particleFloat1 { 0%,100%{transform:translateY(0) translateX(0)} 50%{transform:translateY(-12px) translateX(-8px)} }
          @keyframes particleFloat2 { 0%,100%{transform:translateY(0) translateX(0)} 50%{transform:translateY(-22px) translateX(4px)} }
        `}</style>
      </div>
    </>
  );
}
