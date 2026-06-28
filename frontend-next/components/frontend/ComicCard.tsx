"use client";

import Link from "next/link";
import type { Comic } from "@/types/comic";

type ComicCardProps = { comic: Comic };

const STYLES = `
  .cc-card { transition: transform 0.3s cubic-bezier(0.16,1,0.3,1); }
  .cc-card:hover { transform: translateY(-6px) scale(1.02); }
  .cc-card:hover .cc-img { transform: scale(1.07); }
  .cc-card:hover .cc-overlay { opacity: 1 !important; }
  .cc-card:hover .cc-read-btn { opacity: 1 !important; transform: translateY(0) !important; }
  .cc-card:hover .cc-ink-lines { opacity: 1 !important; }
  .cc-card:hover .cc-title-bar { background: rgba(16,185,129,0.12) !important; }

  .cc-img { transition: transform 0.45s cubic-bezier(0.16,1,0.3,1); }
  .cc-overlay { transition: opacity 0.3s ease; }
  .cc-read-btn { transition: all 0.32s cubic-bezier(0.16,1,0.3,1); }
  .cc-ink-lines { transition: opacity 0.3s ease; }

  /* corner fold */
  .cc-fold::after {
    content:'';
    position:absolute; top:0; right:0;
    width:0; height:0;
    border-style:solid;
    border-width:0 18px 18px 0;
    border-color:transparent #10b981 transparent transparent;
    z-index:10;
    filter: drop-shadow(-2px 2px 3px rgba(0,0,0,0.5));
  }

  /* manga speed lines */
  .cc-ink-lines {
    background-image: repeating-linear-gradient(
      92deg,
      transparent,
      transparent 2px,
      rgba(16,185,129,0.04) 2px,
      rgba(16,185,129,0.04) 3px
    );
    pointer-events: none;
  }

  @keyframes ccShimmer {
    0%   { background-position: -300% center }
    100% { background-position:  300% center }
  }
  .cc-skeleton {
    background: linear-gradient(90deg,#12151c 25%,#1a1f2e 50%,#12151c 75%);
    background-size:300% 100%;
    animation: ccShimmer 1.8s ease-in-out infinite;
  }

  @keyframes ccFadeIn { from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none} }
  .cc-appear { animation: ccFadeIn 0.4s cubic-bezier(0.16,1,0.3,1) both; }

  /* chapter badge pulse */
  @keyframes ccBadge { 0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,0.4)} 50%{box-shadow:0 0 0 5px rgba(16,185,129,0)} }
  .cc-badge-pulse { animation: ccBadge 2.5s ease-in-out infinite; }
`;

let styleInjectedCC = false;

export default function ComicCard({ comic }: ComicCardProps) {
  if (!styleInjectedCC) {
    const s = document.createElement("style");
    s.textContent = STYLES;
    document.head.appendChild(s);
    styleInjectedCC = true;
  }

  const poster = comic.thumb_full;
  const year = new Date(comic.updatedAt).getFullYear();

  return (
    <Link href={`/doc-truyen/${comic.slug}`}
      className="cc-card cc-appear cc-fold group relative block rounded-xl overflow-hidden"
      style={{
        background: "linear-gradient(160deg,#111520,#0d1018)",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
      }}
    >
      {/* ── Poster ── */}
      <div className="aspect-[2/3] w-full relative overflow-hidden">
        {poster ? (
          <img
            src={poster} alt={comic.name}
            className="cc-img w-full h-full object-cover"
            loading="lazy" width={400} height={600}
          />
        ) : (
          <div className="cc-skeleton w-full h-full" />
        )}

        {/* manga speed lines overlay */}
        <div className="cc-ink-lines absolute inset-0 z-[2] opacity-0" />

        {/* gradient overlays */}
        <div className="absolute inset-0 z-[3] pointer-events-none"
          style={{ background: "linear-gradient(to top,rgba(10,12,18,0.96) 0%,rgba(10,12,18,0.2) 45%,transparent 100%)" }} />
        <div className="absolute inset-0 z-[3] pointer-events-none"
          style={{ background: "linear-gradient(to bottom,rgba(0,0,0,0.35) 0%,transparent 30%)" }} />

        {/* hover overlay */}
        <div className="cc-overlay absolute inset-0 z-[4] flex flex-col items-center justify-center opacity-0"
          style={{ background: "linear-gradient(160deg,rgba(16,185,129,0.15),rgba(0,0,0,0.6))" }}>

          {/* read button */}
          <div className="cc-read-btn flex items-center gap-2 rounded-full font-bold"
            style={{
              background: "linear-gradient(135deg,#10b981,#059669)",
              color: "#021a12", padding: "10px 20px",
              fontFamily: "var(--font-primary)", fontSize: "0.82rem", fontWeight: 800,
              boxShadow: "0 6px 20px rgba(16,185,129,0.45)",
              opacity: 0, transform: "translateY(8px)",
            }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
            </svg>
            Đọc ngay
          </div>
        </div>

        {/* year badge — bottom center */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[5]">
          <span className="cc-badge-pulse inline-block rounded-full"
            style={{
              background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.35)",
              color: "#6ee7b7", padding: "2px 10px",
              fontFamily: "var(--font-primary)", fontSize: "0.6rem", fontWeight: 600,
              letterSpacing: "0.08em",
            }}>{year}</span>
        </div>

        {/* top-left "NEW" ribbon if updated recently */}
        {(new Date().getTime() - new Date(comic.updatedAt).getTime()) < 1000 * 60 * 60 * 24 * 7 && (
          <div className="absolute top-2 left-2 z-[5]">
            <span style={{
              background: "linear-gradient(135deg,#10b981,#059669)",
              color: "#021a12", padding: "2px 8px", borderRadius: 4,
              fontFamily: "var(--font-mono-sans)", fontSize: "0.7rem", letterSpacing: "0.1em",
              boxShadow: "0 2px 8px rgba(16,185,129,0.4)",
            }}>NEW</span>
          </div>
        )}
      </div>

      {/* ── Title bar ── */}
      <div className="cc-title-bar px-3 py-2.5 transition-colors duration-300"
        style={{ borderTop: "1px solid rgba(16,185,129,0.08)" }}>

        {/* accent line */}
        <div className="w-6 h-[2px] rounded-full mb-1.5"
          style={{ background: "linear-gradient(90deg,#10b981,transparent)" }} />

        <p className="text-center leading-snug"
          style={{
            fontFamily: "var(--font-primary)", fontSize: "0.78rem", fontWeight: 600,
            color: "rgba(255,255,255,0.88)",
            overflow: "hidden", display: "-webkit-box",
            WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          }}
          dangerouslySetInnerHTML={{ __html: comic.name }}
        />
      </div>
    </Link>
  );
}