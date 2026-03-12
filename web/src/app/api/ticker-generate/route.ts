import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import type { Factoid, LikeDislike } from "@/types/profile-extras";

/**
 * POST /api/ticker-generate
 * Generates ticker/carousel items from the user's profile data.
 * Pinned items are passed in the request so the model avoids duplicating them.
 * [SQ.S-W-2603-0044]
 *
 * Body: { pinned: string[], count: number }
 * Response: { items: string[] }
 *
 * Requires ANTHROPIC_API_KEY env var.
 */

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const pinned: string[] = Array.isArray(body.pinned) ? body.pinned : [];
  const count: number = Math.min(Math.max(1, Number(body.count) || 5), 10);

  // Fetch user's profile for context
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: profile } = await db
    .from("profiles")
    .select("bio, about_bio, factoids, likes, dislikes")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Build profile context for the prompt
  const parts: string[] = [];

  if (profile.bio) {
    parts.push(`Short bio: ${profile.bio}`);
  }
  if (profile.about_bio) {
    parts.push(`About me: ${profile.about_bio}`);
  }

  const factoids = (profile.factoids as Factoid[] | null) ?? [];
  if (factoids.length > 0) {
    const factoidSummary = factoids
      .map((f) => `${f.category}: ${f.value}`)
      .join(", ");
    parts.push(`Quick facts: ${factoidSummary}`);
  }

  const likes = (profile.likes as LikeDislike[] | null) ?? [];
  if (likes.length > 0) {
    parts.push(`Loves: ${likes.map((l) => l.text).join(", ")}`);
  }

  const dislikes = (profile.dislikes as LikeDislike[] | null) ?? [];
  if (dislikes.length > 0) {
    parts.push(`Dislikes: ${dislikes.map((d) => d.text).join(", ")}`);
  }

  const profileContext = parts.join("\n");

  // Check for API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured — add it to your Vercel environment variables." },
      { status: 503 }
    );
  }

  const pinnedBlock =
    pinned.length > 0
      ? `\n\nAlready pinned (do NOT repeat or paraphrase these):\n${pinned.map((p) => `- ${p}`).join("\n")}`
      : "";

  const prompt = `You are generating short, punchy ticker/marquee items for a personal website's scrolling banner strip.

Profile context:
${profileContext || "No profile data available."}${pinnedBlock}

Generate exactly ${count} short ticker items for this person.

Rules:
- Each item must be 2–7 words, punchy and factual
- Write in third-person implied style (like a quick fact or label, e.g. "Patent holder", "20+ years in tech", "Surrey-based")
- No emojis, no punctuation at the end, no hashtags
- Each item must be meaningfully different from the others and from any pinned items
- Draw from different aspects of the profile (career, location, interests, achievements, personality)
- If there's not enough profile data, invent plausible items that fit the person's style

Return ONLY a JSON array of strings, nothing else. Example: ["Patent holder", "20+ years in tech", "Surrey-based"]`;

  try {
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = (message.content[0] as { type: string; text: string }).text.trim();

    // Parse the JSON array from the response
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) {
      return NextResponse.json({ error: "Failed to parse generation response" }, { status: 500 });
    }

    const items: string[] = JSON.parse(match[0]);

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid response format" }, { status: 500 });
    }

    // Deduplicate against pinned (case-insensitive prefix match)
    const pinnedLower = pinned.map((p) => p.toLowerCase());
    const filtered = items
      .filter((item) => typeof item === "string" && item.trim())
      .filter((item) => {
        const lower = item.toLowerCase();
        return !pinnedLower.some(
          (p) => lower === p || lower.startsWith(p.slice(0, 8)) || p.startsWith(lower.slice(0, 8))
        );
      })
      .map((item) => item.trim())
      .slice(0, count);

    return NextResponse.json({ items: filtered });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
