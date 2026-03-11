# SideQuest.me — Code Security Review
**Date:** 2026-03-11
**Scope:** Web application (`/web`) — Next.js 16, Supabase Auth, RLS
**Reviewer:** Claude (automated)

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 2 |
| High | 4 |
| Medium | 5 |
| Low | 3 |
| Pass | 3 |

The application has a solid foundation (Next.js defaults, Supabase RLS, no vulnerable deps), but two critical open-redirect vulnerabilities and an unauthenticated API endpoint need immediate attention.

---

## Critical

### 1. Open Redirect in Auth Callback
**File:** `web/src/app/auth/callback/route.ts` (lines 14-18)

The auth callback constructs a redirect URL from user-controlled `x-forwarded-host` / `x-forwarded-proto` headers. An attacker can redirect users to a phishing site immediately after email verification.

**Fix:** Validate host against a whitelist; use `request.url` origin instead of forwarded headers.

### 2. Open Redirect in Login (`next` param)
**File:** `web/src/app/login/page.tsx` (lines 32-34)

`searchParams.get('next')` is passed directly to `router.push()` without validation. Attackers can craft `/login?next=//attacker.com`.

**Fix:** Validate `nextPath` starts with `/` and not `//`; check `url.origin === window.location.origin`.

---

## High

### 3. Unsafe Image URL in Avatar
**File:** `web/src/app/[username]/settings/SettingsForm.tsx` (lines 114-125)

Users can store arbitrary URLs in `avatar_url`. No origin validation — enables tracking pixels, analytics exfiltration.

**Fix:** Whitelist allowed image hosts (images.sidequest.me, Bunny CDN).

### 4. Incomplete Route Protection for Multi-Tenant
**File:** `web/src/lib/supabase/middleware.ts` (lines 5-7)

Only `/[username]/settings/*` is protected. No rate limiting on username enumeration.

**Fix:** Document access model; add rate limiting; plan for multi-tenant.

### 5. Notion API Key at Module Level
**File:** `web/src/lib/notion.ts` (line 4)

Notion client instantiated at module load — risk of accidental exposure in error logs.

**Fix:** Lazy initialisation inside function scope.

### 6. Unauthenticated Feedback API
**File:** `web/src/app/api/feedback/route.ts` (lines 22-81)

No auth check, no input validation, no rate limiting. Anyone can spam Asana tasks and update field values via `waitingForFieldGid`.

**Fix:** Add auth guard, zod validation, rate limiting.

---

## Medium

### 7. Avatar URL Allows Arbitrary Origins
Same file as #3. Needs URL origin validation on both client and server.

### 8. No Explicit CSRF Documentation
Server actions rely on Next.js built-in CSRF tokens — verify this is working; document it.

### 9. Bio Field — No Input Sanitisation
**File:** `web/src/app/[username]/settings/SettingsForm.tsx`

Raw user input stored. Safe today (React escapes), but risk if ever rendered via `dangerouslySetInnerHTML` or in emails/RSS.

**Fix:** Strip control characters server-side.

### 10. No Rate Limiting on Auth
Login and signup have no app-level rate limiting. Supabase provides some protection, but brute-force attacks are possible.

**Fix:** IP-based rate limiting in middleware (5 login / 15 min, 3 signup / hour).

### 11. No Content Security Policy
**File:** `web/next.config.ts`

No CSP header. Mitigated by Next.js nonces but explicit policy recommended.

---

## Low

### 12. Error Messages May Leak Info
**File:** `web/src/lib/asana.ts` — `JSON.stringify(err)` in thrown errors.

### 13. No security.txt
No vulnerability disclosure policy.

### 14. Type Assertions in Login
**File:** `web/src/app/login/page.tsx` — `as unknown as` cast bypasses TS safety.

---

## Passing

- **RLS policies** — correctly implemented (public read, owner-only write)
- **Dependencies** — `npm audit` clean, all packages current
- **Env vars** — `NEXT_PUBLIC_*` correctly used; server secrets not exposed

---

## Recommended Timeline

**Week 1 (immediate):** Fix #1, #2, #6
**Week 2:** Fix #3, #7, #10, #11
**Before multi-tenant launch:** Fix #4, #8, #9
**Ongoing:** #12, #13, #14
