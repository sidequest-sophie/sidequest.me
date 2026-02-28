"use client";

/* ── Career timeline data from LinkedIn ── */

type TimelineEntry = {
  company: string;
  color: string;
  roles: { title: string; period: string }[];
  desc: string;
};

const timeline: TimelineEntry[] = [
  {
    company: "Hack The Box",
    color: "sticker-green",
    roles: [{ title: "Sr. Director, Product Marketing", period: "Dec 2025 – Present" }],
    desc: "Leading product marketing for the cybersecurity upskilling platform used by enterprises and ethical hackers worldwide.",
  },
  {
    company: "Self-Employed",
    color: "sticker-lilac",
    roles: [{ title: "Analyst Relations Consultant", period: "Nov 2023 – Present" }],
    desc: "Independent consulting on analyst relations strategy, helping tech companies build credibility with industry analysts.",
  },
  {
    company: "1E",
    color: "sticker-orange",
    roles: [
      { title: "SVP Product", period: "Jan 2022 – Nov 2023" },
      { title: "VP Product Marketing", period: "Jun 2020 – Jan 2022" },
      { title: "VP Product Management", period: "Apr 2012 – Sep 2014" },
      { title: "Product Manager", period: "Jul 2007 – Jul 2012" },
      { title: "Solutions Engineering", period: "Dec 2005 – Jul 2007" },
    ],
    desc: "Nearly 13 years across two stints at the endpoint management company — from solutions engineering all the way up to SVP Product. Patent holder for network device configuration.",
  },
  {
    company: "Signal Media",
    color: "sticker-pink",
    roles: [{ title: "VP Product & Marketing", period: "Aug 2018 – May 2020" }],
    desc: "Led product and marketing for the AI-powered media intelligence platform, bridging the gap between product development and market positioning.",
  },
  {
    company: "Brandwatch",
    color: "sticker-blue",
    roles: [
      { title: "VP Product Data", period: "Mar 2016 – Jul 2018" },
      { title: "Head of Product", period: "Mar 2015 – Mar 2016" },
    ],
    desc: "Drove product data strategy and led the product team at one of the world's leading social intelligence platforms.",
  },
  {
    company: "Earlier Career",
    color: "sticker-yellow",
    roles: [
      { title: "Consultant — Marks & Spencer", period: "2006" },
      { title: "IT Operations — Cumbria Constabulary", period: "2003 – 2005" },
      { title: "Developer — Business Serve Plc", period: "2001 – 2003" },
    ],
    desc: "Started in development and IT ops before discovering a passion for product. The technical foundations that shaped everything that followed.",
  },
];

const credentials = [
  { label: "🎓 Computation Degree", sub: "1998 – 2001" },
  { label: "📜 Pragmatic Marketing Certified", sub: "Focus · Build · Market · Launch" },
  { label: "📋 ITIL Foundations", sub: "IT Service Management" },
  { label: "💡 Patent Holder", sub: "Configuration of network devices" },
];

const skills = [
  "Product Management",
  "Product Marketing",
  "Go-to-Market Strategy",
  "Analyst Relations",
  "Enterprise Software",
  "Cybersecurity",
  "Team Leadership",
  "Data Products",
];

export default function ProfessionalPage() {
  return (
    <main className="max-w-[1100px] mx-auto px-8 py-12 relative">
      <div
        className="doodle doodle-star"
        style={{ width: 80, height: 80, top: 20, right: -10 }}
      />

      {/* Header */}
      <h1 className="font-head font-[900] text-[clamp(1.8rem,4vw,2.8rem)] uppercase leading-[0.95] mb-3">
        Professional Life
      </h1>
      <p className="text-[0.95rem] leading-relaxed max-w-[700px] opacity-80 mb-10">
        From writing code to leading product orgs — a 20-year journey through
        enterprise software, media intelligence, and cybersecurity.
      </p>

      {/* Skills bar */}
      <div className="flex gap-2 flex-wrap mb-10">
        {skills.map((skill, i) => (
          <span
            key={skill}
            className={`badge ${
              ["sticker-orange", "sticker-blue", "sticker-pink", "sticker-green", "sticker-lilac", "sticker-yellow"][i % 6]
            }`}
            style={{
              transform: `rotate(${i % 2 === 0 ? "-0.5deg" : "0.5deg"})`,
            }}
          >
            {skill}
          </span>
        ))}
      </div>

      {/* Timeline */}
      <div className="section-title">Career Timeline</div>
      <div className="flex flex-col gap-5 mb-12">
        {timeline.map((entry, i) => (
          <div
            key={entry.company}
            className="border-3 border-ink bg-white overflow-hidden"
            style={{
              transform: `rotate(${i % 2 === 0 ? "-0.2deg" : "0.2deg"})`,
            }}
          >
            {/* Company header */}
            <div className="flex items-center gap-3 px-5 pt-5 pb-3">
              <span className={`badge ${entry.color}`}>{entry.company}</span>
            </div>

            {/* Roles */}
            <div className="px-5 pb-2">
              {entry.roles.map((role) => (
                <div
                  key={role.title + role.period}
                  className="flex items-baseline gap-3 mb-1.5"
                >
                  <h3 className="font-head font-bold text-[0.92rem] uppercase">
                    {role.title}
                  </h3>
                  <span className="font-mono text-[0.6rem] opacity-40 whitespace-nowrap">
                    {role.period}
                  </span>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="px-5 pb-5">
              <p className="text-[0.85rem] leading-snug opacity-70">
                {entry.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Credentials */}
      <div className="section-title">Credentials & Extras</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {credentials.map((c, i) => (
          <div
            key={c.label}
            className="border-3 border-ink p-4 bg-white text-center"
            style={{
              transform: `rotate(${i % 2 === 0 ? "-0.5deg" : "0.5deg"})`,
            }}
          >
            <div className="font-head font-bold text-[0.82rem] uppercase mb-1">
              {c.label}
            </div>
            <div className="font-mono text-[0.6rem] opacity-50">{c.sub}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
