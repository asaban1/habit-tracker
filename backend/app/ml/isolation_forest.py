import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.impute import SimpleImputer

HABIT_VARIABLES = [
    "sleep_hours",
    "sleep_quality",
    "nutrition_quality",
    "physical_activity",
    "stress_level",
    "energy_level",
]

MIN_ENTRIES_REQUIRED = 10
CONTAMINATION = 0.1


def compute_isolation_forest_anomalies(entries: list[dict]) -> list[dict]:
    """
    Given a list of daily entry dicts, run Isolation Forest on the multivariate
    feature space to detect unusual combinations of habit variables.

    Returns a list of dicts, one per entry, containing:
      - entry_date
      - anomaly_score: float (lower = more anomalous; roughly in [-0.5, 0.5])
      - is_anomalous: bool
    """
    if len(entries) < MIN_ENTRIES_REQUIRED:
        return [
            {
                "entry_date": e["entry_date"],
                "anomaly_score": None,
                "is_anomalous": False,
                "insufficient_data": True,
            }
            for e in entries
        ]

    df = pd.DataFrame(entries)
    dates = df["entry_date"].tolist()

    feature_df = df[HABIT_VARIABLES].copy()

    # Impute missing values with column mean so IsolationForest can run
    # (it cannot handle NaN natively)
    imputer = SimpleImputer(strategy="mean")
    features = imputer.fit_transform(feature_df)

    model = IsolationForest(
        n_estimators=200,
        contamination=CONTAMINATION,
        random_state=42,
    )
    model.fit(features)

    # decision_function: higher = more normal, lower/negative = more anomalous
    scores = model.decision_function(features)
    predictions = model.predict(features)  # -1 = anomaly, 1 = normal

    results = []
    for i, date_val in enumerate(dates):
        results.append(
            {
                "entry_date": date_val,
                "anomaly_score": round(float(scores[i]), 4),
                "is_anomalous": bool(predictions[i] == -1),
                "insufficient_data": False,
            }
        )

    return results