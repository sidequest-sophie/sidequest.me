import Link from "next/link";

const stickers = [
  { label: "Product", color: "sticker-orange" },
  { label: "Marketing", color: "sticker-green" },
  { label: "Photography", color: "sticker-pink" },
  { label: "Writing", color: "sticker-blue" },
  { label: "Cybersecurity", color: "sticker-yellow" },
  { label: "Side Projects", color: "sticker-lilac" },
];

const latestCards = [
  {
    title: "Current Role",
    badge: "sticker-green",
    heading: "Hack The Box",
    desc: "Sr. Director of Product Marketing at the leading cybersecurity upskilling platform.",
    link: "/about",
  },
  {
    title: "Latest Thought",
    badge: "sticker-lilac",
    heading: "On building in public",
    desc: "Why I started sharing my side projects before they're ready...",
    link: "/ideas",
  },
  {
    title: "Latest Photo",
    badge: "sticker-pink",
    heading: "Golden hour 🌅",
    desc: "Chasing light with a camera — one of those perfect evenings.",
    link: "/photos",
  },
];

const thoughts = [
  {
    text: "20 years in tech and the most valuable skill is still knowing when to listen.",
    date: "Recently",
  },
  {
    text: "The best product marketers are the ones who started in product. Fight me.",
    date: "Recently",
  },
  {
    text: "Notion as a CMS might be the most underrated stack choice of the decade.",
    date: "Recently",
  },
];

const tickerItems = [
  "Sr. Director PMM at Hack The Box",
  "20+ years in tech",
  "Surrey-based",
  "Product → Marketing → Leadership",
  "Patent holder",
  "Next.js enthusiast",
  "Always a sidequest in progress",
];

export default function Home() {
  return (
    <main className="max-w-[1100px] mx-auto px-8 py-12 relative">
      {/* Decorative doodles */}
      <div
        className="doodle doodle-circle"
        style={{ width: 120, height: 120, top: 40, right: -30 }}
      />
      <div
        className="doodle"
        style={{ width: 80, height: 80, bottom: 200, left: -20 }}
      />

      {/* ── HERO ── */}
      <section className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-10 mb-14 relative z-1">
        <div>
          <h1 className="font-head font-[900] text-[clamp(2rem,5vw,3.4rem)] uppercase leading-[0.92] mb-5">
            Sophie Collins builds things &amp; tells their story
          </h1>
          <p className="text-[1.05rem] leading-relaxed mb-6 max-w-[540px] opacity-80">
            Product leader turned product marketer. 20+ years taking enterprise
            software to market — from code to customer. This is my corner of the
            internet.
          </p>
          <div className="flex flex-wrap gap-2.5">
            {stickers.map((s) => (
              <span key={s.label} className={`sticker ${s.color}`}>
                {s.label}
              </span>
            ))}
          </div>
        </div>

        <div
          className="hidden md:block border-3 border-ink bg-white p-2.5 relative"
          style={{ transform: "rotate(1.5deg)" }}
        >
          <div className="w-full h-52 bg-gradient-to-br from-orange/30 to-pink/30" />
          <p className="font-mono text-[0.7rem] text-center mt-2 opacity-60">
            📍 currently in Surrey, UK
          </p>
          <div
            className="absolute -bottom-1 -right-1 w-full h-full border-3 border-ink -z-1"
            style={{ transform: "translate(5px, 5px)" }}
          />
        </div>
      </section>

      {/* ── LATEST GRID ── */}
      <section className="mb-14">
        <div className="section-title">What&apos;s New</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {latestCards.map((card, i) => (
            <Link
              key={card.title}
              href={card.link}
              className="block border-3 border-ink p-5 bg-white card-hover no-underline text-ink"
              style={{
                transform: `rotate(${i % 2 === 0 ? "-0.3deg" : "0.3deg"})`,
              }}
            >
              <span className={`badge ${card.badge} mb-3 inline-block`}>
                {card.title}
              </span>
              <h3 className="font-head font-bold text-[1rem] uppercase mt-2 mb-1.5">
                {card.heading}
              </h3>
              <p className="text-[0.85rem] opacity-70 leading-snug">
                {card.desc}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── TICKER ── */}
      <div className="border-y-3 border-ink py-3 overflow-hidden mb-14">
        <div
          className="flex whitespace-nowrap font-mono text-[0.78rem] uppercase gap-0"
          style={{ animation: "scroll 25s linear infinite" }}
        >
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} className="px-6">
              {item} ✦
            </span>
          ))}
        </div>
      </div>

      {/* ── QUICK THOUGHTS ── */}
      <section>
        <div className="section-title">Quick Thoughts</div>
        <div className="flex flex-col gap-4">
          {thoughts.map((t, i) => (
            <div
              key={i}
              className="border-3 border-ink p-5 flex justify-between items-start gap-5 bg-white"
              style={{
                transform: `rotate(${i % 2 === 0 ? "-0.2deg" : "0.2deg"})`,
              }}
            >
              <p className="text-[0.92rem] leading-snug">{t.text}</p>
              <span className="font-mono text-[0.65rem] opacity-40 whitespace-nowrap shrink-0">
                {t.date}
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
