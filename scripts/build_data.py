#!/usr/bin/env python3
"""Build toronto-parking-tickets-geocoded derived datasets.

Slice: City of Toronto "Parking Tickets" open data, calendar years 2023-2025
(monthly CSVs). Raw kept in data/raw/ (not committed).

Geocoding: ticket location2 addresses ("642 KING ST W") are matched against
the City's Address Points (Municipal) file on (house number, normalized street).
Each matched address point carries its ward directly and is point-in-polygon
assigned to a 158-model neighbourhood. Rows without a leading house number
(street-only locations, intersections) cannot be address-matched and are
counted as unmatched.
"""

import csv
import glob
import json
import os
import re
import sys
from collections import Counter, defaultdict

from shapely.geometry import shape, Point
from shapely.strtree import STRtree

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(BASE, "data", "raw")
DATA = os.path.join(BASE, "data")

# street-type normalization: ticket spelling -> address-point spelling
TYPE_MAP = {
    "STREET": "ST", "AVENUE": "AVE", "BOULEVARD": "BLVD", "DRIVE": "DR",
    "ROAD": "RD", "LANE": "LN", "TRAIL": "TRL", "CRESCENT": "CRES",
    "PLACE": "PL", "COURT": "CT", "TERRACE": "TERR", "PARKWAY": "PKWY",
    "GROVE": "GRV", "SQUARE": "SQ", "CIRCLE": "CIR", "GATE": "GATE",
    "MEWS": "MEWS", "WAY": "WAY", "HILL": "HILL", "PARK": "PK",
    "GARDENS": "GDNS", "QUAY": "QUAY", "ROW": "ROW",
}


def norm_street(s):
    s = s.upper().strip().rstrip(".")
    s = re.sub(r"\s+", " ", s)
    parts = s.split(" ")
    out = []
    for p in parts:
        out.append(TYPE_MAP.get(p, p))
    return " ".join(out)


def split_address(loc2):
    """Return (number, street_norm) or (None, None) if no leading number."""
    loc2 = (loc2 or "").upper().strip().rstrip(".")
    m = re.match(r"^(\d+)\s*(?:[A-Z]\s+)?(.+)$", loc2)
    if not m:
        return None, None
    return m.group(1), norm_street(m.group(2))


