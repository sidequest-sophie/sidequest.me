# Style Guide — sidequest.me Professional Page

## Design Philosophy: Neo-Brutalist
- **No border-radius** on cards, buttons, inputs (0px) — exception: tag lozenges (999px) and station dots (50%)
- **Heavy borders**: 3px solid ink on all structural elements
- **Flat colour fills**: no shadows, no gradients on backgrounds (gradients only on SVG tube lines)
- **Cream background** (#fffbe6) — NOT white
- **Cards use white (#fff)** background to stand out from cream page
- **Typography-driven hierarchy**: weight and size create emphasis, not colour
- **Uppercase headings**: all headings use Archivo 900 uppercase
- **Monospace for data**: dates, labels, track headers use Space Mono

## Layout Rules

### Page Container
- Max-width: match existing site pages (the layout.tsx wrapper handles this)
- Section title: use existing `.section-title` class from globals.css
- Page padding: consistent with other pages in the site

### Card Stack
- Cards stack vertically with `margin-bottom: 30px`
- No horizontal card layouts
- Cards have `overflow: hidden` (for accent stripe bleed)

### Responsive Considerations
- Tube map grid may need to collapse on mobile — track headers and stations should stack
- Tags should remain `nowrap` — if they overflow, the card should accommodate
- Blurb 2-column grid should collapse to single column on small screens
- Logo sizes remain fixed (no scaling)

## Colour Usage Rules
- **Brand colours** are ONLY used for: accent stripes, logo borders, logo text, station dot fills
- **Ink (#1a1a1a)** for: all text, card borders, tag backgrounds, station dot borders, track header borders
- **Cream (#fffbe6)** for: page background, tag text (on ink background)
- **#555** for: sub-lines, secondary text
- **#777** for: station date text
- **#444** for: blurb body text  
- **#ccc** for: blurb dashed divider
- **Discipline colours** (red/green/blue): ONLY on tube lines and station dot fills
- White (#fff): card background only

## Typography Rules
- **Archivo 900 uppercase**: company names, role titles, blurb headings, section titles
- **Archivo 700 uppercase**: blurb sub-headings (h4)
- **DM Sans 400**: body text, blurbs, lozenge tags
- **Space Mono 400/700**: dates, rect tags, track headers, year labels
- No italic usage in cards
- Letter-spacing: 0.04em on rect tags only

## Component Patterns

### Tags Always Last
Tags container is always the last flex child in the header row. It uses no `flex-wrap` — all tags must fit on one line.

### Accent + Card Inner
Every card follows: `.accent` (6px colour stripe) → `.card-inner` (padded content area). The accent is outside card-inner.

### Blurb Separator
Blurbs are always preceded by `border-top: 2px dashed #ccc` with equal margin-top and padding-top (16px).

### SVG Overlay Pattern
The tube map SVG is absolutely positioned over the grid (`position: absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:0`). Stations have `z-index:1` to sit above lines.

## CSS Variables to Add to globals.css
The following variables need to be added to the existing `:root` block:
```css
--line-commercial: #E53935;
--line-product: #1E88E5;
--line-marketing: #43A047;
--cream: #fffbe6;
```

And to the `@theme inline` block:
```css
--color-line-commercial: var(--line-commercial);
--color-line-product: var(--line-product);
--color-line-marketing: var(--line-marketing);
```

## Existing Classes to Reuse
From globals.css, these existing classes should be used where appropriate:
- `.section-title` — for the page heading
- `.card-hover` — if card hover effects are desired (existing: translate + shadow)
- Nav and Footer are already handled by layout.tsx

## File Organisation
New files should be created at:
- `src/app/professional/page.tsx` — REPLACE existing file entirely
- `src/components/professional/CareerCard.tsx` — multi-role card component
- `src/components/professional/SingleRoleCard.tsx` — single-role card component  
- `src/components/professional/TubeMap.tsx` — tube map grid + SVG drawing
- `src/components/professional/Tags.tsx` — tag row component
- `src/lib/career-data.ts` — all career data as typed arrays
