---
name: quynhphu-portal
description: Sinh và mở rộng "Cổng thông tin Quỳnh Phụ" trên NEXT.JS (bản mới nhất — App Router, React 19, TypeScript, KHÔNG Tailwind) theo design system SATI v3.3 (warm tech — cold base Navy/Teal/Indigo + accent vàng chỉ dùng line/dot). Dùng khi người dùng muốn tạo trang chủ hoặc các trang Tổng quan / Trường học / Y tế / Việc làm / Tìm đồ rơi / Chợ & mua bán / Giao thông / Di tích / Tin tức / Liên hệ cho cổng thông tin huyện Quỳnh Phụ — hoặc thêm/sửa một trang trong cổng đó.
license: MIT
metadata:
  author: DuongNV
  version: "3.0"
  breaking_change: "v3.0 chuyển target sang Next.js (App Router + React 19 + TypeScript). App nằm ở web/ (vì tên gốc project không hợp lệ làm package npm). Design system SATI vanilla giữ nguyên nhưng dùng làm GLOBAL CSS (web/styles/*) + class qp-*; shell & tương tác là React component (TopBar/Marquee/Footer + client components). KHÔNG Tailwind (giữ đúng SATI)."
  based_on: "SATI v3.3.1 + v3.3.2 (ISP Portal Design System, vốn là Next.js 15) — đã dịch sang vanilla CSS bundle trong assets/."
---

# Cổng thông tin Quỳnh Phụ — Next.js (App Router) + SATI

Skill này dựng cổng thông tin huyện Quỳnh Phụ trên **Next.js bản mới nhất** (App Router, React 19,
TypeScript). Styling dùng **design system SATI v3.3** đã dịch sang **CSS thuần** (global stylesheet,
class `qp-*`) — **KHÔNG Tailwind, KHÔNG CSS-in-JS** (đúng triết lý SATI). Bộ CSS + ảnh đóng gói trong
`assets/` cạnh file này.

> Mọi văn bản giao tiếp với người dùng bằng **tiếng Việt**.

## Mặc định đã chốt (đổi được nếu người dùng yêu cầu)
- **App ở thư mục `web/`** (gốc project tên `_CONGTHONGTINQUYNHPHU_` không hợp lệ làm package npm).
- **Next.js mới nhất + App Router + TypeScript + ESLint**, `--no-tailwind`, `--no-src-dir`, alias `@/*`.
- **Styling:** global SATI CSS (`web/styles/{tokens,base,components}.css`) + class `qp-*`. CSS Modules
  chỉ dùng khi thật sự cần style cục bộ không có sẵn.
- **Dữ liệu:** mảng TypeScript tĩnh trong `web/lib/data.ts` (dữ liệu minh hoạ, chưa cần DB/CMS).

---

## CRITICAL RULES (đọc trước — vi phạm = phải refactor)

1. **Target Next.js App Router + React 19 + TS.** Page là `app/<route>/page.tsx` (Server Component
   mặc định). Chỉ thêm `'use client'` cho component có tương tác (menu mobile, tabs, lọc). KHÔNG Tailwind.
2. **Styling từ SATI global CSS.** Class `qp-*`, `type-*` từ `web/styles/*`. Thiếu pattern → thêm class
   `qp-*` vào `components.css` (dùng biến `tokens.css`). KHÔNG inline màu/typography, KHÔNG tạo
   `font-size`/preset typography mới.
3. **Yellow `#FCD34D` CHỈ dùng line / divider / dot / indicator / border-hover.** Không fill
   button/card/box. Gradient G4 chỉ ở badge ≤30px (`.qp-badge-g4`), label marquee, tab/nav indicator 3px.
4. **Mật độ:** BloomCard 1–2/section · MeshCard/tile 3–6/grid · `.qp-btn-primary` ≤1/viewport ·
   `.qp-badge-g4` ≤5/viewport · Hero & Marquee 1/trang.
