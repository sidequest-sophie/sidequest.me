# Career Data — Professional Page

## Company Cards (in display order, top to bottom)

### 1. Hack The Box (Single-Role)
- **Brand colour:** #9FEF00
- **Logo text:** HTB
- **Role:** VP Product Marketing
- **Dates:** 2023 – 2024
- **Tags rect:** B2B SaaS, Cybersecurity
- **Tags loz:** Marketing, Strategy
- **Blurb left ("About"):** Placeholder text about HTB
- **Blurb right ("Key stuff"):** Placeholder text

### 2. Self-Employed (Single-Role)
- **Brand colour:** #c4a8ff
- **Logo text:** SE
- **Role:** Freelance Consultant
- **Dates:** 2020 – 2023
- **Tags rect:** Consulting
- **Tags loz:** Strategy, GTM
- **Blurb left:** Placeholder
- **Blurb right:** Placeholder

### 3. 1E (Multi-Role — 7 stations, tube map)
- **Brand colour:** #F7941D
- **Logo text:** 1E
- **Sub-line:** Enterprise Software · 2013–2020
- **Tags rect:** B2B SaaS, Enterprise
- **Tags loz:** IT Ops, DEX

#### Stations (bottom to top by data-idx):
| idx | Role | Dates | Discipline | Track | Dot Colour |
|-----|------|-------|-----------|-------|------------|
| 1 | Solutions Engineer | 2013–2014 | commercial | 1 (left) | #E53935 |
| 2 | Solutions Engineering Lead | 2014–2015 | commercial | 1 (left) | #E53935 |
| 3 | Product Manager | 2015–2016 | product | 3 (right) | #1E88E5 |
| 4 | Senior Product Manager | 2016–2017 | product | 3 (right) | #1E88E5 |
| 5 | Product Marketing Manager | 2017–2018 | marketing | 2 (middle) | #43A047 |
| 6 | Senior Product Marketing Mgr | 2018–2019 | marketing | 2 (middle) | #43A047 |
| 7 | VP Product Marketing | 2019–2020 | marketing | 2 (middle) | #43A047 |

#### Track Headers:
- Track 1: "Selling" (Red #E53935)
- Track 2: "Marketing" (Green #43A047)
- Track 3: "Product" (Blue #1E88E5)

#### Year Labels:
Displayed in column 1, aligned with corresponding station rows.
Years: 2013, 2014, 2015, 2016, 2017, 2018, 2019

#### SVG Line Segments (bottom to top):
| From→To | Same track? | Colour/Gradient |
|---------|------------|----------------|
| 1→2 | Yes (track 1) | Solid #E53935 |
| 2→3 | No (1→3) | Gradient: #E53935 → #1E88E5 (20/60/20) |
| 3→4 | Yes (track 3) | Solid #1E88E5 |
| 4→5 | No (3→2) | Gradient: #1E88E5 → #43A047 (20/60/20) |
| 5→6 | Yes (track 2) | Solid #43A047 |
| 6→7 | Yes (track 2) | Solid #43A047 |

- **Blurb left:** Placeholder about 1E
- **Blurb right:** Placeholder key achievements

### 4. Signal Media (Single-Role)
- **Brand colour:** #0066FF
- **Logo text:** SM
- **Role:** Product Marketing Manager
- **Dates:** 2012 – 2013
- **Tags rect:** B2B SaaS
- **Tags loz:** Media, Analytics
- **Blurb left:** Placeholder
- **Blurb right:** Placeholder

### 5. Brandwatch (Multi-Role — 2 stations, tube map)
- **Brand colour:** #FF6B35
- **Logo text:** BW
- **Sub-line:** Social Analytics · 2010–2012
- **Tags rect:** B2B SaaS, Analytics
- **Tags loz:** Social, Data

#### Stations:
| idx | Role | Dates | Discipline | Track | Dot Colour |
|-----|------|-------|-----------|-------|------------|
| 1 | Marketing Executive | 2010–2011 | marketing | 2 (middle) | #43A047 |
| 2 | Senior Marketing Executive | 2011–2012 | marketing | 2 (middle) | #43A047 |

#### Track Headers:
- Same 3-track layout but only track 2 has stations
- Track 1: "Selling", Track 2: "Marketing", Track 3: "Product"

#### SVG Line: Single solid green line (same track)

- **Blurb left:** Placeholder
- **Blurb right:** Placeholder

### 6. Earlier Career (Single-Role)
- **Brand colour:** #888888
- **Logo text:** _ (underscore)
- **Role:** Various Roles
- **Dates:** 2007 – 2010
- **Tags rect:** Early Career
- **Tags loz:** Foundations
- **Blurb left:** Placeholder
- **Blurb right:** Placeholder

## Notes
- Blurb content is placeholder — Sophie will fill in actual text in Phase 2/3
- All logo images already exist in `/public/logos/` as SVG files
- The existing page.tsx has different role titles and dates — use THIS spec as source of truth
- Station order matters: idx 1 is bottom (oldest), highest idx is top (newest)
