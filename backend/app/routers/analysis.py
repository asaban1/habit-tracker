from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.daily_entry import DailyEntry
from app.ml.zscore import compute_zscore_anomalies
from app.ml.isolation_forest import compute_isolation_forest_anomalies
from app.ml.insights import generate_insights

router = APIRouter(prefix="/analysis", tags=["analysis"])


def _get_entry_dicts(db: Session, user_id: int) -> list[dict]:
    entries = (
        db.query(DailyEntry)
        .filter(DailyEntry.user_id == user_id)
        .order_by(DailyEntry.entry_date.asc())
        .all()
    )
    return [
        {
            "entry_date": e.entry_date.isoformat(),
            "sleep_hours": e.sleep_hours,
            "sleep_quality": e.sleep_quality,
            "nutrition_quality": e.nutrition_quality,
            "physical_activity": e.physical_activity,
            "stress_level": e.stress_level,
            "energy_level": e.energy_level,
        }
        for e in entries
    ]


@router.get("/zscore")
def get_zscore_analysis(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry_dicts = _get_entry_dicts(db, current_user.id)
    results = compute_zscore_anomalies(entry_dicts)
    return {"total_entries": len(entry_dicts), "results": results}


@router.get("/isolation-forest")
def get_isolation_forest_analysis(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry_dicts = _get_entry_dicts(db, current_user.id)
    results = compute_isolation_forest_anomalies(entry_dicts)
    return {"total_entries": len(entry_dicts), "results": results}


@router.get("/combined")
def get_combined_analysis(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry_dicts = _get_entry_dicts(db, current_user.id)
    zscore_results = compute_zscore_anomalies(entry_dicts)
    if_results = compute_isolation_forest_anomalies(entry_dicts)

    if_by_date = {r["entry_date"]: r for r in if_results}

    combined = []
    for z in zscore_results:
        date_val = z["entry_date"]
        if_result = if_by_date.get(date_val, {})
        combined.append(
            {
                "entry_date": date_val,
                "zscore": {
                    "zscores": z["zscores"],
                    "anomalous_variables": z["anomalous_variables"],
                    "is_anomalous": z["is_anomalous"],
                },
                "isolation_forest": {
                    "anomaly_score": if_result.get("anomaly_score"),
                    "is_anomalous": if_result.get("is_anomalous", False),
                },
                "insufficient_data": z["insufficient_data"] or if_result.get("insufficient_data", False),
            }
        )

    return {"total_entries": len(entry_dicts), "results": combined}


@router.get("/insights")
def get_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry_dicts = _get_entry_dicts(db, current_user.id)
    zscore_results = compute_zscore_anomalies(entry_dicts)
    insights = generate_insights(entry_dicts, zscore_results)
    return {"total_entries": len(entry_dicts), "insights": insights}