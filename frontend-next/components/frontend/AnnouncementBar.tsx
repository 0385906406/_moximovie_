"use client";

const ITEMS = [
  { emoji: "👋", text: "Xin chào tất cả các bạn đã đến với MoxiMovie!" },
  { emoji: "🎬", text: "Hàng ngàn bộ phim chất lượng cao đang chờ bạn khám phá" },
  { emoji: "🔥", text: "Phim mới cập nhật mỗi ngày — Xem ngay!" },
  { emoji: "⭐", text: "Xem phim HD · 4K hoàn toàn miễn phí" },
  { emoji: "🎭", text: "Anime · Phim Bộ · Phim Lẻ · Hoạt Hình — đủ cả!" },
  { emoji: "🌏", text: "Kho phim đồ sộ từ Việt Nam, Hàn Quốc, Nhật Bản, Âu Mỹ và hơn thế nữa" },
  { emoji: "🎞️", text: "Vietsub · Thuyết Minh · Lồng Tiếng đầy đủ" },
  { emoji: "🍿", text: "Trải nghiệm điện ảnh đỉnh cao ngay tại nhà" },
  { emoji: "✨", text: "Cùng MoxiMovie khám phá thế giới điện ảnh muôn màu!" },
];

const SEP = "  ·  ";
const TRACK_CONTENT = [...ITEMS, ...ITEMS]; // doubled for seamless loop

export default function AnnouncementBar() {
  return (
    <>
      <style>{`
        .ann-bar {
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 32px;
          z-index: 60;
          background: #05070d;
          border-bottom: 1px solid rgba(34,211,165,0.14);
          display: flex;
          align-items: center;
          overflow: hidden;
        }

        /* LIVE label */
        .ann-live {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 6px;
          height: 100%;
          padding: 0 14px;
          background: linear-gradient(90deg, rgba(34,211,165,0.18), rgba(34,211,165,0.08));
          border-right: 1px solid rgba(34,211,165,0.18);
          font-size: 9.5px;
          font-weight: 800;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #22d3a5;
          white-space: nowrap;
        }
        .ann-live-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #22d3a5;
          box-shadow: 0 0 6px rgba(34,211,165,0.9);
          animation: annDotBlink 1.4s ease-in-out infinite;
          flex-shrink: 0;
        }
        @keyframes annDotBlink {
          0%,100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.2; transform: scale(0.8); }
        }

        /* scrolling area */
        .ann-scroll-area {
          flex: 1;
          overflow: hidden;
          position: relative;
          height: 100%;
          display: flex;
          align-items: center;
        }

        /* fade masks */
        .ann-scroll-area::before,
        .ann-scroll-area::after {
          content: '';
          position: absolute;
          top: 0; bottom: 0;
          width: 48px;
          z-index: 2;
          pointer-events: none;
        }
        .ann-scroll-area::before {
          left: 0;
          background: linear-gradient(90deg, #05070d, transparent);
        }
        .ann-scroll-area::after {
          right: 0;
          background: linear-gradient(270deg, #05070d, transparent);
        }

        /* track */
        .ann-track {
          display: flex;
          align-items: center;
          white-space: nowrap;
          animation: annScroll 55s linear infinite;
          will-change: transform;
        }
        .ann-track:hover {
          animation-play-state: paused;
        }

        /* item */
        .ann-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 0 28px;
          font-size: 12px;
          color: rgba(255,255,255,0.45);
          flex-shrink: 0;
          line-height: 1;
        }
        .ann-item-emoji {
          font-size: 13px;
          flex-shrink: 0;
        }
        .ann-item-text {
          white-space: nowrap;
        }
        .ann-item-text strong {
          color: rgba(34,211,165,0.85);
          font-weight: 600;
        }
        .ann-sep {
          color: rgba(34,211,165,0.25);
          font-size: 10px;
          padding: 0 4px;
          flex-shrink: 0;
        }

        @keyframes annScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }

        @media (max-width: 480px) {
          .ann-live span:last-child { display: none; }
          .ann-live { padding: 0 10px; }
          .ann-item { font-size: 11px; padding: 0 18px; }
        }
      `}</style>

      <div className="ann-bar" role="marquee" aria-live="off">
        {/* LIVE badge */}
        <div className="ann-live">
          <span className="ann-live-dot" />
          <span>MoxiMovie</span>
        </div>

        {/* Scrolling text */}
        <div className="ann-scroll-area">
          <div className="ann-track">
            {TRACK_CONTENT.map((item, i) => (
              <span key={i} className="ann-item">
                <span className="ann-item-emoji">{item.emoji}</span>
                <span className="ann-item-text">{item.text}</span>
                <span className="ann-sep">✦</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
