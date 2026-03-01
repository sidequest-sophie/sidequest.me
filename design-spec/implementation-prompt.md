# Implementation Prompt — Professional Page

## Step 0: Read Design Specs
Before writing any code, read these files in the project root:
- `design-spec/design-tokens.md` — all colours, fonts, spacing values
- `design-spec/component-spec.md` — card anatomy, tube map grid, SVG lines, tags
- `design-spec/style-guide.md` — neo-brutalist rules, layout patterns, file organisation
- `design-spec/career-data.md` — all company/role data with station indices and tracks
- `card-preview-v14-FINAL.html` — THE visual source of truth (open in browser to see target)

Also read these existing project files to understand patterns:
- `src/app/globals.css` — existing CSS variables and Tailwind v4 theme
- `src/app/layout.tsx` — font loading, Nav/Footer wrapper
- `src/components/Nav.tsx` — example of Tailwind class usage patterns
- `src/app/professional/page.tsx` — current page to REPLACE

## Step 1: Update globals.css
Add these CSS variables to the existing `:root` block (do NOT remove existing variables):
```css
--cream: #fffbe6;
--line-commercial: #E53935;
--line-product: #1E88E5;
--line-marketing: #43A047;
```

Add to the existing `@theme inline` block:
```css
--color-cream: var(--cream);
--color-line-commercial: var(--line-commercial);
--color-line-product: var(--line-product);
--color-line-marketing: var(--line-marketing);
```

Add professional card styles (append to end of file):
```css
/* Professional page cards */
.pro-card {
  border: 3px solid var(--ink);
  background: #fff;
  margin-bottom: 30px;
  position: relative;
  overflow: hidden;
}
.pro-card-inner { padding: 24px 28px; }
.pro-accent { height: 6px; }

/* Tags */
.pro-tags { display: flex; gap: 4px; flex-wrap: nowrap; }
.pro-tag-rect {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 3px 10px;
  background: var(--ink);
  color: var(--cream);
  border: none;
}
.pro-tag-loz {
  display: inline-block;
  font-family: var(--font-body);
  font-size: 0.7rem;
  padding: 3px 10px;
  background: var(--ink);
  color: var(--cream);
  border: none;
  border-radius: 999px;
}

/* Tube map */
.tm-grid {
  display: grid;
  grid-template-columns: 50px 1fr 1fr 1fr;
  gap: 0;
  padding: 20px 0;
  position: relative;
}
.tm-track-headers {
  display: grid;
  grid-template-columns: 50px 1fr 1fr 1fr;
  gap: 0;
  margin-bottom: 4px;
}
.tm-track-label {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  text-align: center;
  padding: 4px;
  border-bottom: 2px solid var(--ink);
}

/* Blurb */
.pro-blurb {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 2px dashed #ccc;
}

@media (max-width: 640px) {
  .pro-blurb { grid-template-columns: 1fr; }
  .tm-grid { grid-template-columns: 40px 1fr 1fr 1fr; }
}
```

## Step 2: Create Career Data File
Create `src/lib/career-data.ts` with TypeScript types and data.
Refer to `design-spec/career-data.md` for all values.

Types needed:
```typescript
type Tag = { label: string; type: 'rect' | 'loz' };
type Station = {
  idx: number;
  role: string;
  dates: string;
  discipline: 'commercial' | 'product' | 'marketing';
  track: 1 | 2 | 3;
};
type Company = {
  name: string;
  brandColour: string;
  logoText: string;
  logoSrc?: string; // path to /logos/*.svg
  type: 'single' | 'multi';
  subLine?: string; // for multi-role cards
  role?: string; // for single-role cards
  dates?: string; // for single-role cards
  tags: Tag[];
  stations?: Station[]; // for multi-role cards
  blurbLeft: string;
  blurbRight: string;
};
```

## Step 3: Create Components

### `src/components/professional/Tags.tsx`
Simple component rendering `.pro-tags` container with `.pro-tag-rect` and `.pro-tag-loz` spans.

### `src/components/professional/TubeMap.tsx`
"use client" component (needs useEffect + useRef for SVG drawing).

Must implement:
1. Track headers row (3 labels + empty year column)
2. 4-column CSS grid with stations placed by `data-track`
3. Year labels in column 1
4. SVG overlay drawn with useEffect after mount
5. ResizeObserver to redraw SVG on window resize

SVG drawing logic — port exactly from v14 FINAL:
- Get bounding rects of station dots relative to grid container
- For same-track: straight vertical line
- For cross-track: vertical → Q curve → horizontal → Q curve → vertical
- curveR = 18, lineWidth = 6, round caps/joins
- Cross-discipline segments get linearGradient with 20/60/20 stops
- Gradient direction: y1=1 y2=0 (bottom to top)

### `src/components/professional/CareerCard.tsx`
Multi-role card with accent stripe, header (logo + company info + tags), TubeMap, and blurb.

### `src/components/professional/SingleRoleCard.tsx`
Single-role card with accent stripe, single-role header (logo + info + tags), and blurb.

### Shared sub-components:
- `Logo`: div with border, brand colour, text/image
- `Blurb`: two-column grid with heading + body

## Step 4: Replace Professional Page
Replace `src/app/professional/page.tsx` entirely.

The new page should:
1. Be a "use client" component (for tube map interactivity)
2. Import career data from `@/lib/career-data`
3. Import CareerCard and SingleRoleCard
4. Render a section title at top
5. Map over companies and render appropriate card type
6. Maintain existing page structure (will be wrapped by Nav/Footer from layout.tsx)

## Step 5: Verify
1. Run `npm run build` — must compile with zero errors
2. Run `npm run dev` and open http://localhost:3000/professional
3. Compare visually to `card-preview-v14-FINAL.html` opened in browser
4. Check: accent stripes, logo styling, tag positioning, tube map grid alignment, SVG lines drawing correctly, gradient transitions, blurb layout
5. Test window resize — SVG lines should redraw
6. Check mobile responsive (narrow viewport)

## Critical Implementation Notes
- This is Next.js 16.1.6 with Tailwind CSS v4 — use `@theme inline` for custom values
- Existing nav uses classes like `border-3`, `font-head`, `bg-bg`, `text-ink` — follow same patterns
- The v14 HTML uses vanilla CSS class names; translate these to either Tailwind utilities or CSS classes in globals.css
- SVG tube lines MUST be drawn client-side (useEffect) since they depend on DOM positions
- All logos exist as SVGs in `/public/logos/` — use Next.js Image component or img tag
- The existing professional/page.tsx data is OUTDATED — use career-data.md as truth
- Station dots must be filled with discipline colour (not brand colour)
- Cards use white (#fff) background, NOT cream
