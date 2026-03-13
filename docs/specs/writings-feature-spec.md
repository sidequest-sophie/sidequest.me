# Writings Feature — Product Spec
**Ticket:** SQ.S-W-2603-0056
**Status:** Planning
**Date:** 2026-03-13

---

## Overview

A long-form writing platform embedded in SideQuest.me, serving two primary use cases:

1. **Personal publishing hub** — migrate Medium writings over; write and publish from one place
2. **API-first content syndication** — expose writings (filtered by tag) to external sites (e.g. Category Leaders) via a keyed API, so other sites can render a blog/thought-leadership section pulling from this source

The primary workflow is **publish here + expose via API** — both always happen together.

---

## Canonical URL Question — Answered

> *"Do I still need canonical URL if I delete the Medium content?"*

**No — if you delete the Medium posts, canonical is not needed for those.** Canonical tags exist to tell Google which version of duplicate content to index. Once Medium posts are deleted, there's no duplicate. The field is still worth having in the schema for future cross-posting scenarios (e.g. republishing a piece on LinkedIn or another platform where you can't delete it). **Recommendation: include the field, leave it optional, skip it for the Medium imports.**

---

## Phase 1 — MVP

### Editor
- **WYSIWYG** (rich text, rendered-output editing)
- Suggested library: **Tiptap** (based on ProseMirror, React-native, extensible, open source, well-maintained)
- Phase 2 roadmap: add markdown mode as a user-selectable toggle per-session (persisted in user prefs)

### Post Anatomy (Phase 1 — minimal)
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → profiles |
| `title` | text | Required |
| `body` | jsonb | Tiptap/ProseMirror JSON doc |
| `body_html` | text | Rendered HTML (for API delivery + search) |
| `slug` | text | Auto-generated from title; user-editable |
| `tags` | text[] | Same tag system as photos |
| `published_at` | timestamptz | Null = draft; set on first publish |
| `scheduled_at` | timestamptz | Future date = scheduled |
| `status` | text | `draft` \| `scheduled` \| `published` \| `unlisted` |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |
| `word_count` | int | Computed on save |
| `canonical_url` | text | Optional; for cross-posted pieces |

### Post Anatomy (Phase 2 — full roadmap)
Additional fields to add iteratively:
- `subtitle` text
- `cover_image_url` text (Bunny.net CDN)
- `excerpt` text (manual override; auto-generated from body if blank)
- `read_time_minutes` int (computed: word_count / 200)
- `series_id` uuid → FK to `writing_series` table
- `series_position` int (order within series)

---

## Post Lifecycle

```
Draft → Scheduled → Published → Unlisted
  ↑_____________________________↑  (can un-publish → unlisted or back to draft)
```

| Status | Visible to owner | Visible publicly | In API | Notes |
|---|---|---|---|---|
| `draft` | ✅ | ❌ | ❌ | Work in progress |
| `scheduled` | ✅ | ❌ | ❌ | Goes live at `scheduled_at` |
| `published` | ✅ | ✅ | ✅ | Live |
| `unlisted` | ✅ | ❌ (no index) | ✅ opt-in | Link-accessible but not listed; includable in API if consumer wants it |

A Supabase cron job (or Edge Function) checks `scheduled_at` and flips status to `published` at the right time.

---

## Routes

| Route | Component | Notes |
|---|---|---|
| `/[username]/writings` | Reader index | Lists published posts; paginated |
| `/[username]/writings/[slug]` | Post view | Full post |
| `/[username]/writings/tags/[tag]` | Tag-filtered index | Same as main but filtered |
| `/[username]/writings/series/[slug]` | Series page | Lists posts in series order |
| `/[username]/admin/writings` | Admin index | Owner only; all statuses |
| `/[username]/admin/writings/new` | Editor | New post |
| `/[username]/admin/writings/[slug]/edit` | Editor | Edit existing |

---

## API

### Authentication
- **API key per consumer site** — issued in settings, labelled (e.g. "Category Leaders"), revocable
- Key passed as `Authorization: Bearer <key>` header
- Keys stored hashed in `api_keys` table; rate-limited per key

### Endpoints

Base: `https://api.sidequest.me/content`

