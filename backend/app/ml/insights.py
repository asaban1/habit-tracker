import pandas as pd

HABIT_VARIABLES = [
    "sleep_hours",
    "sleep_quality",
    "nutrition_quality",
    "physical_activity",
    "stress_level",
    "energy_level",
]

VARIABLE_LABELS = {
    "sleep_hours": "sleep hours",
    "sleep_quality": "sleep quality",
    "nutrition_quality": "nutrition quality",
    "physical_activity": "physical activity",
    "stress_level": "stress level",
    "energy_level": "energy level",
}

NEGATIVE_VARIABLES = {"stress_level"}

MIN_ENTRIES_FOR_CORRELATION = 10
MIN_ENTRIES_FOR_TREND = 14
CORRELATION_THRESHOLD = 0.4
TREND_WINDOW = 7
TREND_CHANGE_THRESHOLD_PCT = 15


def _label(var: str) -> str:
    return VARIABLE_LABELS.get(var, var)


def _is_improvement(var: str, pct_change: float) -> bool:
    if var in NEGATIVE_VARIABLES:
        return pct_change < 0
    return pct_change > 0


def _describe_correlation(var_a: str, var_b: str, value: float) -> str:
    strength = "strong" if abs(value) >= 0.6 else "moderate"
    if value > 0:
        relation = "tend to move together — when one goes up, the other usually does too"
    else:
        relation = "tend to move in opposite directions — when one goes up, the other usually goes down"
    return (
        f"Your {_label(var_a)} and {_label(var_b)} {relation} "
        f"({strength} correlation, r = {round(float(value), 2)})."
    )


def compute_correlation_insights(df: pd.DataFrame) -> list[dict]:
    insights = []
    if len(df) < MIN_ENTRIES_FOR_CORRELATION:
        return insights

    corr_matrix = df[HABIT_VARIABLES].corr(method="pearson", min_periods=MIN_ENTRIES_FOR_CORRELATION)

    seen_pairs = set()
    pairs = []
    for var_a in HABIT_VARIABLES:
        for var_b in HABIT_VARIABLES:
            if var_a == var_b:
                continue
            pair_key = tuple(sorted([var_a, var_b]))
            if pair_key in seen_pairs:
                continue
            seen_pairs.add(pair_key)

            value = corr_matrix.loc[var_a, var_b]
            if pd.isna(value):
                continue
            if abs(value) >= CORRELATION_THRESHOLD:
                pairs.append((var_a, var_b, float(value)))

    pairs.sort(key=lambda p: abs(p[2]), reverse=True)

    for var_a, var_b, value in pairs[:4]:
        insights.append(
            {
                "type": "correlation",
                "title": f"{_label(var_a).capitalize()} and {_label(var_b)} are linked",
                "description": _describe_correlation(var_a, var_b, value),
                "correlation": round(value, 3),
                "variables": [var_a, var_b],
            }
        )

    return insights


def compute_trend_insights(df: pd.DataFrame) -> list[dict]:
    insights = []
    if len(df) < MIN_ENTRIES_FOR_TREND:
        return insights

    df_sorted = df.sort_values("entry_date")
    recent = df_sorted.tail(TREND_WINDOW)
    previous = df_sorted.iloc[-(TREND_WINDOW * 2):-TREND_WINDOW]

    if len(previous) < 3:
        return insights

    for var in HABIT_VARIABLES:
        recent_mean = recent[var].mean(skipna=True)
        previous_mean = previous[var].mean(skipna=True)

        if pd.isna(recent_mean) or pd.isna(previous_mean) or previous_mean == 0:
            continue

        pct_change = (recent_mean - previous_mean) / abs(previous_mean) * 100

        if abs(pct_change) < TREND_CHANGE_THRESHOLD_PCT:
            continue

        direction = "improved" if _is_improvement(var, pct_change) else "declined"
        insights.append(
            {
                "type": "trend",
                "title": f"{_label(var).capitalize()} has {direction}",
                "description": (
                    f"Your average {_label(var)} over the last {TREND_WINDOW} days is "
                    f"{round(float(recent_mean), 1)}, compared to {round(float(previous_mean), 1)} "
                    f"in the {TREND_WINDOW} days before that "
                    f"({'+' if pct_change > 0 else ''}{round(float(pct_change), 0)}%)."
                ),
                "variable": var,
                "direction": direction,
                "pct_change": round(float(pct_change), 1),
            }
        )

    return insights


def compute_anomaly_frequency_insight(zscore_results: list[dict]) -> dict | None:
    counts: dict[str, int] = {}
    total_analyzed = 0

    for r in zscore_results:
        if r.get("insufficient_data"):
            continue
        total_analyzed += 1
        for var in r.get("anomalous_variables", []):
            counts[var] = counts.get(var, 0) + 1

    if not counts or total_analyzed == 0:
        return None

    top_var, top_count = max(counts.items(), key=lambda kv: kv[1])
    if top_count < 2:
        return None

    return {
        "type": "anomaly_frequency",
        "title": f"{_label(top_var).capitalize()} is your most variable habit",
        "description": (
            f"{_label(top_var).capitalize()} was flagged as unusual on {top_count} out of "
            f"{total_analyzed} analyzed days — more than any other habit. This might be the "
            f"easiest place to start building a more consistent routine."
        ),
        "variable": top_var,
        "count": top_count,
        "total_days": total_analyzed,
    }


def generate_insights(entries: list[dict], zscore_results: list[dict]) -> list[dict]:
    df = pd.DataFrame(entries)
    if df.empty:
        return []

    insights: list[dict] = []
    insights.extend(compute_correlation_insights(df))
    insights.extend(compute_trend_insights(df))

    freq_insight = compute_anomaly_frequency_insight(zscore_results)
    if freq_insight:
        insights.append(freq_insight)

    return insights