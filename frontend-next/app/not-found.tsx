"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

type Particle = { x: number; dur: number; delay: number; size: number; op: number };

export default function NotFoundPage() {
  const [mounted, setMounted]     = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    setMounted(true);
    setParticles(
      Array.from({ length: 40 }, () => ({
        x:     Math.random() * 100,
        dur:   9  + Math.random() * 13,
        delay: Math.random() * 12,
        size:  1  + Math.random() * 2.8,
        op:    0.06 + Math.random() * 0.3,
      }))
    );
  }, []);

  return (
    <>
      <style>{`
        /* ── root ── */
        .nf {
          min-height: 100vh;
          background: #080a12;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          padding: 24px;
          animation: nfFlicker 9s ease-in-out infinite;
        }
        @keyframes nfFlicker {
          0%,88%,100% { opacity: 1; }
          89% { opacity: 0.88; }
          89.5% { opacity: 1; }
          91% { opacity: 0.93; }
          91.5% { opacity: 1; }
        }

        /* ── blobs ── */
        .nf-blob {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(90px);
          will-change: transform;
        }
        .nf-blob-1 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(34,211,165,0.13) 0%, transparent 70%);
          top: -180px; left: 50%; transform: translateX(-55%);
          animation: blobA 10s ease-in-out infinite;
        }
        .nf-blob-2 {
          width: 480px; height: 480px;
          background: radial-gradient(circle, rgba(56,189,248,0.09) 0%, transparent 70%);
          bottom: -120px; right: -60px;
          animation: blobB 13s ease-in-out infinite;
        }
        .nf-blob-3 {
          width: 360px; height: 360px;
          background: radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 70%);
          top: 30%; left: -80px;
          animation: blobC 11s ease-in-out infinite;
        }
        .nf-blob-4 {
          width: 260px; height: 260px;
          background: radial-gradient(circle, rgba(244,63,94,0.07) 0%, transparent 70%);
          bottom: 15%; right: 15%;
          animation: blobD 15s ease-in-out infinite;
        }
        @keyframes blobA { 0%,100%{transform:translateX(-55%) scale(1)}  50%{transform:translateX(-55%) scale(1.12) translateY(24px)} }
        @keyframes blobB { 0%,100%{transform:scale(1)}                   50%{transform:scale(1.14) translate(-22px,-18px)} }
        @keyframes blobC { 0%,100%{transform:scale(1)}                   50%{transform:scale(1.1) translate(18px,-12px)} }
        @keyframes blobD { 0%,100%{transform:scale(1)}                   50%{transform:scale(1.18) translate(-10px,14px)} }

        /* ── projector beam ── */
        .nf-beam {
          position: absolute;
          top: 0; left: 50%;
          width: 0; height: 0;
          border-left: 260px solid transparent;
          border-right: 260px solid transparent;
          border-top: 520px solid rgba(34,211,165,0.025);
          transform: translateX(-50%);
          filter: blur(28px);
          pointer-events: none;
          animation: beamPulse 6s ease-in-out infinite;
          will-change: transform, opacity;
        }
        @keyframes beamPulse {
          0%,100% { opacity: 0.6; transform: translateX(-50%) scaleX(1); }
          50%      { opacity: 1;   transform: translateX(-50%) scaleX(1.15); }
        }

        /* ── scan line ── */
        .nf-scan {
          position: absolute;
          left: 0; right: 0;
          height: 3px;
          background: linear-gradient(180deg, transparent, rgba(34,211,165,0.08), rgba(34,211,165,0.16), rgba(34,211,165,0.08), transparent);
          animation: scanMove 7s linear infinite;
          pointer-events: none;
          z-index: 6;
          will-change: transform;
        }
        @keyframes scanMove {
          from { transform: translateY(-10vh); }
          to   { transform: translateY(110vh); }
        }

        /* ── horizontal glitch lines ── */
        .nf-hline {
          position: absolute; left: 0; right: 0;
          height: 1.5px;
          background: linear-gradient(90deg, transparent 5%, rgba(34,211,165,0.7) 40%, rgba(56,189,248,0.5) 60%, transparent 95%);
          pointer-events: none;
          opacity: 0;
          z-index: 8;
          will-change: transform, opacity;
        }
        .nf-hline-1 { top: 22%; animation: hlineFlash 8s  0.8s steps(1) infinite; }
        .nf-hline-2 { top: 58%; animation: hlineFlash 11s 3.2s steps(1) infinite; }
        .nf-hline-3 { top: 78%; animation: hlineFlash 7s  5.5s steps(1) infinite; }
        @keyframes hlineFlash {
          0%,90%,100% { opacity:0; transform:scaleX(0); }
          91%          { opacity:1; transform:scaleX(1); }
          92%          { opacity:0.4; transform:scaleX(0.6); }
          93%          { opacity:0; transform:scaleX(0); }
        }

        /* ── particles ── */
        .nf-particle {
          position: absolute;
          bottom: -8px;
          border-radius: 50%;
          background: #22d3a5;
          pointer-events: none;
          will-change: transform, opacity;
          animation: particleRise var(--dur) var(--delay) ease-in infinite;
        }
        @keyframes particleRise {
          0%   { transform: translateY(0) translateX(0);   opacity: var(--op); }
          40%  { transform: translateY(-35vh) translateX(8px); }
          80%  { transform: translateY(-70vh) translateX(-6px); }
          100% { transform: translateY(-95vh) translateX(4px);  opacity: 0; }
        }

        /* ── grain ── */
        .nf-grain {
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          opacity: 0.028;
          pointer-events: none;
          mix-blend-mode: overlay;
          z-index: 7;
          animation: grainShift 0.18s steps(1) infinite;
        }
        @keyframes grainShift {
          0%   { transform: translate(0,0); }
          25%  { transform: translate(-5px, 4px); }
          50%  { transform: translate(4px,-4px); }
          75%  { transform: translate(-3px, 5px); }
          100% { transform: translate(5px,-3px); }
        }

        /* ── scanlines static ── */
        .nf-scanlines {
          position: absolute; inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent 0px, transparent 2px,
            rgba(0,0,0,0.13) 2px, rgba(0,0,0,0.13) 4px
          );
          pointer-events: none;
          z-index: 7;
        }

        /* ── vignette ── */
        .nf-vignette {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 85% 85% at 50% 50%, transparent 35%, rgba(0,0,0,0.88) 100%);
          pointer-events: none;
          z-index: 8;
        }

        /* ── content ── */
        .nf-content {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          max-width: 620px;
          width: 100%;
        }

        /* ── badge ── */
        .nf-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: #22d3a5;
          padding: 6px 16px;
          border: 1px solid rgba(34,211,165,0.22);
          border-radius: 99px;
          background: rgba(34,211,165,0.06);
          margin-bottom: 28px;
          opacity: 0;
          transform: translateY(10px);
          animation: fadeUp 0.5s 0.1s ease forwards;
        }
        .nf-badge-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #22d3a5;
          box-shadow: 0 0 6px rgba(34,211,165,0.8);
          animation: dotBlink 1.3s ease-in-out infinite;
        }
        @keyframes dotBlink {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.15; }
        }

        /* ── glitch 404 ── */
        .nf-glitch-wrap {
          position: relative;
          display: inline-block;
          margin-bottom: 28px;
          opacity: 0;
          transform: translateY(12px);
          animation: fadeUp 0.55s 0.25s ease forwards;
        }
        .nf-num {
          display: block;
          font-size: clamp(120px, 19vw, 220px);
          font-weight: 900;
          line-height: 0.88;
          letter-spacing: -0.04em;
          background: linear-gradient(170deg, #ffffff 20%, rgba(255,255,255,0.38) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 0 55px rgba(34,211,165,0.16)) drop-shadow(0 0 110px rgba(34,211,165,0.07));
        }
        .nf-num-r {
          position: absolute; inset: 0;
          display: block;
          font-size: clamp(120px, 19vw, 220px);
          font-weight: 900;
          line-height: 0.88;
          letter-spacing: -0.04em;
          background: linear-gradient(170deg, #ff3366 0%, #ff7799 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          opacity: 0;
          animation: glitchR 7s steps(1) infinite;
          will-change: transform, opacity;
        }
        .nf-num-b {
          position: absolute; inset: 0;
          display: block;
          font-size: clamp(120px, 19vw, 220px);
          font-weight: 900;
          line-height: 0.88;
          letter-spacing: -0.04em;
          background: linear-gradient(170deg, #00eeff 0%, #22d3a5 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          opacity: 0;
          animation: glitchB 7s steps(1) infinite;
          will-change: transform, opacity;
        }
        @keyframes glitchR {
          0%,78%,100%  { opacity:0; transform:translate(0); clip-path:none; }
          79%  { opacity:.85; transform:translate(-6px,3px);  clip-path:polygon(0 8%,100% 8%,100% 38%,0 38%); }
          80%  { opacity:0; }
          82%  { opacity:.7;  transform:translate(5px,-3px);  clip-path:polygon(0 60%,100% 60%,100% 84%,0 84%); }
          83%  { opacity:0; }
          85%  { opacity:.5;  transform:translate(-3px,2px);  clip-path:polygon(0 30%,100% 30%,100% 52%,0 52%); }
          86%  { opacity:0; transform:translate(0); clip-path:none; }
        }
        @keyframes glitchB {
          0%,78%,100%  { opacity:0; transform:translate(0); clip-path:none; }
          79.5%{ opacity:.75; transform:translate(6px,-3px);  clip-path:polygon(0 54%,100% 54%,100% 78%,0 78%); }
          80.5%{ opacity:0; }
          83%  { opacity:.65; transform:translate(-5px,2px);  clip-path:polygon(0 14%,100% 14%,100% 42%,0 42%); }
          84%  { opacity:0; }
          86%  { opacity:.4;  transform:translate(3px,-1px);  clip-path:polygon(0 66%,100% 66%,100% 90%,0 90%); }
          87%  { opacity:0; transform:translate(0); clip-path:none; }
        }

        /* ── glow ring around 404 ── */
        .nf-glow-ring {
          position: absolute;
          inset: -16px;
          border-radius: 16px;
          background: linear-gradient(90deg, #22d3a5, #38bdf8, #6366f1, #f43f5e, #22d3a5);
          background-size: 300% 100%;
          animation: ringShift 4s linear infinite;
          opacity: 0.12;
          filter: blur(12px);
          pointer-events: none;
          z-index: -1;
        }
        @keyframes ringShift {
          0%   { background-position: 0% 50%; }
          100% { background-position: 300% 50%; }
        }

        /* ── divider ── */
        .nf-line {
          width: 56px; height: 2px;
          background: linear-gradient(90deg, transparent, #22d3a5, transparent);
          border-radius: 1px;
          margin-bottom: 20px;
          box-shadow: 0 0 14px rgba(34,211,165,0.55);
          opacity: 0;
          animation: fadeUp 0.5s 0.45s ease forwards;
        }

        /* ── text ── */
        .nf-title {
          font-size: clamp(17px, 2.8vw, 23px);
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.01em;
          margin-bottom: 10px;
          line-height: 1.3;
          opacity: 0;
          animation: fadeUp 0.5s 0.55s ease forwards;
        }
        .nf-desc {
          font-size: 13px;
          color: rgba(255,255,255,0.33);
          line-height: 1.75;
          margin-bottom: 40px;
          max-width: 380px;
          opacity: 0;
          animation: fadeUp 0.5s 0.65s ease forwards;
        }

        /* ── buttons ── */
        .nf-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
          opacity: 0;
          animation: fadeUp 0.5s 0.78s ease forwards;
        }
        .nf-btn-p {
          display: inline-flex; align-items: center; gap: 8px;
          background: #22d3a5;
          color: #041a11;
          font-weight: 700; font-size: 13px;
          padding: 12px 30px;
          border-radius: 10px;
          text-decoration: none;
          box-shadow: 0 4px 22px rgba(34,211,165,0.35);
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          position: relative;
          overflow: hidden;
        }
        .nf-btn-p::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%);
          transform: translateX(-100%);
          transition: transform 0.5s ease;
        }
        .nf-btn-p:hover::after { transform: translateX(100%); }
        .nf-btn-p:hover {
          background: #1ab896;
          transform: translateY(-2px);
          box-shadow: 0 8px 36px rgba(34,211,165,0.5);
        }
        .nf-btn-s {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.55);
          font-weight: 600; font-size: 13px;
          padding: 12px 24px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.09);
          text-decoration: none;
          transition: background 0.2s, color 0.2s, transform 0.15s, border-color 0.2s;
        }
        .nf-btn-s:hover {
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.88);
          border-color: rgba(255,255,255,0.2);
          transform: translateY(-2px);
        }

        /* ── film strip ── */
        .nf-strip {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 30px;
          overflow: hidden;
          border-top: 1px solid rgba(34,211,165,0.07);
          z-index: 10;
          display: flex;
          align-items: center;
        }
        .nf-strip-track {
          display: flex;
          white-space: nowrap;
          animation: filmScroll 18s linear infinite;
          will-change: transform;
        }
        .nf-strip-segment {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 0 16px;
          flex-shrink: 0;
        }
        .nf-strip-hole {
          width: 11px; height: 7px;
          border: 1px solid rgba(34,211,165,0.14);
          border-radius: 2px;
          background: rgba(34,211,165,0.03);
          flex-shrink: 0;
        }
        .nf-strip-label {
          font-size: 9px;
          letter-spacing: 0.22em;
          color: rgba(34,211,165,0.2);
          font-family: monospace;
          text-transform: uppercase;
        }
        @keyframes filmScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }

        /* ── top bar ── */
        .nf-topbar {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 28px;
          border-bottom: 1px solid rgba(34,211,165,0.07);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          z-index: 10;
        }
        .nf-topbar span {
          font-size: 9px;
          letter-spacing: 0.22em;
          color: rgba(34,211,165,0.18);
          font-family: monospace;
          text-transform: uppercase;
        }
        .nf-topbar-animated {
          background: linear-gradient(90deg, #22d3a5, #6366f1, #f43f5e, #22d3a5);
          background-size: 300% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: ringShift 4s linear infinite;
          opacity: 0.5;
        }

        /* ── fade up ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 520px) {
          .nf-topbar { display: none; }
          .nf-strip-hole { display: none; }
          .nf-beam { border-left-width: 160px; border-right-width: 160px; border-top-width: 380px; }
        }
      `}</style>

      <div className="nf">
        {/* blobs */}
        <div className="nf-blob nf-blob-1" />
        <div className="nf-blob nf-blob-2" />
        <div className="nf-blob nf-blob-3" />
        <div className="nf-blob nf-blob-4" />

        {/* projector beam */}
        <div className="nf-beam" />

        {/* scan line */}
        <div className="nf-scan" />

        {/* horizontal glitch lines */}
        <div className="nf-hline nf-hline-1" />
        <div className="nf-hline nf-hline-2" />
        <div className="nf-hline nf-hline-3" />

        {/* particles */}
        {mounted && particles.map((p, i) => (
          <div
            key={i}
            className="nf-particle"
            style={{
              left: `${p.x}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              "--dur":   `${p.dur}s`,
              "--delay": `${p.delay}s`,
              "--op":    `${p.op}`,
            } as React.CSSProperties}
          />
        ))}

        {/* overlays */}
        <div className="nf-grain" />
        <div className="nf-scanlines" />
        <div className="nf-vignette" />

        {/* top bar */}
        <div className="nf-topbar">
          <span>MOXIFILM · CODEC H.265</span>
          <span className="nf-topbar-animated">◈ SIGNAL LOST · 404 · NOT FOUND ◈</span>
          <span>HDR · 4K</span>
        </div>

        {/* main content */}
        <div className="nf-content">

          {/* badge */}
          <div className="nf-badge">
            <span className="nf-badge-dot" />
            Không tìm thấy trang
          </div>

          {/* 404 glitch */}
          <div className="nf-glitch-wrap">
            <div className="nf-glow-ring" />
            <span className="nf-num">404</span>
            <span className="nf-num-r" aria-hidden>404</span>
            <span className="nf-num-b" aria-hidden>404</span>
          </div>

          <div className="nf-line" />

          <h1 className="nf-title">Trang này không tồn tại</h1>
          <p className="nf-desc">
            Nội dung bạn tìm kiếm đã bị xóa, thay đổi địa chỉ,<br />
            hoặc chưa bao giờ có mặt tại đây.
          </p>

          <div className="nf-actions">
            <Link href="/phimhay" className="nf-btn-p">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12h18M15 6l6 6-6 6" />
              </svg>
              Về trang chủ
            </Link>
            <Link href="/tim-kiem" className="nf-btn-s">
              <Search size={13} />
              Tìm kiếm phim
            </Link>
          </div>
        </div>

        {/* film strip bottom */}
        <div className="nf-strip">
          <div className="nf-strip-track">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="nf-strip-segment">
                <div className="nf-strip-hole" />
                <div className="nf-strip-hole" />
                <span className="nf-strip-label">MOXIFILM · 404 · SIGNAL LOST · NOT FOUND ·</span>
                <div className="nf-strip-hole" />
                <div className="nf-strip-hole" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