```
GET /writings
  ?username=       required — identifies whose writings
  ?tag=            filter by tag (exact match, single tag)
  ?status=         published (default) | unlisted | all (requires key with unlisted permission)
  ?page=           page number (default 1)
  ?per_page=       items per page (default 20, max 100)
  ?fields=         comma-separated: title,slug,tags,published_at,excerpt,body
                   body is excluded by default (excerpt mode)

Response: { data: Post[], meta: { total, page, per_page, total_pages } }
```

```
GET /writings/[slug]
  ?username=       required
  ?fields=         same as above

Response: { data: Post }
```

```
GET /writings/latest
  ?username=       required
  ?fields=         title,slug,excerpt (default)

Response: { data: Post }   ← For "Now Reading" widget
```

### Body vs Excerpt toggle
**Per-post:** A `body` field flag on each post (Phase 2 — initially always excerpt-only unless `?fields=body` is passed and the key has body permission).

**Per-tag:** A `api_tags_config` jsonb column on the profile: `{ "category-leaders": { full_body_tags: ["product", "strategy"] } }` — if a post has a tag in this list, body is returned; otherwise excerpt. Phase 2.

**Phase 1 simplification:** Consumer explicitly requests `?fields=body` and the API returns it. Tag-based and post-based body restrictions are Phase 2.

---

## Medium Migration

**Approach:** Drop Medium export ZIP(s) into working folder → Claude processes and bulk-imports.

**Medium export format:** ZIP containing `posts/` directory with `.html` files per post. Each file contains the post HTML, title in `<title>`, and publication date in metadata/URL.

**Import process (one-time, run by Claude):**
1. Unzip export
2. Parse each `.html` — extract title, publication date, body HTML
3. Convert body HTML → Tiptap JSON (via html-to-prosemirror or similar)
4. Compute word count
5. Set `status = 'published'`, `published_at` = original Medium date
6. Set `canonical_url = null` (original Medium content will be deleted)
7. Bulk insert into `writings` table
8. Report: N posts imported, list of titles + slugs for review

**Tags on import:** Medium exports don't include tags reliably — either leave blank and tag manually post-import, or do a first-pass import with tags blank and let Sophie tag in bulk via admin UI.

---

## Discovery Features

### A — Reader Index (`/[username]/writings`)
- Paginated list of published posts
- Shows: title, excerpt (first 150 chars or manual excerpt), tags, date, read time
- Filterable by tag (via tag stickers at top, same pattern as photo wall)
- Sorted: newest first (default); Phase 2 add sort options

### B — Search
- Full-text search over `title` + `body_html`
- Supabase `tsvector` + `GIN` index on a generated column
- Search UI: a search input on the reader index page; results replace the listing

### C — Series (`writing_series` table)
```sql
CREATE TABLE writing_series (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   uuid REFERENCES profiles(id),
  title     text NOT NULL,
  slug      text NOT NULL,
  created_at timestamptz DEFAULT now()
);
```
- Each post has optional `series_id` + `series_position`
- **Toggle per post:** `in_series_nav boolean DEFAULT true` — if false, post is part of series but doesn't show prev/next series navigation links (e.g. a standalone post that belongs to a series thematically but shouldn't be read in sequence)
- Series page at `/[username]/writings/series/[slug]` lists all posts in order
- On a post page: prev/next series links shown if `in_series_nav = true`

### D — "Now Reading" Widget
- Embeddable snippet for other sites: an iframe or JS embed that shows the post the owner is currently reading/has most recently published
- Simplest implementation: a public API endpoint `GET /api/v1/writings/latest` that returns the single most recently published post's title, slug, and excerpt
- Consumer site fetches this and renders however they like

### E — Email Subscribe
- Subscribe form on reader index + individual post pages
- **Per-tag subscriptions:** subscriber can choose to receive all posts, or only posts tagged with specific tag(s)
- Stored in `email_subscribers` table:
```sql
CREATE TABLE email_subscribers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES profiles(id),  -- profile they're subscribed to
  email      text NOT NULL,
  tags       text[],  -- empty = all posts; populated = only these tags
  confirmed  boolean DEFAULT false,
  token      text,    -- for confirmation + unsubscribe links
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, email)
);
```
- Confirmation email sent on subscribe; confirmed = true after click
- Send: triggered by Supabase Edge Function on `status` changing to `published`
- Unsubscribe: one-click link with token in every email
- Phase 1: send plain-text or simple HTML email via Resend/Postmark
- Phase 2: templated email matching SideQuest brand

