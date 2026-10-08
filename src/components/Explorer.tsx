"use client";

import { useEffect, useMemo, useState } from "react";
import { useLang } from "@/i18n";

interface SearchResult {
  streets: { street: string; tickets: number }[];
  wards: { ward: string; name: string; tickets: number; fines: number }[];
  neighbourhoods: { code: string; name: string; tickets: number; fines: number }[];
  infractions: { code: string; desc: string; tickets: number; avg_fine: number }[];
}

interface CodeEntry {
  code: string;
  desc: string;
  tickets: number;
  avg_fine: number;
}

function fmt(n: number) {
  return n.toLocaleString("en-CA");
}

export default function Explorer() {
  const { t } = useLang();
  const [q, setQ] = useState("");
  const [res, setRes] = useState<SearchResult | null>(null);
  const [codes, setCodes] = useState<CodeEntry[]>([]);
  const [codeQ, setCodeQ] = useState("");

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (q.trim().length < 2) {
        setRes(null);
        return;
      }
      fetch(`/api/v1/tickets/search?q=${encodeURIComponent(q.trim())}`)
        .then((r) => r.json())
        .then(setRes)
        .catch(() => {});
    }, 250);
    return () => window.clearTimeout(id);
  }, [q]);

  useEffect(() => {
    fetch("/api/v1/tickets/infractions?limit=60")
      .then((r) => r.json())
      .then((d) => setCodes(d.infractions))
      .catch(() => {});
  }, []);

  const filteredCodes = useMemo(() => {
    const s = codeQ.trim().toLowerCase();
    if (!s) return codes;
    return codes.filter((c) => c.desc.toLowerCase().includes(s) || c.code === s);
  }, [codes, codeQ]);

  const searched = q.trim().length >= 2;

  return (
    <section id="explorer" className="bg-paper">
      <div className="mx-auto max-w-[1392px] px-6 py-20 md:py-28">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-canada">{t.explorer.kicker}</p>
        <h2 className="display mt-4 max-w-[720px] text-[40px] md:text-[52px]">{t.explorer.title}</h2>
        <p className="mt-5 max-w-[720px] text-[18px] leading-relaxed text-ink/70">{t.explorer.body}</p>

        <div className="mt-8 max-w-[720px]">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.explorer.search}
            className="w-full rounded-full border border-line bg-paper px-6 py-4 text-[17px] outline-none placeholder:text-ink/40 focus:border-canada"
            aria-label={t.explorer.search}
          />
        </div>

        {searched && res && (
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {res.streets.length > 0 && (
              <div className="rounded-[24px] border border-line bg-paper-warm p-6">
                <h3 className="text-[15px] font-semibold uppercase tracking-wide text-ink/60">{t.explorer.streets}</h3>
                <ul className="mt-3 space-y-2">
                  {res.streets.map((s) => (
                    <li key={s.street} className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 break-words font-mono text-[15px]">{s.street}</span>
                      <span className="shrink-0 font-mono text-[14px] text-canada">{fmt(s.tickets)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {res.neighbourhoods.length > 0 && (
              <div className="rounded-[24px] border border-line bg-paper-warm p-6">
                <h3 className="text-[15px] font-semibold uppercase tracking-wide text-ink/60">{t.explorer.hoods}</h3>
                <ul className="mt-3 space-y-2">
                  {res.neighbourhoods.map((h) => (
                    <li key={h.code} className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 break-words text-[15px]">
                        {h.name} <span className="font-mono text-ink/50">({h.code})</span>
                      </span>
                      <span className="shrink-0 font-mono text-[14px] text-canada">{fmt(h.tickets)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {res.wards.length > 0 && (
              <div className="rounded-[24px] border border-line bg-paper-warm p-6">
                <h3 className="text-[15px] font-semibold uppercase tracking-wide text-ink/60">{t.explorer.wards}</h3>
                <ul className="mt-3 space-y-2">
                  {res.wards.map((w) => (
                    <li key={w.ward} className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 break-words text-[15px]">
                        {w.name} <span className="font-mono text-ink/50">({w.ward})</span>
                      </span>
                      <span className="shrink-0 font-mono text-[14px] text-canada">{fmt(w.tickets)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {res.infractions.length > 0 && (
              <div className="rounded-[24px] border border-line bg-paper-warm p-6">
                <h3 className="text-[15px] font-semibold uppercase tracking-wide text-ink/60">{t.explorer.codes}</h3>
                <ul className="mt-3 space-y-2">
                  {res.infractions.map((c) => (
                    <li key={c.code} className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 break-words text-[15px]">
                        <span className="font-mono text-ink/50">[{c.code}]</span> {c.desc}
                      </span>
                      <span className="shrink-0 font-mono text-[14px] text-canada">{fmt(c.tickets)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {res.streets.length + res.wards.length + res.neighbourhoods.length + res.infractions.length === 0 && (
              <p className="text-[16px] text-ink/60 md:col-span-2">{t.explorer.noResult}</p>
            )}
          </div>
        )}

        <div className="mt-14">
          <h3 className="display text-[30px] md:text-[36px]">{t.explorer.codebookTitle}</h3>
          <p className="mt-3 max-w-[640px] text-[16px] text-ink/70">{t.explorer.codebookBody}</p>
          <input
            value={codeQ}
            onChange={(e) => setCodeQ(e.target.value)}
            placeholder={t.explorer.codebookSearch}
            className="mt-5 w-full max-w-[480px] rounded-full border border-line bg-paper px-6 py-3 text-[16px] outline-none placeholder:text-ink/40 focus:border-canada"
            aria-label={t.explorer.codebookSearch}
          />
          <div className="mt-5 overflow-x-auto rounded-[24px] border border-line">
            <table className="w-full min-w-[640px] text-left text-[14.5px]">
              <thead>
                <tr className="border-b border-line bg-paper-warm text-[13px] uppercase tracking-wide text-ink/55">
                  <th className="px-5 py-3 font-semibold">{t.explorer.colCode}</th>
                  <th className="px-5 py-3 font-semibold">{t.explorer.colDesc}</th>
                  <th className="px-5 py-3 text-right font-semibold">{t.explorer.colTickets}</th>
                  <th className="px-5 py-3 text-right font-semibold">{t.explorer.colAvgFine}</th>
                </tr>
              </thead>
              <tbody>
                {filteredCodes.map((c) => (
                  <tr key={c.code} className="border-b border-line/60 last:border-0 hover:bg-paper-warm">
                    <td className="px-5 py-2.5 font-mono">{c.code}</td>
                    <td className="px-5 py-2.5">{c.desc}</td>
                    <td className="px-5 py-2.5 text-right font-mono text-canada">{fmt(c.tickets)}</td>
                    <td className="px-5 py-2.5 text-right font-mono">${c.avg_fine.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
