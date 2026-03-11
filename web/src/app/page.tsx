import { redirect } from "next/navigation";

/**
 * Root page — redirects to Sophie's profile.
 * Temporary while the platform is single-user.
 * When multi-tenant registration is live, this becomes a proper landing page.
 * [SQ.S-W-2603-0031]
 */
export default function Home() {
  redirect("/sophie");
}