### F — Canonical URL
- `canonical_url` text field on each post (optional)
- Rendered as `<link rel="canonical" href="...">` in page `<head>`
- Use case: if a post was originally published elsewhere and still exists there (e.g. re-posting from another platform that won't let you delete it)
- **Not needed for Medium imports** if Medium content is deleted

---

## Schema (Phase 1 — new tables)

```sql
-- Posts
CREATE TABLE public.writings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title           text NOT NULL,
  slug            text NOT NULL,
  body            jsonb,                    -- Tiptap JSON
  body_html       text,                     -- rendered HTML (for search + API)
  tags            text[] DEFAULT '{}',
  status          text NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','scheduled','published','unlisted')),
  published_at    timestamptz,
  scheduled_at    timestamptz,
  word_count      int DEFAULT 0,
  canonical_url   text,
  in_series_nav   boolean DEFAULT true,
  series_id       uuid REFERENCES public.writing_series(id) ON DELETE SET NULL,
  series_position int,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE(user_id, slug)
);

-- Full-text search index
ALTER TABLE public.writings
  ADD COLUMN fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title,'') || ' ' || coalesce(body_html,''))
  ) STORED;

CREATE INDEX writings_fts_idx ON public.writings USING GIN(fts);
CREATE INDEX writings_user_status_idx ON public.writings(user_id, status);
CREATE INDEX writings_tags_idx ON public.writings USING GIN(tags);

-- Series
CREATE TABLE public.writing_series (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title      text NOT NULL,
  slug       text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, slug)
);

-- API keys
CREATE TABLE public.api_keys (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label       text NOT NULL,              -- e.g. "Category Leaders"
  key_hash    text NOT NULL UNIQUE,       -- bcrypt hash of the key
  key_prefix  text NOT NULL,             -- first 8 chars, shown in UI
  created_at  timestamptz DEFAULT now(),
  last_used_at timestamptz,
  revoked_at  timestamptz
);

-- Email subscribers
CREATE TABLE public.email_subscribers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email      text NOT NULL,
  tags       text[] DEFAULT '{}',        -- empty = all posts
  confirmed  boolean DEFAULT false,
  token      text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, email)
);
```

### RLS
- `writings`: owner can CRUD all; public can SELECT where `status = 'published'`
- `writing_series`: same
- `api_keys`: owner only (no public access)
- `email_subscribers`: owner can SELECT/DELETE; anyone can INSERT (subscribe)

---

## Phased Rollout

### Phase 1 — Core publish + API
- [ ] DB schema + RLS
- [ ] Tiptap WYSIWYG editor (+ Bunny.net image upload integration)
- [ ] Post CRUD (create/edit/delete drafts); slug auto-gen + editable
- [ ] Publish / unpublish / unlisted
- [ ] Reader index + single post view
- [ ] Tag filtering on reader index
- [ ] `api.sidequest.me` subdomain — Vercel config + Next.js middleware routing
- [ ] API: `GET /content/writings`, `GET /content/writings/[slug]`, `GET /content/writings/latest`
- [ ] API key management: generate, label, revoke in settings
- [ ] Medium bulk import (one-time script)
- [ ] Full-text search (tsvector + GIN index)

### Phase 2 — Rich posts
- [ ] Subtitle, cover image, excerpt field, read time display
- [ ] Markdown toggle in editor
- [ ] Scheduled publishing (cron/Edge Function)

### Phase 3 — Discovery + reach
- [ ] Series navigation
- [ ] Email subscribe + per-tag subscriptions
- [ ] "Now reading" embed widget
- [ ] Per-tag or per-post body/excerpt toggle in API
- [ ] Canonical URL rendering in `<head>`

---

## Decisions — 2026-03-13

### 1 — Slug: auto-generate + user-editable ✅
Auto-generate from title on create; user can override before/after publishing. Slug locked once published to preserve inbound links (show warning + offer redirect option — Phase 2).

### 2 — Authors: owner + Collaborators ✅
Phase 1: display owner as author.
Phase 2: **Colabs** — co-author credits on posts. A collaborator is a credited co-author.

**Schema addition:**
```sql
CREATE TABLE public.writing_collaborators (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  writing_id  uuid NOT NULL REFERENCES public.writings(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,  -- null if external
  name        text NOT NULL,   -- display name; pre-filled from profile if user_id set
  url         text,            -- optional link (their site, SideQuest profile, etc.)
  created_at  timestamptz DEFAULT now()
);
```

**Resolved:** Credited-only for Phase 2. Full collaborative editing ("Some Day Maybe") tracked in SDM backlog.

### 3 — Comments: native, requires SideQuest account ✅
Build native comments. Commenter must have a SideQuest account (no anonymous comments).

**Implications:**
- Requires a reader auth flow (non-owner sign-up/login) — significant scope, Phase 3+
- Needs `comments` table, moderation (owner can delete), optional threading

**Reader auth: lightweight commenter accounts (not full SideQuest profiles)**
- **Option A:** Name + email + email verification (OTP/magic link via Supabase Auth)
- **Option B:** Login with Google (OAuth via Supabase Auth)
- CAPTCHA on comment form (Supabase has built-in Cloudflare Turnstile / hCaptcha support)
- No public profile page for commenters — just a verified identity
- Commenters become Supabase Auth users (`auth.users`) without a `profiles` row

**Schema (Phase 3):**
```sql
CREATE TABLE public.writing_comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  writing_id  uuid NOT NULL REFERENCES public.writings(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL,  -- auth.users.id (commenter; may or may not have a profiles row)
  display_name text NOT NULL, -- from Google profile or entered on sign-up
  parent_id   uuid REFERENCES public.writing_comments(id) ON DELETE CASCADE,  -- threading
  body        text NOT NULL,
  created_at  timestamptz DEFAULT now(),
  deleted_at  timestamptz   -- soft delete; writing owner or commenter can delete
);
```

RLS: authenticated users can INSERT own comments; writing owner can soft-delete any; public can SELECT non-deleted.

### 4 — Image uploads in posts: Bunny.net (same flow as photos) ✅
Tiptap image node triggers the same Supabase Edge Function upload → Bunny.net CDN path as the photo wall. No new infrastructure needed; reuse existing upload util.

### 5 — API: `api.sidequest.me/content/writings` ✅ — expandable tree
**External URL tree (confirmed):**
```
api.sidequest.me/
  content/
    writings          ← this feature
    writings/[slug]
    projects/         ← future
    tasks/            ← future
```

**Implementation:**
- `api.sidequest.me` custom domain added to Vercel project
- Next.js middleware detects `api.` subdomain and routes to internal API handlers
- Internal route files at `web/src/app/api/external/content/writings/route.ts`
- No separate service needed — all served by the existing Next.js app on Vercel

**Updated endpoint paths (replacing `/api/v1/writings`):**
```
GET api.sidequest.me/content/writings
GET api.sidequest.me/content/writings/[slug]
GET api.sidequest.me/content/writings/latest   ← Now Reading widget feed
```

**Vercel config (`vercel.json` rewrites):**
```json
{
  "rewrites": [
    {
      "source": "/content/:path*",
      "has": [{ "type": "host", "value": "api.sidequest.me" }],
      "destination": "/api/external/content/:path*"
    }
  ]
}
```

---

## Some Day Maybe (SDM)

Features explicitly deferred with no committed timeline:
- **Full collaborative editing** — real-time co-authoring with session/role system for colabs
- **Markdown editor** — user-selectable toggle between WYSIWYG and markdown (Phase 2 roadmap, SDM if deprioritised)
- **Scheduled publishing** — cron/Edge Function to flip draft → published at a set time
- **Per-tag / per-post body toggle in API** — currently body returned on `?fields=body` request; SDM for fine-grained per-consumer control

---

## Status: Planning complete ✅
All open questions resolved. Ready for design loop (Phase 1 scope).
