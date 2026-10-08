import fs from "node:fs";
import path from "node:path";

const DATA = path.join(process.cwd(), "data");

export interface Summary {
  slice: string;
  total_tickets_in_slice: number;
  geocoded_tickets: number;
  match_rate: number;
  match_method: string;
  unmatched_no_house_number: number;
  unmatched_no_address_match: number;
  total_set_fines_geocoded: number;
  wards_covered: number;
  neighbourhoods_covered: number;
  infraction_codes: number;
  top_infraction: { code: string; desc: string; tickets: number } | null;
  top_ward: { ward: string; name: string; tickets: number } | null;
  top_neighbourhood: { code: string; name: string; tickets: number } | null;
  top_street: { street: string; tickets: number } | null;
  peak_hour: number | null;
  peak_month: number | null;
}

export interface WardStat {
  ward: string;
  name: string;
  tickets: number;
  fines: number;
  y2023: number;
  y2024: number;
  y2025: number;
}

export interface HoodStat {
  code: string;
  name: string;
  tickets: number;
  fines: number;
}

export interface StreetStat {
  street: string;
  tickets: number;
}

export interface CodeEntry {
  code: string;
  desc: string;
  tickets: number;
  avg_fine: number;
}

export interface Temporal {
  by_hour: Record<string, number>;
  by_month: Record<string, number>;
  by_dow: Record<string, number>;
}

export interface AppData {
  summary: Summary;
  wards: WardStat[];
  hoods: HoodStat[];
  streets: StreetStat[];
  temporal: Temporal;
  codebook: CodeEntry[];
}

let cache: AppData | null = null;

export function getData(): AppData {
  if (!cache) {
    cache = JSON.parse(fs.readFileSync(path.join(DATA, "app_data.json"), "utf-8")) as AppData;
  }
  return cache;
}

export function fmt(n: number): string {
  return n.toLocaleString("en-CA");
}
