"""
Seed script that generates a reproducible synthetic dataset for a demo user.

Run from the backend root, with the virtual environment activated:
    python seed_data.py

This creates (or reuses) a demo user and inserts 60 days of daily entries:
  - a realistic baseline for all six habit variables (with mild natural
    correlation between sleep quality, stress and energy)
  - a set of deliberately injected anomalies, both univariate (a single
    variable far from the user's own baseline) and multivariate (a
    combination of variables that is unusual together, even though no
    single variable is extreme) - useful to demonstrate the complementarity
    of Z-score vs. Isolation Forest for the thesis.

The random seed is fixed, so re-running this script (after clearing the
demo user's entries) always produces the same dataset.
"""

import random
from datetime import date, timedelta

import numpy as np

from app.database import SessionLocal
from app.models.user import User
from app.models.daily_entry import DailyEntry
from app.security import hash_password

DEMO_EMAIL = "demo@example.com"
DEMO_PASSWORD = "demo12345"
DEMO_FULL_NAME = "Demo User"

NUM_DAYS = 60
END_DATE = date.today()

RANDOM_SEED = 42

INJECTED_ANOMALIES = [
    {"offset": 10, "type": "univariate", "description": "Very short sleep (2h) after a normal routine"},
    {"offset": 22, "type": "univariate", "description": "Extremely high physical activity (180 min)"},
    {"offset": 34, "type": "multivariate", "description": "High sleep quality + high stress + high energy together (unusual combination)"},
    {"offset": 41, "type": "univariate", "description": "Very high stress (10/10)"},
    {"offset": 48, "type": "multivariate", "description": "Low nutrition + high activity + low stress together (unusual combination)"},
    {"offset": 55, "type": "univariate", "description": "Very low energy (1/10)"},
]


def clip(value, low, high):
    return max(low, min(high, value))


def generate_baseline_day(rng):
    sleep_quality = rng.normal(7.0, 1.0)
    stress_level = rng.normal(4.0, 1.3)
    energy_level = 6.8 + 0.35 * (sleep_quality - 7.0) - 0.35 * (stress_level - 4.0) + rng.normal(0, 0.7)

    day = {
        "sleep_hours": clip(rng.normal(7.2, 0.6), 3, 10),
        "sleep_quality": clip(sleep_quality, 1, 10),
        "nutrition_quality": clip(rng.normal(6.5, 1.2), 1, 10),
        "physical_activity": clip(rng.normal(35, 15), 0, 90),
        "stress_level": clip(stress_level, 1, 10),
        "energy_level": clip(energy_level, 1, 10),
    }
    return {k: round(v, 1) for k, v in day.items()}


def apply_anomaly(day_values, anomaly_type):
    values = dict(day_values)

    if anomaly_type == "univariate":
        pass

    return values


def build_dataset():
    rng = np.random.default_rng(RANDOM_SEED)
    random.seed(RANDOM_SEED)

    start_date = END_DATE - timedelta(days=NUM_DAYS - 1)
    anomaly_by_offset = {a["offset"]: a for a in INJECTED_ANOMALIES}

    dataset = []
    for offset in range(NUM_DAYS):
        entry_date = start_date + timedelta(days=offset)
        values = generate_baseline_day(rng)

        anomaly = anomaly_by_offset.get(offset)
        if anomaly:
            if offset == 10:
                values["sleep_hours"] = 2.0
            elif offset == 22:
                values["physical_activity"] = 180
            elif offset == 34:
                values["sleep_quality"] = 9.0
                values["stress_level"] = 9.0
                values["energy_level"] = 9.0
            elif offset == 41:
                values["stress_level"] = 10.0
            elif offset == 48:
                values["nutrition_quality"] = 3.0
                values["physical_activity"] = 80
                values["stress_level"] = 2.0
            elif offset == 55:
                values["energy_level"] = 1.0

        dataset.append({"entry_date": entry_date, "values": values, "anomaly": anomaly})

    return dataset


def get_or_create_demo_user(db):
    user = db.query(User).filter(User.email == DEMO_EMAIL).first()
    if user:
        return user, False

    user = User(
        email=DEMO_EMAIL,
        hashed_password=hash_password(DEMO_PASSWORD),
        full_name=DEMO_FULL_NAME,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user, True


def main():
    db = SessionLocal()
    try:
        user, created = get_or_create_demo_user(db)
        print(f"Demo user: {DEMO_EMAIL} ({'created' if created else 'already existed'})")

        deleted = db.query(DailyEntry).filter(DailyEntry.user_id == user.id).delete()
        db.commit()
        if deleted:
            print(f"Cleared {deleted} existing entries for demo user")

        dataset = build_dataset()

        for day in dataset:
            entry = DailyEntry(
                user_id=user.id,
                entry_date=day["entry_date"],
                **day["values"],
            )
            db.add(entry)

        db.commit()

        print(f"\nInserted {len(dataset)} daily entries "
              f"({dataset[0]['entry_date']} to {dataset[-1]['entry_date']})")

        print("\nInjected anomalies (for reference when validating Z-score / Isolation Forest results):")
        for day in dataset:
            if day["anomaly"]:
                print(
                    f"  {day['entry_date']} [{day['anomaly']['type']}] - {day['anomaly']['description']}"
                )

        print(f"\nLogin with:\n  email:    {DEMO_EMAIL}\n  password: {DEMO_PASSWORD}")

    finally:
        db.close()


if __name__ == "__main__":
    main()