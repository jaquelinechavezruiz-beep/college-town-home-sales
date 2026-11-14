"""Make data/map_sales.json, the small data file the site reads.

Reads data/college_town_home_sales.csv (never changes it) and keeps only the
columns the map needs. Applies the site's price rule: sales under $10,000 or
over $5,000,000 are left out, because the data description sheet says some
prices in that range are impossible.

Uses only the Python standard library. Run from the repository root:

    python3 scripts/make_map_data.py
"""

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "data" / "college_town_home_sales.csv"
OUTPUT = ROOT / "data" / "map_sales.json"

MIN_PRICE = 10_000      # sales below this are excluded
MAX_PRICE = 5_000_000   # sales above this are excluded

# Columns written for each sale, in this order
COLUMNS = ["listing_id", "latitude", "longitude", "city", "state",
           "university", "sale_price", "beds", "baths", "sale_date",
           "miles_to_campus", "year_built"]


def number(text):
    """Turn CSV text into an int or float, or None when blank."""
    if text == "":
        return None
    value = float(text)
    return int(value) if value.is_integer() else value


def main():
    rows = []
    total = below = above = 0
    universities = {}

    # Every column is read as text, so zipcode, county_fips and
    # parcel_number keep their leading zeros (they are not used here).
    with SOURCE.open(newline="", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            total += 1
            price = int(r["sale_price"])
            if price < MIN_PRICE:
                below += 1
                continue
            if price > MAX_PRICE:
                above += 1
                continue
            uni = r["university"]
            universities[uni] = universities.get(uni, 0) + 1
            rows.append([
                r["listing_id"],
                float(r["latitude"]),
                float(r["longitude"]),
                r["city"],
                r["state"],
                uni,
                price,
                number(r["beds"]),
                number(r["baths"]),
                r["sale_date"] or None,
                number(r["miles_to_campus"]),
                number(r["year_built"]),
            ])

    data = {
        "source": "data/college_town_home_sales.csv",
        "made_by": "scripts/make_map_data.py",
        "price_rule": {"min_price": MIN_PRICE, "max_price": MAX_PRICE},
        "counts": {
            "rows_in_dataset": total,
            "excluded_below_min": below,
            "excluded_above_max": above,
            "rows_kept": len(rows),
        },
        "universities": dict(sorted(universities.items())),
        "columns": COLUMNS,
        "rows": rows,
    }
    with OUTPUT.open("w", encoding="utf-8") as f:
        json.dump(data, f, separators=(",", ":"))

    print(f"Read {total} rows, excluded {below} under ${MIN_PRICE:,} "
          f"and {above} over ${MAX_PRICE:,}, wrote {len(rows)} to {OUTPUT.name}")


if __name__ == "__main__":
    main()
