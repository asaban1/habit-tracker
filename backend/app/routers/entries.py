from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.daily_entry import DailyEntry
from app.schemas.daily_entry import DailyEntryCreate, DailyEntryUpdate, DailyEntryOut

router = APIRouter(prefix="/entries", tags=["entries"])


@router.post("/", response_model=DailyEntryOut, status_code=status.HTTP_201_CREATED)
def create_entry(
    entry_in: DailyEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = (
        db.query(DailyEntry)
        .filter(
            DailyEntry.user_id == current_user.id,
            DailyEntry.entry_date == entry_in.entry_date,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Entry for this date already exists. Use PUT to update it.",
        )

    entry = DailyEntry(user_id=current_user.id, **entry_in.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/", response_model=list[DailyEntryOut])
def list_entries(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entries = (
        db.query(DailyEntry)
        .filter(DailyEntry.user_id == current_user.id)
        .order_by(DailyEntry.entry_date.desc())
        .all()
    )
    return entries


@router.get("/{entry_id}", response_model=DailyEntryOut)
def get_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = (
        db.query(DailyEntry)
        .filter(DailyEntry.id == entry_id, DailyEntry.user_id == current_user.id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    return entry


@router.put("/{entry_id}", response_model=DailyEntryOut)
def update_entry(
    entry_id: int,
    entry_in: DailyEntryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = (
        db.query(DailyEntry)
        .filter(DailyEntry.id == entry_id, DailyEntry.user_id == current_user.id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    update_data = entry_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(entry, field, value)

    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = (
        db.query(DailyEntry)
        .filter(DailyEntry.id == entry_id, DailyEntry.user_id == current_user.id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    db.delete(entry)
    db.commit()
    return None