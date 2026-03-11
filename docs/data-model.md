# SideQuest.me Database Schema

## Overview

The SideQuest.me platform uses Supabase (PostgreSQL) as the primary data store. This document describes the schema for the multi-tenant social platform.

## Profiles Table

**Migration:** `001_profiles.sql`

```sql
CREATE TABLE public.profiles (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    text        UNIQUE NOT NULL,
  display_name text,
  bio         text,
  avatar_url  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
```

### Columns

- **id** (uuid): Primary key, references Supabase auth.users(id). Cascading delete on user removal.
- **username** (text, unique): User's chosen handle. Defaults to the email prefix on account creation.
- **display_name** (text, nullable): User's public display name.
- **bio** (text, nullable): User's profile bio/description.
- **avatar_url** (text, nullable): URL to user's avatar image (stored on Bunny.net CDN).
- **created_at** (timestamptz): Timestamp of account creation. Defaults to now().
- **updated_at** (timestamptz): Timestamp of last profile modification. Defaults to now().

### Triggers

**Trigger:** `on_auth_user_created`

Automatically creates a profile row when a new user signs up via Supabase Auth.
- Extracts username from email prefix (everything before '@')
- Ensures every authenticated user has a profile

## Row Level Security (RLS)

**Migration:** `002_rls_policies.sql`

All RLS policies are enforced at the database layer for defense-in-depth.

### Policies

| Policy | Table | Operation | Effect |
|---|---|---|---|
| `profiles_select_public` | profiles | SELECT | Anyone (anon + users) can read all profiles |
| `profiles_update_own` | profiles | UPDATE | User can only update their own profile (id = auth.uid()) |
| `profiles_delete_own` | profiles | DELETE | User can only delete their own profile (id = auth.uid()) |
| `profiles_insert_via_trigger` | profiles | INSERT | Inserts only allowed during auth trigger; blocks direct inserts |

### Design Notes

- **Read (SELECT):** Public — enables discovery of user profiles without authentication.
- **Write (UPDATE/DELETE):** Private — only the profile owner can modify their own data.
- **Insert:** Automatic via trigger on auth user creation; no manual inserts allowed.
- This design ensures security regardless of app-layer bugs.
