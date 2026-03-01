# Component Spec — Professional Page Cards

## Card Types

### 1. Multi-Role Card (e.g. 1E, Brandwatch)
Companies where Sophie held multiple roles. Features a tube map timeline.

**Structure:**
```
┌─────────────────────────────────────────────┐
│ accent stripe (6px, company brand colour)    │
├─────────────────────────────────────────────┤
│ [Logo 48×48]  Company Name        [tags row]│
│               Sub-line (sector · dates)      │
│                                              │
│  Track Headers: Commercial | Marketing | Product │
│  ┌──────────────────────────────────────┐   │
│  │  TUBE MAP GRID (4-col)              │   │
│  │  Year | Track1 | Track2 | Track3    │   │
│  │  Stations with SVG tube lines       │   │
│  └──────────────────────────────────────┘   │
│  - - - - - - - - - - - - - - - - - - - -   │
│  Blurb (2-col): "About" | "Key stuff"       │
└─────────────────────────────────────────────┘
```

### 2. Single-Role Card (e.g. HTB, Signal Media, Self-Employed)
Companies with one role. Simpler header, no tube map.

**Structure:**
```
┌─────────────────────────────────────────────┐
│ accent stripe (6px, company brand colour)    │
├─────────────────────────────────────────────┤
│ [Logo 44×44]  Company Name        [tags row]│
│               Role Title                     │
│               Date range                     │
│  - - - - - - - - - - - - - - - - - - - -   │
│  Blurb (2-col): "About" | "Key stuff"       │
└─────────────────────────────────────────────┘
```

## Card Header

### Multi-role `.card-header`
- `display: flex; align-items: flex-start; gap: 16px`
- Children: `.logo-placeholder` → `.company-info` → `.tags`
- `.logo-placeholder`: 48×48, 2px border in brand colour, brand colour text, Archivo 900 1rem
- `.company-info`: flex:1
  - `.company-name`: Archivo 900 1.1rem uppercase
  - `.company-sub`: 0.85rem #555

### Single-role `.single-role-header`
- Same flex layout, gap 16px
- `.logo-placeholder`: 44×44 (slightly smaller)
- `.single-role-info`: flex:1
  - `.company-name`: same as multi
  - `.single-role-title`: Archivo 900 0.95rem uppercase
  - `.single-role-date`: Space Mono 0.8rem #555

## Tags
- Container: `.tags` — `display: flex; gap: 4px; flex-wrap: nowrap`
- Positioned as last flex child of card-header (pushes to right)
- **NO wrap** — all tags on single row

### Tag Types
| Class | Font | Size | Padding | BG | Text | Radius | Usage |
|-------|------|------|---------|-----|------|--------|-------|
| `.tag-rect` | Space Mono | 0.65rem | 3px 10px | ink | cream | 0 | Discipline/type (B2B SaaS, Enterprise) |
| `.tag-loz` | DM Sans | 0.7rem | 3px 10px | ink | cream | 999px | Category (IT Ops, DEX, Marketing) |

Both: `uppercase, letter-spacing: 0.04em` (rect only), `border: none`

## Tube Map Grid

### Grid Layout
- `.tm`: `display: grid; grid-template-columns: 50px 1fr 1fr 1fr; padding: 20px 0; position: relative`
- Column 1: Year labels
- Column 2: Track 1 — Commercial (Red)
- Column 3: Track 2 — Marketing (Green)  
- Column 4: Track 3 — Product (Blue)

### Track Headers
- `.tm-track-headers`: same 4-col grid
- `.tm-track-label`: Space Mono 0.7rem uppercase, centered, 2px solid ink bottom border
- First column (year col) is empty

### Stations
- `.tm-station`: `padding: 10px 8px; display: flex; align-items: center; gap: 8px`
- Positioned via `data-track="1|2|3"` → `grid-column: 2|3|4`
- Ordered via `data-idx` (1=bottom/oldest, 7=top/newest)
- `.tm-dot`: 14×14, border-radius 50%, 3px solid ink, filled with discipline colour
- `.tm-label`: contains `.tm-role` (bold) and `.tm-date` (mono, #777)

### Year Labels
- `.tm-year`: grid-column 1, Space Mono 0.8rem bold, right-aligned
- Placed in same grid row as corresponding station

## SVG Tube Lines

### Drawing Logic
Lines connect consecutive stations (by `data-idx` order, bottom to top).

**Same track (vertical):** Straight line `M x1,y1 L x2,y2`

**Cross-track (with curves):**
```
M x1,y1                          // start at station A
L x1, midY+r                     // vertical down to curve start
Q x1,midY  x1+dx*r,midY          // curve into horizontal
L x2-dx*r, midY                  // horizontal across
Q x2,midY  x2,midY-r             // curve into vertical
L x2,y2                          // vertical up to station B
```
Where: `midY = (y1+y2)/2`, `dx = x2>x1 ? 1 : -1`, `r = 18` (curveR)

### Gradient (cross-discipline transitions)
- `linearGradient` with `x1=0 y1=1 x2=0 y2=0` (bottom-to-top)
- 4 stops: `0%` prevColour, `20%` prevColour, `80%` newColour, `100%` newColour
- Creates a 20/60/20 blend: 20% solid previous → 60% gradient → 20% solid new

### Line Styling
- `stroke-width: 6`, `stroke-linecap: round`, `stroke-linejoin: round`, `fill: none`

## Blurb Section
- `.blurb`: `display: grid; grid-template-columns: 1fr 1fr; gap: 20px`
- Separated from content above by `border-top: 2px dashed #ccc`, margin-top/padding-top 16px
- Two columns: "About the company" (left) and "Some stuff I did there" (right)
- Heading: Archivo 700 0.8rem uppercase
- Body: 0.85rem #444

## Accent Stripe
- `.accent`: `height: 6px`, full-width at top of card
- Background: company brand colour (inline style)

## Card Order (top to bottom on page)
1. Hack The Box (single-role) — #9FEF00
2. Self-Employed (single-role) — #c4a8ff
3. 1E (multi-role, 7 stations) — #F7941D
4. Signal Media (single-role) — #0066FF
5. Brandwatch (multi-role, 2 stations) — #FF6B35
6. Earlier Career (single-role) — #888