5. **A11y:** `next/image` hoặc `<img>` đều phải có `alt`; nút icon có `aria-label`; giữ focus-visible
   (đã có trong base.css); animation có fallback `prefers-reduced-motion` (đã có). Mỗi page đúng 1 `<h1>`.
6. **Điều hướng nội bộ dùng `next/link`** (`<Link href="/viec-lam">`), KHÔNG `<a href>` cho route nội bộ.
   Ảnh static để trong `web/public/img/...`, tham chiếu `/img/...`.
7. **Shell 1 nguồn sự thật:** TopBar + Marquee + Footer render trong `app/layout.tsx` qua React
   component — KHÔNG lặp lại trong từng page.
8. **Dữ liệu minh hoạ** — không bịa thông tin nhạy cảm (tên người thật, CCCD). Ghi rõ ở footer (đã có).

---

## INPUT / SETUP

### Step 0 — Xác định app Next.js
- App nằm ở `web/` trong gốc project (`D:\DuongNV\PROJECT\_CONGTHONGTINQUYNHPHU_\web\`).
- Kiểm tra đã có chưa: tồn tại `web/package.json` chứa `"next"`.
  - **Chưa** → tạo bằng: `npx --yes create-next-app@latest web --ts --eslint --app --no-tailwind
    --no-src-dir --import-alias "@/*" --use-npm --yes` (chạy ở gốc project). Cần Node ≥ 18.18.
  - **Có** → dùng luôn.

### Step 0.5 — Kiểm tra design system đã cài chưa
- Nếu `web/styles/tokens.css` **đã tồn tại** → bỏ qua PHASE A (trừ khi yêu cầu refresh).
- Nếu chưa → chạy PHASE A.

### Step 1 — Phạm vi
- "Đầy đủ" → toàn bộ 12 page (PAGE CATALOG) + layout + shell + data.
- "Thêm/sửa trang X" → chỉ `app/<route>/page.tsx` (+ data nếu cần), không đụng design system/layout/page khác.

---

## PHASE A — Cài design system vào Next app (idempotent)

Copy CSS sang `web/styles/`, ảnh sang `web/public/img/`:

```powershell
$skill = "D:\DuongNV\PROJECT\_CONGTHONGTINQUYNHPHU_\skills\quynhphu-portal\assets"
$web   = "D:\DuongNV\PROJECT\_CONGTHONGTINQUYNHPHU_\web"
New-Item -ItemType Directory -Force "$web\styles" | Out-Null
New-Item -ItemType Directory -Force "$web\public\img" | Out-Null
Copy-Item "$skill\css\*"  "$web\styles\"     -Recurse -Force
Copy-Item "$skill\img\*"  "$web\public\img\" -Recurse -Force
```

> `assets/js/portal.js` KHÔNG dùng trong Next (tương tác chuyển sang React client component — xem B3).

---

## PHASE B — Khung Next.js (layout · fonts · shell · data)

### B1. Global CSS + fonts — `app/layout.tsx`
Import 3 file CSS theo đúng thứ tự, nạp fonts SATI (qua `<link>` Google Fonts trong `<head>` cho đơn
giản — tokens.css tham chiếu đúng tên family), render shell.

```tsx
import type { Metadata } from "next";
import "@/styles/tokens.css";
import "@/styles/base.css";
import "@/styles/components.css";
import { TopBar } from "@/components/layout/TopBar";
import { Marquee } from "@/components/layout/Marquee";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: { default: "Cổng thông tin Quỳnh Phụ", template: "%s · Cổng thông tin Quỳnh Phụ" },
  description: "Cổng thông tin huyện Quỳnh Phụ — tin tức, việc làm, tìm đồ rơi, cộng đồng.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@500&family=Source+Serif+4:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <a className="skip-link" href="#main">Bỏ qua tới nội dung</a>
        <TopBar />
        <Marquee />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

### B2. Điều hướng + ticker — `lib/nav.ts`
Export 3 thứ:
- `NAV` — danh sách **phẳng** `{ id, label, href }` đủ 11 route (`/`, `/tong-quan`, …, `/lien-he`).
  Dùng cho Footer & dò active.
- `NAV_TREE` — **cây menu** cho TopBar: gom 11 mục thành ít mục cấp 1 + dropdown để navbar gọn, KHÔNG
  dàn ngang full (xấu). Mỗi node: `{ id, label, href? , children?: NavItem[] }`; child có thêm
  `desc` + `icon`. Nhóm mặc định: Trang chủ (link) · **Dịch vụ công ▾** (Trường học/Y tế/Giao thông) ·
  **Tiện ích ▾** (Việc làm/Tìm đồ rơi/Chợ & Mua bán) · **Khám phá ▾** (Tổng quan/Di tích) · Tin tức
  (link) · Liên hệ (link).
- `TICKER` — mảng string cho Marquee.

### B3. Shell components
- `components/layout/TopBar.tsx` — **client component** (`'use client'`): brand (mark "QP" + tên + sub),
  `<nav className="qp-nav">` map `NAV_TREE` — node có `children` render `.qp-nav__btn` + `.qp-nav__chevron`
  + panel `.qp-dropdown` (mỗi item `.qp-dropdown__item` có icon + label + desc); node không children render
  `.qp-nav__link`. State `openId` (dropdown đang mở) + `mobileOpen` (hamburger). Mở dropdown khi hover
  (`onMouseEnter`) hoặc click; đóng bằng ESC / click ra ngoài (ref + listener). Active: link theo
  `usePathname()`, nhóm active khi 1 child active (`aria-current`, `aria-haspopup`, `aria-expanded`).
  Link dùng `next/link`. Trên mobile (<1180px) dropdown thành khối tĩnh mở khi bấm (CSS lo).
- `components/layout/Marquee.tsx` — render `.qp-marquee` với `.qp-marquee__track` chứa `TICKER` lặp **2
  lần** (để loop liền mạch — CSS animation đã lo phần chạy). Có thể là Server Component.
- `components/layout/Footer.tsx` — `.qp-footer` 4 cột (brand + 3 cột link từ `NAV`), dòng cuối
  "© {năm} … Dữ liệu minh hoạ". Server Component.
- `components/client/Tabs.tsx` (`'use client'`) — nhận `items={[{id,label}]}` + render children theo tab
  active (state). Dùng cho Tìm đồ rơi, Tin tức.
- `components/client/FilterList.tsx` (`'use client'`) — nhận data + cấu hình filter (search `q` + các
  select), lọc client-side bằng `useState`/`useMemo`, render `.qp-empty` khi rỗng. Dùng cho Trường học,
  Y tế, Việc làm.

> Markup HTML của component bám đúng class trong `components.css`. Đây là cách "dịch" component SATI
> (TopBar/Marquee/ArticleCard…) sang JSX dùng class `qp-*` thay vì CSS Modules.

### B4. Dữ liệu mẫu — `lib/data.ts`
Khai báo type + mảng tĩnh: `schools`, `healthFacilities`, `jobs`, `lostFound`, `markets`, `transit`,
`relics`, `news` (mỗi news có `slug`, `category`, `title`, `excerpt`, `body`, `image`, `author`, `date`),
`adminUnits`, `kpis`. Page import từ đây. `app/tin-tuc/[slug]/page.tsx` tra `slug`, `notFound()` nếu
không thấy; có thể `generateStaticParams()` từ `news`.

---

## PAGE CATALOG (12 page trong `app/` — spec + component map)

Mỗi page là `app/<route>/page.tsx`, export `metadata` (title), default function trả JSX. Server Component
trừ khi cần tương tác (bọc phần đó bằng client component ở B3). Dữ liệu là **gợi ý mẫu Quỳnh Phụ**; giữ
đúng component & mật độ. Trang con mở đầu `.qp-pagehead` hoặc `.qp-breadcrumb`; trang chủ mở `.qp-hero`.

### 1. `app/page.tsx` — Trang chủ
- `.qp-hero` (1/trang): eyebrow "HUYỆN QUỲNH PHỤ · THÁI BÌNH", H1 "Cổng thông tin & kết nối cộng đồng
  Quỳnh Phụ", excerpt, CTA 1 `.qp-btn-primary` (Link `/viec-lam`) + 1 `.qp-btn-secondary on-dark`
  (Đăng tin). Ảnh nền `/img/...` + overlay + pattern.
- `.qp-kpi-strip` 4 KPI (Dân số ~230.000 · 37 xã/thị trấn · ~120 trường · 1.000+ tin việc làm).
- "Truy cập nhanh": grid `.qp-tile` (6 tile, icon SVG inline, `next/link`).
- "Tin nổi bật": 1 `.qp-bloom-card` chứa `.qp-article--featured` + 3 `.qp-mesh-card` (map `news`).
- Pattern divider `.qp-divider-strip` (background `/img/patterns/light-pillars.png`). `.qp-newsletter`.
- **Density:** Hero 1 · BloomCard 1 · MeshCard 3 · btn-primary 1 ✓

### 2. `app/tong-quan/page.tsx` — Tổng quan
- `.qp-pagehead`. Giới thiệu `.qp-prose` + ảnh. Lưới `.qp-stat-card` (diện tích/dân số/số xã/làng nghề).
  `.qp-table` "Đơn vị hành chính" map `adminUnits`.

### 3. `app/truong-hoc/page.tsx` — Trường học
- `.qp-pagehead` + `<FilterList>`: search `q` + select `cap` (Mầm non/Tiểu học/THCS/THPT) + select
  `loai` (Công lập/Tư thục). Render `.qp-list` các trường (`.qp-list__item` + `data-cap`/`data-loai`
  KHÔNG cần — FilterList lọc bằng state): icon, tên, xã+địa chỉ, `.qp-category-badge` cấp, SĐT ở aside.
  `.qp-empty` khi rỗng.

### 4. `app/y-te/page.tsx` — Y tế
- `.qp-pagehead`. `.qp-alert is-info` hotline 115. `<FilterList>` (loại). `.qp-list` cơ sở y tế: SĐT,
  giờ làm việc, `.qp-dot is-live`.

### 5. `app/viec-lam/page.tsx` — Việc làm
- `.qp-pagehead` + 1 `.qp-btn-primary` "Đăng tin tuyển dụng". `<FilterList>` (search + ngành + lương).
  Lưới `.qp-mesh-card` việc làm: chức danh, công ty, xã, lương (`.qp-tag`), `.qp-badge-g4` "MỚI" cho
  1–2 tin (≤5). Phân trang đơn giản (state) hoặc tĩnh.
- **Density:** MeshCard ≤6 · badge-g4 ≤5 · btn-primary 1 ✓

### 6. `app/tim-do-roi/page.tsx` — Tìm đồ rơi
- `.qp-pagehead`. `<Tabs>` "Nhặt được"/"Bị mất" → mỗi tab lưới `.qp-mesh-card`. Form đăng tin (client
  component, `onSubmit` preventDefault → hiện `.qp-alert is-success`).

### 7. `app/cho-mua-ban/page.tsx` — Chợ & Mua bán
- `.qp-pagehead`. `.qp-table` lịch chợ phiên. Lưới `.qp-mesh-card` đặc sản. `.qp-list` tin mua bán.

### 8. `app/giao-thong/page.tsx` — Giao thông
- `.qp-pagehead`. `.qp-table` tuyến xe. `.qp-alert is-warning` lưu ý. `.qp-list` bến/điểm đón.

### 9. `app/di-tich/page.tsx` — Di tích
- `.qp-pagehead`. 1 `.qp-bloom-card` di tích tiêu biểu. Lưới `.qp-mesh-card` map `relics`.

### 10. `app/tin-tuc/page.tsx` — Tin tức
- `.qp-breadcrumb` + header "Tin tức · N bài" + search. `<Tabs>` (Tất cả/Thông báo/Đời sống/Kinh tế).
  1 `.qp-article--featured` (trong `.qp-bloom-card`) + lưới 6 `.qp-mesh-card`, Link `/tin-tuc/[slug]`.

### 11. `app/tin-tuc/[slug]/page.tsx` — Bài chi tiết
- `.qp-breadcrumb`. Header: `.qp-category-badge` ×1–2, H1 `.type-display-l`, excerpt, `.qp-author`. Ảnh
  hero 16:9. `.qp-article-layout`: `.qp-prose` (p/h2/h3/blockquote/list) + `.qp-toc` sticky. Hàng
  `.qp-tag`. Divider. "Bài liên quan" 3 `.qp-mesh-card`. `.qp-newsletter`. `generateStaticParams` từ news.

### 12. `app/lien-he/page.tsx` — Liên hệ/Phản ánh
- `.qp-pagehead`. 2 cột: trái form (client component) Họ tên/SĐT/loại `.qp-select`/nội dung
  `.qp-textarea`/`.qp-check`/`.qp-btn-primary` + `.qp-alert is-success` khi submit; phải `.qp-list`
  thông tin liên hệ + `.qp-alert is-info`.

---

## ICONS
Inline SVG kiểu lucide (`fill="none" stroke="currentColor" stroke-width="2"`, 20–24px), một bộ duy nhất
(hoặc cài `lucide-react` nếu muốn — đúng SATI). Nút icon có `aria-label`. Gợi ý: graduation-cap,
heart-pulse, briefcase, search/map-pin, shopping-bag, bus, landmark, newspaper, phone.

---

## FINALIZATION
1. Nhắc chạy: `cd web && npm run dev` → mở `http://localhost:3000`.
2. `npm run build` để chắc chắn không lỗi type/lint trước khi giao.
3. In bảng tổng kết page/route đã tạo + Density check từng trang.

### Density check (mỗi page)
- [ ] Hero ≤1/trang · Marquee 1 (trong layout)
- [ ] BloomCard 1–2/section · MeshCard/tile 3–6/grid
- [ ] `.qp-btn-primary` ≤1/viewport · `.qp-badge-g4` ≤5 · G4 chỉ ≤30px
- [ ] Không yellow fill · không inline màu · 11 type preset
- [ ] Đúng 1 `<h1>` · ảnh có alt · nút icon có aria-label
- [ ] Route nội bộ dùng `next/link` · ảnh trong `/public/img`

---

## WHAT NOT TO DO (instant-fail)
- ❌ Thêm Tailwind/styled-components/emotion/MUI (vi phạm SATI). Dùng global CSS + class `qp-*`.
- ❌ Fill yellow vào button/card/box; gradient G4 trên bề mặt > 30px.
- ❌ >1 `.qp-btn-primary` cùng viewport; >2 BloomCard cùng section; >6 MeshCard cùng grid.
- ❌ Lặp TopBar/Footer trong từng page (phải qua `app/layout.tsx`).
- ❌ `<a href>` cho route nội bộ (dùng `next/link`); inline `style` cho màu/typography; tạo preset mới.
- ❌ `'use client'` cho cả page khi chỉ một mẩu cần tương tác — tách client component nhỏ.
- ❌ Bỏ `alt`/`aria-label`; xoá focus outline; animation không `prefers-reduced-motion`.
- ❌ Sửa file trong `web/styles/` để vá 1 page — thêm class `qp-*` tái dùng được.
- ❌ Bịa thông tin nhạy cảm. Giữ "dữ liệu minh hoạ".
