"use client";

import { useLang } from "@/i18n";
import McpConnect from "./McpConnect";

const endpoints = [
  {
    method: "GET",
    path: "/api/v1/tickets/by_ward?ward=10",
    desc: "Ticket stats for one ward",
    response: `{
  "ward": "10",
  "name": "Spadina-Fort York",
  "tickets": 811816,
  "fines": 62531325,
  "y2023": 286351, "y2024": 267802, "y2025": 257663
}`,
  },
  {
    method: "GET",
    path: "/api/v1/tickets/infractions?code=5",
    desc: "One infraction code, documented",
    response: `{
  "code": "5",
  "desc": "PARK-SIGNED HWY-PROHIBIT DY/TM",
  "tickets": 769476,
  "avg_fine": 56.62
}`,
  },
  {
    method: "GET",
    path: "/api/v1/tickets/streets?q=king",
    desc: "Most-ticketed streets matching a name",
    response: `{ "count": 3, "streets": [
  { "street": "KING ST W", "tickets": 53753 }, … ] }`,
  },
];

export default function Developers() {
  const { t } = useLang();
  return (
    <section id="developers" className="bg-ink text-white">
      <div className="mx-auto max-w-[1392px] px-6 py-20 md:py-28">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-white/60">{t.developers.kicker}</p>
        <h2 className="display mt-4 max-w-[720px] text-[40px] md:text-[52px]">{t.developers.title}</h2>
        <p className="mt-5 max-w-[720px] text-[18px] leading-relaxed text-white/70">{t.developers.body}</p>

        <h3 className="mt-14 text-[13px] font-semibold uppercase tracking-[0.12em] text-white/60">{t.developers.endpoints}</h3>
        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          {endpoints.map((e) => (
            <article key={e.path} className="overflow-hidden rounded-[24px] bg-white/[0.06]">
              <div className="border-b border-white/10 px-6 py-4">
                <span className="mr-3 rounded-full bg-canada px-2.5 py-1 font-mono text-[12px] font-semibold">{e.method}</span>
                <code className="font-mono text-[13px] text-white/85 break-all">{e.path}</code>
                <p className="mt-2 text-[14px] text-white/60">{e.desc}</p>
              </div>
              <pre className="overflow-x-auto px-6 py-4 font-mono text-[12.5px] leading-relaxed text-white/75">{e.response}</pre>
            </article>
          ))}
        </div>

        <div className="mt-8">
          <a href="/api/openapi.json" className="block rounded-[24px] bg-white/[0.06] p-6 hover:bg-white/[0.09]">
            <h4 className="text-[19px] font-semibold">{t.developers.openapi}</h4>
            <code className="mt-2 block font-mono text-[13px] text-white/60">GET /api/openapi.json</code>
          </a>
        </div>

        <McpConnect
          config={{
            slug: "toronto-parking",
            displayName: "Toronto Parking Tickets",
            exampleEn: "Get the ticket stats for ward 10 and tell me its yearly trend",
            exampleFr: "Donne-moi les statistiques de contraventions de l'arrondissement 10 et leur tendance annuelle",
          }}
        />
      </div>
    </section>
  );
}
