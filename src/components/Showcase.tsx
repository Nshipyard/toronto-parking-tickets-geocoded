"use client";

import { useEffect, useMemo, useState } from "react";
import { useLang } from "@/i18n";
import TicketMap from "./TicketMap";

interface HoodStat {
  code: string;
  name: string;
  tickets: number;
  fines: number;
}

interface Temporal {
  by_hour: Record<string, number>;
  by_month: Record<string, number>;
  by_dow: Record<string, number>;
}

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmt(n: number) {
  return n.toLocaleString("en-CA");
}

function BarChart({ data, labels, height = 160 }: { data: number[]; labels: string[]; height?: number }) {
  const max = Math.max(1, ...data);
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((v, i) => (
        <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1.5 self-stretch">
          <div
            className="w-full rounded-t-[4px] bg-canada/80"
            style={{ height: `${Math.max(3, (v / max) * (height - 28))}px` }}
            title={`${labels[i]}: ${fmt(v)}`}
          />
          <span className="text-[10.5px] text-ink/50">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

export default function Showcase() {
  const { t } = useLang();
  const [hoods, setHoods] = useState<HoodStat[]>([]);
  const [temporal, setTemporal] = useState<Temporal | null>(null);
  const [streets, setStreets] = useState<{ street: string; tickets: number }[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/tickets/by_neighbourhood")
      .then((r) => r.json())
      .then((d) => setHoods(d.neighbourhoods))
      .catch(() => {});
    fetch("/api/v1/tickets/summary")
      .then((r) => r.json())
      .then(() => {})
      .catch(() => {});
    fetch("/data/temporal.json")
      .then((r) => r.json())
      .then(setTemporal)
      .catch(() => {});
    fetch("/api/v1/tickets/streets?limit=10")
      .then((r) => r.json())
      .then((d) => setStreets(d.streets))
      .catch(() => {});
  }, []);

  const values = useMemo(() => {
    const m: Record<string, number> = {};
    for (const h of hoods) m[h.code] = h.tickets;
    return m;
  }, [hoods]);

  const hours = useMemo(() => {
    if (!temporal) return { data: [] as number[], labels: [] as string[] };
    const data: number[] = [];
    const labels: string[] = [];
    for (let h = 0; h < 24; h++) {
      data.push(temporal.by_hour[String(h)] ?? 0);
      labels.push(h % 3 === 0 ? `${h}h` : "");
    }
    return { data, labels };
  }, [temporal]);

  const months = useMemo(() => {
    if (!temporal) return { data: [] as number[], labels: [] as string[] };
    const data: number[] = [];
    for (let m = 1; m <= 12; m++) data.push(temporal.by_month[String(m)] ?? 0);
    return { data, labels: MONTHS };
  }, [temporal]);

  const dows = useMemo(() => {
    if (!temporal) return { data: [] as number[], labels: [] as string[] };
    const data: number[] = [];
    for (let d = 0; d < 7; d++) data.push(temporal.by_dow[String(d)] ?? 0);
    return { data, labels: DOW };
  }, [temporal]);

  const maxStreet = Math.max(1, ...streets.map((s) => s.tickets));
  const selHood = selected ? hoods.find((h) => h.code === selected) : null;

  return (
    <section id="showcase" className="bg-paper-warm">
      <div className="mx-auto max-w-[1392px] px-6 py-20 md:py-28">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-canada">{t.showcase.kicker}</p>
        <h2 className="display mt-4 max-w-[760px] text-[40px] md:text-[52px]">{t.showcase.title}</h2>
        <p className="mt-5 max-w-[720px] text-[18px] leading-relaxed text-ink/70">{t.showcase.body}</p>

        <div className="mt-10">
          <TicketMap
            values={values}
            selected={selected}
            onSelect={setSelected}
            formatTip={(code, name, tickets) => `${fmt(tickets)} ${t.showcase.tickets}`}
          />
          {selHood && (
            <div className="mt-4 rounded-[20px] border border-line bg-paper p-5">
              <p className="text-[17px] font-semibold">
                {selHood.name} <span className="font-mono text-[14px] text-ink/50">({selHood.code})</span>
              </p>
              <p className="mt-1 font-mono text-[15px] text-canada">
                {fmt(selHood.tickets)} {t.showcase.tickets} · ${fmt(selHood.fines)} {t.showcase.fines}
              </p>
            </div>
          )}
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <div className="rounded-[24px] border border-line bg-paper p-6 md:p-8">
            <h3 className="display text-[26px]">{t.showcase.topStreets}</h3>
            <p className="mt-2 text-[14.5px] text-ink/60">{t.showcase.topStreetsBody}</p>
            <ul className="mt-5 space-y-2.5">
              {streets.map((s) => (
                <li key={s.street}>
                  <div className="flex items-baseline justify-between gap-3 text-[14.5px]">
                    <span className="font-mono">{s.street}</span>
                    <span className="shrink-0 font-mono text-canada">{fmt(s.tickets)}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink/8">
                    <div className="h-full rounded-full bg-canada" style={{ width: `${(s.tickets / maxStreet) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-5">
            <div className="rounded-[24px] border border-line bg-paper p-6 md:p-8">
              <h3 className="display text-[26px]">{t.showcase.byHour}</h3>
              <p className="mt-2 text-[14.5px] text-ink/60">{t.showcase.byHourBody}</p>
              <div className="mt-4">
                <BarChart data={hours.data} labels={hours.labels} />
              </div>
            </div>
            <div className="rounded-[24px] border border-line bg-paper p-6 md:p-8">
              <h3 className="display text-[26px]">{t.showcase.byMonth}</h3>
              <p className="mt-2 text-[14.5px] text-ink/60">{t.showcase.byMonthBody}</p>
              <div className="mt-4">
                <BarChart data={months.data} labels={months.labels} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-[24px] border border-line bg-paper p-6 md:p-8">
          <h3 className="display text-[26px]">{t.showcase.byDow}</h3>
          <p className="mt-2 max-w-[640px] text-[14.5px] text-ink/60">{t.showcase.byDowBody}</p>
          <div className="mt-4 max-w-[720px]">
            <BarChart data={dows.data} labels={dows.labels} height={140} />
          </div>
        </div>
      </div>
    </section>
  );
}
