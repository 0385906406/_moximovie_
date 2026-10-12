/* ── Lọc quảng cáo chèn giữa phim trong playlist HLS (nguồn phimapi) ──
   Nguồn phim chèn các đoạn quảng cáo (~20–30 giây) vào giữa phim, luôn được bọc bởi #EXT-X-DISCONTINUITY
   và nằm ở thư mục khác với các đoạn phim chính (vd. "convertv8/…", "/v8/<mã>/segment_0001.ts", "/adjump/…").
   Cách nhận biết: chia playlist thành các nhóm theo DISCONTINUITY; thư mục chứa nhiều thời lượng nhất là phim chính;
   nhóm ngắn mà không đoạn nào thuộc thư mục phim chính → quảng cáo → bỏ.

   Khi dựng lại playlist phải giữ #EXT-X-DISCONTINUITY đúng chỗ (trước đoạn tương ứng) và thêm 1 cái ở chỗ vừa cắt
   quảng cáo — thiếu thì trình phát mất mốc thời gian và kẹt khi tua tới đó. */

export interface HlsSegment {
    duration: number;
    /* URL tuyệt đối */
    uri: string;
    /* Có #EXT-X-DISCONTINUITY ngay trước đoạn này */
    discontinuity: boolean;
    /* Thẻ #EXT-X-KEY đang áp dụng cho đoạn này (nếu có) */
    key?: string;
    /* Thẻ riêng của đoạn (#EXT-X-MAP, #EXT-X-BYTERANGE, #EXT-X-PROGRAM-DATE-TIME) */
    tags: string[];
    isAd: boolean;
}

/* Quảng cáo không dài quá mức này (để không bao giờ cắt nhầm một phần phim) */
const MAX_AD_GROUP_SECONDS = 180;

const SEGMENT_TAG = /^#EXT-X-(MAP|BYTERANGE|PROGRAM-DATE-TIME)/;

function absolute(uri: string, base: string) {
    if (!uri || /^https?:\/\//i.test(uri)) return uri;
    try { return new URL(uri, base).toString(); } catch { return uri; }
}

const dirOf = (uri: string) => uri.split("?")[0].replace(/[^/]*$/, "");

export function parseHlsPlaylist(text: string, playlistUrl: string): { header: string[]; segments: HlsSegment[] } {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    const header: string[] = [];
    const segments: HlsSegment[] = [];
    let started = false;
    let discontinuity = false;
    let key: string | undefined;
    let tags: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith("#EXTINF:")) {
            started = true;
            const duration = parseFloat(line.slice(8).split(",")[0]) || 0;
            const uri = lines[i + 1] && !lines[i + 1].startsWith("#") ? absolute(lines[++i], playlistUrl) : "";
            if (uri) segments.push({ duration, uri, discontinuity, key, tags, isAd: false });
            discontinuity = false;
            tags = [];
        } else if (line.startsWith("#EXT-X-DISCONTINUITY") && !line.startsWith("#EXT-X-DISCONTINUITY-SEQUENCE")) {
            started = true;
            discontinuity = true;
        } else if (line.startsWith("#EXT-X-KEY")) {
            started = true;
            key = line.replace(/URI="([^"]+)"/, (_m, u) => `URI="${absolute(u, playlistUrl)}"`);
        } else if (SEGMENT_TAG.test(line)) {
            started = true;
            tags.push(line.replace(/URI="([^"]+)"/, (_m, u) => `URI="${absolute(u, playlistUrl)}"`));
        } else if (line.startsWith("#EXT-X-ENDLIST")) {
            /* thêm lại ở cuối khi dựng playlist */
        } else if (!started && line.startsWith("#")) {
            header.push(line);
        }
    }
    return { header, segments };
}

/* Đánh dấu đoạn quảng cáo (isAd) */
export function markAds(segments: HlsSegment[]) {
    const total = new Map<string, number>();
    for (const s of segments) total.set(dirOf(s.uri), (total.get(dirOf(s.uri)) ?? 0) + s.duration);
    const mainDir = [...total.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

    /* Chia nhóm theo DISCONTINUITY */
    const groups: HlsSegment[][] = [];
    for (const s of segments) {
        if (s.discontinuity || groups.length === 0) groups.push([]);
        groups[groups.length - 1].push(s);
    }
    for (const g of groups) {
        const duration = g.reduce((t, s) => t + s.duration, 0);
        const foreign = g.every(s => dirOf(s.uri) !== mainDir);
        if (foreign && duration <= MAX_AD_GROUP_SECONDS) g.forEach(s => { s.isAd = true; });
    }
    /* Dấu hiệu quảng cáo cũ của nguồn */
    for (const s of segments) if (s.uri.includes("/adjump/")) s.isAd = true;
    return segments;
}

/* Playlist mới chỉ còn phim chính, giữ đúng thẻ của từng đoạn */
export function buildPlaylist(header: string[], segments: HlsSegment[]) {
    const out = header.some(h => h.startsWith("#EXTM3U")) ? [...header] : ["#EXTM3U", ...header];
    let lastKey: string | undefined;
    let cut = false;
    let first = true;
    for (const s of segments) {
        if (s.isAd) { cut = true; continue; }
        if (!first && (s.discontinuity || cut)) out.push("#EXT-X-DISCONTINUITY");
        if (s.key && s.key !== lastKey) { out.push(s.key); lastKey = s.key; }
        out.push(...s.tags, `#EXTINF:${s.duration},`, s.uri);
        cut = false;
        first = false;
    }
    out.push("#EXT-X-ENDLIST");
    return out.join("\n") + "\n";
}

/* Gộp: playlist gốc → playlist đã bỏ quảng cáo + số giây quảng cáo đã bỏ */
export function stripAds(text: string, playlistUrl: string) {
    const { header, segments } = parseHlsPlaylist(text, playlistUrl);
    markAds(segments);
    const removed = segments.filter(s => s.isAd).reduce((t, s) => t + s.duration, 0);
    return { playlist: buildPlaylist(header, segments), removedSeconds: removed, segmentCount: segments.length };
}