def main():
    print("loading address points...", flush=True)
    ap = {}  # (number, street) -> (ward, ward_name, lon, lat)
    pts = []
    with open(os.path.join(RAW, "address-points-4326.csv"), newline="") as f:
        for row in csv.DictReader(f):
            num = (row["ADDRESS_NUMBER"] or "").strip()
            if not num:
                continue
            key = (num, norm_street(row["LINEAR_NAME_FULL"] or ""))
            try:
                g = json.loads(row["geometry"])
                coords = g["coordinates"]
                # MultiPoint nests as [[lon, lat]]
                pt = coords[0] if isinstance(coords[0], (list, tuple)) else coords
                lon, lat = float(pt[0]), float(pt[1])
            except Exception:
                continue
            ap[key] = (row["WARD"].strip(), (row["WARD_NAME"] or "").strip(), lon, lat)
            pts.append((lon, lat))
    print(f"address points: {len(ap)}", flush=True)

    print("loading neighbourhood polygons...", flush=True)
    nbh_path = "/home/hatch/workspace/toronto-geo-concordances/data/raw/nbh158.geojson"
    feats = json.load(open(nbh_path))["features"]
    geoms, codes, names = [], [], []
    for ft in feats:
        p = ft["properties"]
        geoms.append(shape(ft["geometry"]))
        codes.append(str(p["AREA_SHORT_CODE"]))
        names.append(p["AREA_NAME"])
    tree = STRtree(geoms)
    code_of = {}
    for i, (lon, lat) in enumerate(pts):
        hits = tree.query(Point(lon, lat))
        hood = None
        for h in hits:
            if geoms[h].contains(Point(lon, lat)):
                hood = h
                break
        code_of[i] = codes[hood] if hood is not None else None
    name_of = dict(zip(codes, names))
    print("neighbourhood assignment done", flush=True)

    # re-key address points with neighbourhood
    ap2 = {}
    i = 0
    with open(os.path.join(RAW, "address-points-4326.csv"), newline="") as f:
        for row in csv.DictReader(f):
            num = (row["ADDRESS_NUMBER"] or "").strip()
            if not num:
                i += 1
                continue
            key = (num, norm_street(row["LINEAR_NAME_FULL"] or ""))
            if key in ap:
                ward, ward_name, lon, lat = ap[key]
                ap2[key] = (ward, ward_name, code_of[i], name_of.get(code_of[i], ""))
            i += 1
    ap = ap2
    print(f"address points with neighbourhood: {len(ap)}", flush=True)

    total = 0
    matched = 0
    no_number = 0
    by_ward = defaultdict(lambda: {"tickets": 0, "fines": 0, "by_year": Counter(), "codes": Counter()})
    ward_names = {}
    by_hood = defaultdict(lambda: {"tickets": 0, "fines": 0, "by_year": Counter()})
    by_street = Counter()
    by_hour = Counter()
    by_month = Counter()
    by_dow = Counter()
    codebook = defaultdict(lambda: {"desc": "", "count": 0, "fines": 0})
    total_fines = 0

    files = sorted(glob.glob(os.path.join(RAW, "parking-tickets-20*/Parking_Tags_Data_*.csv")))
    print(f"ticket files: {len(files)}", flush=True)
    import datetime

    def norm_rows(fp):
        for enc in ("utf-8-sig", "cp1252"):
            try:
                with open(fp, newline="", encoding=enc) as f:
                    reader = csv.DictReader((ln for ln in f if ln.strip()))
                    if reader.fieldnames:
                        reader.fieldnames = [h.strip().lower() for h in reader.fieldnames]
                    rows = list(reader)
                break
            except UnicodeDecodeError:
                continue
        for row in rows:
            yield {k.strip().lower(): (v or "") for k, v in row.items()}

    for fp in files:
        for row in norm_rows(fp):
                total += 1
                date = row["date_of_infraction"] or ""
                year = date[:4] if len(date) == 8 else ""
                code = (row["infraction_code"] or "").strip()
                desc = (row["infraction_description"] or "").strip()
                try:
                    fine = int(float(row["set_fine_amount"] or 0))
                except ValueError:
                    fine = 0
                tstr = (row["time_of_infraction"] or "").strip()
                hour = int(tstr[:2]) if len(tstr) >= 2 and tstr[:2].isdigit() else -1
                num, street = split_address(row["location2"])
                if num is None:
                    no_number += 1
                    continue
                hit = ap.get((num, street))
                if not hit:
                    continue
                matched += 1
                ward, ward_name, hood, hood_name = hit
                total_fines += fine
                by_street[street] += 1
                if hour >= 0:
                    by_hour[hour] += 1
                if len(date) == 8:
                    try:
                        dt = datetime.date(int(date[:4]), int(date[4:6]), int(date[6:8]))
                        by_month[int(date[4:6])] += 1
                        by_dow[dt.weekday()] += 1
                    except ValueError:
                        pass
                cb = codebook[code]
                cb["desc"] = cb["desc"] or desc
                cb["count"] += 1
                cb["fines"] += fine
                w = by_ward[ward]
                w["tickets"] += 1
                w["fines"] += fine
                w["by_year"][year] += 1
                w["codes"][code] += 1
                ward_names[ward] = ward_name
                if hood:
                    h = by_hood[hood]
                    h["tickets"] += 1
                    h["fines"] += fine
                    h["by_year"][year] += 1
        print(f"  {os.path.basename(fp)}: total={total} matched={matched}", flush=True)

    match_rate = matched / total if total else 0
    print(f"TOTAL={total} MATCHED={matched} ({match_rate:.1%}) NO_NUMBER={no_number}", flush=True)

    # ---- outputs ----
    with open(os.path.join(DATA, "tickets_by_ward.csv"), "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["ward", "ward_name", "tickets", "total_fines", "tickets_2023", "tickets_2024", "tickets_2025", "top_infraction_code", "top_infraction_count"])
        for ward in sorted(by_ward, key=lambda x: int(x) if x.isdigit() else 999):
            d = by_ward[ward]
            top = d["codes"].most_common(1)[0] if d["codes"] else ("", 0)
            w.writerow([ward, ward_names.get(ward, ""), d["tickets"], d["fines"],
                        d["by_year"].get("2023", 0), d["by_year"].get("2024", 0), d["by_year"].get("2025", 0),
                        top[0], top[1]])

    with open(os.path.join(DATA, "tickets_by_neighbourhood158.csv"), "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["hood_158", "hood_name", "tickets", "total_fines", "tickets_2023", "tickets_2024", "tickets_2025"])
        for hood in sorted(by_hood, key=lambda x: d["tickets"] if False else by_hood[x]["tickets"], reverse=True):
            d = by_hood[hood]
            w.writerow([hood, name_of.get(hood, ""), d["tickets"], d["fines"],
                        d["by_year"].get("2023", 0), d["by_year"].get("2024", 0), d["by_year"].get("2025", 0)])

    with open(os.path.join(DATA, "infraction_codebook.csv"), "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["infraction_code", "description", "tickets", "total_fines", "avg_fine"])
        for code, d in sorted(codebook.items(), key=lambda kv: kv[1]["count"], reverse=True):
            avg = round(d["fines"] / d["count"], 2) if d["count"] else 0
            w.writerow([code, d["desc"], d["count"], d["fines"], avg])

    with open(os.path.join(DATA, "top_streets.csv"), "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["street", "tickets"])
        for street, c in by_street.most_common(200):
            w.writerow([street, c])

    summary = {
        "slice": "City of Toronto open data 'Parking Tickets', calendar years 2023-2025 (monthly files), retrieved 2026-10-08",
        "total_tickets_in_slice": total,
        "geocoded_tickets": matched,
        "match_rate": round(match_rate, 4),
        "match_method": "location2 addresses matched to City Address Points (Municipal) on house number + normalized street; ward from address point, neighbourhood via point-in-polygon on 158-model boundaries",
        "unmatched_no_house_number": no_number,
        "unmatched_no_address_match": total - matched - no_number,
        "total_set_fines_geocoded": total_fines,
        "wards_covered": len(by_ward),
        "neighbourhoods_covered": len(by_hood),
        "infraction_codes": len(codebook),
        "top_infraction": None,
        "top_ward": None,
        "top_neighbourhood": None,
        "top_street": None,
        "peak_hour": None,
        "peak_month": None,
    }
    if codebook:
        c, d = max(codebook.items(), key=lambda kv: kv[1]["count"])
        summary["top_infraction"] = {"code": c, "desc": d["desc"], "tickets": d["count"]}
    if by_ward:
        wcode = max(by_ward, key=lambda x: by_ward[x]["tickets"])
        summary["top_ward"] = {"ward": wcode, "name": ward_names.get(wcode, ""), "tickets": by_ward[wcode]["tickets"]}
    if by_hood:
        hcode = max(by_hood, key=lambda x: by_hood[x]["tickets"])
        summary["top_neighbourhood"] = {"code": hcode, "name": name_of.get(hcode, ""), "tickets": by_hood[hcode]["tickets"]}
    if by_street:
        s, c = by_street.most_common(1)[0]
        summary["top_street"] = {"street": s, "tickets": c}
    if by_hour:
        summary["peak_hour"] = max(by_hour, key=lambda x: by_hour[x])
    if by_month:
        summary["peak_month"] = max(by_month, key=lambda x: by_month[x])
    with open(os.path.join(DATA, "summary.json"), "w") as f:
        json.dump(summary, f, indent=2)

    temporal = {"by_hour": {str(k): v for k, v in sorted(by_hour.items())},
                "by_month": {str(k): v for k, v in sorted(by_month.items())},
                "by_dow": {str(k): v for k, v in sorted(by_dow.items())}}
    with open(os.path.join(DATA, "temporal.json"), "w") as f:
        json.dump(temporal, f)

    # compact app bundle
    app_data = {
        "summary": summary,
        "wards": [{"ward": w, "name": ward_names.get(w, ""), "tickets": d["tickets"], "fines": d["fines"],
                   "y2023": d["by_year"].get("2023", 0), "y2024": d["by_year"].get("2024", 0), "y2025": d["by_year"].get("2025", 0)}
                  for w, d in sorted(by_ward.items(), key=lambda kv: int(kv[0]) if kv[0].isdigit() else 999)],
        "hoods": [{"code": h, "name": name_of.get(h, ""), "tickets": d["tickets"], "fines": d["fines"]}
                  for h, d in sorted(by_hood.items(), key=lambda kv: kv[1]["tickets"], reverse=True)],
        "streets": [{"street": s, "tickets": c} for s, c in by_street.most_common(100)],
        "temporal": temporal,
        "codebook": [{"code": c, "desc": d["desc"], "tickets": d["count"], "avg_fine": round(d["fines"]/d["count"], 2) if d["count"] else 0}
                     for c, d in sorted(codebook.items(), key=lambda kv: kv[1]["count"], reverse=True)[:60]],
    }
    with open(os.path.join(DATA, "app_data.json"), "w") as f:
        json.dump(app_data, f)
    print("wrote outputs", flush=True)
    print(json.dumps({k: v for k, v in summary.items() if not isinstance(v, dict)}, indent=1))


if __name__ == "__main__":
    sys.exit(main())
