import numpy as np
import pandas as pd

HABIT_VARIABLES = [
    "sleep_hours",
    "sleep_quality",
    "nutrition_quality",
    "physical_activity",
    "stress_level",
    "energy_level",
]

Z_SCORE_THRESHOLD = 2.0
MIN_ENTRIES_REQUIRED = 7


def compute_zscore_anomalies(entries: list[dict]) -> list[dict]:
    """
    Given a list of daily entry dicts (each containing 'entry_date' and habit variables),
    compute per-variable z-scores against the user's own historical mean/std.

    Returns a list of dicts, one per entry, containing:
      - entry_date
      - zscores: {variable: z_score}
      - anomalous_variables: [variable names where |z| > threshold]
      - is_anomalous: bool (True if any variable is anomalous)
    """
    if len(entries) < MIN_ENTRIES_REQUIRED:
        return [
            {
                "entry_date": e["entry_date"],
                "zscores": {},
                "anomalous_variables": [],
                "is_anomalous": False,
                "insufficient_data": True,
            }
            for e in entries
        ]

    df = pd.DataFrame(entries)

    means = {}
    stds = {}
    for var in HABIT_VARIABLES:
        if var in df.columns:
            means[var] = df[var].mean(skipna=True)
            stds[var] = df[var].std(skipna=True)

    results = []
    for _, row in df.iterrows():
        zscores = {}
        anomalous_variables = []

        for var in HABIT_VARIABLES:
            value = row.get(var)
            if pd.isna(value):
                continue

            std = stds.get(var)
            mean = means.get(var)

            if std is None or mean is None or std == 0 or np.isnan(std):
                continue

            z = (value - mean) / std
            zscores[var] = round(float(z), 3)

            if abs(z) > Z_SCORE_THRESHOLD:
                anomalous_variables.append(var)

        results.append(
            {
                "entry_date": row["entry_date"],
                "zscores": zscores,
                "anomalous_variables": anomalous_variables,
                "is_anomalous": len(anomalous_variables) > 0,
                "insufficient_data": False,
            }
        )

    return results