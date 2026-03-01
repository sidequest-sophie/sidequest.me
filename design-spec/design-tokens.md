# Design Tokens — sidequest.me Professional Page

## Site Colours
| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | `#fffbe6` | Page background (cream) |
| `--ink` | `#1a1a1a` | Text, borders, dark elements |
| `--cream` | `#fffbe6` | Alias for bg, used in tag text |
| `--orange` | `#ff6b35` | Site accent |
| `--green` | `#00d4aa` | Site accent |
| `--pink` | `#ff69b4` | Site accent |
| `--blue` | `#4d9fff` | Site accent |
| `--yellow` | `#ffd23f` | Site accent |
| `--lilac` | `#c4a8ff` | Site accent |

## Company Brand Colours
| Company | Hex | Logo Text |
|---------|-----|-----------|
| Hack The Box | `#9FEF00` | HTB |
| 1E | `#F7941D` | 1E |
| Signal Media | `#0066FF` | SM |
| Brandwatch | `#FF6B35` | BW |
| Self-Employed | `#c4a8ff` | SE |
| Earlier Career | `#888888` | _ |

## Tube Line (Discipline) Colours
| Token | Hex | Discipline | Track |
|-------|-----|-----------|-------|
| `--line-commercial` | `#E53935` | Commercial / Selling | Track 1 (left, grid-col 2) |
| `--line-marketing` | `#43A047` | Marketing & Strategy | Track 2 (middle, grid-col 3) |
| `--line-product` | `#1E88E5` | Product & Dev | Track 3 (right, grid-col 4) |

## Typography
| Token | Value | Usage |
|-------|-------|-------|
| `--font-head` | `'Archivo', sans-serif` | Headings, company names, labels — weight 900, uppercase |
| `--font-body` | `'DM Sans', sans-serif` | Body text, blurbs, lozenge tags |
| `--font-mono` | `'Space Mono', monospace` | Dates, rect tags, track headers, year labels |

## Font Sizes
| Element | Size |
|---------|------|
| Company name | `1.1rem` |
| Single-role title | `0.95rem` |
| Body / blurb | `0.85rem` |
| Company sub-line | `0.85rem` |
| Tag rect | `0.65rem` |
| Tag lozenge | `0.7rem` |
| Tube station role | `0.82rem` |
| Tube station date | `0.72rem` |
| Track header label | `0.7rem` |
| Year label | `0.8rem` |
| Blurb heading | `0.8rem` |

## Spacing
| Element | Value |
|---------|-------|
| Card inner padding | `24px 28px` |
| Card header gap | `16px` |
| Tag gap | `4px` |
| Tag padding (rect) | `3px 10px` |
| Tag padding (loz) | `3px 10px` |
| Accent stripe height | `6px` |
| Blurb grid gap | `20px` |
| Blurb top margin | `16px` |
| Blurb top padding | `16px` |
| Tube map padding | `20px 0` |
| Station padding | `10px 8px` |
| Station gap | `8px` |
| Card margin-bottom | `30px` |

## Borders & Radii
| Element | Value |
|---------|-------|
| Card border | `3px solid var(--ink)` |
| Logo border | `2px solid var(--ink)` |
| Blurb divider | `2px dashed #ccc` |
| Track header bottom | `2px solid var(--ink)` |
| Station dot border | `3px solid var(--ink)` |
| Border radius (global) | `0px` (neo-brutalist) |
| Tag lozenge radius | `999px` |

## Component Dimensions
| Element | Size |
|---------|------|
| Logo (multi-role card) | `48px × 48px` |
| Logo (single-role card) | `44px × 44px` |
| Station dot | `14px × 14px` |
| Tube grid columns | `50px 1fr 1fr 1fr` |

## SVG Tube Line Parameters
| Parameter | Value |
|-----------|-------|
| Line width | `6px` |
| Curve radius | `18px` |
| Stroke linecap | `round` |
| Stroke linejoin | `round` |
| Gradient stops (cross-discipline) | `0%/20%/80%/100%` (20-60-20 blend) |
